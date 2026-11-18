# Design System: OpenWedding Kiosk

> **Single Source of Truth untuk tampilan OpenWedding.**
> File ini menggantikan DESIGN.md lama (2026-11-19) yang isinya desain
> landing Regesit hasil tempel — tidak ada hubungannya dengan repo ini.
> Yang benar di bawah ini, diambil dari `styles.css` (v3) + `src/`.

## 1. Produk & konteks pakai

Kiosk video guestbook di meja resepsi: satu perangkat (tablet/laptop),
tamu datang silih berganti tanpa operator menjaga layar. Desain harus:

- **Terbaca dari jarak 1 meter** — judul besar, satu aksi utama per layar.
- **Tidak bisa salah ketuk** — satu tombol besar per langkah; tombol
  berbahaya (hapus) selalu di balik konfirmasi + PIN.
- **Tetap elegan** — ini pernikahan: krem hangat, emas, serif display.

## 2. Token desain (`styles.css`, `:root`)

| Token | Nilai | Peran |
|---|---|---|
| `--c-bg` | `#FFFFFF` | Kanvas putih |
| `--c-surface` | `#FFFFFF` | Kartu putih |
| `--c-surface-2` | `#F8FAFC` | Kanvas sekunder |
| `--c-surface-hi` | `#EFF1E6` | Hover |
| `--c-border` | `#D8DCC8` | Border terlihat (bukan samar) |
| `--c-ink` | `#1A1C14` | Teks utama (kontras 16:1) |
| `--c-ink-2` | `#3F4232` | Teks sekunder (9:1) |
| `--c-ink-3` | `#646A52` | Teks muted (5:1) |
| `--c-olive` | `#3A3E22` | Primer (tombol utama) |
| `--c-gold` | `#8A6F2B` | Aksen (progress aktif, ikon) |
| `--c-danger` | `#B42323` | Hapus / stop |
| `--c-success` | `#1F6B2E` | Toast sukses |
| `--f-display` | Playfair Display, Georgia, serif | Judul |
| `--f-ui` | Inter, Outfit, system sans | Body & UI |

Radius: 8 / 14 / 20 / 28 / 36 px. Shadow: **tidak ada** (flat 2D, border
yang bicara). Transisi `0.18s cubic-bezier(0.4, 0, 0.2, 1)`.

### Tema event (`src/constants/themes.js`)

Tema dipilih operator per event dan diterapkan via `data-theme` di
`<html>`; token di atas adalah default (gold). Lima tema pastel:

| Tema | bg | primary | aksen |
|---|---|---|---|
| Classic Gold & Champagne | `#F5F0E4` | `#4A4E2A` | `#9A8040` |
| Sage Green & Olive | `#EBF2EA` | `#4A7050` | `#80A060` |
| Blush Pink & Rose | `#FFF0F2` | `#A0506A` | `#C0788A` |
| Lavender Mist & Violet | `#F5F3FF` | `#6D28D9` | `#8B5CF6` |
| Sky Blue & Ocean | `#F0F9FF` | `#0284C7` | `#38BDF8` |

## 3. Tipografi

- Judul layar: `.heading-primary` — Playfair Display, `clamp(1.7rem, 4vw, 2.5rem)`.
- Body: `.text-body` — Inter/Outfit 16 px, `line-height: 1.5`.
- Font self-hosted: Outfit + Playfair Display di `public/fonts/`
  (`@import '/fonts/fonts.css'`); Google Fonts `@import` di `styles.css`
  hanya pelengkap saat online — offline tetap tampil dengan font lokal.
- Ikon: lucide-react (SVG). **Tidak ada emoji sebagai ikon UI.**
  (Pengecualian: `lucide-react` 1.x menghapus ikon brand — logo GitHub di
  landing di-inline sebagai SVG `GithubMark` di `ScreenLanding.jsx`.)

## 4. Struktur layar kiosk

```
.cx-kiosk-bg > .cx-kiosk-frame
  .cx-kiosk-topbar          logo "OpenWedding" | nama acara | tombol gerigi (PIN)
  main.screen-container
    #screen-welcome         hero split: copy + "Cara kerja — 3 ketuk saja"
    #screen-guest-name      input nama + Lewati / Kembali / Lanjutkan
    #screen-greeting        hitung mundur 3 detik
    #screen-recording       FRAMElESS: video fullscreen + HUD (REC, mic, timer, stop)
    #screen-preview         video hasil + Ulangi Rekam / Simpan Ucapan
    #screen-thankyou        confetti + auto-kembali 8 detik
  modal: PinModal, OperatorDashboard, ExportModal, ConfirmModal
  ToastContainer
```

- Progress tamu: `.kiosk-progress` + 4 dot (`done` olive / `now` gold).
- Tombol: `.btn` + `.btn-primary` (olive) / `.btn-secondary` (garis) /
  `.btn-danger` (stop) / `.btn-lg`; varian hitam `.cx-btn-black`.
- Kartu: `.glass-card` — putih, border 1.5 px, radius 20 px, tanpa shadow.
- Layar rekam sengaja **tanpa frame** (video memenuhi layar, HUD pill di
  atas/bawah) — satu-satunya layar frameless.

## 5. Landing page (`#landing`, `ScreenLanding.jsx`)

Satu halaman di atas token yang sama, kelas ber-prefix `.ow-`:

1. **Navbar** (sticky): logo kiri, link Fitur/Cara kerja/Pratinjau tengah,
   tautan GitHub (pill + mark GitHub) + tombol *Buka Kiosk* kanan.
2. **Hero**: eyebrow "Video Guestbook Kiosk — Offline-first PWA", H1
   "Ucapan pernikahan, direkam langsung di lokasi.", CTA *Mulai Kiosk* +
   *Lihat cara kerja*, catatan "Gratis & open source (MIT)".
3. **Pratinjau**: 3 kartu gambar (`/img/preview-*.png`) + caption.
4. **Fitur**: grid 3 kolom × 6 fitur (ikon + judul + 1–2 kalimat).
5. **Cara kerja**: 4 langkah bernomor + catatan operator (PIN, `#admin`).
6. **Footer**: brand, tautan GitHub, *Buka Kiosk*, "Lisensi MIT — dezzorigin".

Responsif: ≤820 px grid jadi 1 kolom, nav link disembunyikan, label GitHub
disembunyikan (ikon saja); ≤480 px langkah jadi 1 kolom.

## 6. Aturan yang dijaga

1. **Satu aksi utama per layar tamu** — tamu tidak pernah dihadapkan dua
   tombol primer sekaligus.
2. **Tidak ada card bloat di kiosk** — teks & langkah duduk langsung di
   kanvas/kartu kaca, bukan kotak-kotak bertumpuk.
3. **Kontras AA minimum** — muted text paling redup 5:1 di atas putih.
4. **Tanpa glow/neon, tanpa gradien ramai** — flat, krem, emas, olive.
5. **Semua teks antarmuka Bahasa Indonesia** (kecuali nama produk & istilah
   teknis seperti "EO Control Center").
6. **Aman disentuh** — tombol utama `min-height` besar, target ketuk ≥44 px
   di layar kecil (lihat media query akhir `styles.css`).
