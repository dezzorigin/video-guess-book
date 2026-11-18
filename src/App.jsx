/**
 * OpenWedding Kiosk - Main React Application Component
 * Client shell speaks the same Crextio language as the operator dashboard:
 * flat cream page, rounded frame, pill topbar. Recording stays frameless.
 */
import React, { useEffect, useState } from 'react';
import { useKiosk } from './context/KioskContext.jsx';
import { Settings } from 'lucide-react';

import { ToastContainer } from './components/common/ToastContainer.jsx';

import { ScreenWelcome } from './components/screens/ScreenWelcome.jsx';
import { ScreenLanding } from './components/screens/ScreenLanding.jsx';
import { ScreenGuestName } from './components/screens/ScreenGuestName.jsx';
import { ScreenGreeting } from './components/screens/ScreenGreeting.jsx';
import { ScreenRecording } from './components/screens/ScreenRecording.jsx';
import { ScreenPreview } from './components/screens/ScreenPreview.jsx';
import { ScreenThankYou } from './components/screens/ScreenThankYou.jsx';

import { PinModal } from './components/modals/PinModal.jsx';
import { OperatorDashboard } from './components/modals/OperatorDashboard.jsx';
import { ExportModal } from './components/modals/ExportModal.jsx';
import { ConfirmModal } from './components/modals/ConfirmModal.jsx';

function KioskTopbar() {
  const { config, activeEvent, setIsPinModalOpen } = useKiosk();
  return (
    <div className="cx-kiosk-topbar" aria-label="Bar atas kiosk">
      <span className="cx-logo">OpenWedding</span>
      <span className="cx-kiosk-session" title="Sesi acara aktif">
        {(activeEvent?.title || config.coupleNames) || 'Video Guestbook'}
      </span>
      <button
        className="cx-iconbtn"
        onClick={() => setIsPinModalOpen(true)}
        title="Buka Pengaturan Operator"
        aria-label="Buka Pengaturan Operator"
      >
        <Settings size={17} />
      </button>
    </div>
  );
}

export default function App() {
  const { currentScreen, setIsPinModalOpen } = useKiosk();

  // Landing page (#landing) hidup di atas kiosk yang sama; hash lain
  // (#admin / #operator) tetap membuka modal PIN seperti sebelumnya.
  const [isLanding, setIsLanding] = useState(
    () => window.location.hash === '#landing'
  );

  // Hash Navigation (#admin or #operator opens PIN Modal directly)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      setIsLanding(hash === '#landing');
      if (hash === '#admin' || hash === '#operator') {
        setIsPinModalOpen(true);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setIsPinModalOpen]);

  if (isLanding) {
    return (
      <div id="app-root">
        <ScreenLanding onOpenKiosk={() => setIsLanding(false)} />
        <PinModal />
        <OperatorDashboard />
        <ExportModal />
        <ConfirmModal />
        <ToastContainer />
      </div>
    );
  }

  const isFrameless = currentScreen === 'recording';

  return (
    <div id="app-root">
      {isFrameless ? (
        /* Recording: frameless fullscreen camera (HUD carries the Crextio pills) */
        <main className="screen-container">
          <ScreenRecording />
        </main>
      ) : (
        <div className="cx-kiosk-bg">
          <div className="cx-kiosk-frame">
            <KioskTopbar />
            {/* Screen Router */}
            <main className="screen-container">
              {currentScreen === 'welcome' && <ScreenWelcome />}
              {currentScreen === 'guest-name' && <ScreenGuestName />}
              {currentScreen === 'greeting' && <ScreenGreeting />}
              {currentScreen === 'preview' && <ScreenPreview />}
              {currentScreen === 'thankyou' && <ScreenThankYou />}
            </main>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <PinModal />
      <OperatorDashboard />
      <ExportModal />
      <ConfirmModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}
