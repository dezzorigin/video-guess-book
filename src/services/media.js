/**
 * OpenWedding Kiosk - Media Stream & Audio Visualizer Service
 */

let audioCtx = null;
let analyser = null;
let animFrameId = null;

export const mediaService = {
  detectBestMimeType() {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return '';
    }
    const types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
    ];
    for (const t of types) {
      try {
        if (MediaRecorder.isTypeSupported(t)) {
          return t;
        }
      } catch (e) {}
    }
    return '';
  },

  async getDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      const mics = devices.filter(d => d.kind === 'audioinput');
      return { cameras, mics };
    } catch (err) {
      console.error("Error enumerating devices:", err);
      return { cameras: [], mics: [] };
    }
  },

  async requestMediaStream(cameraId = null, micId = null) {
    const videoConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    };
    if (cameraId) {
      videoConstraints.deviceId = { exact: cameraId };
    }

    const audioConstraints = micId
      ? { deviceId: { exact: micId } }
      : true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints
      });
      return stream;
    } catch (err) {
      console.error("Camera/Mic stream request error:", err);
      // Fallback if specific constraint/deviceId failed (common on iPad/iOS/iframe)
      if (cameraId || micId) {
        console.warn("Retrying getUserMedia with default constraints...");
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true
          });
        } catch (fallbackErr) {
          console.error("Fallback getUserMedia also failed:", fallbackErr);
          throw fallbackErr;
        }
      }
      throw err;
    }
  },

  startAudioVisualizer(stream, onLevelUpdate) {
    this.stopAudioVisualizer();
    if (!stream) return;

    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const update = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const levelPct = Math.min(100, Math.round((avg / 128) * 100));

        if (onLevelUpdate) {
          onLevelUpdate(levelPct, dataArray);
        }

        animFrameId = requestAnimationFrame(update);
      };
      update();
    } catch (e) {
      console.warn("Audio visualizer initialization error:", e);
    }
  },

  stopAudioVisualizer() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
      analyser = null;
    }
  }
};
