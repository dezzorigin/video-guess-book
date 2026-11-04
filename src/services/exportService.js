/**
 * OpenWedding Kiosk - Export & ZIP Bundling Service
 */
import JSZip from 'jszip';

export const exportService = {
  /**
   * Generates a CSV string representation of guest list recordings
   */
  generateGuestListCSV(videos = [], eventName = 'OpenWedding Event') {
    const headers = ['No', 'Nama Tamu', 'Waktu Rekam', 'Ukuran (MB)', 'Nama File', 'ID Event'];
    const rows = videos.map((v, idx) => {
      const cleanName = `"${(v.guestName || 'Tamu Anonim').replace(/"/g, '""')}"`;
      const timeStr = `"${v.timestamp || ''}"`;
      const sizeStr = `${v.sizeMB || '0'}`;
      const filenameStr = `"${v.filename || ''}"`;
      const eventStr = `"${v.eventId || eventName}"`;
      return [idx + 1, cleanName, timeStr, sizeStr, filenameStr, eventStr].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },

  /**
   * Generates a human-readable text summary of the guest list
   */
  generateGuestListTXT(videos = [], eventName = 'OpenWedding Event', eventDate = '') {
    const totalMB = videos.reduce((acc, v) => acc + parseFloat(v.sizeMB || 0), 0);
    const dateStr = eventDate || new Date().toLocaleDateString('id-ID');

    let txt = `========================================================\n`;
    txt += `  REKAPITULASI GUESTBOOK VIDEO - OPENWEDDING KIOSK\n`;
    txt += `========================================================\n`;
    txt += `Acara       : ${eventName}\n`;
    txt += `Tanggal     : ${dateStr}\n`;
    txt += `Total Tamu  : ${videos.length} Rekaman Video\n`;
    txt += `Total Size  : ${totalMB.toFixed(2)} MB\n`;
    txt += `Diexport    : ${new Date().toLocaleString('id-ID')}\n`;
    txt += `--------------------------------------------------------\n\n`;
    txt += `DAFTAR TAMU REKAMAN:\n`;

    videos.forEach((v, idx) => {
      txt += `${idx + 1}. [${v.timestamp}] ${v.guestName || 'Tamu Anonim'} (${v.sizeMB} MB)\n`;
      txt += `   File: ${v.filename}\n`;
    });

    txt += `\n========================================================\n`;
    txt += `  Disimpan secara offline via OpenWedding Kiosk System\n`;
    txt += `========================================================\n`;

    return txt;
  },

  /**
   * Bundles all provided video blobs + CSV & TXT recaps into a single .zip file
   */
  async buildEventZip(videos = [], eventName = 'OpenWedding', eventDate = '', onProgress = null) {
    const zip = new JSZip();
    const cleanEventTitle = (eventName || 'OpenWedding').replace(/[^a-zA-Z0-9_-]/g, '_');
    const folderName = `${cleanEventTitle}_Videos`;
    const folder = zip.folder(folderName);

    // 1. Add Rekap CSV & TXT to root of ZIP
    const csvContent = this.generateGuestListCSV(videos, eventName);
    const txtContent = this.generateGuestListTXT(videos, eventName, eventDate);

    zip.file(`00_Daftar_Tamu_Rekap_${cleanEventTitle}.csv`, csvContent);
    zip.file(`00_Daftar_Tamu_Rekap_${cleanEventTitle}.txt`, txtContent);

    // 2. Add video blobs into folder
    const total = videos.length;
    for (let i = 0; i < total; i++) {
      const v = videos[i];
      const seq = String(i + 1).padStart(3, '0');
      const cleanGuest = (v.guestName || 'Tamu_Anonim').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${seq}_${cleanGuest}_${v.id || Date.now()}.mp4`;
      
      const mp4Blob = v.blob.type.includes('mp4') ? v.blob : new Blob([v.blob], { type: 'video/mp4' });
      folder.file(filename, mp4Blob);

      if (onProgress) {
        const pct = Math.round(((i + 1) / total) * 60);
        onProgress(pct, `Menyiapkan video ${i + 1} dari ${total}: ${v.guestName || 'Tamu'}...`);
      }
    }

    // 3. Generate ZIP blob with progress callback
    if (onProgress) {
      onProgress(65, 'Mengompresi file ke ZIP...');
    }

    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (metadata) => {
        if (onProgress) {
          const zipPct = 65 + Math.round((metadata.percent / 100) * 35);
          onProgress(zipPct, `Mengompresi ZIP: ${Math.round(metadata.percent)}%`);
        }
      }
    );

    return zipBlob;
  },

  /**
   * Helper to trigger browser download for a Blob
   */
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 6000);
  }
};
