/**
 * OpenWedding Kiosk - Toast Notification Container Component
 */
import React from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts } = useKiosk();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item toast-${t.type} show`}>
          <span className="toast-icon">
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'warning' && <AlertTriangle size={18} />}
            {t.type === 'error' && <XCircle size={18} />}
            {t.type === 'info' && <Info size={18} />}
          </span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
