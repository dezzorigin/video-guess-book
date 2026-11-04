/**
 * OpenWedding Kiosk - Screen 4: Preview & Save Decision Screen
 */
import React, { useState } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { storageService } from '../../services/storage.js';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

export function ScreenPreview() {
  const { config, activeEvent, session, resetSession, setCurrentScreen, showToast } = useKiosk();
  const [isSaving, setIsSaving] = useState(false);

  const handleRestart = () => {
    resetSession();
    setCurrentScreen('greeting');
  };

  const handleSave = async () => {
    if (!session.recordedBlob || isSaving) return;
    setIsSaving(true);

    try {
      const ok = await storageService.saveVideoBlob(
        session.recordedBlob,
        session.guestName || 'Tamu Anonim',
        activeEvent?.title || config.coupleNames || 'OpenWedding',
        activeEvent?.id
      );

      if (ok) {
        showToast("Rekaman video berhasil disimpan!", "success");
        setCurrentScreen('thankyou');
      } else {
        showToast("Gagal menyimpan video. Coba lagi.", "error");
      }
    } catch (e) {
      console.error("Save error:", e);
      showToast("Gagal menyimpan video.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="screen-preview" className="screen active">
      <div className="glass-card fade-in" style={{ textAlign: 'left', maxWidth: 720 }}>
        <div className="kiosk-progress">
          <span>Langkah 4 dari 4 — Tinjau</span>
          <span className="kiosk-progress-dots"><i className="done" /><i className="done" /><i className="done" /><i className="now" /></span>
        </div>
        <h2 className="heading-primary" style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)' }}>
          Tinjau rekaman Anda
        </h2>
        <p className="text-body">
          Apakah Anda puas dengan ucapan ini, <strong>{session.guestName || 'Tamu'}</strong>?
          Putar ulang sebelum disimpan permanen.
        </p>

        <div className="preview-player-container">
          <video
            id="recorded-preview"
            src={session.recordedUrl || ''}
            controls
            playsInline
          />
        </div>

        <div className="preview-actions" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary cx-btn-line"
            onClick={handleRestart}
            disabled={isSaving}
          >
            <RotateCcw size={18} />
            <span>Ulangi Rekam</span>
          </button>

          <button
            className="btn btn-primary cx-btn-black"
            onClick={handleSave}
            disabled={isSaving}
            style={{ flex: 1, minWidth: 220 }}
          >
            <CheckCircle2 size={18} />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Ucapan'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
