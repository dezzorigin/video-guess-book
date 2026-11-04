/**
 * OpenWedding Kiosk - Custom Export & Download Modal Component
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { storageService } from '../../services/storage.js';
import { Download, Share2, Play, Trash2, X, Film } from 'lucide-react';

export function ExportModal() {
  const { isExportModalOpen, setIsExportModalOpen, showToast, showConfirm } = useKiosk();
  const [videos, setVideos] = useState([]);
  const [totalMB, setTotalMB] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [playingVideoUrl, setPlayingVideoUrl] = useState(null);

  const refreshVideos = useCallback(async () => {
    const list = await storageService.getAllVideos();
    setVideos(list);
    let sum = 0;
    list.forEach(v => { sum += parseFloat(v.sizeMB || 0); });
    setTotalMB(sum);
  }, []);

  useEffect(() => {
    if (isExportModalOpen) {
      refreshVideos();
    }
  }, [isExportModalOpen, refreshVideos]);

  if (!isExportModalOpen) return null;

  const downloadSingle = (v) => {
    const rawName = (v.filename || `OpenWedding_${v.guestName || 'Tamu'}_${Date.now()}`).replace(/\.[^/.]+$/, '');
    const cleanFilename = `${rawName}.mp4`;
    const mp4Blob = v.blob.type.includes('mp4') ? v.blob : new Blob([v.blob], { type: 'video/mp4' });
    const url = URL.createObjectURL(mp4Blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = cleanFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    showToast(`Video "${v.guestName || 'Tamu'}" diunduh (MP4)!`, "success");
  };

  const shareSingle = async (v) => {
    const rawName = (v.filename || `OpenWedding_${v.guestName || 'Tamu'}`).replace(/\.[^/.]+$/, '');
    const filename = `${rawName}.mp4`;
    const mp4Blob = v.blob.type.includes('mp4') ? v.blob : new Blob([v.blob], { type: 'video/mp4' });
    const mp4File = new File([mp4Blob], filename, { type: 'video/mp4' });

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (navigator.canShare) {
      try {
        if (navigator.canShare({ files: [mp4File] })) {
          await navigator.share({
            files: [mp4File],
            title: filename,
            text: `Video Guestbook OpenWedding - ${v.guestName}`
          });
          showToast("Video tersimpan ke Galeri!", "success");
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn("Web Share warning:", err);
      }
    }

    if (isIOS) {
      const url = URL.createObjectURL(mp4Blob);
      window.open(url, '_blank');
      return;
    }

    downloadSingle(v);
  };

  const handleBatchDownload = async () => {
    if (videos.length === 0) {
      showToast("Belum ada video untuk di-export.", "warning");
      return;
    }

    setIsExporting(true);
    const total = videos.length;

    for (let i = 0; i < total; i++) {
      const v = videos[i];
      const pct = Math.round(((i + 1) / total) * 100);
      setProgressText(`Mengunduh ${i + 1} / ${total}: ${v.guestName || 'Tamu'}...`);
      setProgressPct(pct);

      downloadSingle(v);
      await new Promise(r => setTimeout(r, 600));
    }

    setProgressText(`Semua ${total} video selesai didownload!`);
    showToast(`Semua ${total} video selesai didownload!`, "success");

    setTimeout(() => {
      setIsExporting(false);
      setProgressPct(0);
    }, 3000);
  };

  const handleBatchShare = async () => {
    if (videos.length === 0) {
      showToast("Belum ada video untuk dibagikan.", "warning");
      return;
    }

    if (navigator.canShare) {
      try {
        const files = videos.map((v, idx) => {
          const rawName = (v.filename || `OpenWedding_${v.guestName}_${idx + 1}`).replace(/\.[^/.]+$/, '');
          const filename = `${rawName}.mp4`;
          const mp4Blob = v.blob.type.includes('mp4') ? v.blob : new Blob([v.blob], { type: 'video/mp4' });
          return new File([mp4Blob], filename, { type: 'video/mp4' });
        });

        if (navigator.canShare({ files })) {
          await navigator.share({
            files,
            title: `OpenWedding - ${videos.length} Video Guestbook`,
            text: `Kumpulan ${videos.length} video rekaman tamu acara.`
          });
          showToast(`${videos.length} video berhasil dibagikan ke Galeri!`, "success");
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.warn("Batch Share error:", err);
      }
    }

    handleBatchDownload();
  };

  const handleDelete = async (v) => {
    const ok = await showConfirm(
      'Hapus Video?',
      `Hapus rekaman dari "${v.guestName || 'Tamu Anonim'}"?`,
      'Ya, Hapus',
      'Batal'
    );
    if (ok) {
      const success = await storageService.deleteVideo(v.id);
      if (success) {
        showToast(`Video "${v.guestName}" dihapus.`, 'warning');
        refreshVideos();
      } else {
        showToast('Gagal menghapus video.', 'error');
      }
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 3000 }}>
      <div className="glass-card download-modal-card">
        {/* Modal Header */}
        <div className="download-modal-header">
          <div>
            <h2 className="modal-title" style={{ margin: 0 }}>Pusat Export & Simpan Video</h2>
            <p className="download-modal-subtitle">
              {videos.length} Video Tersimpan • Total {totalMB.toFixed(1)} MB
            </p>
          </div>
          <button className="btn-close-dashboard" onClick={() => setIsExportModalOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Banner */}
        <div className="download-actions-banner">
          <div className="download-banner-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
              <span className="badge-mp4">Format: MP4</span>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--c-olive)' }}>Offline Ready</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--c-ink-2)', margin: 0 }}>
              Di iPad / iPhone, gunakan <b>"Simpan ke Galeri"</b> untuk menyimpan video langsung ke Photos App.
            </p>
          </div>
          <div className="download-banner-buttons">
            <button className="btn btn-primary btn-sm" onClick={handleBatchDownload}>
              <Download size={16} />
              <span>Download Semua</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleBatchShare}>
              <Share2 size={16} />
              <span>Simpan ke Galeri</span>
            </button>
          </div>
        </div>

        {/* Batch Progress Bar */}
        {isExporting && (
          <div className="download-progress-box">
            <div className="download-progress-header">
              <span className="download-progress-text">{progressText}</span>
              <span className="download-progress-pct">{progressPct}%</span>
            </div>
            <div className="meter-bar" style={{ height: '8px' }}>
              <div className="meter-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Video Items List */}
        <div className="download-video-list">
          {videos.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--c-ink-3)', padding: '3rem 1rem' }}>
              <Film size={36} style={{ marginBottom: '0.5rem' }} />
              <p>Belum ada rekaman video tersimpan hari ini.</p>
            </div>
          ) : (
            videos.map((v) => {
              const videoUrl = URL.createObjectURL(v.blob);
              return (
                <div key={v.id} className="download-video-item">
                  <div className="download-item-left">
                    <div className="download-item-thumb">
                      <video src={videoUrl} preload="metadata" muted />
                    </div>
                    <div className="download-item-details">
                      <div className="download-item-name">{v.guestName || 'Tamu Anonim'}</div>
                      <div className="download-item-meta">
                        <span>{v.timestamp}</span>
                        <span>{v.sizeMB} MB</span>
                        <span className="badge-mp4" style={{ fontSize: '0.68rem' }}>MP4</span>
                      </div>
                    </div>
                  </div>
                  <div className="download-item-actions">
                    <button className="btn btn-secondary btn-xs" onClick={() => setPlayingVideoUrl(videoUrl)}>
                      <Play size={14} />
                      <span>Putar</span>
                    </button>
                    <button className="btn btn-primary btn-xs" onClick={() => shareSingle(v)}>
                      <Download size={14} />
                      <span>Simpan</span>
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(v)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Embedded Video Player Overlay */}
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
          <button className="btn btn-secondary cx-btn-line" onClick={() => setPlayingVideoUrl(null)}>
            Tutup
          </button>
        </div>
      )}
    </div>
  );
}
