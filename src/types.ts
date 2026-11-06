export type TipoLevantamiento = 
  | 'Tanquilla' 
  | 'SÓTANO DE TRANSFORMACIÓN' 
  | 'CASILLA DE TRANSFORMACIÓN' 
  | 'POSTE DE TRANSFORMACIÓN' 
  | 'Transformador';

export type EstadoLevantamiento = 
  | 'Inspeccionada' 
  | 'Por inspeccionar' 
  | 'Sin acceso';

export interface EstadoConfig {
  label: EstadoLevantamiento;
  descripcion: string;
  badgeClass: string;
  bgLight: string;
  textClass: string;
  borderClass: string;
}

export const ESTADOS_LEVANTAMIENTO: Record<EstadoLevantamiento, EstadoConfig> = {
  'Inspeccionada': {
    label: 'Inspeccionada',
    descripcion: 'El levantamiento ha sido ejecutado y validado en campo.',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    bgLight: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-500',
  },
  'Por inspeccionar': {
    label: 'Por inspeccionar',
    descripcion: 'El punto o tramo está registrado o asignado, pero aún no se ha realizado la inspección.',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    bgLight: 'bg-amber-500',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-500',
  },
  'Sin acceso': {
    label: 'Sin acceso',
    descripcion: 'Sin acceso al punto o infraestructura (condición especial en campo).',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
    bgLight: 'bg-rose-500',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-500',
  },
};

export function getRecordStatus(record: Partial<LevantamientoRecord>): EstadoLevantamiento {
  if (record.status === 'Inspeccionada' || record.status === 'Por inspeccionar' || record.status === 'Sin acceso') {
    return record.status;
  }
  if (record.tieneAcceso === 'No') {
    return 'Sin acceso';
  }
  return 'Inspeccionada';
}

export function isTransformacionTipo(tipo?: TipoLevantamiento | string | null): boolean {
  if (!tipo) return false;
  const upper = tipo.toUpperCase();
  return (
    upper.includes('TRANSFORMA') || 
    upper.includes('SÓTANO') || 
    upper.includes('SOTANO') || 
    upper.includes('CASILLA') || 
    upper.includes('POSTE')
  );
}

export function formatTipoDisplayName(tipo?: TipoLevantamiento | string | null): string {
  if (!tipo) return 'Tanquilla';
  if (tipo === 'Transformador') return 'SÓTANO DE TRANSFORMACIÓN';
  return tipo;
}
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

export type ConfiguracionBancoPoste = 
  | 'Monofásico (1 unidad)'
  | 'Banco Monofásico (2 unidades)'
  | 'Banco Monofásico (3 unidades)'
  | 'Trifásico (1 unidad)'
  | 'Otro'
  | string;

export type TipoConexionPoste = 
  | 'Y-Y'
  | 'Δ-Δ'
  | 'Δ-Y'
  | 'OTROS'
  | string;

export type FugasAceitePoste = 'No' | 'Sí' | 'Evidencia de mancha previa' | string;
export type CorrosionTanquePoste = 'Ninguna' | 'Leve' | 'Moderada' | 'Severa' | string;
export type BushingPrimarioPoste = 'Bueno' | 'Fisurado' | 'Roto' | 'Con arqueo' | string;
export type BushingSecundarioPoste = 'Bueno' | 'Fisurado' | 'Roto' | 'Calentamiento / sulfatado' | string;
export type NivelAceitePoste = 'Normal' | 'Bajo' | 'No visible' | string;
export type TierraTanquePoste = 'Conectada y firme' | 'Desconectada' | 'Sulfatada' | 'Inexistente' | string;

export type PararrayosEstadoFisico = 'Bueno' | 'Dañado / Explotado / Disparado' | 'Desconectado / Aislador roto' | string;
export type PararrayosTierra = 'Firme' | 'Suelta' | 'Cortada' | 'Inexistente' | string;

export type ProteccionPrimariaTipo = 'Cortacorriente fusible Drop-Out' | 'Seccionador bajo carga' | 'Conexión directa' | 'Otro' | string;
export type PortafusibleEstado = 'Cerrado / Operativo' | 'Abierto (caído)' | 'Faltante' | 'Puenteado con alambre' | string;
export type AisladorSoporteEstado = 'Bueno' | 'Fisurado' | 'Manchado por arco' | string;

export type ConductorSalidaBT = 'Conductor desnudo' | 'Cable concéntrico / trenzado' | 'Cable TTU / THW encamisado' | 'Otro' | string;
export type ProteccionBT = 'Interruptor termomagnético (Breaker en base)' | 'Fusibles aéreos BT' | 'Sin protección BT (directo)' | 'Otro' | string;
export type EstadoConexionesBT = 'Buen estado / Apretados' | 'Sulfatados / Recalentamiento' | 'Falsos contactos / Aislamiento quemado' | string;

export type EstadoCableProteccionPoste = 'Adecuado / Protegido con tubo' | 'Sulfatado / Suelto' | 'Cortado' | string;
export type EvidenciaJabalinaPoste = 'Si' | 'No' | 'No visible / enterrada' | string;
export type BajanteEstadoCablePoste = EstadoCableProteccionPoste;
export type TuboProteccionBajante = 'Sí' | 'No' | 'Dañado' | string;
export type JabalinaBasePoste = EvidenciaJabalinaPoste;
export type EstadoConexionTierraPoste = 'Firme y en buen estado' | 'Oxidada / Floja' | 'Ausente' | string;

export type MaterialPoste = 'Concreto armado' | 'Tubo de acero' | 'Madera' | 'Celosía metálica' | 'Otro' | string;
export type EstadoPoste = 'Bueno' | 'Grietas / fisuras' | 'Armadura expuesta' | 'Inclinado' | 'Base socavada' | string;
export type CrucetasHerrajes = 'Perfil de acero' | 'Madera' | 'Fibra de vidrio' | 'Buen estado' | 'Corroídas / deformadas' | string;
export type AlturaPosteAprox = '8m' | '10m' | '12m' | '14m' | 'Otro' | string;

export interface PosteTransformacionData {
  // 5. Transformador aéreo
  configuracionBanco?: ConfiguracionBancoPoste;
  configuracionBancoOtro?: string;
  potenciaNominalKva?: string;
  potenciaBanco3xKva?: string;
  tensionPrimarioKv?: string;
  tensionSecundarioKv?: string;
  conexion?: TipoConexionPoste;
  conexionOtro?: string;
  fugasAceite?: FugasAceitePoste;
  corrosionTanque?: CorrosionTanquePoste;
  bushingPrimario?: BushingPrimarioPoste;
  bushingSecundario?: BushingSecundarioPoste;
  nivelAceite?: NivelAceitePoste;
  tierraTanque?: TierraTanquePoste;

  // 6. Descargadores de Sobretensiones y Protecciones
  pararrayosPresente?: OpcionSiNo;
  pararrayosCantidad?: string;
  portafusiblesPresente?: OpcionSiNo;
  corrienteFusibleAmp?: string;
  pararrayosTensionKv?: string;
  pararrayosEstadoFisico?: PararrayosEstadoFisico;
  pararrayosTierra?: PararrayosTierra;

  // 7. Sistema de Puesta a Tierra del Poste
  bajanteCableVisibleContinuo?: OpcionSiNo;
  bajanteEstadoCableProteccion?: EstadoCableProteccionPoste | string;
  bajanteTuboProteccion?: TuboProteccionBajante;
  jabalinaORegistroBase?: EvidenciaJabalinaPoste | string;
  estadoConexionTierra?: EstadoConexionTierraPoste | string;

  // Campos previos para retrocompatibilidad
  proteccionPrimariaTipo?: ProteccionPrimariaTipo;
  proteccionPrimariaTipoOtro?: string;
  proteccionPrimariaCantidad?: string;
  portafusibleEstado?: PortafusibleEstado;
  aisladorSoporteEstado?: AisladorSoporteEstado;
  capacidadFusibleAmp?: string;
  conductorSalidaBT?: ConductorSalidaBT;
  calibreSalidaBT?: string;
  proteccionBT?: ProteccionBT;
  estadoConexionesBT?: EstadoConexionesBT;
  materialPoste?: MaterialPoste;
  materialPosteOtro?: string;
  estadoPoste?: EstadoPoste;
  crucetasHerrajes?: CrucetasHerrajes;
  alturaPosteAprox?: AlturaPosteAprox;
}

export type EstadoPlacaCasilla = 'Legible' | 'Ilegible' | 'Sin placa' | string;
export type EstadoBreakerPrincipal = 'Operativo' | 'Directo / Sin breaker' | 'Dañado / Fuera de servicio' | 'Otro' | string;
export type TipoControlAlumbrado = 'Fotocelda' | 'Reloj temporizador' | 'Contactor manual' | 'Directo' | 'No aplica / Sin alumbrado' | 'Otro' | string;
export type TipoRefrigeracionCasilla = 'Sumergido en aceite' | 'Tipo seco' | 'Pedestal' | 'Otro' | string;

export interface SotanoTransformacionData {
  // 5. Transformador
  estadoPlaca?: EstadoPlacaCasilla;
  potenciaNominalKva?: string;
  tensionPrimariaKv?: string;
  tensionSecundariaKv?: string;
}

export interface CasillaTransformacionData {
  // 5. Transformador
  estadoPlaca?: EstadoPlacaCasilla;
  potenciaNominalKva?: string;
  tensionPrimariaKv?: string;
  tensionSecundariaKv?: string;
  tipoRefrigeracion?: TipoRefrigeracionCasilla;

  // 6. Protecciones MT
  tieneProtecciones?: OpcionSiNo;
  obsProtecciones?: string;

  // 7. Tablero de BT y Control de Alumbrado
  breakerCapacidadA?: string;
  breakerEstado?: EstadoBreakerPrincipal;
  tipoControlAlumbrado?: TipoControlAlumbrado;
  obsTableroBT?: string;
}

export interface LevantamientoRecord {
  id: string;
  tipo: TipoLevantamiento;
  status: EstadoLevantamiento;
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
  posteData?: PosteTransformacionData;
  casillaData?: CasillaTransformacionData;
  sotanoData?: SotanoTransformacionData;
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
