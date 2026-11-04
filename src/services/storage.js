/**
 * OpenWedding Kiosk - IndexedDB & LocalStorage Service
 * Version 2: Multi-Event Session Isolation & Storage Persistence
 */

const DB_NAME = 'OpenWeddingDB';
const DB_VERSION = 2;
const STORE_NAME = 'videos';
const EVENTS_STORE = 'events';
const CONFIG_KEY = 'openwedding_kiosk_config';
const ACTIVE_EVENT_KEY = 'openwedding_active_event_id';

// Request Storage Persistence to prevent browser eviction
if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persisted) => {
    console.log(`[StorageService] Storage persistence mode: ${persisted ? 'PERSISTED' : 'TEMPORARY'}`);
  }).catch((e) => console.warn('[StorageService] Persist request failed:', e));
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Videos store
      let videoStore;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        videoStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      } else {
        videoStore = e.target.transaction.objectStore(STORE_NAME);
      }
      if (!videoStore.indexNames.contains('eventId')) {
        videoStore.createIndex('eventId', 'eventId', { unique: false });
      }

      // Events store
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const storageService = {
  // Load saved configuration presets
  loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Error loading config presets:", e);
    }
    return {
      coupleNames: 'Rian & Maya',
      eventDateLine: '12 September 2026 • Ballroom Hotel Mulia',
      recordSeconds: 60,
      theme: 'gold',
      operatorPin: '1234'
    };
  },

  saveConfig(config) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (e) {
      console.error("Error saving config:", e);
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // Multi-Event Session Management
  // ---------------------------------------------------------------------------
  async getAllEvents() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(EVENTS_STORE, 'readonly');
        const store = tx.objectStore(EVENTS_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const events = req.result || [];
          resolve(events.sort((a, b) => b.createdAt - a.createdAt));
        };
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.error("Get all events error:", e);
      return [];
    }
  },

  async getActiveEventId() {
    try {
      return localStorage.getItem(ACTIVE_EVENT_KEY) || null;
    } catch (e) {
      return null;
    }
  },

  async setActiveEventId(eventId) {
    try {
      localStorage.setItem(ACTIVE_EVENT_KEY, eventId);
      return true;
    } catch (e) {
      return false;
    }
  },

  async createEvent(groomName = 'Rian', brideName = 'Maya', subtitle = '12 September 2026 • Ballroom Hotel Mulia', theme = 'gold', recordSeconds = 60) {
    const eventId = `evt_${Date.now()}`;
    const cleanGroom = (groomName || '').trim() || 'Mempelai Pria';
    const cleanBride = (brideName || '').trim() || 'Mempelai Wanita';
    const title = `${cleanGroom} & ${cleanBride}`;

    const eventRecord = {
      id: eventId,
      groomName: cleanGroom,
      brideName: cleanBride,
      title,
      subtitle: (subtitle || '').trim(),
      theme: theme || 'gold',
      recordSeconds: parseInt(recordSeconds, 10) || 60,
      createdAt: Date.now(),
      createdDate: new Date().toLocaleDateString('id-ID'),
      status: 'active'
    };

    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(EVENTS_STORE, 'readwrite');
        const store = tx.objectStore(EVENTS_STORE);
        const req = store.add(eventRecord);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e);
      });
      await this.setActiveEventId(eventId);

      // Sync active config to localStorage as well
      const currentConfig = this.loadConfig();
      this.saveConfig({
        ...currentConfig,
        coupleNames: title,
        eventDateLine: eventRecord.subtitle,
        theme: eventRecord.theme,
        recordSeconds: eventRecord.recordSeconds
      });

      return eventRecord;
    } catch (err) {
      console.error("Create event error:", err);
      return null;
    }
  },

  async updateEvent(eventId, fields = {}) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(EVENTS_STORE, 'readwrite');
        const store = tx.objectStore(EVENTS_STORE);
        const getReq = store.get(eventId);

        getReq.onsuccess = () => {
          const item = getReq.result;
          if (item) {
            const updatedGroom = fields.groomName !== undefined ? fields.groomName.trim() : item.groomName;
            const updatedBride = fields.brideName !== undefined ? fields.brideName.trim() : item.brideName;
            const updatedTitle = (updatedGroom && updatedBride) ? `${updatedGroom} & ${updatedBride}` : (fields.title || item.title);

            const updatedItem = {
              ...item,
              ...fields,
              groomName: updatedGroom,
              brideName: updatedBride,
              title: updatedTitle
            };

            store.put(updatedItem).onsuccess = () => {
              // If this is the active event, sync to localStorage config
              this.getActiveEventId().then(activeId => {
                if (activeId === eventId) {
                  const currentConfig = this.loadConfig();
                  this.saveConfig({
                    ...currentConfig,
                    coupleNames: updatedItem.title,
                    eventDateLine: updatedItem.subtitle,
                    theme: updatedItem.theme,
                    recordSeconds: updatedItem.recordSeconds
                  });
                }
              });
              resolve(updatedItem);
            };
          } else {
            resolve(null);
          }
        };

        getReq.onerror = () => resolve(null);
      });
    } catch (e) {
      console.error("Update event error:", e);
      return null;
    }
  },

  async ensureDefaultEvent(config) {
    const events = await this.getAllEvents();
    if (events.length === 0) {
      const parts = (config.coupleNames || 'Rian & Maya').split('&').map(s => s.trim());
      const groom = parts[0] || 'Rian';
      const bride = parts[1] || 'Maya';

      return await this.createEvent(
        groom,
        bride,
        config.eventDateLine || '12 September 2026 • Ballroom Hotel Mulia',
        config.theme || 'gold',
        config.recordSeconds || 60
      );
    }
    const activeId = await this.getActiveEventId();
    const currentActive = events.find(e => e.id === activeId) || events[0];
    if (currentActive && currentActive.id !== activeId) {
      await this.setActiveEventId(currentActive.id);
    }
    return currentActive;
  },

  async completeEvent(eventId) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(EVENTS_STORE, 'readwrite');
        const store = tx.objectStore(EVENTS_STORE);
        const getReq = store.get(eventId);
        getReq.onsuccess = () => {
          const item = getReq.result;
          if (item) {
            item.status = 'completed';
            item.completedAt = Date.now();
            store.put(item).onsuccess = () => resolve(true);
          } else {
            resolve(false);
          }
        };
        getReq.onerror = () => resolve(false);
      });
    } catch (e) {
      console.error("Complete event error:", e);
      return false;
    }
  },

  // ---------------------------------------------------------------------------
  // Video Recording Storage Methods
  // ---------------------------------------------------------------------------
  async saveVideoBlob(blob, guestName = 'Tamu Anonim', coupleNames = 'OpenWedding', eventId = null) {
    const activeEventId = eventId || await this.getActiveEventId() || 'evt_default';
    const timestampIso = new Date().toISOString().replace(/[:.]/g, '-');
    const cleanGuest = (guestName || 'Tamu_Anonim').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${coupleNames || 'OpenWedding'}_${cleanGuest}_${timestampIso}.mp4`;
    const mp4Blob = blob.type.includes('mp4') ? blob : new Blob([blob], { type: 'video/mp4' });

    const videoRecord = {
      id: `vid_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      eventId: activeEventId,
      filename,
      guestName: guestName || 'Tamu Anonim',
      eventTitle: coupleNames || 'OpenWedding',
      timestamp: new Date().toLocaleString('id-ID'),
      rawDate: Date.now(),
      blob: mp4Blob,
      sizeMB: (mp4Blob.size / (1024 * 1024)).toFixed(2)
    };

    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.add(videoRecord);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target ? e.target.error : e);
      });
      return true;
    } catch (err) {
      console.error("Save video failed:", err);
      return false;
    }
  },

  async getAllVideos() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.error("Get all videos error:", e);
      return [];
    }
  },

  async getVideosByEvent(eventId) {
    if (!eventId || eventId === 'all') {
      return this.getAllVideos();
    }
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('eventId');
        const req = index.getAll(eventId);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      console.error("Get videos by event error:", e);
      return [];
    }
  },

  async deleteVideo(id) {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => {
          console.error("Delete IDB error:", e);
          resolve(false);
        };
      });
    } catch (e) {
      console.error("Delete video error:", e);
      return false;
    }
  },

  async deleteMultipleVideos(ids = []) {
    if (!ids || ids.length === 0) return true;
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        store.delete(id);
      }
      return new Promise((resolve) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch (e) {
      console.error("Delete multiple videos error:", e);
      return false;
    }
  },

  async deleteVideosByEvent(eventId) {
    const videos = await this.getVideosByEvent(eventId);
    const ids = videos.map(v => v.id);
    return this.deleteMultipleVideos(ids);
  },

  async checkStorageQuota() {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        const availableMB = estimate.quota ? (estimate.quota - (estimate.usage || 0)) / (1024 * 1024) : 9999;
        const usedMB = estimate.usage ? estimate.usage / (1024 * 1024) : 0;
        const quotaMB = estimate.quota ? estimate.quota / (1024 * 1024) : 9999;
        const isPersisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
        return { usedMB, availableMB, quotaMB, isPersisted };
      } catch (e) {
        console.warn("Storage estimate failed:", e);
      }
    }
    return { usedMB: 0, availableMB: 9999, quotaMB: 9999, isPersisted: false };
  }
};

