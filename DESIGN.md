# Design System: Regesit 1-Page Landing Platform

> **Single Source of Truth for Regesit Landing Page Redesign**
> Based on Blueprint Layout (`/home/rvlionxz/Downloads/Layout Desain.png`), Brevo Pricing UI, and AR Shakir Process Flow.

---

## 1. Page Architecture & Section Order (Top to Bottom)

### Section 1: Top Navigation Bar
- **Logo:** `Regesit` brand badge in Royal Blue (`#1D4ED8`).
- **Nav Links:** `Beranda`, `Layanan Fitur`, `Pricing`.
- **CTA:** `Sign Up` / `Login` primary buttons.

### Section 2: Hero Section
- **Headline:** `"Registrasi & Ticketing Event Tanpa Antrian."`
- **Sub-headline:** `"Solusi manajemen event lengkap: Offline QR check-in 3 detik, Webinar Online otomatis, dan Hybrid Event terpadu."`
- **CTA Button:** `"Buat Event Gratis"` (Royal Blue `#1D4ED8`).

### Section 3: Segmented Control & Dynamic Content Area (Kotak Merah)
- **Segmented Control (3 Toggle Switch):**
  - `[ 📍 Event Offline ]` | `[ 💻 Event Online ]` | `[ ⚡ Hybrid Event ]`
- **Dynamic Content Container (Area Merah):**
  - All content inside updates dynamically based on the active Segmented Control toggle.
  - **Rules for Content Inside Area Merah:**
    - ❌ **NO CARD BLOAT:** Text and feature points sit directly on the clean white canvas using space and typography. Do NOT wrap plain text in generic card boxes.
    - **1. Penjelasan Event:** Clean title (`h2`) and paragraph description explaining the selected event type.
    - **2. Penjelasan Fitur:** Feature checklist and icon-text rows directly on canvas.
    - **3. Step By Step Penggunaan:** S-Curve process flow featuring an organic curved connector line, large watermark numbers (`1`, `2`, `3`), and 3 connected waypoint nodes (`01. Form & QR`, `02. Simpan Tiket`, `03. Scan 3 Detik`).

### Section 4: Pricing Section (Brevo Pricing UI Specification)
- **Headline:** `"Pricing & Paket Event"`
- **Synced Toggle Controls:**
  - Row 1: Event Type (`Offline` | `Online` | `Hybrid`) — synchronized with the hero toggle.
  - Row 2: Billing Cycle (`Monthly` | `Yearly (-10%)`).
- **4 Pricing Cards:**
  - `Free` (Rp 0), `Starter` (Rp 72k - Featured), `Standard` (Rp 285k), `Pro` (Custom).
- **Customize Your Plan (2-Panel Brevo Layout):**
  - **Left Panel (Configuration):**
    - Plan Selection Tabs: `Starter (Gratis)`, `Standard`, `Pro`.
    - Volume Slider: `Kapasitas Peserta Event` (Range 30 to 500+ participants).
    - Optional Add-ons: Toggles for `Hapus Watermark Regesit` & `Kirim Tiket WA / SMS`.
  - **Right Panel (Summary Card):**
    - Package summary items, Billing toggle (`Monthly` / `Yearly`), real-time total price calculation (`Rp X`), and primary CTA button `"Buat Event Sekarang ➔"`.

### Section 5: Footer
- Standard single-page footer with sitemap links, copyright, and platform support.

---

## 2. Color Palette & Roles (STRICTLY 2 COLORS)

- **Canvas Base & Surface:** Pure White (`#FFFFFF`) / Warm Light Neutral (`#F8FAFC`).
- **Primary Accent & Interactive Elements:** Royal Blue (`#1D4ED8` / `#2563EB`).
- **Primary Typography:** Deep Dark Slate (`#0B132A`).
- **Secondary Typography:** Muted Slate (`#64748B`).

---

## 3. Typography & Spacing Rules

- **Font Family:** `Plus Jakarta Sans`, sans-serif.
- **Headlines:** Track-tight, bold weight (700-800), high contrast.
- **Grouping:** Group elements with negative space (2x gap between groups vs within groups), NOT with unnecessary border boxes.
- **Banned:** Wrapping plain text or step descriptions in card boxes; using emojis as UI icons (use Material Symbols / SVG icons only).

---

## 4. Summary of Banned Anti-Patterns

1. ❌ **No Card Bloat:** Text, features, and steps MUST NOT be wrapped in generic rectangular card boxes.
2. ❌ **No AI Slop:** No neon glows, no fake 3x3 identical card grids.
3. ❌ **No Emojis as UI Icons:** Use SVG or Material Symbols icons only.
4. ❌ **No Multipage Fragmentation:** Single-page landing page flow only.

---

## 5. Component Stylings & daisyUI Semantic Mappings
- **daisyUI Theme Configuration:** `data-theme="light"`
  - `primary`: `#1D4ED8` (Royal Blue)
  - `base-100`: `#FFFFFF` (Canvas Base)
  - `base-200`: `#F8FAFC` (Surface Neutral)
  - `neutral`: `#0B132A` (Deep Slate Text)
- **daisyUI Component Mappings:**
  - **Navbar:** `navbar bg-base-100 border-b border-base-200`
  - **Buttons:** `btn btn-primary` (Royal Blue `#1D4ED8`), `btn-outline` (Secondary)
  - **Segmented Control / Tabs:** `tabs tabs-bordered`, `tab tab-active` (Blue underline)
  - **Volume Range Slider:** `range range-primary` (Blue accent)
  - **Add-on Switch:** `toggle toggle-primary` (Blue accent)
  - **Pricing Cards:** `card bg-base-100 border border-base-200` (Used ONLY for Pricing Cards & Summary Card)
- **Icons:** Material Symbols / SVG icons only. Emojis as UI icons are strictly BANNED.
