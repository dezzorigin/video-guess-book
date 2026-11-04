/**
 * OpenWedding Kiosk - Screen 5: Thank You Screen
 */
import React, { useEffect, useRef, useState } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { launchConfetti } from '../../utils/confetti.js';
import { Heart, CheckCircle2 } from 'lucide-react';

export function ScreenThankYou() {
  const { setCurrentScreen, resetSession } = useKiosk();
  const canvasRef = useRef(null);
  const [timer, setTimer] = useState(8);

  useEffect(() => {
    // Launch celebratory confetti
    const stopConfetti = launchConfetti(canvasRef.current);

    // Auto-reset countdown
    setTimer(8);
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          resetSession();
          setCurrentScreen('welcome');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopConfetti();
    };
  }, [setCurrentScreen, resetSession]);

  const handleFinish = () => {
    resetSession();
    setCurrentScreen('welcome');
  };

  return (
    <section id="screen-thankyou" className="screen active">
      <canvas ref={canvasRef} id="thankyou-canvas" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />

      <div className="glass-card fade-in" style={{ textAlign: 'center', zIndex: 10, maxWidth: 560 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 72, height: 72, borderRadius: '50%', background: 'var(--c-olive-light)', border: '1.5px solid var(--c-border)', margin: '0 auto 16px' }}>
          <CheckCircle2 size={36} color="var(--c-olive)" />
        </div>

        <h2 className="heading-primary" style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)' }}>
          Terima kasih!
        </h2>
        <p className="text-body" style={{ maxWidth: 460, margin: '0 auto 20px' }}>
          Pesan Anda tersimpan aman di perangkat ini. Kehadiran dan doa Anda
          sangat berarti. <Heart size={15} style={{ verticalAlign: '-2px' }} color="var(--c-gold)" fill="var(--c-gold)" />
        </p>

        <button className="btn btn-primary btn-lg cx-btn-black" onClick={handleFinish} style={{ minWidth: 220 }}>
          Selesai
        </button>

        <p className="loop-timer-text" style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--c-ink-3)' }}>
          Kembali ke layar utama dalam {timer} detik
        </p>
      </div>
    </section>
  );
}
