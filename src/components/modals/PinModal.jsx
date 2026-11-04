/**
 * OpenWedding Kiosk - Security PIN Modal Component
 */
import React, { useState } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { Lock, X } from 'lucide-react';

export function PinModal() {
  const { isPinModalOpen, setIsPinModalOpen, setIsDashboardOpen, config, showToast } = useKiosk();
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isPinModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPin = config.operatorPin || '1234';

    if (pinInput === correctPin) {
      setPinInput('');
      setErrorMsg('');
      setIsPinModalOpen(false);
      setIsDashboardOpen(true);
      showToast("Akses Operator Diterima", "success");
    } else {
      setErrorMsg('PIN salah. Coba lagi.');
      setPinInput('');
    }
  };

  const handleClose = () => {
    setPinInput('');
    setErrorMsg('');
    setIsPinModalOpen(false);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-card" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={22} color="var(--c-olive)" />
            <h2 className="modal-title" style={{ margin: 0, fontSize: '1.4rem' }}>Akses Operator</h2>
          </div>
          <button className="btn-close-dashboard" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <p className="text-body" style={{ fontSize: '0.9rem', color: 'var(--c-ink-2)', marginBottom: '1rem' }}>
            Masukkan PIN Operator untuk membuka EO Control Center.
          </p>

          <input
            type="password"
            className="form-input"
            placeholder="PIN"
            maxLength={8}
            inputMode="numeric"
            pattern="[0-9]*"
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            style={{
              textAlign: 'center',
              fontSize: '1.8rem',
              letterSpacing: '0.4em',
              padding: '0.75rem',
              marginBottom: '0.5rem'
            }}
            autoFocus
          />

          {errorMsg && (
            <p style={{ color: 'var(--c-danger)', fontSize: '0.85rem', textAlign: 'center', margin: '0.2rem 0 0.8rem' }}>
              {errorMsg}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary cx-btn-line" style={{ flex: 1 }} onClick={handleClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary cx-btn-black" style={{ flex: 1 }}>
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
