/**
 * OpenWedding Kiosk - Screen 1.5: Guest Name Input
 */
import React, { useState } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { ArrowRight, ArrowLeft, UserX } from 'lucide-react';

export function ScreenGuestName() {
  const { setCurrentScreen, updateSession } = useKiosk();
  const [inputName, setInputName] = useState('');

  const handleConfirm = () => {
    const finalName = inputName.trim() || 'Tamu Anonim';
    updateSession({ guestName: finalName });
    setCurrentScreen('greeting');
  };

  const handleSkip = () => {
    updateSession({ guestName: 'Tamu Anonim' });
    setCurrentScreen('greeting');
  };

  return (
    <section id="screen-guest-name" className="screen active">
      <div className="glass-card fade-in" style={{ textAlign: 'left', maxWidth: 640 }}>
        <div className="kiosk-progress">
          <span>Langkah 2 dari 4 — Identitas</span>
          <span className="kiosk-progress-dots"><i className="done" /><i className="now" /><i /><i /></span>
        </div>
        <h2 className="heading-primary" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)' }}>
          Siapa yang mengirim pesan ini?
        </h2>
        <p className="text-body">
          Nama tampil di daftar rekap operator. Boleh nama pribadi, pasangan, atau keluarga.
        </p>

        <div className="form-group" style={{ margin: '8px 0 20px' }}>
          <label className="form-label" htmlFor="guest-name-input">Nama tamu</label>
          <input
            id="guest-name-input"
            type="text"
            className="form-input"
            placeholder="misal: Budi & Keluarga"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleConfirm();
            }}
            style={{ fontSize: '1.2rem', textAlign: 'left', padding: '0.9rem 1rem' }}
            autoFocus
            maxLength={60}
            autoComplete="off"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary cx-btn-line" onClick={() => setCurrentScreen('welcome')}>
            <ArrowLeft size={18} />
            <span>Kembali</span>
          </button>
          <button className="btn btn-secondary cx-btn-line" onClick={handleSkip}>
            <UserX size={18} />
            <span>Lewati</span>
          </button>
          <button className="btn btn-primary cx-btn-black" onClick={handleConfirm} style={{ flex: 1, minWidth: 180 }}>
            <span>Lanjutkan</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
