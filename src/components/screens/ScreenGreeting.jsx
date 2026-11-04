/**
 * OpenWedding Kiosk - Screen 2: Greeting & Countdown Screen
 */
import React, { useState, useEffect } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { Video } from 'lucide-react';

export function ScreenGreeting() {
  const { setCurrentScreen, session } = useKiosk();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCurrentScreen('recording');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [setCurrentScreen]);

  return (
    <section id="screen-greeting" className="screen active">
      <div className="glass-card fade-in" style={{ textAlign: 'center', maxWidth: 560 }}>
        <div className="kiosk-progress" style={{ justifyContent: 'center' }}>
          <span>Langkah 3 dari 4 — Siap merekam</span>
          <span className="kiosk-progress-dots"><i className="done" /><i className="done" /><i className="now" /><i /></span>
        </div>
        <h2 className="heading-primary" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}>
          Siapkan senyum terbaikmu{session.guestName && session.guestName !== 'Tamu Anonim' ? `, ${session.guestName}` : ''}
        </h2>
        <p className="text-body">
          Perekaman mulai otomatis. Posisikan wajah di tengah bingkai dan bicara jelas.
        </p>

        <div className="countdown-display" aria-live="assertive">
          {countdown > 0 ? countdown : <Video size={56} />}
        </div>
        <p style={{ fontSize: 13, color: 'var(--c-ink-3)', marginTop: 8 }}>
          Jangan tutup halaman selama merekam
        </p>
      </div>
    </section>
  );
}
