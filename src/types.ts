export type TipoLevantamiento = 'Tanquilla' | 'Transformador';
export type OpcionSiNo = 'Si' | 'No';

export interface ConductorItem {
  id: string;
  categoria: 'PLT' | 'PP' | 'OTROS' | string;
  calibre: '1/0AWG' | '2/0AWG' | '3/0AWG' | '4/0AWG' | '250MCM' | '500MCM' | string;
  cantidad: number;
}

export interface CanalItem {
  id: string;
  refTanquilla: string;
  conductores: ConductorItem[];
}

export interface EmpalmeItem {
  id: string;
  tipo: 'PP-PLT' | 'PLT-PLT' | 'PP-PP' | string;
  cant1: number;
  dir1: string;
  cant2: number;
  dir2: string;
}

export interface ConductorMTItem {
  id: string;
  categoria: 'PLT' | 'PP' | 'OTROS' | string;
  calibre: '1/0AWG' | '2/0AWG' | '3/0AWG' | '4/0AWG' | '250MCM' | '500MCM' | string;
  cantidad: number;
}

export interface EvidenciaFoto {
  id: string;
  nombre: string;
  dataUrl?: string;
  size?: number;
  timestamp: number;
}

export interface LevantamientoRecord {
  id: string;
  tipo: TipoLevantamiento;
  fecha: string;
  timestamp: number;
  existeNombre: OpcionSiNo;
  idPlano?: string;
  idNuevo?: string;
  codigoIdentificador: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  precisionGPS?: number | null;
  tieneAcceso: OpcionSiNo;
  motivoSinAcceso?: string;
  canales: CanalItem[];
  empalmes: EmpalmeItem[];
  tieneProtecciones?: OpcionSiNo;
  obsProtecciones?: string;
  conductoresMT?: ConductorMTItem[];
  observaciones: string;
  evidencias: EvidenciaFoto[];
  sincronizadoGoogleSheets?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleSheetsConfig {
  webhookUrl: string;
  autoSync: boolean;
  lastSyncTimestamp?: number;
}
