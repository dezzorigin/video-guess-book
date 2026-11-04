/**
 * OpenWedding Kiosk - Central React State Context
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storage.js';
import { mediaService } from '../services/media.js';

const KioskContext = createContext(null);

export function KioskProvider({ children }) {
  // 1. Navigation & Screen state
  const [currentScreen, setCurrentScreen] = useState('welcome');

  // 2. Configuration state (stored in localStorage)
  const [config, setConfig] = useState(() => storageService.loadConfig());

  // 3. Multi-Event Session state
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventsList, setEventsList] = useState([]);

  // Load and sync active event with config state
  const refreshEvents = useCallback(async () => {
    const defaultEvt = await storageService.ensureDefaultEvent(config);
    const list = await storageService.getAllEvents();
    setEventsList(list);
    setActiveEvent(defaultEvt);

    if (defaultEvt) {
      setConfig(prev => {
        const updated = {
          ...prev,
          coupleNames: defaultEvt.title || `${defaultEvt.groomName || ''} & ${defaultEvt.brideName || ''}`,
          eventDateLine: defaultEvt.subtitle || prev.eventDateLine,
          theme: defaultEvt.theme || prev.theme,
          recordSeconds: defaultEvt.recordSeconds || prev.recordSeconds
        };
        storageService.saveConfig(updated);
        return updated;
      });
    }
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const switchActiveEvent = useCallback(async (eventId) => {
    await storageService.setActiveEventId(eventId);
    await refreshEvents();
  }, [refreshEvents]);

  const createNewEvent = useCallback(async (groomName, brideName, subtitle, theme, recordSeconds) => {
    const newEvt = await storageService.createEvent(groomName, brideName, subtitle, theme || config.theme, recordSeconds);
    if (newEvt) {
      await refreshEvents();
      return newEvt;
    }
    return null;
  }, [config.theme, refreshEvents]);

  const updateActiveEvent = useCallback(async (eventId, fields) => {
    const updated = await storageService.updateEvent(eventId, fields);
    if (updated) {
      await refreshEvents();
      return updated;
    }
    return null;
  }, [refreshEvents]);

  // 4. Session state (per guest flow)
  const [session, setSession] = useState({
    guestName: '',
    recordedBlob: null,
    recordedUrl: null,
    mimeType: mediaService.detectBestMimeType(),
    recordedChunks: []
  });

  // 5. Toast notifications
  const [toasts, setToasts] = useState([]);

  // 6. Confirm Dialog State (Top Layer Modal)
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: 'Konfirmasi',
    message: 'Apakah Anda yakin?',
    confirmText: 'Ya',
    cancelText: 'Batal',
    resolveFn: null
  });

  // 7. Modal & Workspace open states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // 8. Hardware selection
  const [activeCameraId, setActiveCameraId] = useState(null);
  const [activeMicId, setActiveMicId] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

  // Apply Theme to document root whenever theme or active event changes
  useEffect(() => {
    const currentTheme = activeEvent?.theme || config.theme || 'gold';
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [config.theme, activeEvent]);

  // Toast Helper
  const showToast = useCallback((message, type = 'info', durationMs = 3000) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, durationMs);
  }, []);

  // Confirm Dialog Helper
  const showConfirm = useCallback((title, message, confirmText = 'Ya', cancelText = 'Batal') => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        resolveFn: resolve
      });
    });
  }, []);

  const handleConfirmResult = (result) => {
    if (confirmState.resolveFn) {
      confirmState.resolveFn(result);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false, resolveFn: null }));
  };

  // Update Config Helper
  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => {
      const merged = { ...prev, ...newConfig };
      storageService.saveConfig(merged);
      return merged;
    });
  }, []);

  // Session Helper
  const updateSession = useCallback((fields) => {
    setSession(prev => ({ ...prev, ...fields }));
  }, []);

  const resetSession = useCallback(() => {
    if (session.recordedUrl) {
      URL.revokeObjectURL(session.recordedUrl);
    }
    setSession({
      guestName: '',
      recordedBlob: null,
      recordedUrl: null,
      mimeType: mediaService.detectBestMimeType(),
      recordedChunks: []
    });
  }, [session.recordedUrl]);

  return (
    <KioskContext.Provider value={{
      currentScreen, setCurrentScreen,
      config, updateConfig,
      activeEvent, eventsList, refreshEvents, switchActiveEvent, createNewEvent, updateActiveEvent,
      session, updateSession, resetSession,
      toasts, showToast,
      confirmState, showConfirm, handleConfirmResult,
      isPinModalOpen, setIsPinModalOpen,
      isDashboardOpen, setIsDashboardOpen,
      isExportModalOpen, setIsExportModalOpen,
      activeCameraId, setActiveCameraId,
      activeMicId, setActiveMicId,
      mediaStream, setMediaStream
    }}>
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const ctx = useContext(KioskContext);
  if (!ctx) {
    throw new Error('useKiosk must be used within a KioskProvider');
  }
  return ctx;
}

