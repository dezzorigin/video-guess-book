/**
 * OpenWedding Kiosk - Confirmation Alert Modal Component
 * Top z-index layer (z-index: 99999) to ensure high visibility over any open modal.
 */
import React from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { AlertCircle } from 'lucide-react';

export function ConfirmModal() {
  const { confirmState, handleConfirmResult } = useKiosk();

  if (!confirmState.isOpen) return null;

  return (
    <div id="custom-modal" className="modal-overlay" style={{ zIndex: 99999 }}>
      <div className="glass-card modal-card" style={{ maxWidth: '460px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem', width: '100%' }}>
          <AlertCircle size={24} color="var(--c-warning)" />
          <h2 className="modal-title" style={{ margin: 0, fontSize: '1.4rem' }}>
            {confirmState.title}
          </h2>
        </div>

        <p className="text-body" style={{ fontSize: '0.95rem', color: 'var(--c-ink-2)', marginBottom: '1.5rem', width: '100%' }}>
          {confirmState.message}
        </p>

        <div className="modal-actions" style={{ marginTop: 0 }}>
          <button
            className="btn btn-secondary cx-btn-line"
            onClick={() => handleConfirmResult(false)}
          >
            {confirmState.cancelText || 'Batal'}
          </button>
          <button
            className="btn btn-primary cx-btn-black"
            onClick={() => handleConfirmResult(true)}
          >
            {confirmState.confirmText || 'Ya'}
          </button>
        </div>
      </div>
    </div>
  );
}
