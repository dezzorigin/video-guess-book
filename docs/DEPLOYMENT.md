# Deployment — OpenWedding

> Live: https://video-guess-book.pages.dev (proyek Pages `video-guess-book`)

## 1. Ringkasan

- **Platform:** Cloudflare Pages (static hosting, direct upload via API —
  tanpa Git integration, tanpa Wrangler di CI).
- **Build:** `npm run build` → `dist/` (Vite + Workbox `generateSW`).
- **Nama proyek:** `video-guess-book` — dibuat 2026-11-19, subdomain
  `video-guess-book.pages.dev` didapat **bersih** (percobaan pertama;
  fallback `videoguessbook` → `tebak-video` tidak terpakai).
- **Tidak ada backend** — deploy hanya menyajikan `dist/` statis.

## 2. Deploy manual (dari laptop/VM)

```bash
npm ci
npm run build
python3 ~/workspace/github-actions/cf_pages.py deploy video-guess-book dist/
```

`cf_pages.py` memakai pola wrangler v4 (upload-token JWT → check-missing →
assets/upload → upsert-hashes → create deployment). Auth via konektor
Cloudflare (`custom.cloudflare`, token di Secure Vault — jangan tempel
token di chat/terminal).

Alternatif (bila Wrangler terpasang & login):

```bash
npm run deploy   # npm run build && wrangler pages deploy dist --project-name=video-guess-book
```

## 3. Verifikasi setelah deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://video-guess-book.pages.dev/
curl -s https://video-guess-book.pages.dev/manifest.webmanifest | head -c 200
curl -s -o /dev/null -w "%{http_code}\n" https://video-guess-book.pages.dev/sw.js
```

Lalu play-test di browser (atau Playwright dengan kamera palsu, lihat
[DEMO.md](DEMO.md)): sambutan → nama → hitung mundur → rekam → pratinjau
→ simpan → terima kasih; `#landing` tampil; PIN `1234` membuka dashboard.
**Catatan cache:** bila browser masih menampilkan versi lama setelah deploy,
hard-refresh (Ctrl+Shift+R) atau buka incognito — service worker
`autoUpdate` mengambil versi baru saat kunjungan berikutnya.

## 4. Homepage repo (About)

Setelah live, pasang link live di About repo via API:

```bash
# PATCH /repos/dezzorigin/video-guess-book {"homepage": "https://video-guess-book.pages.dev"}
```

(helper GitHub di `~/workspace/github-actions/gh_write.py` tidak punya
perintah homepage — dipakai skrip inline dengan pola surrogate yang sama.)
Verifikasi: `GET /repos/dezzorigin/video-guess-book` → `homepage` terisi.

## 5. CI

`.github/workflows/ci.yml` (4 job, lihat [ARCHITECTURE.md](ARCHITECTURE.md)
§10). CI **tidak** men-deploy otomatis — deploy dilakukan manual setelah
PR merge + verifikasi live (pola program P1). Alasan: deploy Pages butuh
token Cloudflare yang tidak disimpan di repo; PR merge adalah gerbangnya.

## 6. Rollback

Pages menyimpan tiap deployment. Bila rilis baru bermasalah:

1. Buka Cloudflare Dashboard → Pages → `video-guess-book` → Deployments.
2. Pilih deployment sebelumnya → **Rollback** (atau deploy ulang commit lama:
   `git checkout <sha-lama> && npm run build && cf_pages.py deploy …`).

Karena aplikasi stateless (data di perangkat pengguna, bukan server),
rollback hanya mengganti aset statis — tidak ada migrasi data.

## 7. Catatan domain

- URL kanonis di `index.html`, `public/sitemap.xml`, `public/robots.txt`,
  dan komentar `public/_headers` semuanya menunjuk
  `https://video-guess-book.pages.dev/` (diperbarui 2026-11-19 dari
  `openwedding.pages.dev` — nama proyek lama yang belum pernah dibuat).
- Bila suatu saat dipindah ke domain sendiri (mis. `openwedding.id`),
  perbarui keempat file itu + `vite.config.js` tidak perlu (manifest
  memakai path relatif).
