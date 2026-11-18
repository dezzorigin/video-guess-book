/**
 * OpenWedding — Landing Page (SaaS-style)
 *
 * Halaman pengenalan produk di atas kiosk yang sama: navbar + tautan GitHub,
 * hero + pratinjau produk, fitur, cara kerja, dan footer. Dibuka lewat
 * hash #landing agar tidak mengganggu alur kiosk tamu (layar sambutan
 * tetap menjadi halaman utama). Tidak ada backend: semua data tetap
 * tersimpan lokal di perangkat (IndexedDB).
 */
import React from 'react';
import {
  Archive,
  ArrowRight,
  CalendarDays,
  Heart,
  Lock,
  Mic,
  Palette,
  Video,
  WifiOff,
} from 'lucide-react';

// Mark GitHub (jalur SVG standar simple-icons, CC0) — lucide-react 1.x
// sudah menghapus ikon brand, jadi mark ini di-inline agar tautan GitHub
// di navbar tetap memakai logo yang dikenali.
function GithubMark({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const REPO_URL = 'https://github.com/dezzorigin/video-guess-book';

const FEATURES = [
  {
    icon: WifiOff,
    title: 'Offline-first',
    text: 'Jalan tanpa internet di lokasi acara. Service worker + precache menyimpan seluruh aplikasi di perangkat; rekaman tersimpan lokal.',
  },
  {
    icon: Video,
    title: 'Rekam & pratinjau',
    text: 'Tamu merekam ucapan video (durasi bisa diatur operator, default 60 detik), menonton ulang, lalu memilih simpan atau rekam ulang.',
  },
  {
    icon: CalendarDays,
    title: 'Multi-event',
    text: 'Satu perangkat untuk banyak acara: buat event baru, ganti event aktif, dan video tiap event terpisah rapi di IndexedDB.',
  },
  {
    icon: Palette,
    title: '5 tema pastel',
    text: 'Classic Gold, Sage Green, Blush Pink, Lavender Mist, dan Sky Blue — dipilih operator per event, langsung mengubah seluruh kiosk.',
  },
  {
    icon: Lock,
    title: 'PIN operator',
    text: 'Dashboard operator (EO Control Center) terkunci PIN. Tamu tidak bisa membuka galeri, mengubah acara, atau menghapus video.',
  },
  {
    icon: Archive,
    title: 'Export ZIP',
    text: 'Semua video + daftar tamu (CSV & TXT) dibungkus jadi satu file ZIP siap diserahkan ke pengantin setelah acara selesai.',
  },
];

const STEPS = [
  { num: '1', title: 'Tulis nama', text: 'Tamu menulis nama — atau lewati dan tetap anonim.' },
  { num: '2', title: 'Hitung mundur', text: 'Layar persiapan 3 detik sebelum kamera mulai merekam.' },
  { num: '3', title: 'Rekam ucapan', text: 'Rekam sampai selesai atau sampai batas durasi, dengan timer & visual mic.' },
  { num: '4', title: 'Tinjau & simpan', text: 'Putar ulang, simpan ke perangkat, lalu layar terima kasih + confetti.' },
];

const PREVIEWS = [
  { src: '/img/preview-welcome.png', caption: 'Layar sambutan — nama mempelai & cara kerja' },
  { src: '/img/preview-recording.png', caption: 'Layar perekaman — kamera penuh + timer' },
  { src: '/img/preview-dashboard.png', caption: 'EO Control Center — statistik, galeri & export' },
];

export function ScreenLanding({ onOpenKiosk }) {
  const openKiosk = () => {
    if (onOpenKiosk) onOpenKiosk();
    window.location.hash = '';
  };

  return (
    <div className="ow-landing">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="ow-nav">
        <a className="ow-nav-logo" href="#landing" aria-label="OpenWedding — beranda">
          <Heart size={20} color="var(--c-gold)" fill="var(--c-gold)" />
          <span>OpenWedding</span>
        </a>
        <nav className="ow-nav-links" aria-label="Navigasi landing">
          <a href="#fitur">Fitur</a>
          <a href="#cara-kerja">Cara kerja</a>
          <a href="#pratinjau">Pratinjau</a>
        </nav>
        <div className="ow-nav-actions">
          <a
            className="ow-github-link"
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Lihat kode sumber di GitHub"
          >
            <GithubMark size={18} />
            <span>GitHub</span>
          </a>
          <button className="btn btn-primary" onClick={openKiosk}>
            Buka Kiosk
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="ow-hero">
        <p className="ow-eyebrow">Video Guestbook Kiosk — Offline-first PWA</p>
        <h1 className="heading-primary ow-hero-title">
          Ucapan pernikahan, direkam langsung di lokasi.
        </h1>
        <p className="text-body ow-hero-sub">
          OpenWedding adalah kiosk video guestbook untuk pernikahan &amp; event spesial.
          Tamu merekam pesan video singkat tanpa aplikasi tambahan, tanpa antre,
          tanpa internet — semua tersimpan aman di perangkat acara.
        </p>
        <div className="ow-hero-cta">
          <button className="btn btn-primary btn-lg cx-btn-black" onClick={openKiosk}>
            <Video size={20} />
            <span>Mulai Kiosk</span>
            <ArrowRight size={18} />
          </button>
          <a className="btn btn-secondary btn-lg" href="#cara-kerja">
            Lihat cara kerja
          </a>
        </div>
        <p className="ow-hero-note">
          Gratis &amp; open source (MIT) • Tanpa akun • Tanpa server • Data milik penyelenggara
        </p>
      </section>

      {/* ── Pratinjau produk ───────────────────────────────── */}
      <section className="ow-section" id="pratinjau">
        <h2 className="heading-primary ow-section-title">Pratinjau produk</h2>
        <p className="text-body ow-section-sub">
          Tiga layar yang paling sering dipakai: sambutan untuk tamu, perekaman,
          dan dashboard operator.
        </p>
        <div className="ow-preview-grid">
          {PREVIEWS.map((p) => (
            <figure className="ow-preview-card" key={p.src}>
              <img src={p.src} alt={p.caption} loading="lazy" />
              <figcaption>{p.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Fitur ──────────────────────────────────────────── */}
      <section className="ow-section" id="fitur">
        <h2 className="heading-primary ow-section-title">Kenapa OpenWedding</h2>
        <p className="text-body ow-section-sub">
          Dibangun untuk satu sore yang sibuk: perangkat ditaruh di meja resepsi,
          tamu datang silih berganti, dan semua ucapan terkumpul tanpa operator
          harus menjaga layar.
        </p>
        <div className="ow-feature-grid">
          {FEATURES.map((f) => (
            <article className="ow-feature" key={f.title}>
              <span className="ow-feature-icon">
                <f.icon size={22} />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Cara kerja ─────────────────────────────────────── */}
      <section className="ow-section" id="cara-kerja">
        <h2 className="heading-primary ow-section-title">Cara kerja — 4 langkah tamu</h2>
        <p className="text-body ow-section-sub">
          Alur kiosk dirancang supaya tamu paham tanpa penjelasan: satu tombol besar,
          satu layar per langkah, dan layar kembali ke sambutan sendiri setelah selesai.
        </p>
        <ol className="ow-steps">
          {STEPS.map((s) => (
            <li key={s.num}>
              <span className="ow-step-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="ow-operator-note">
          <Mic size={16} style={{ verticalAlign: '-3px' }} /> Operator membuka EO Control Center
          lewat PIN (ikon gerigi di pojok kiosk, ketuk 5× pada nama mempelai, atau hash{' '}
          <code>#admin</code>) — untuk ganti acara, pilih kamera/mik, atur tema &amp; durasi,
          melihat galeri, dan export ZIP.
        </p>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="ow-footer">
        <div className="ow-footer-brand">
          <span className="ow-nav-logo">
            <Heart size={18} color="var(--c-gold)" fill="var(--c-gold)" />
            <span>OpenWedding</span>
          </span>
          <p>Video guestbook offline-first untuk pernikahan &amp; event spesial.</p>
        </div>
        <div className="ow-footer-links">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            <GithubMark size={16} /> Kode sumber di GitHub
          </a>
          <a href="#landing">Kembali ke atas</a>
          <button className="ow-footer-kiosk" onClick={openKiosk}>Buka Kiosk</button>
        </div>
        <p className="ow-footer-copy">
          Lisensi MIT — dibuat oleh dezzorigin (Nabil Aulia Dika).
        </p>
      </footer>
    </div>
  );
}
