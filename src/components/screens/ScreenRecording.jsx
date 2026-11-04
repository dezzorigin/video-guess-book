/**
 * OpenWedding Kiosk - Screen 3: Live Video Recording Screen
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useKiosk } from '../../context/KioskContext.jsx';
import { mediaService } from '../../services/media.js';
import { Square } from 'lucide-react';

export function ScreenRecording() {
  const {
    config, updateSession, setCurrentScreen, showToast,
    activeCameraId, activeMicId, mediaStream, setMediaStream
  } = useKiosk();

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const isStartedRef = useRef(false);

  const [secondsLeft, setSecondsLeft] = useState(config.recordSeconds || 60);
  const [canStop, setCanStop] = useState(false);
  const [micBars, setMicBars] = useState([5, 5, 5, 5, 5]);

  const stopRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn("Error stopping recorder:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isStartedRef.current) return;
    isStartedRef.current = true;

    let isMounted = true;

    async function initStreamAndRecording() {
      try {
        let stream = mediaStream;
        if (!stream || !stream.active || stream.getVideoTracks().length === 0 || stream.getVideoTracks()[0].readyState === 'ended') {
          stream = await mediaService.requestMediaStream(activeCameraId, activeMicId);
          if (isMounted) setMediaStream(stream);
        }

        if (videoRef.current && stream) {
          videoRef.current.muted = true;
          videoRef.current.defaultMuted = true;
          videoRef.current.playsInline = true;
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("webcam play warning:", playErr);
          }
        }

        // Start mic visualizer
        mediaService.startAudioVisualizer(stream, (pct, data) => {
          if (!isMounted) return;
          const bars = [];
          for (let i = 0; i < 5; i++) {
            const val = data ? (data[i * 2] || 0) : 0;
            const barH = Math.max(4, Math.min(22, Math.round((val / 255) * 22)));
            bars.push(barH);
          }
          setMicBars(bars);
        });

        // Initialize MediaRecorder
        const mimeType = mediaService.detectBestMimeType();
        recordedChunksRef.current = [];

        let recorder = null;
        try {
          recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        } catch (e) {
          console.warn("MimeType fallback triggered:", e);
          recorder = new MediaRecorder(stream);
        }

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          mediaService.stopAudioVisualizer();
          const usedMime = recorder.mimeType || mimeType || 'video/mp4';
          const finalBlob = new Blob(recordedChunksRef.current, { type: usedMime });
          const finalUrl = URL.createObjectURL(finalBlob);

          updateSession({
            recordedBlob: finalBlob,
            recordedUrl: finalUrl,
            mimeType: usedMime
          });
          setCurrentScreen('preview');
        };

        recorder.start(500);

        // Start Countdown Timer
        const totalSec = config.recordSeconds || 60;
        setSecondsLeft(totalSec);
        setCanStop(false);

        const startTime = Date.now();
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          const rem = Math.max(0, totalSec - elapsed);
          setSecondsLeft(rem);

          if (elapsed >= 2) {
            setCanStop(true);
          }

          if (rem <= 0) {
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              try {
                mediaRecorderRef.current.stop();
              } catch (e) {
                console.warn("Auto-stop recorder error:", e);
              }
            }
          }
        }, 500);

      } catch (err) {
        console.error("Recording initialization failed:", err);
        showToast("Gagal mengakses kamera/mikrofon. Izinkan akses media.", "error");
      }
    }

    initStreamAndRecording();

    return () => {
      isMounted = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      mediaService.stopAudioVisualizer();
    };
  }, []); // Run setup once when ScreenRecording mounts

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <section id="screen-recording" className="screen active" style={{ padding: 0 }}>
      <div className="recording-wrapper">
        <video ref={videoRef} id="webcam-preview" autoPlay playsInline muted />

        {/* Top HUD */}
        <div className="recording-hud-top">
          <div className="rec-badge">
            <div className="rec-dot" />
            REC
          </div>

          <div id="mic-visualizer" className="mic-visualizer-container">
            {micBars.map((h, idx) => (
              <div key={idx} className="mic-bar" style={{ height: `${h}px` }} />
            ))}
          </div>

          <div className={`timer-badge ${secondsLeft <= 10 ? 'warning' : ''}`}>
            {formatTime(secondsLeft)}
          </div>
        </div>

        {/* Bottom HUD Control */}
        <div className="recording-hud-bottom">
          <button
            id="stop-rec-btn"
            className={`btn btn-danger ${!canStop ? 'btn-disabled' : ''}`}
            onClick={stopRecording}
          >
            <Square size={18} fill="currentColor" />
            <span>Selesai & Simpan Video</span>
          </button>
        </div>
      </div>
    </section>
  );
}
