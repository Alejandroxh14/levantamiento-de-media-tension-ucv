import { LevantamientoRecord } from '../types';

const STORAGE_KEY = 'ucv_media_tension_records_v1';
const DRAFT_KEY = 'ucv_media_tension_current_draft_v1';
const IDB_NAME = 'ucv_media_tension_idb';
const IDB_VERSION = 1;
const IDB_STORE = 'records';

// IndexedDB Helper
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no soportado'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e: any) => {
      const dbInstance = e.target.result as IDBDatabase;
      if (!dbInstance.objectStoreNames.contains(IDB_STORE)) {
        dbInstance.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecordToIDB(record: LevantamientoRecord): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB save fallback:', err);
  }
}

export async function getAllRecordsFromIDB(): Promise<LevantamientoRecord[]> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    return [];
  }
}

export async function deleteRecordFromIDB(id: string): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    store.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IDB delete error:', err);
  }
}

export async function fetchServerRecords(): Promise<LevantamientoRecord[] | null> {
  try {
    const res = await fetch('/api/levantamientos');
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('Servidor offline o no alcanzable, usando almacenamiento local:', err);
  }
  return null;
}

export async function syncRecordToServer(record: LevantamientoRecord): Promise<boolean> {
  try {
    const res = await fetch('/api/levantamientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch (err) {
    console.warn('No se pudo sincronizar con el servidor en este momento:', err);
    return false;
  }
}

export async function deleteRecordFromServer(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/levantamientos/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Error eliminando del servidor:', err);
    return false;
  }
}

export function getLocalRecords(): LevantamientoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error leyendo registros locales:', e);
  }
  return [];
}

export function saveLocalRecords(records: LevantamientoRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Error guardando registros locales:', e);
  }
}

export async function getAllRecords(): Promise<LevantamientoRecord[]> {
  const local = getLocalRecords();
  const idbRecords = await getAllRecordsFromIDB();
  const server = await fetchServerRecords();

  const mergedMap = new Map<string, LevantamientoRecord>();
  
  // 1. Load local
  local.forEach((r) => mergedMap.set(r.id, r));

  // 2. Merge IDB (which holds full photos and evidence)
  idbRecords.forEach((r) => {
    const existing = mergedMap.get(r.id);
    if (!existing || new Date(r.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      mergedMap.set(r.id, r);
    }
  });

  // 3. Merge server
  if (server && Array.isArray(server)) {
    server.forEach((r) => {
      const existing = mergedMap.get(r.id);
      if (!existing || new Date(r.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        mergedMap.set(r.id, r);
      }
    });
  }

  const combined = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);

  // If completely empty, seed sample records
  if (combined.length === 0) {
    const defaultData = getInitialUcvSampleRecords();
    saveLocalRecords(defaultData);
    defaultData.forEach((item) => {
      saveRecordToIDB(item);
      syncRecordToServer(item);
    });
    return defaultData;
  }

  saveLocalRecords(combined);
  return combined;
}

export async function saveRecord(record: LevantamientoRecord): Promise<LevantamientoRecord[]> {
  const local = getLocalRecords();
  const existingIndex = local.findIndex((r) => r.id === record.id);

  let updatedList: LevantamientoRecord[];
  if (existingIndex >= 0) {
    updatedList = [...local];
    updatedList[existingIndex] = record;
  } else {
    updatedList = [record, ...local];
  }

  saveLocalRecords(updatedList);
  // Persist to IDB (unlimited storage for photos)
  await saveRecordToIDB(record);
  // Persist to backend server
  await syncRecordToServer(record);
  clearDraft();
  return updatedList;
}

export async function deleteRecord(id: string): Promise<LevantamientoRecord[]> {
  const local = getLocalRecords();
  const filtered = local.filter((r) => r.id !== id);
  saveLocalRecords(filtered);
  await deleteRecordFromIDB(id);
  await deleteRecordFromServer(id);
  return filtered;
}

// Draft Management for Field Reliability
export function saveDraft(formData: Partial<LevantamientoRecord>): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  } catch (e) {
    console.error('Error guardando borrador:', e);
  }
}

export function getDraft(): Partial<LevantamientoRecord> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error leyendo borrador:', e);
  }
  return null;
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

// Sample records from UCV Ciudad Universitaria for immediate testing and verification
export function getInitialUcvSampleRecords(): LevantamientoRecord[] {
  return [
    // {
    //   id: 'ucv-rec-001',
    //   tipo: 'Tanquilla',
    //   fecha: '2026-08-31 09:30:00',
    //   timestamp: Date.now() - 7200000,
    //   existeNombre: 'Si',
    //   idPlano: 'TQ-ING-04',
    //   idNuevo: '',
    //   codigoIdentificador: 'TQ-ING-04',
    //   direccion: 'Frente al Edificio de Escuela de Ingeniería Eléctrica UCV, pasillo central',
    //   latitud: 10.48835,
    //   longitud: -66.89042,
    //   precisionGPS: 3.2,
    //   tieneAcceso: 'Si',
    //   canales: [
    //     {
    //       id: 'c1',
    //       refTanquilla: 'TQ-ING-05',
    //       conductores: [
    //         { id: 'cd1', categoria: 'PLT', calibre: '4/0AWG', cantidad: 3 },
    //         { id: 'cd2', categoria: 'PP', calibre: '2/0AWG', cantidad: 1 },
    //       ],
    //     },
    //     {
    //       id: 'c2',
    //       refTanquilla: 'TQ-TRANSF-SUB02',
    //       conductores: [{ id: 'cd3', categoria: 'PP', calibre: '500MCM', cantidad: 3 }],
    //     },
    //   ],
    //   empalmes: [
    //     {
    //       id: 'emp1',
    //       tipo: 'PP-PLT',
    //       cant1: 3,
    //       dir1: 'Hacia TQ-ING-05',
    //       cant2: 3,
    //       dir2: 'Hacia Subestación 02',
    //     },
    //   ],
    //   observaciones: 'Tapa de concreto en buen estado. Presencia de poco sedimento en fondo, sin nivel freático.',
    //   evidencias: [],
    //   sincronizadoGoogleSheets: false,
    //   createdAt: new Date(Date.now() - 7200000).toISOString(),
    //   updatedAt: new Date(Date.now() - 7200000).toISOString(),
    // },
    // {
    //   id: 'ucv-rec-002',
    //   tipo: 'Transformador',
    //   fecha: '2026-08-31 10:45:00',
    //   timestamp: Date.now() - 3600000,
    //   existeNombre: 'Si',
    //   idPlano: 'TR-BAS-01',
    //   idNuevo: '',
    //   codigoIdentificador: 'TR-BAS-01',
    //   direccion: 'Subestación Caseta Básica, adyacente a Facultad de Ciencias UCV',
    //   latitud: 10.49012,
    //   longitud: -66.88764,
    //   precisionGPS: 2.8,
    //   tieneAcceso: 'Si',
    //   canales: [
    //     {
    //       id: 'c1',
    //       refTanquilla: 'TQ-BAS-08',
    //       conductores: [{ id: 'cd1', categoria: 'PP', calibre: '500MCM', cantidad: 3 }],
    //     },
    //   ],
    //   empalmes: [],
    //   tieneProtecciones: 'Si',
    //   obsProtecciones: 'Fusibles seccionadores cortacorriente de 15kV / 100A operativos. Conexión de puesta a tierra intacta.',
    //   conductoresMT: [
    //     { id: 'cmt1', categoria: 'PP', calibre: '4/0AWG', cantidad: 3 },
    //   ],
    //   observaciones: 'Transformador trifásico 300 kVA, 13.8 kV a 208/120V. Sin fugas de aceite dieléctrico visibles.',
    //   evidencias: [],
    //   sincronizadoGoogleSheets: false,
    //   createdAt: new Date(Date.now() - 3600000).toISOString(),
    //   updatedAt: new Date(Date.now() - 3600000).toISOString(),
    // },
  ];
}
