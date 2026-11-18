#!/usr/bin/env python3
"""Sweep production dependencies against OSV (Open Source Vulnerabilities).

Why this exists instead of `npm audit --omit=dev`:
`npm audit --omit=dev` is documented to exclude dev dependencies, but in
practice it still reports advisories that are only reachable through dev
packages (a known npm bug). That made the CI `audit` job fail
deterministically on two dev-only HIGH findings (braces@3.0.3,
picomatch@2.3.2) even though neither ships to users.

Why OSV instead of the GitHub Advisory Database API (history):
the first version of this script queried
`https://api.github.com/advisories` with the CI `GITHUB_TOKEN`. In the
orteam CI it failed deterministically — 5x `401 Bad credentials` on the
very first package, across 4 runs — while the SAME script, SAME token
source, SAME run passed in a probe job (exit 0, "OK: no high/critical"),
and curl/python probes with that token returned 200 for the identical
endpoint. Diagnosis: some per-job `GITHUB_TOKEN`s are rejected by that
endpoint (token lottery); the script, the token and the endpoint were
each proven good in isolation. OSV (https://osv.dev) mirrors the GitHub
Advisory Database (GHSA entries carry `database_specific.severity` from
GitHub's own review), needs no auth, and answers all 81 packages in ONE
batched POST (`/v1/querybatch`, max 1000 queries) — no token, no
per-package requests, no rate-limit lottery.

The script checks ONLY the packages that end up in the production tree
(`dev: true` entries in package-lock.json are skipped). It FAILS (exit 1)
when any production package is affected by a high/critical vulnerability.
Withdrawn advisories are not returned by OSV queries for an affected
version, and the query itself only returns vulns affecting the given
version.

Usage:
    python3 scripts/advisory-sweep.py
No token needed. Exit code 0 = production tree clean, 1 = findings,
2 = API error.
"""

import json
import os
import sys
import urllib.error
import urllib.request

SEVERITIES = ("HIGH", "CRITICAL")
OSV_BATCH_URL = "https://api.osv.dev/v1/querybatch"


def pkg_name(key):
    """Extract the package name from a package-lock 'packages' key."""
    rest = key
    while rest.startswith("node_modules/"):
        rest = rest[len("node_modules/"):]
    # Nested installs: node_modules/a/node_modules/b -> b
    if "/node_modules/" in rest:
        rest = rest.rsplit("/node_modules/", 1)[1]
    parts = rest.split("/")
    if rest.startswith("@") and len(parts) >= 2:
        return "/".join(parts[:2])
    return parts[0]


def load_prod_packages(lock_path):
    """name -> sorted list of versions, production only."""
    with open(lock_path) as f:
        lock = json.load(f)
    prod = {}
    for key, info in lock.get("packages", {}).items():
        if not key or not info.get("version"):
            continue
        if info.get("dev"):
            continue
        prod.setdefault(pkg_name(key), set()).add(info["version"])
    return {name: sorted(versions) for name, versions in sorted(prod.items())}


def severity_of(vuln):
    """HIGH/CRITICAL/MODERATE/LOW/None for one OSV vuln record.

    GHSA-reviewed entries carry `database_specific.severity` (GitHub's own
    rating). Otherwise try a numeric CVSS score in `severity[]`; CVSS
    vector strings (e.g. "CVSS:3.1/...") are not parseable to a number
    here and yield None (reported, not counted as a finding).
    """
    ds = vuln.get("database_specific") or {}
    sev = (ds.get("severity") or "").upper()
    if sev in ("CRITICAL", "HIGH", "MODERATE", "LOW"):
        return sev
    for entry in vuln.get("severity", []) or []:
        try:
            score = float(entry.get("score", ""))
        except (TypeError, ValueError):
            continue
        if score >= 9.0:
            return "CRITICAL"
        if score >= 7.0:
            return "HIGH"
        if score >= 4.0:
            return "MODERATE"
        return "LOW"
    return None


def query_osv(queries):
    """One batched POST; returns the decoded response dict."""
    body = json.dumps({"queries": queries}).encode()
    req = urllib.request.Request(
        OSV_BATCH_URL,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.build_opener().open(req, timeout=120) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        detail = e.read()[:500].decode("utf-8", "replace")
        print(f"ERROR: OSV API {e.code}: {detail}", file=sys.stderr)
        raise SystemExit(2)
    except urllib.error.URLError as e:
        print(f"ERROR: OSV API unreachable: {e}", file=sys.stderr)
        raise SystemExit(2)


def sweep(lock_path, query_fn=query_osv):
    """Return (findings, unknown) for the lockfile at lock_path."""
    prod = load_prod_packages(lock_path)
    pairs = [(name, ver) for name, vers in prod.items() for ver in vers]
    print(
        f"checking {len(prod)} production packages "
        f"({len(pairs)} name@version pairs)",
        flush=True,
    )
    queries = [
        {"package": {"name": name, "ecosystem": "npm"}, "version": ver}
        for name, ver in pairs
    ]
    resp = query_fn(queries)
    results = resp.get("results", [])
    findings = []
    unknown = []
    seen = set()
    for (name, ver), res in zip(pairs, results):
        for vuln in res.get("vulns", []) or []:
            sev = severity_of(vuln)
            vid = vuln.get("id", "?")
            aliases = ",".join(vuln.get("aliases", []) or [])
            key = (name, ver, vid)
            if key in seen:
                continue
            seen.add(key)
            if sev in SEVERITIES:
                findings.append(f"{name}@{ver}: {vid} {sev} {aliases}")
            elif sev is None:
                unknown.append(f"{name}@{ver}: {vid} (severity unknown)")
    return findings, unknown


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    lock_path = os.path.join(root, "package-lock.json")
    findings, unknown = sweep(lock_path)

    for line in unknown:
        print("  note: " + line, flush=True)

    if findings:
        print(
            f"FAIL: {len(findings)} HIGH/CRITICAL finding(s) in "
            "production dependencies:",
            flush=True,
        )
        for line in findings:
            print("  " + line, flush=True)
        return 1

    print("OK: no high/critical advisories affect production dependencies",
          flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
