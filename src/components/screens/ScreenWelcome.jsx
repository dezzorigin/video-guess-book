/**
 * OpenWedding Kiosk - Screen 1: Welcome Screen
 * Restructured: hero split + steps, no AI slop, no emoji, iPad/phone friendly
 */
import React, { useRef } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { Video, Mic, Heart, CheckCircle2 } from 'lucide-react';

export function ScreenWelcome() {
  const { config, setCurrentScreen, setIsPinModalOpen } = useKiosk();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);

  // Hidden gesture: 5x tap on couple names -> opens PIN modal
  const handleTitleClick = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setIsPinModalOpen(true);
    } else {
      tapTimerRef.current = setTimeout(() => {
        tapCountRef.current = 0;
      }, 2000);
    }
  };

  return (
    <section id="screen-welcome" className="screen active">
      <div className="glass-card kiosk-hero fade-in">
        <div className="kiosk-hero-copy">
          <div className="kiosk-progress" aria-hidden="true">
            <span>Langkah 1 dari 4</span>
            <span className="kiosk-progress-dots"><i className="now" /><i /><i /><i /></span>
          </div>
          <p className="subheading" style={{ marginBottom: 8 }}>
            Video Guestbook Kiosk
          </p>
          <h1
            className="heading-primary"
            onClick={handleTitleClick}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Tap 5x untuk Operator Dashboard"
          >
            {config.coupleNames || 'Rian & Maya'}
          </h1>
          <p className="subheading">
            {config.eventDateLine || '12 September 2026 • Ballroom Hotel Mulia'}
          </p>
          <p className="text-body" style={{ maxWidth: 480 }}>
            Tinggalkan ucapan, doa, dan kesan berharga melalui rekaman video
            singkat. Tanpa antre, tanpa aplikasi tambahan.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
            <button
              className="btn btn-primary btn-lg cx-btn-black"
              onClick={() => setCurrentScreen('guest-name')}
            >
              <Video size={22} />
              <span>Sentuh untuk Mulai</span>
            </button>
          </div>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--c-ink-3)' }}>
            Durasi maks {config.recordSeconds || 60} detik • Tersimpan offline di perangkat ini
          </p>
        </div>

        <div className="kiosk-hero-visual" aria-label="Cara kerja">
          <p style={{ margin: '0 0 8px', fontWeight: 800, fontSize: 14, color: 'var(--c-ink)' }}>
            Cara kerja — 3 ketuk saja
          </p>
          <ul className="kiosk-steps">
            <li>
              <span className="kiosk-step-num">1</span>
              <span><strong>Tulis nama.</strong> Bisa dilewati bila ingin anonim.</span>
            </li>
            <li>
              <span className="kiosk-step-num">2</span>
              <span><strong>Rekam ucapan.</strong> Ikuti hitung mundur, bicara jelas ke mic <Mic size={14} style={{ verticalAlign: '-2px' }} />.</span>
            </li>
            <li>
              <span className="kiosk-step-num">3</span>
              <span><strong>Simpan.</strong> Cek ulang lalu simpan <CheckCircle2 size={14} style={{ verticalAlign: '-2px' }} />. Terima kasih <Heart size={14} style={{ verticalAlign: '-2px' }} />.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
