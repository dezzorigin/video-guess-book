/**
 * OpenWedding Kiosk - Full-Screen Enterprise Operator Dashboard
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { storageService } from '../../services/storage.js';
import { mediaService } from '../../services/media.js';
import { exportService } from '../../services/exportService.js';
import { THEME_OPTIONS } from '../../constants/themes.js';
import {
  LayoutDashboard, Calendar, Film, Mic, X,
  RotateCcw, Wrench, Download, Play, Trash2, CheckCircle,
  Search, Filter, Share2, Plus, ShieldCheck, HardDrive,
  FileSpreadsheet, FileText, CheckSquare, Square, ChevronDown, RefreshCw, Eye,
  AlertTriangle, Activity, Clock, Users, TrendingUp, Zap, Database, Video
} from 'lucide-react';

function buildAreaChartPaths(values, w = 600, h = 200, pad = 20) {  if (!values || values.length === 0) return { line: '', area: '', points: [] };
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = values.length > 1 ? pad + i * stepX : w / 2;
    const y = h - pad - (v / max) * (h - pad * 2);
    return { x, y, v };
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad.toFixed(1)},${(h - pad).toFixed(1)} Z`;
  return { line, area, points: pts };
}

/* Compact theme picker: one row of 4-dot radio pills (no giant cards, no duplicate select) */
function ThemeDots({ value, onChange, label }) {
  const selected = THEME_OPTIONS.find(t => t.id === value);
  return (
    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
      <span className="form-label">{label || 'Tema Warna Acara'}</span>
      <div className="cx-themedots" role="radiogroup" aria-label={label || 'Tema warna acara'}>
        {THEME_OPTIONS.map(t => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={value === t.id}
            title={`${t.name} — ${t.badge}`}
            aria-label={t.name}
            className={`cx-themedot ${value === t.id ? 'active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            <span style={{ background: t.bg }} />
            <span style={{ background: t.surface }} />
            <span style={{ background: t.primary }} />
            <span style={{ background: t.accent }} />
          </button>
        ))}
      </div>
      <p className="cx-themedot-name">{selected?.name} <span>• {selected?.badge}</span></p>
    </div>
  );
}

export function OperatorDashboard() {
  const {
    isDashboardOpen, setIsDashboardOpen,
    config, updateConfig,
    activeEvent, eventsList, refreshEvents, switchActiveEvent, createNewEvent, updateActiveEvent,
    showToast, showConfirm,
    activeCameraId, setActiveCameraId,
    activeMicId, setActiveMicId,
    setMediaStream
  } = useKiosk();

  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState('op-tab-overview'); // overview, events, gallery, hardware

  // Videos & Data State
  const [allVideos, setAllVideos] = useState([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('active'); // 'active' | 'all' | specific eventId
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, name
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Storage & Health State
  const [storageInfo, setStorageInfo] = useState({ usedMB: 0, availableMB: 9999, quotaMB: 9999, isPersisted: false });
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [exportProgressPct, setExportProgressPct] = useState(0);
  const [exportProgressText, setExportProgressText] = useState('');

  // Dropdown UI Toggle State
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  // Proper menus: close on Escape or outside tap (iPad-friendly)
  useEffect(() => {
    if (!isSaveMenuOpen && !isShareMenuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsSaveMenuOpen(false);
        setIsShareMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSaveMenuOpen, isShareMenuOpen]);

  const closeMenus = useCallback(() => {
    setIsSaveMenuOpen(false);
    setIsShareMenuOpen(false);
  }, []);

  // New Event Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroomName, setNewGroomName] = useState('');
  const [newBrideName, setNewBrideName] = useState('');
  const [newEventSubtitle, setNewEventSubtitle] = useState('');
  const [newEventTheme, setNewEventTheme] = useState('gold');
  const [newEventDuration, setNewEventDuration] = useState(60);

  // Edit Active Event Form State
  const [editGroomName, setEditGroomName] = useState('');
  const [editBrideName, setEditBrideName] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editTheme, setEditTheme] = useState('gold');
  const [editDuration, setEditDuration] = useState(60);

  // Sync Edit Active Event inputs when activeEvent changes
  useEffect(() => {
    if (activeEvent) {
      const parts = (activeEvent.title || '').split('&').map(s => s.trim());
      setEditGroomName(activeEvent.groomName || parts[0] || 'Rian');
      setEditBrideName(activeEvent.brideName || parts[1] || 'Maya');
      setEditSubtitle(activeEvent.subtitle || config.eventDateLine || '');
      setEditTheme(activeEvent.theme || config.theme || 'gold');
      setEditDuration(activeEvent.recordSeconds || config.recordSeconds || 60);
    }
  }, [activeEvent, config]);

  const handleSelectEditTheme = useCallback((themeId) => {
    setEditTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  }, []);

  // Hardware State
  const [cameras, setCameras] = useState([]);
  const [mics, setMics] = useState([]);
  const [micTestFillPct, setMicTestFillPct] = useState(0);
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null);

  // Load stats and videos
  const loadDashboardData = useCallback(async () => {
    await refreshEvents();
    const vList = await storageService.getAllVideos();
    setAllVideos(vList);
    const quota = await storageService.checkStorageQuota();
    setStorageInfo(quota);
  }, [refreshEvents]);

  useEffect(() => {
    if (isDashboardOpen) {
      loadDashboardData();

      // Load hardware devices
      mediaService.getDevices().then(({ cameras, mics }) => {
        setCameras(cameras);
        setMics(mics);
        if (cameras.length > 0 && !activeCameraId) setActiveCameraId(cameras[0].deviceId);
        if (mics.length > 0 && !activeMicId) setActiveMicId(mics[0].deviceId);
      });
    }
  }, [isDashboardOpen, loadDashboardData, activeCameraId, activeMicId, setActiveCameraId, setActiveMicId]);

  // Hardware Tab Live Mic Test
  useEffect(() => {
    if (isDashboardOpen && activeTab === 'op-tab-hardware') {
      let isMounted = true;
      mediaService.requestMediaStream(activeCameraId, activeMicId).then(stream => {
        if (!isMounted) return;
        setMediaStream(stream);
        mediaService.startAudioVisualizer(stream, (pct) => {
          if (isMounted) setMicTestFillPct(pct);
        });
      }).catch(err => console.warn("Hardware test stream error:", err));

      return () => {
        isMounted = false;
        mediaService.stopAudioVisualizer();
      };
    }
  }, [isDashboardOpen, activeTab, activeCameraId, activeMicId, setMediaStream]);

  // Filtered and sorted videos list
  const filteredVideos = useMemo(() => {
    let result = [...allVideos];

    // Event Filtering
    if (selectedEventFilter === 'active') {
      if (activeEvent) {
        result = result.filter(v => v.eventId === activeEvent.id);
      }
    } else if (selectedEventFilter !== 'all') {
      result = result.filter(v => v.eventId === selectedEventFilter);
    }

    // Search Query Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(v =>
        (v.guestName || '').toLowerCase().includes(q) ||
        (v.timestamp || '').toLowerCase().includes(q) ||
        (v.filename || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return (b.rawDate || 0) - (a.rawDate || 0);
      if (sortBy === 'oldest') return (a.rawDate || 0) - (b.rawDate || 0);
      if (sortBy === 'name') return (a.guestName || '').localeCompare(b.guestName || '');
      return 0;
    });

    return result;
  }, [allVideos, selectedEventFilter, activeEvent, searchQuery, sortBy]);

  // WattVision-style analytics: KPIs, area chart buckets, alerts
  const analytics = useMemo(() => {
    const totalSizeMB = allVideos.reduce((s, v) => s + (parseFloat(v.sizeMB) || 0), 0);
    const activeSizeMB = filteredVideos.reduce((s, v) => s + (parseFloat(v.sizeMB) || 0), 0);
    const recordSec = activeEvent?.recordSeconds || config?.recordSeconds || 60;
    const estMinutes = Math.round((filteredVideos.length * recordSec) / 60);

    // Bucket videos per hour for area chart (max 8 points)
    const byHour = new Map();
    [...filteredVideos].forEach(v => {
      const d = v.rawDate ? new Date(v.rawDate) : null;
      if (!d || isNaN(d)) return;
      const key = `${String(d.getHours()).padStart(2, '0')}:00`;
      byHour.set(key, (byHour.get(key) || 0) + 1);
    });
    const sortedHours = [...byHour.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const chartLabels = sortedHours.slice(-8).map(([k]) => k);
    const chartValues = sortedHours.slice(-8).map(([, c]) => c);
    const chart = buildAreaChartPaths(chartValues);
    const peakIdx = chartValues.length ? chartValues.indexOf(Math.max(...chartValues)) : -1;

    // Alerts (WattVision: red left-border box, green live state)
    const alerts = [];
    if (storageInfo.availableMB < 1000) {
      alerts.push({
        kind: 'critical',
        title: 'Memori hampir penuh',
        desc: `Sisa ${(storageInfo.availableMB / 1024).toFixed(2)} GB. Export ZIP lalu hapus video lama.`
      });
    }
    if (!storageInfo.isPersisted) {
      alerts.push({
        kind: 'warn',
        title: 'Storage masih Temporary',
        desc: 'Browser bisa hapus data. Aktifkan Persist di Chrome: Site Settings > Storage.'
      });
    }
    if (filteredVideos.length === 0) {
      alerts.push({
        kind: 'warn',
        title: 'Belum ada rekaman sesi aktif',
        desc: 'Kiosk siap. Cek kamera & mic di tab Uji Perangkat sebelum tamu datang.'
      });
    }
    if (cameras.length === 0 || mics.length === 0) {
      alerts.push({
        kind: 'warn',
        title: 'Perangkat belum terdeteksi',
        desc: 'Buka tab Uji Perangkat untuk izin kamera & mikrofon.'
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        kind: 'ok',
        title: 'Sistem live & sehat',
        desc: `${allVideos.length} video aman di IndexedDB. Kiosk siap menerima tamu.`
      });
    }

    const recentVideos = [...filteredVideos].slice(0, 5);

    return { totalSizeMB, activeSizeMB, estMinutes, recordSec, chartLabels, chartValues, chart, peakIdx, alerts, recentVideos };
  }, [allVideos, filteredVideos, activeEvent, config, storageInfo, cameras, mics]);

  if (!isDashboardOpen) return null;

  // ---------------------------------------------------------------------------
  // Checkbox & Selection Handlers
  // ---------------------------------------------------------------------------
  const isAllSelected = filteredVideos.length > 0 && filteredVideos.every(v => selectedVideoIds.has(v.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVideoIds(new Set());
    } else {
      const newSet = new Set(filteredVideos.map(v => v.id));
      setSelectedVideoIds(newSet);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedVideoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const targetVideosForAction = () => {
    if (selectedVideoIds.size > 0) {
      return allVideos.filter(v => selectedVideoIds.has(v.id));
    }
    return filteredVideos;
  };

  // ---------------------------------------------------------------------------
  // Export & Download Actions
  // ---------------------------------------------------------------------------
  const handleExportZip = async () => {
    setIsSaveMenuOpen(false);
    const videos = targetVideosForAction();
    if (videos.length === 0) {
      showToast("Tidak ada video yang dipilih untuk diexport.", "warning");
      return;
    }

    setIsExportingZip(true);
    const currentEvtTitle = activeEvent?.title || config.coupleNames || 'OpenWedding';
    const currentEvtDate = activeEvent?.subtitle || config.eventDateLine || '';

    try {
      const zipBlob = await exportService.buildEventZip(
        videos,
        currentEvtTitle,
        currentEvtDate,
        (pct, text) => {
          setExportProgressPct(pct);
          setExportProgressText(text);
        }
      );

      const zipFilename = `${currentEvtTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_${videos.length}_Video_Guestbook.zip`;
      exportService.downloadBlob(zipBlob, zipFilename);

      showToast(`Paket ${videos.length} video + Rekap Tamu berhasil didownload!`, "success");
    } catch (err) {
      console.error("ZIP Export Error:", err);
      showToast("Gagal membuat paket ZIP.", "error");
    } finally {
      setTimeout(() => {
        setIsExportingZip(false);
        setExportProgressPct(0);
      }, 2000);
    }
  };

  const handleExportCSVOnly = () => {
    setIsSaveMenuOpen(false);
    const videos = targetVideosForAction();
    if (videos.length === 0) {
      showToast("Tidak ada data tamu untuk diexport.", "warning");
      return;
    }
    const csvContent = exportService.generateGuestListCSV(videos, activeEvent?.title || 'OpenWedding');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `Daftar_Tamu_${(activeEvent?.title || 'OpenWedding').replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    exportService.downloadBlob(blob, filename);
    showToast("Rekap Daftar Tamu (CSV) diunduh!", "success");
  };

  const handleExportTXTOnly = () => {
    setIsSaveMenuOpen(false);
    const videos = targetVideosForAction();
    if (videos.length === 0) {
      showToast("Tidak ada data tamu untuk diexport.", "warning");
      return;
    }
    const txtContent = exportService.generateGuestListTXT(videos, activeEvent?.title || 'OpenWedding', activeEvent?.subtitle);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const filename = `Daftar_Tamu_${(activeEvent?.title || 'OpenWedding').replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
    exportService.downloadBlob(blob, filename);
    showToast("Rekap Teks Daftar Tamu (TXT) diunduh!", "success");
  };

  const handleShareWebShare = async () => {
    setIsShareMenuOpen(false);
    const videos = targetVideosForAction();
    if (videos.length === 0) {
      showToast("Pilih setidaknya 1 video untuk dibagikan.", "warning");
      return;
    }

    const files = videos.map((v, idx) => {
      const cleanGuest = (v.guestName || `Tamu_${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanGuest}_${idx + 1}.mp4`;
      const mp4Blob = v.blob.type.includes('mp4') ? v.blob : new Blob([v.blob], { type: 'video/mp4' });
      return new File([mp4Blob], filename, { type: 'video/mp4' });
    });

    if (navigator.canShare) {
      try {
        if (navigator.canShare({ files })) {
          await navigator.share({
            files,
            title: `${activeEvent?.title || 'OpenWedding'} - Video Guestbook`,
            text: `Kumpulan ${videos.length} video rekaman tamu acara.`
          });
          showToast("Video berhasil dibagikan ke Photos/AirDrop!", "success");
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn("Web share failed:", err);
      }
    }

    showToast("Fitur Langsung Galeri tidak didukung di perangkat ini. Gunakan Export ZIP.", "warning");
  };

  const handleShareSummaryText = async () => {
    setIsShareMenuOpen(false);
    const videos = targetVideosForAction();
    const txtContent = exportService.generateGuestListTXT(videos, activeEvent?.title || 'OpenWedding', activeEvent?.subtitle);

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(txtContent);
      showToast("Laporan Teks Rekap disalin ke Clipboard!", "success");
    } else {
      showToast("Gagal menyalin ke clipboard.", "error");
    }
  };

  // ---------------------------------------------------------------------------
  // Delete Actions
  // ---------------------------------------------------------------------------
  const handleDeleteSingle = async (v) => {
    const ok = await showConfirm(
      'Hapus Video?',
      `Hapus rekaman dari "${v.guestName || 'Tamu Anonim'}"?`,
      'Ya, Hapus',
      'Batal'
    );
    if (ok) {
      const success = await storageService.deleteVideo(v.id);
      if (success) {
        showToast(`Video "${v.guestName}" berhasil dihapus.`, 'warning');
        loadDashboardData();
      } else {
        showToast('Gagal menghapus video.', 'error');
      }
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedVideoIds.size === 0) return;
    const ok = await showConfirm(
      'Hapus Video Terpilih?',
      `Yakin ingin menghapus ${selectedVideoIds.size} video yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      `Hapus ${selectedVideoIds.size} Video`,
      'Batal'
    );
    if (ok) {
      const success = await storageService.deleteMultipleVideos(Array.from(selectedVideoIds));
      if (success) {
        showToast(`${selectedVideoIds.size} video berhasil dihapus.`, 'warning');
        setSelectedVideoIds(new Set());
        loadDashboardData();
      } else {
        showToast('Gagal menghapus video terpilih.', 'error');
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Event Management Handlers
  // ---------------------------------------------------------------------------
  const handleCreateNewEventSubmit = async (e) => {
    e.preventDefault();
    if (!newGroomName.trim() || !newBrideName.trim()) {
      showToast("Isi nama mempelai pria dan mempelai wanita terlebih dahulu.", "warning");
      return;
    }
    const created = await createNewEvent(
      newGroomName.trim(),
      newBrideName.trim(),
      newEventSubtitle.trim() || 'Ballroom / Location',
      newEventTheme,
      newEventDuration
    );
    if (created) {
      showToast(`Sesi Acara Baru "${created.title}" Berhasil Dibuat & Aktif!`, "success");
      setNewGroomName('');
      setNewBrideName('');
      setNewEventSubtitle('');
      loadDashboardData();
    } else {
      showToast("Gagal membuat sesi acara.", "error");
    }
  };

  const handleUpdateActiveEventSubmit = async (e) => {
    e.preventDefault();
    if (!activeEvent) return;
    if (!editGroomName.trim() || !editBrideName.trim()) {
      showToast("Nama mempelai pria dan wanita tidak boleh kosong.", "warning");
      return;
    }

    // updateActiveEvent is destructured at top of component
    const updated = await updateActiveEvent(activeEvent.id, {
      groomName: editGroomName.trim(),
      brideName: editBrideName.trim(),
      subtitle: editSubtitle.trim(),
      theme: editTheme,
      recordSeconds: parseInt(editDuration, 10) || 60
    });

    if (updated) {
      showToast("Pengaturan Sesi Acara Berhasil Diperbarui!", "success");
      loadDashboardData();
    } else {
      showToast("Gagal memperbarui sesi acara.", "error");
    }
  };

  const handleSwitchEvent = async (evtId) => {
    await switchActiveEvent(evtId);
    showToast("Sesi Acara Aktif Berhasil Diganti!", "success");
    loadDashboardData();
  };

  const handleForceReset = async () => {
    const ok = await showConfirm(
      "Reset ke Welcome Screen?",
      "Kembali ke layar utama Kiosk untuk tamu?",
      "Kembali ke Welcome",
      "Batal"
    );
    if (ok) {
      setIsDashboardOpen(false);
      window.location.hash = '';
    }
  };

  return (
    <div id="operator-dashboard-modal" className="cx-shell" style={{ zIndex: 2000 }}>
      <div className="cx-frame">
      {/* CREXTIO PILL NAVBAR */}
      <nav className="cx-nav" aria-label="Navigasi operator">
        <span className="cx-logo">OpenWedding</span>
        <div className="cx-tabs" role="tablist">
          <button
            type="button" role="tab"
            className={`cx-tab ${activeTab === 'op-tab-overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('op-tab-overview')}
          >
            <LayoutDashboard size={14} />
            <span>Dashboard</span>
          </button>
          <button
            type="button" role="tab"
            className={`cx-tab ${activeTab === 'op-tab-gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('op-tab-gallery')}
          >
            <Film size={14} />
            <span>Galeri</span>
            <span className="cx-count">{allVideos.length}</span>
          </button>
          <button
            type="button" role="tab"
            className={`cx-tab ${activeTab === 'op-tab-events' ? 'active' : ''}`}
            onClick={() => setActiveTab('op-tab-events')}
          >
            <Calendar size={14} />
            <span>Events</span>
            <span className="cx-count">{eventsList.length}</span>
          </button>
          <button
            type="button" role="tab"
            className={`cx-tab ${activeTab === 'op-tab-hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('op-tab-hardware')}
          >
            <Mic size={14} />
            <span>Perangkat</span>
          </button>
        </div>
        <div className="cx-actions">
          <select
            className="cx-eventpick"
            value={activeEvent?.id || ''}
            onChange={(e) => handleSwitchEvent(e.target.value)}
            aria-label="Pilih sesi acara"
          >
            {eventsList.map(evt => (
              <option key={evt.id} value={evt.id}>
                {evt.status === 'active' ? 'Aktif — ' : ''}{evt.title} ({evt.createdDate})
              </option>
            ))}
          </select>
          <span className="cx-memory" title="Status penyimpanan offline">
            <HardDrive size={14} />
            <span>{storageInfo.usedMB.toFixed(1)} MB</span>
            <span className={`wv-live-dot`} style={{ fontSize: 10 }}>{storageInfo.isPersisted ? 'Persisted' : 'Temporary'}</span>
          </span>
          <button className="cx-iconbtn" onClick={handleForceReset} title="Kembali ke Kiosk" aria-label="Kembali ke Kiosk">
            <Eye size={16} />
          </button>
          <button className="cx-iconbtn" onClick={() => setIsDashboardOpen(false)} title="Tutup Dashboard" aria-label="Tutup Dashboard">
            <X size={16} />
          </button>
        </div>
      </nav>
        {/* CREXTIO CONTENT (no sidebar — pill nav above) */}
        <main>
          {/* ================================================================= */}
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          {/* ================================================================= */}
          {activeTab === 'op-tab-overview' && (
            <div className="tab-pane active fade-in">
              {/* CREXTIO WELCOME HEADER */}
              <div className="cx-welcome">
                <h2>Welcome in, {(activeEvent?.title || config.coupleNames || 'Rian & Maya').split('&')[0].trim()}</h2>
                <div className="cx-welcome-row">
                  <div className="cx-seg">
                    <div style={{ width: '100%' }}>
                      <div className="cx-seg-meta">
                        <span>Video <b>{filteredVideos.length}</b></span>
                        <span>Sesi <b>{eventsList.length}</b></span>
                        <span>Memori <b>{storageInfo.usedMB.toFixed(1)} MB</b></span>
                      </div>
                      <div className="cx-segbar" aria-hidden="true">
                        <span className="s-black" style={{ width: `${Math.min(38, 10 + filteredVideos.length * 4)}%` }}>{filteredVideos.length} video</span>
                        <span className="s-yellow" style={{ width: `${Math.min(30, 8 + eventsList.length * 6)}%` }}>{eventsList.length} sesi</span>
                        <span className="s-hatch">{storageInfo.usedMB.toFixed(0)} MB</span>
                        <span className="s-outline">{analytics.recordSec}s</span>
                      </div>
                    </div>
                  </div>
                  <div className="cx-stats">
                    <div className="cx-stat">
                      <span className="n"><Video size={20} />{filteredVideos.length}</span>
                      <span className="l">Video sesi</span>
                    </div>
                    <div className="cx-stat">
                      <span className="n"><Users size={20} />{allVideos.length}</span>
                      <span className="l">Total video</span>
                    </div>
                    <div className="cx-stat">
                      <span className="n"><HardDrive size={20} />{analytics.totalSizeMB.toFixed(0)}</span>
                      <span className="l">MB tersimpan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CREXTIO GRID */}
              <div className="cx-grid">
                {/* Profile card */}
                <div className="cx-card cx-profile cx-3">
                  <div className="cx-avatar" aria-hidden="true">
                    <span>{((activeEvent?.title || config.coupleNames || 'R M').split('&').map(s => s.trim()[0]).join('').slice(0, 2)).toUpperCase()}</span>
                  </div>
                  <div className="cx-profile-info">
                    <div>
                      <b>{activeEvent?.title || config.coupleNames}</b>
                      <small>{activeEvent?.subtitle || config.eventDateLine}</small>
                    </div>
                    <span className="cx-pill">{analytics.recordSec}s</span>
                  </div>
                </div>

                {/* Progress / week bars */}
                <div className="cx-card cx-3">
                  <div className="cx-row-top">
                    <h3>Progress</h3>
                    <span className="corner"><TrendingUp size={14} /></span>
                  </div>
                  <div className="cx-bignum">{analytics.estMinutes}<small> mnt</small> <small>estimasi • {filteredVideos.length} video</small></div>
                  <div style={{ marginTop: 6 }}>
                    <span className="cx-pill line">{analytics.chartLabels.length > 0 ? `Puncak ${analytics.chartLabels[analytics.peakIdx] || ''}` : 'Belum ada tren'}</span>
                  </div>
                  <div className="cx-weekbars">
                    {(() => {
                      const vals = analytics.chartValues.length ? analytics.chartValues.slice(-7) : [0, 0, 0, 0, 0, 0, 0];
                      const days = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];
                      const max = Math.max(...vals, 1);
                      return vals.map((v, i) => (
                        <div key={i}>
                          <i className={v >= max && v > 0 ? 'hot' : v > 0 ? 'fill' : ''} style={{ height: `${Math.max(8, (v / max) * 64)}px` }} />
                          <em>{days[i % 7]}</em>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Ring tracker memori */}
                <div className="cx-card cx-3">
                  <div className="cx-row-top">
                    <h3>Time tracker</h3>
                    <span className="corner"><Clock size={14} /></span>
                  </div>
                  <div className="cx-ringwrap">
                    {(() => {
                      const pct = Math.min(100, (storageInfo.usedMB / 4000) * 100);
                      const R = 52, C = 2 * Math.PI * R;
                      return (
                        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label=".Anchor memori">
                          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--cx-line)" strokeWidth="10" strokeDasharray="3 5" />
                          <circle cx="70" cy="70" r={R} fill="none" stroke={storageInfo.availableMB < 1000 ? 'var(--cx-danger)' : 'var(--cx-yellow)'} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C} transform="rotate(-90 70 70)" />
                          <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="300" fill="var(--cx-ink)">{storageInfo.usedMB.toFixed(1)}</text>
                          <text x="70" y="86" textAnchor="middle" fontSize="10" fill="var(--cx-muted)">MB terpakai</text>
                        </svg>
                      );
                    })()}
                  </div>
                  <div className="cx-ringmeta">
                    <div className="cx-playbtns">
                      <button onClick={() => setActiveTab('op-tab-gallery')} title="Buka galeri" aria-label="Buka galeri"><Film size={15} /></button>
                      <button onClick={handleExportZip} title="Export ZIP" aria-label="Export ZIP"><Download size={15} /></button>
                    </div>
                    <span className="cx-pill line">{storageInfo.isPersisted ? 'Persisted' : 'Temporary'}</span>
                  </div>
                </div>

                {/* Kesiapan kiosk */}
                <div className="cx-card cx-3">
                  <div className="cx-row-top">
                    <h3>Kesiapan</h3>
                    <span style={{ fontSize: 22, fontWeight: 300 }}>{(() => {
                      const tasks = [filteredVideos.length > 0 || true, cameras.length > 0 || mics.length > 0 || true, storageInfo.availableMB >= 1000, storageInfo.isPersisted];
                      const done = tasks.filter(Boolean).length;
                      return `${Math.round((done / tasks.length) * 100)}%`;
                    })()}</span>
                  </div>
                  <div className="cx-splitlabels"><span>Siap</span><span>Siaga</span><span>Risiko</span></div>
                  <div className="cx-splitbar">
                    <span className="a" style={{ flex: 2 }}>Siap</span>
                    <span className="b" style={{ flex: 1 }}>Cek</span>
                    <span className="c" style={{ flex: storageInfo.isPersisted ? 0.2 : 1 }}>Alerta</span>
                  </div>
                  <p className="sub" style={{ marginTop: 10 }}>{analytics.alerts[0]?.title || 'Sistem siap'} — {analytics.alerts[0]?.desc || ''}</p>
                  <button className="btn btn-primary btn-xs" style={{ borderRadius: 999, width: '100%' }} onClick={() => setActiveTab('op-tab-hardware')}>
                    <Mic size={14} /><span>Uji perangkat</span>
                  </button>
                </div>

                {/* Perangkat accordion */}
                <div className="cx-card cx-3">
                  <div className="cx-row-top">
                    <h3>Perangkat</h3>
                    <span className="corner"><ShieldCheck size={14} /></span>
                  </div>
                  <div className="cx-acc">
                    <div className="cx-acc-item">
                      <button className="cx-acc-head" onClick={() => setActiveTab('op-tab-hardware')}><span>Kamera ({cameras.length})</span><Eye size={14} /></button>
                      <div className="cx-device">
                        <span className="thumb"><Video size={16} /></span>
                        <div><b>{cameras.length > 0 ? 'Terdeteksi' : 'Belum ada izin'}</b><small>{cameras.length} kamera • uji di tab Perangkat</small></div>
                      </div>
                    </div>
                    <div className="cx-acc-item">
                      <button className="cx-acc-head" onClick={() => setActiveTab('op-tab-hardware')}><span>Mikrofon ({mics.length})</span><Mic size={14} /></button>
                      <div className="cx-device">
                        <span className="thumb"><Mic size={16} /></span>
                        <div><b>{mics.length > 0 ? 'Terdeteksi' : 'Belum ada izin'}</b><small>Level live • {Math.round(micTestFillPct)}%</small></div>
                      </div>
                    </div>
                    <div className="cx-acc-item">
                      <div className="cx-acc-head"><span>Penyimpanan</span><HardDrive size={14} /></div>
                      <div className="cx-device">
                        <span className="thumb"><Database size={16} /></span>
                        <div><b>IndexedDB {(storageInfo.availableMB / 1024).toFixed(2)} GB sisa</b><small>{storageInfo.isPersisted ? 'Persisted — aman' : 'Temporary — aktifkan Persist'}</small></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendar strip */}
                <div className="cx-card cx-6">
                  <div className="cx-cal-head">
                    <span className="cx-cal-month">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                    <span className="cx-cal-nav">{activeEvent?.title || config.coupleNames}</span>
                  </div>
                  <div className="cx-cal-grid">
                    {(() => {
                      const base = new Date();
                      const start = new Date(base);
                      start.setDate(base.getDate() - base.getDay() + 1);
                      return Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(start);
                        d.setDate(start.getDate() + i);
                        const isToday = d.toDateString() === new Date().toDateString();
                        return (
                          <div key={i} className={`cx-cal-day ${isToday ? 'today' : ''}`}>
                            <span>{d.toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                            <b>{d.getDate()}</b>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  {analytics.chartValues.length >= 2 ? (
                    <>
                      <svg className="cx-chart-svg" viewBox="0 0 600 150" preserveAspectRatio="none" role="img" aria-label="Tren rekaman">
                        <path d={analytics.chart.area} fill="var(--cx-yellow)" opacity="0.35" />
                        <path d={analytics.chart.line} fill="none" stroke="var(--cx-black)" strokeWidth="2.5" strokeLinecap="round" />
                        {analytics.chart.points.map((pt, i) => (
                          <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r={i === analytics.peakIdx ? 5 : 3.5} fill="var(--cx-black)" />
                            <text x={pt.x} y={142} textAnchor="middle" fontSize="9" fill="var(--cx-muted)">{analytics.chartLabels[i]}</text>
                          </g>
                        ))}
                      </svg>
                      <div className="cx-event-dark">
                        <b>Puncak {analytics.chartLabels[analytics.peakIdx]}</b>
                        <small>{Math.max(...analytics.chartValues)} video dalam satu jam • {analytics.recordSec}s maks per rekaman</small>
                      </div>
                    </>
                  ) : (
                    <div className="cx-event-light">
                      <b>{activeEvent?.title || config.coupleNames}</b>
                      <small>{activeEvent?.subtitle || config.eventDateLine} • Rekaman tampil di sini setelah 2 slot jam terisi</small>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-xs" style={{ borderRadius: 999 }} onClick={() => setActiveTab('op-tab-gallery')}>
                      <Film size={14} /><span>Buka Galeri</span>
                    </button>
                    <button className="btn btn-secondary btn-xs" style={{ borderRadius: 999 }} onClick={() => setActiveTab('op-tab-events')}>
                      <Plus size={14} /><span>Kelola sesi</span>
                    </button>
                  </div>
                </div>

                {/* Dark task card */}
                <div className="cx-3">
                  <div className="cx-darkcard">
                    <div className="cx-row-top">
                      <h3>Onboarding Task</h3>
                      <span style={{ fontSize: 20, fontWeight: 300 }}>{(() => {
                        const done = [storageInfo.isPersisted, cameras.length > 0 || mics.length > 0, filteredVideos.length > 0, eventsList.length > 0].filter(Boolean).length;
                        return `${done}/4`;
                      })()}</span>
                    </div>
                    {[
                      { t: 'Storage Persisted', s: storageInfo.isPersisted ? 'Aktif — aman' : 'Temporary — aktifkan', ok: storageInfo.isPersisted, icon: <Database size={14} /> },
                      { t: 'Kamera & Mic', s: `${cameras.length} kamera • ${mics.length} mic`, ok: cameras.length > 0 || mics.length > 0, icon: <Video size={14} /> },
                      { t: 'Video pertama', s: filteredVideos.length > 0 ? `${filteredVideos.length} terekam` : 'Belum ada — mulai kiosk', ok: filteredVideos.length > 0, icon: <Film size={14} /> },
                      { t: 'Export siap', s: `${allVideos.length} video • ZIP + CSV`, ok: allVideos.length > 0, icon: <Download size={14} /> },
                    ].map((it, i) => (
                      <div key={i} className="cx-task">
                        <span className="ic">{it.icon}</span>
                        <div><b>{it.t}</b><small>{it.s}</small></div>
                        <span className="done">{it.ok ? <CheckCircle size={16} /> : <span style={{ width: 12, height: 12, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.35)', display: 'inline-block' }} />}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent table full width */}
                <div className="cx-card cx-12">
                  <div className="cx-row-top">
                    <h3><Film size={15} /> Rekaman Terbaru</h3>
                    <button className="btn btn-secondary btn-xs" style={{ borderRadius: 999 }} onClick={() => setActiveTab('op-tab-gallery')}>Lihat semua</button>
                  </div>
                  <p className="sub">5 video terakhir sesi aktif</p>
                  {analytics.recentVideos.length === 0 ? (
                    <p className="sub" style={{ margin: 0 }}>Belum ada video. Mulai kiosk untuk rekaman pertama.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="wv-table">
                        <thead><tr><th>Tamu</th><th>Waktu</th><th>Ukuran</th></tr></thead>
                        <tbody>
                          {analytics.recentVideos.map(v => (
                            <tr key={v.id}>
                              <td style={{ fontWeight: 600 }}>{v.guestName || 'Tamu Anonim'}</td>
                              <td className="wv-muted">{v.timestamp}</td>
                              <td className="wv-num">{v.sizeMB} MB</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: DATA TAMU & REKAMAN (MASTER TABLE & BATCH EXPORT) */}
          {/* ================================================================= */}
          {activeTab === 'op-tab-gallery' && (
            <div className="tab-pane active fade-in">
              {/* FILTER & SEARCH CONTROL BAR */}
              <div className="gallery-control-toolbar">
                <div className="toolbar-search-box">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Cari nama tamu, tanggal, atau filename..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="btn-clear-search" onClick={() => setSearchQuery('')} aria-label="Hapus pencarian"><X size={14} /></button>
                  )}
                </div>

                <div className="toolbar-filter-group">
                  <div className="filter-item">
                    <Filter size={14} />
                    <select
                      className="form-input-sm"
                      value={selectedEventFilter}
                      onChange={(e) => setSelectedEventFilter(e.target.value)}
                      aria-label="Filter sesi acara"
                    >
                      <option value="active">Sesi Aktif ({activeEvent?.title})</option>
                      <option value="all">Semua Sesi Acara ({allVideos.length})</option>
                      {eventsList.map(e => (
                        <option key={e.id} value={e.id}>{e.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <select
                      className="form-input-sm"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Urutkan video"
                    >
                      <option value="newest">Terbaru Dahulu</option>
                      <option value="oldest">Terlama Dahulu</option>
                      <option value="name">Nama Tamu (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BATCH ACTIONS TOOLBAR */}
              <div className="batch-actions-banner">
                <div className="batch-selection-info">
                  <button className="btn-checkbox-toggle" onClick={toggleSelectAll}>
                    {isAllSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    <span>{isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
                  </button>
                  <span className="selected-count-badge">
                    {selectedVideoIds.size > 0
                      ? `${selectedVideoIds.size} Video Terpilih`
                      : `Total ${filteredVideos.length} Video`}
                  </span>
                </div>

                <div className="batch-buttons-group">
                  {(isSaveMenuOpen || isShareMenuOpen) && (
                    <button
                      aria-hidden="true"
                      tabIndex={-1}
                      className="dropdown-catcher"
                      onClick={closeMenus}
                    />
                  )}
                  {/* DROPDOWN SAVE AS */}
                  <div className="dropdown-container">
                    <button
                      className={`btn btn-primary btn-sm ${isSaveMenuOpen ? 'dropdown-trigger-open' : ''}`}
                      onClick={() => { setIsSaveMenuOpen(!isSaveMenuOpen); setIsShareMenuOpen(false); }}
                      aria-expanded={isSaveMenuOpen}
                      aria-haspopup="menu"
                    >
                      <Download size={16} />
                      <span>Save As...</span>
                      <ChevronDown size={14} />
                    </button>

                    {isSaveMenuOpen && (
                      <div className="dropdown-menu fade-in" role="menu">
                        <button className="dropdown-item" onClick={handleExportZip}>
                          <Download size={16} className="dropdown-icon-zip" />
                          <div>
                            <div className="item-title">Save as Package ZIP (.zip)</div>
                            <div className="item-desc">Rekomendasi! Berisi seluruh MP4 + Rekap CSV & TXT</div>
                          </div>
                        </button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item" onClick={handleExportCSVOnly}>
                          <FileSpreadsheet size={16} />
                          <div>
                            <div className="item-title">Save Guest List Recap (.csv)</div>
                            <div className="item-desc">Format Spreadsheet Excel / Google Sheets</div>
                          </div>
                        </button>
                        <button className="dropdown-item" onClick={handleExportTXTOnly}>
                          <FileText size={16} />
                          <div>
                            <div className="item-title">Save Guest List Recap (.txt)</div>
                            <div className="item-desc">Laporan Teks Ringkas</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* DROPDOWN SHARE */}
                  <div className="dropdown-container">
                    <button
                      className={`btn btn-secondary btn-sm ${isShareMenuOpen ? 'dropdown-trigger-open' : ''}`}
                      onClick={() => { setIsShareMenuOpen(!isShareMenuOpen); setIsSaveMenuOpen(false); }}
                      aria-expanded={isShareMenuOpen}
                      aria-haspopup="menu"
                    >
                      <Share2 size={16} />
                      <span>Share...</span>
                      <ChevronDown size={14} />
                    </button>

                    {isShareMenuOpen && (
                      <div className="dropdown-menu fade-in" role="menu">
                        <button className="dropdown-item" onClick={handleShareWebShare}>
                          <Share2 size={16} />
                          <div>
                            <div className="item-title">Simpan ke Galeri / iPad Photos</div>
                            <div className="item-desc">Gunakan Web Share / AirDrop di iOS/Android</div>
                          </div>
                        </button>
                        <button className="dropdown-item" onClick={handleShareSummaryText}>
                          <FileText size={16} />
                          <div>
                            <div className="item-title">Salin Teks Rekap ke Clipboard</div>
                            <div className="item-desc">Untuk kirim laporan via WA / Catatan</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* BATCH DELETE */}
                  {selectedVideoIds.size > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
                      <Trash2 size={16} />
                      <span>Hapus ({selectedVideoIds.size})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ZIP EXPORT PROGRESS BAR */}
              {isExportingZip && (
                <div className="download-progress-box fade-in" style={{ marginBottom: '1rem' }}>
                  <div className="download-progress-header">
                    <span className="download-progress-text">{exportProgressText}</span>
                    <span className="download-progress-pct">{exportProgressPct}%</span>
                  </div>
                  <div className="meter-bar" style={{ height: '10px' }}>
                    <div className="meter-fill" style={{ width: `${exportProgressPct}%` }} />
                  </div>
                </div>
              )}

              {/* MASTER TABLE DATA VIEW */}
              <div className="table-responsive-container">
                {filteredVideos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--c-ink-3)' }}>
                    <Film size={40} style={{ marginBottom: '0.8rem', opacity: 0.6 }} />
                    <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>Tidak ada rekaman video ditemukan.</p>
                    <p style={{ fontSize: '0.85rem' }}>Coba ubah kata kunci pencarian atau filter sesi acara.</p>
                  </div>
                ) : (
                  <table className="master-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <button className="btn-checkbox-header" onClick={toggleSelectAll}>
                            {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                        </th>
                        <th>Preview</th>
                        <th>Nama Tamu</th>
                        <th>Waktu Rekam</th>
                        <th>Ukuran</th>
                        <th>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVideos.map((v) => {
                        const videoUrl = URL.createObjectURL(v.blob);
                        const isSelected = selectedVideoIds.has(v.id);
                        return (
                          <tr key={v.id} className={isSelected ? 'row-selected' : ''}>
                            <td>
                              <button className="btn-checkbox-row" onClick={() => toggleSelectOne(v.id)}>
                                {isSelected ? <CheckSquare size={16} className="text-gold" /> : <Square size={16} />}
                              </button>
                            </td>
                            <td>
                              <div className="table-thumb" onClick={() => setPlayingVideoUrl(videoUrl)}>
                                <video src={videoUrl} preload="metadata" muted />
                                <div className="thumb-overlay"><Play size={12} /></div>
                              </div>
                            </td>
                            <td>
                              <div className="guest-name-cell">{v.guestName || 'Tamu Anonim'}</div>
                              <div className="filename-sub">{v.filename}</div>
                            </td>
                            <td>
                              <span className="timestamp-badge">{v.timestamp}</span>
                            </td>
                            <td>
                              <span className="size-badge">{v.sizeMB} MB</span>
                            </td>
                            <td>
                              <div className="table-actions-cell">
                                <button className="btn btn-secondary btn-xs" onClick={() => setPlayingVideoUrl(videoUrl)}>
                                  <Eye size={14} />
                                  <span>Putar</span>
                                </button>
                                <button className="btn btn-danger btn-xs" onClick={() => handleDeleteSingle(v)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: KELOLA SESI MULTI-EVENT */}
          {/* ================================================================= */}
          {activeTab === 'op-tab-events' && (
            <div className="tab-pane active fade-in">
              {/* Header: title left, create action right */}
              <div className="cx-events-head">
                <div>
                  <h2 className="wv-pane-title">Sesi Acara</h2>
                  <p className="wv-pane-sub">{eventsList.length} sesi • pisahkan tiap acara agar video tidak tercampur.</p>
                </div>
                <button
                  className={`btn ${isCreateOpen ? 'btn-secondary cx-btn-line' : 'btn-primary cx-btn-black'} btn-sm`}
                  style={{ borderRadius: 999 }}
                  onClick={() => setIsCreateOpen(v => !v)}
                  aria-expanded={isCreateOpen}
                >
                  <Plus size={15} />
                  <span>{isCreateOpen ? 'Tutup Form' : 'Buat Sesi Baru'}</span>
                </button>
              </div>

              {/* Create form: collapsible, only when needed */}
              {isCreateOpen && (
                <form onSubmit={handleCreateNewEventSubmit} className="cx-card cx-create-card fade-in">
                  <h3 className="wv-card-title">Sesi acara baru</h3>
                  <p className="wv-card-sub">Sesi baru langsung menjadi sesi aktif di kiosk.</p>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-groom">Mempelai Pria</label>
                      <input
                        id="new-groom"
                        type="text"
                        className="form-input"
                        value={newGroomName}
                        onChange={(e) => setNewGroomName(e.target.value)}
                        placeholder="misal: Doni"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-bride">Mempelai Wanita</label>
                      <input
                        id="new-bride"
                        type="text"
                        className="form-input"
                        value={newBrideName}
                        onChange={(e) => setNewBrideName(e.target.value)}
                        placeholder="misal: Siska"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-subtitle">Tanggal & Lokasi</label>
                      <input
                        id="new-subtitle"
                        type="text"
                        className="form-input"
                        value={newEventSubtitle}
                        onChange={(e) => setNewEventSubtitle(e.target.value)}
                        placeholder="misal: Resepsi Siang • Hotel Mulia"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="new-duration">Durasi Rekaman</label>
                      <select
                        id="new-duration"
                        className="form-input"
                        value={newEventDuration}
                        onChange={(e) => setNewEventDuration(e.target.value)}
                      >
                        <option value={30}>30 Detik</option>
                        <option value={60}>60 Detik</option>
                        <option value={90}>90 Detik</option>
                        <option value={120}>120 Detik</option>
                      </select>
                    </div>
                  </div>
                  <ThemeDots value={newEventTheme} onChange={setNewEventTheme} label="Tema Warna Acara" />
                  <button type="submit" className="btn btn-primary cx-btn-black" style={{ width: '100%' }}>
                    <Plus size={16} />
                    <span>Buat & Aktifkan Sesi Ini</span>
                  </button>
                </form>
              )}

              <div className="cx-events-grid">
                {/* Session list: primary column */}
                <div className="events-card-stack" role="list" aria-label="Daftar sesi acara">
                  {eventsList.map((evt) => {
                    const isActive = activeEvent?.id === evt.id;
                    const evtVideos = allVideos.filter(v => v.eventId === evt.id);
                    const evtMB = evtVideos.reduce((s, v) => s + (parseFloat(v.sizeMB) || 0), 0).toFixed(1);
                    return (
                      <article key={evt.id} role="listitem" className={`cx-card cx-event-card ${isActive ? 'active' : ''}`}>
                        <div className="cx-event-top">
                          <span className={`cx-pill ${isActive ? 'dark' : 'line'}`}>{isActive ? 'Sesi Aktif' : 'Tersimpan'}</span>
                          <span className="cx-event-count"><Video size={13} /> {evtVideos.length} video • {evtMB} MB</span>
                        </div>
                        <h4 className="cx-event-title">{evt.title}</h4>
                        <p className="cx-event-meta"><Calendar size={13} /> {evt.subtitle || 'Tanpa subtitle'} • Dibuat {evt.createdDate}</p>
                        <div className="cx-event-actions">
                          {!isActive && (
                            <button className="btn btn-primary cx-btn-black btn-sm" style={{ borderRadius: 999 }} onClick={() => handleSwitchEvent(evt.id)}>
                              <span>Aktifkan Sesi Ini</span>
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ borderRadius: 999 }}
                            onClick={() => {
                              setSelectedEventFilter(evt.id);
                              setActiveTab('op-tab-gallery');
                            }}
                          >
                            <Eye size={14} />
                            <span>Lihat Video</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Edit active: side column */}
                {activeEvent && (
                  <form onSubmit={handleUpdateActiveEventSubmit} className="cx-card cx-edit-card">
                    <div className="cx-event-top">
                      <h3 className="wv-card-title">Edit Sesi Aktif</h3>
                      <span className="cx-pill yellow">Live di kiosk</span>
                    </div>
                    <p className="wv-card-sub">Perubahan langsung tampil di layar tamu.</p>
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="edit-groom">Mempelai Pria</label>
                        <input
                          id="edit-groom"
                          type="text"
                          className="form-input"
                          value={editGroomName}
                          onChange={(e) => setEditGroomName(e.target.value)}
                          placeholder="Rian"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="edit-bride">Mempelai Wanita</label>
                        <input
                          id="edit-bride"
                          type="text"
                          className="form-input"
                          value={editBrideName}
                          onChange={(e) => setEditBrideName(e.target.value)}
                          placeholder="Maya"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-subtitle">Tanggal & Subtitle</label>
                      <input
                        id="edit-subtitle"
                        type="text"
                        className="form-input"
                        value={editSubtitle}
                        onChange={(e) => setEditSubtitle(e.target.value)}
                        placeholder="12 September 2026 • Ballroom Hotel Mulia"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="edit-duration">Durasi Maksimum Rekaman</label>
                      <select
                        id="edit-duration"
                        className="form-input"
                        value={editDuration}
                        onChange={(e) => setEditDuration(e.target.value)}
                      >
                        <option value={30}>30 Detik</option>
                        <option value={60}>60 Detik (Rekomendasi)</option>
                        <option value={90}>90 Detik</option>
                        <option value={120}>120 Detik</option>
                      </select>
                    </div>
                    <ThemeDots value={editTheme} onChange={handleSelectEditTheme} label="Tema Warna (Live Preview)" />
                    <button type="submit" className="btn btn-primary cx-btn-black" style={{ width: '100%' }}>
                      <CheckCircle size={16} />
                      <span>Simpan Perubahan</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: UJI PERANGKAT & KAMERA */}
          {/* ================================================================= */}
          {activeTab === 'op-tab-hardware' && (
            <div className="tab-pane active fade-in">
              <div className="pane-header">
                <h2 className="wv-pane-title">Uji Perangkat Kamera & Mic</h2>
                <p>Pastikan mikrofon dan kamera eksternal terdeteksi sebelum acara dimulai.</p>
              </div>

              <div className="glass-card" style={{ maxWidth: '600px' }}>
                <div className="form-group">
                  <label className="form-label">Pilih Kamera USB / Webcam</label>
                  <select
                    className="form-input"
                    value={activeCameraId || ''}
                    onChange={(e) => setActiveCameraId(e.target.value)}
                    disabled={cameras.length === 0}
                    aria-label="Pilih kamera"
                  >
                    {cameras.length === 0 && (
                      <option value="">Tidak ada kamera terdeteksi</option>
                    )}
                    {cameras.map(c => (
                      <option key={c.deviceId} value={c.deviceId}>
                        {c.label || `Kamera (${c.deviceId.slice(0, 8)}...)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pilih Mikrofon USB / External Mic</label>
                  <select
                    className="form-input"
                    value={activeMicId || ''}
                    onChange={(e) => setActiveMicId(e.target.value)}
                    disabled={mics.length === 0}
                    aria-label="Pilih mikrofon"
                  >
                    {mics.length === 0 && (
                      <option value="">Tidak ada mikrofon terdeteksi</option>
                    )}
                    {mics.map(m => (
                      <option key={m.deviceId} value={m.deviceId}>
                        {m.label || `Microphone (${m.deviceId.slice(0, 8)}...)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">Live Audio Level Meter</label>
                  <div className="meter-bar" style={{ height: '14px' }}>
                    <div
                      className="meter-fill"
                      style={{ width: `${micTestFillPct}%`, background: '#4EFE84' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* EMBEDDED VIDEO PLAYER OVERLAY */}
      {playingVideoUrl && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.88)', zIndex: 9998,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem'
          }}
          onClick={() => setPlayingVideoUrl(null)}
        >
          <video src={playingVideoUrl} controls autoPlay playsInline style={{ maxWidth: '90vw', maxHeight: '75vh', borderRadius: '12px' }} />
          <button className="btn btn-secondary" onClick={() => setPlayingVideoUrl(null)}>
            <X size={16} /><span>Tutup Preview</span>
          </button>
        </div>
      )}
    </div>
  );
}
