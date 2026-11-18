# Panduan Pengguna — OpenWedding

> Untuk tamu, operator (EO), dan pengantin. Live:
> https://video-guess-book.pages.dev

## A. Panduan tamu (di lokasi acara)

1. Di layar sambutan, ketuk tombol besar **Sentuh untuk Mulai**.
2. Tulis nama Anda, lalu **Lanjutkan**. Tidak mau disebut nama? Ketuk
   **Lewati** — Anda tercatat sebagai "Tamu Anonim".
3. Layar akan menghitung mundur **3 – 2 – 1**. Posisikan wajah di tengah
   bingkai dan bicara jelas ke arah mikrofon.
4. Perekaman berjalan (lampu **REC** + timer). Ketuk **Selesai & Simpan
   Video** bila selesai — atau biarkan berhenti sendiri saat waktu habis
   (default 60 detik).
5. Tonton ulang rekaman Anda. Puas? Ketuk **Simpan Ucapan**. Ingin mengulang?
   Ketuk **Ulangi Rekam**.
6. Layar **Terima kasih!** muncul — selesai. Layar kembali ke sambutan
   sendiri dalam 8 detik untuk tamu berikutnya.

**Catatan:** tidak perlu install aplikasi, tidak perlu internet, tidak perlu
akun. Video tersimpan di perangkat acara, bukan di ponsel Anda.

## B. Panduan operator (EO)

### Membuka dashboard

PIN default: **`1234`** — ganti sebelum acara (lihat bawah). Tiga cara membuka:

- Ketuk ikon gerigi di pojok kanan atas kiosk, atau
- Ketuk **5×** nama mempelai di layar sambutan, atau
- Buka URL dengan hash `#admin` (mis. `https://video-guess-book.pages.dev/#admin`).

Masukkan PIN → **EO Control Center** terbuka.

### Checklist sebelum acara (H-1)

1. **Buka dashboard → tab Events.** Buat event baru: nama mempelai pria &
   wanita, tanggal & lokasi (mis. "12 September 2026 • Ballroom Hotel Mulia"),
   tema, durasi rekam (mis. 60 detik). Pastikan event baru berstatus aktif.
2. **Pilih tema** (Classic Gold / Sage / Blush / Lavender / Sky) sesuai dekor.
3. **Tab Hardware:** pilih kamera & mikrofon yang benar; lakukan **tes mic**
   (bicara — bar visual harus bergerak). Bila memakai kamera eksternal,
   pastikan terpilih di sini, bukan kamera laptop bawaan.
4. **Ganti PIN** di tab Overview → kartu *Keamanan — Ganti PIN Operator*
   (PIN baru 4–8 digit + konfirmasi). PIN default `1234` wajib diganti
   sebelum acara; PIN hanya tersimpan di perangkat itu.
5. **Uji satu rekaman penuh** (nama → rekam 5 detik → simpan), lalu cek di
   tab Galeri bahwa video bisa diputar. Hapus video uji itu setelahnya.
6. **Pastikan storage cukup:** tab Overview menampilkan sisa storage. Satu
   menit video ~5–15 MB (tergantung kamera); untuk 100 tamu, siapkan
   minimal 1–2 GB kosong.
7. **Pasang perangkat** di meja resepsi, colok charger, kunci layar agar
   tidak sleep (matikan screen lock / atur "never sleep" saat colok daya).
8. **(Opsional) Install sebagai PWA:** di Chrome → menu → "Install
   OpenWedding" / "Add to Home Screen" — setelah itu aplikasi jalan
   fullscreen tanpa address bar.

### Selama acara

- Biarkan kiosk berjalan. Bila layar kembali ke sambutan, itu normal
  (tamu selesai).
- **Jangan tutup tab/browser** selama acara — video hanya tersimpan di
  perangkat itu.
- Bila kamera/mik tidak jalan: buka dashboard → Hardware → pilih ulang
  perangkat → tes mic. Bila tetap gagal, refresh halaman (video yang sudah
  tersimpan aman di IndexedDB, tidak hilang saat refresh).
- Bila storage menipis: export ZIP (bawah), lalu hapus video lama dari Galeri.

### Setelah acara — export & serahkan

1. Buka dashboard → **Export** (tombol export di Overview/Galeri).
2. Pilih event, lalu **Export ZIP**. Tunggu progress 100% — file
   `<NamaMempelai>_<jumlah>_Video_Guestbook.zip` terunduh.
3. Isi ZIP: folder video (satu file per tamu, nama berisi nama tamu +
   waktu), `Daftar_Tamu.csv`, dan `Rekap.txt`.
4. Serahkan ZIP ke pengantin (flashdisk / Google Drive / WhatsApp).
5. **Setelah pengantin mengonfirmasi sudah menerima & memutar ZIP:**
   hapus video dari Galeri (per event) agar perangkat bersih untuk acara
   berikutnya. Jangan hapus sebelum konfirmasi — tidak ada cadangan cloud.

### Mengganti event aktif

Tab Events → pilih event → **Jadikan Aktif**. Kiosk langsung menampilkan
nama mempelai & tema event itu. Video lama tetap tersimpan di bawah eventnya
masing-masing (filter di Galeri).

## C. FAQ

| Pertanyaan | Jawaban |
|---|---|
| Apakah butuh internet? | Tidak, setelah aplikasi pertama kali dibuka. Install PWA agar aman. |
| Video tersimpan di mana? | IndexedDB di browser perangkat acara. Tidak di-upload ke mana pun. |
| Lupa PIN? | PIN tersimpan di localStorage perangkat (`openwedding_kiosk_config`). Hapus data situs browser akan mereset PIN ke `1234` — tapi juga menghapus semua video. Jadi jangan lupa PIN; catat di tempat aman. |
| Bisa ganti durasi rekam? | Ya, per event (tab Events → edit event). |
| Rekaman terpotong / hitam? | Biasanya izin kamera belum diberikan atau perangkat lain memakai kamera. Refresh halaman dan izinkan kamera/mik saat diminta. |
| Bisa dipakai di iPhone/iPad? | Bisa dibuka di Safari, tapi PWA + MediaRecorder di iOS lebih terbatas (durasi & format bisa berbeda). Uji dulu di perangkat yang sama sebelum hari-H. |
| Apakah ada batas jumlah tamu? | Hanya batas storage perangkat. Pantau di tab Overview. |
| Bagaimana kalau browser tidak sengaja tertutup? | Video yang sudah disimpan aman. Video yang sedang direkam saat tertutup hilang — tamu perlu rekam ulang. |

## D. Jalan pintas (cheat sheet)

| Aksi | Cara |
|---|---|
| Buka dashboard operator | Ikon gerigi / ketuk 5× nama mempelai / `#admin` |
| Lihat landing produk | `#landing` (tautan "Tentang OpenWedding" di layar sambutan) |
| PIN default | `1234` |
| Export ZIP | Dashboard → Export |
| Kembali ke sambutan | Otomatis 8 detik setelah "Terima kasih", atau tombol Selesai |
