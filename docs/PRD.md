# PRD — OpenWedding (Video Guestbook Kiosk)

| Field | Nilai |
|---|---|
| Nama produk | OpenWedding |
| Nama repo | `dezzorigin/video-guess-book` (nama historis; produk = OpenWedding) |
| Live | https://video-guess-book.pages.dev |
| Tech stack | Vite 5 + React 19 + vite-plugin-pwa (Workbox), IndexedDB, MediaRecorder |
| Status | Live (proper 2026-11-19: PR #28 program P1) |
| Penanggung jawab | Nabil Aulia Dika (dezzorigin) |
| Versi dokumen | 2.0 — 2026-11-19 (menggantikan PRD.md v1.0 template yang tidak akurat) |

## 1. Latar belakang

Di resepsi pernikahan, buku tamu kertas hanya mencatat nama. Ucapan video
jauh lebih berkesan — tapi merekamnya biasanya butuh operator, aplikasi
tambahan, atau internet yang di gedung resepsi sering tidak bisa diandalkan.
OpenWedding adalah kiosk mandiri: perangkat ditaruh di meja, tamu merekam
sendiri dalam 4 langkah, semua tersimpan offline di perangkat itu.

## 2. Masalah yang diselesaikan

- Tamu ingin meninggalkan ucapan video, tapi tidak mau install aplikasi.
- Gedung acara sering tanpa Wi-Fi stabil — perekaman tidak boleh gagal
  karena internet.
- Operator (EO) butuh alat yang jalan sendiri seharian: ganti acara, ganti
  tema, lalu serahkan semua video ke pengantin dalam satu file.
- Video adalah data pribadi: tidak boleh ter-upload ke server pihak ketiga.

## 3. Tujuan & sasaran

- Tamu menyelesaikan rekaman tanpa bantuan dalam < 2 menit (4 langkah).
- Nol kegagalan karena internet: seluruh alur jalan offline setelah install.
- Operator mengekspor semua video satu acara dalam 1 file ZIP + daftar tamu.
- Satu perangkat bisa dipakai banyak acara (multi-event) tanpa campur data.

## 4. Ruang lingkup

### In scope

- Alur tamu: sambutan → nama (opsional) → hitung mundur → rekam → pratinjau
  → simpan → terima kasih (auto-kembali).
- Rekam video via MediaRecorder (MP4/WebM sesuai browser) + timer + visual mic.
- Penyimpanan lokal: IndexedDB (video + event) + localStorage (konfigurasi).
- Multi-event: buat / ganti / edit event (nama mempelai, tanggal/lokasi,
  tema, durasi rekam).
- 5 tema pastel per event.
- Dashboard operator ber-PIN: statistik, galeri, hardware (kamera/mik),
  export ZIP + CSV + TXT.
- PWA: manifest, ikon, service worker precache (installable, offline).
- Landing page `#landing` (pengenalan produk + tautan GitHub).

### Out of scope

- Backend / server / akun / sinkronisasi cloud — sengaja tidak ada.
- Upload video ke mana pun; streaming; edit video.
- Pembayaran / paket berbayar.
- Notifikasi ke pengantin; pengolahan video pasca-acara (diserahkan via ZIP).

## 5. Persona

| Persona | Kebutuhan |
|---|---|
| **Tamu** | Paham tanpa penjelasan; selesai cepat; bisa anonim; bisa rekam ulang. |
| **Operator / EO** | Setup acara < 5 menit; ganti tema & durasi; lihat isi galeri; export ZIP; kunci tamu dari pengaturan (PIN). |
| **Pengantin** | Terima satu ZIP berisi semua ucapan + daftar tamu setelah acara. |

## 6. Fitur & persyaratan fungsional

| ID | Fitur | Kriteria |
|---|---|---|
| F1 | Layar sambutan | Nama mempelai + tanggal/lokasi + durasi maks + cara kerja 3 ketuk tampil; tombol *Sentuh untuk Mulai*. |
| F2 | Nama tamu | Input nama; *Lewati* → "Tamu Anonim"; *Lanjutkan* wajib isi atau lewati dulu. |
| F3 | Hitung mundur | 3 detik, lalu otomatis ke layar rekam. |
| F4 | Rekam | MediaRecorder mulai otomatis; timer mundur dari durasi event; tombol stop aktif setelah 2 detik; auto-stop saat waktu habis; visual mic 5 bar. |
| F5 | Pratinjau | Video hasil bisa diputar ulang; *Ulangi Rekam* kembali ke hitung mundur; *Simpan Ucapan* menyimpan blob ke IndexedDB. |
| F6 | Terima kasih | Confetti; auto-kembali ke sambutan 8 detik; tombol *Selesai*. |
| F7 | Multi-event | Buat event baru; ganti event aktif; edit event aktif (nama, subtitle, tema, durasi); video terfilter per event. |
| F8 | Tema | 5 tema; ganti tema langsung mengubah `data-theme` seluruh kiosk. |
| F9 | Dashboard operator | PIN (default `1234`); tab Overview (statistik + peringatan storage), Galeri (putar/hapus per video atau per event), Events, Hardware (pilih kamera/mik + tes mic). |
| F10 | Export | ZIP berisi semua video event + CSV daftar tamu + TXT rekap; progress %; nama file `<Event>_<n>_Video_Guestbook.zip`. |
| F11 | PWA offline | Installable; seluruh aset di-precache; jalan tanpa internet setelah kunjungan pertama. |
| F12 | Landing | `#landing`: navbar + GitHub, hero, pratinjau, fitur, cara kerja, footer; *Buka Kiosk* kembali ke sambutan. |

## 7. Persyaratan non-fungsional

- **Performa:** build JS ~420 KB (gzip ~127 KB); first paint < 2 detik di
  koneksi normal; precache 49 entri (~3,2 MB).
- **Offline:** semua fitur inti jalan tanpa internet (kecuali `@import`
  Google Fonts di `styles.css` — hanya pelengkap; font utama self-hosted).
- **Privasi:** video tidak keluar dari perangkat kecuali export manual.
- **Keamanan:** tidak ada secret ter-commit; PIN operator hanya pengunci
  lokal (bukan autentikasi server) — didokumentasikan sebagai keterbatasan.
- **Aksesibilitas:** kontras teks ≥ 4.5:1 (target tombol ≥ 44 px di layar
  kecil); label `aria-label` pada tombol ikon; `aria-live` pada hitung mundur.
- **Portabilitas:** Chrome/Edge modern (MediaRecorder + IndexedDB + SW);
  tablet & desktop; iOS Safari terbatas (PWA + MediaRecorder — lihat Risiko).

## 8. Arsitektur & tech stack

Lihat [ARCHITECTURE.md](ARCHITECTURE.md). Ringkas: SPA React tanpa router
(state layar di context + hash `#landing`/`#admin`); penyimpanan IndexedDB
v2 + localStorage; service worker Workbox `generateSW`.

## 9. Milestone / roadmap

| Fase | Status |
|---|---|
| Kiosk inti (alur tamu + IndexedDB + dashboard + export) | ✅ selesai (sebelum 2026-11-19) |
| PWA (manifest, ikon, service worker) | ✅ selesai, manifest diperbaiki 2026-11-19 |
| Landing page `#landing` | ✅ 2026-11-19 |
| CI (build + OSV sweep + PWA audit + Playwright e2e) | ✅ 2026-11-19 |
| Docs lengkap + screenshot + video demo | ✅ 2026-11-19 |
| Deploy Cloudflare Pages `video-guess-book` | ✅ 2026-11-19 |
| Perbaikan berikut (belum diputuskan) | Ganti PIN default wajib saat setup pertama; hapus `@import` Google Fonts agar 100% offline; uji iOS Safari |

## 10. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Browser menghapus IndexedDB (storage tidak persistent) | Minta persistensi (`navigator.storage.persist()`); dashboard memperingatkan bila belum persistent + sisa storage. |
| Storage penuh di tengah acara | Statistik + peringatan di Overview; export ZIP lalu hapus video lama. |
| MediaRecorder tidak didukung (browser lama / iOS lama) | `detectBestMimeType()` mencoba MP4 → WebM; gagal → toast "Gagal mengakses kamera/mikrofon". |
| PIN default `1234` tidak diganti | Didokumentasikan di README + panduan operator; dashboard menampilkan PIN saat ini di pengaturan. |
| Manifest PWA tertimpa plugin saat build (pernah terjadi) | Manifest dideklarasi eksplisit di `vite.config.js`; `pwa:audit` di CI memeriksa ikon + nama. |
| Video hilang bila perangkat rusak sebelum export | Bukan tanggung jawab aplikasi (lokal-first); panduan menyarankan export berkala + perangkat cadangan. |

## 11. Kriteria keberhasilan

- Alur tamu penuh berhasil end-to-end di Playwright (kamera palsu) +
  tersimpan di IndexedDB — teruji di CI tiap push.
- PWA audit lolos: manifest lengkap, SW precache 49 entri.
- Live di Cloudflare Pages, HTTP 200, play-test lolos.
- README berisi screenshot asli + video demo.

## 12. Lampiran

- Arsitektur: [ARCHITECTURE.md](ARCHITECTURE.md)
- Panduan: [USER-GUIDE.md](USER-GUIDE.md)
- Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)
- Diagram: [DIAGRAMS.html](DIAGRAMS.html)
- Lisensi: MIT ([LICENSE](../LICENSE))
