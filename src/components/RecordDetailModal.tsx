import React, { useState } from 'react';
import { 
  LevantamientoRecord, 
  EvidenciaFoto, 
  formatTipoDisplayName,
  EstadoLevantamiento,
  ESTADOS_LEVANTAMIENTO,
  getRecordStatus
} from '../types';
import { 
  X, 
  MapPin, 
  Layers, 
  Zap, 
  Calendar, 
  ShieldAlert, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  AlertTriangle, 
  ExternalLink,
  Image as ImageIcon,
  Share2,
  Eye,
  Download,
  Pencil,
  Clock,
  Shield,
  Radio,
  Activity,
  GitBranch,
  Building2
} from 'lucide-react';
import { formatCanalesText, formatEmpalmesText, formatConductoresMTText } from '../services/excelService';
import { UCVLogo } from './UCVLogo';

interface RecordDetailModalProps {
  record: LevantamientoRecord | null;
  onClose: () => void;
  onEditRecord?: (record: LevantamientoRecord) => void;
  onSyncGoogleSheets?: (record: LevantamientoRecord) => void;
  onUpdateStatus?: (recordId: string, newStatus: EstadoLevantamiento) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onEditRecord,
  onSyncGoogleSheets,
  onUpdateStatus,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<EvidenciaFoto | null>(null);

  if (!record) return null;

  const status = getRecordStatus(record);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white flex items-center justify-center p-0.5 border-2 border-amber-400/80 text-white flex-shrink-0 overflow-hidden shadow-md">
              <UCVLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-lg">{record.codigoIdentificador}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  {formatTipoDisplayName(record.tipo)}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border inline-flex items-center gap-1 ${
                  status === 'Inspeccionada'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : status === 'Por inspeccionar'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-rose-950 text-rose-300 border-rose-700'
                }`}>
                  {status === 'Inspeccionada' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {status === 'Por inspeccionar' && <Clock className="w-3 h-3 text-amber-400" />}
                  {status === 'Sin acceso' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                  {status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> {record.fecha} • UCV Media Tensión
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          
          {/* Panel de Gestión de Estado */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Estado del Levantamiento (Status)
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  {status === 'Inspeccionada' && 'El levantamiento ha sido ejecutado y validado en campo.'}
                  {status === 'Por inspeccionar' && 'El punto o tramo está registrado o asignado, pero aún no se ha realizado la inspección.'}
                  {status === 'Sin acceso' && 'Sin acceso al punto o infraestructura (condición especial en campo).'}
                </p>
              </div>

              {onUpdateStatus && (
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {(['Inspeccionada', 'Por inspeccionar', 'Sin acceso'] as EstadoLevantamiento[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(record.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                        status === st
                          ? st === 'Inspeccionada'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : st === 'Por inspeccionar'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {status === 'Sin acceso' && record.motivoSinAcceso && (
              <div className="text-xs bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-200">
                <strong>Motivo registrado:</strong> {record.motivoSinAcceso}
              </div>
            )}
          </div>
          
          {/* Ubicación & Coordenadas */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-start gap-2 text-slate-800 font-semibold">
              <MapPin className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <span>{record.direccion}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-200">
              <div>
                <span className="text-slate-400 font-mono">Latitud:</span>{' '}
                <span className="font-mono font-medium text-slate-800">
                  {record.latitud !== null ? record.latitud : 'No registrada'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-mono">Longitud:</span>{' '}
                <span className="font-mono font-medium text-slate-800">
                  {record.longitud !== null ? record.longitud : 'No registrada'}
                </span>
              </div>
              {record.precisionGPS && (
                <div className="text-emerald-700">
                  Precisión: ±{record.precisionGPS.toFixed(1)}m
                </div>
              )}
            </div>

            {record.latitud !== null && record.longitud !== null && (
              <a
                href={`https://www.google.com/maps?q=${record.latitud},${record.longitud}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline pt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ver ubicación en Google Maps
              </a>
            )}
          </div>

          {/* Estado de Acceso */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Acceso al interior:</span>
            {record.tieneAcceso === 'Si' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Sí tiene acceso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                <XCircle className="w-3.5 h-3.5" /> Sin acceso directo
              </span>
            )}
          </div>

          {/* Canales y Conductores */}
          {record.tieneAcceso === 'Si' && record.canales && record.canales.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Canales y Conductores ({record.canales.length})
              </h4>
              <div className="space-y-2">
                {record.canales.map((c, i) => (
                  <div key={c.id || i} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 mb-1.5">
                      <span>Canal #{i + 1}</span>
                      <span className="text-slate-600 font-normal">
                        Ref: {c.refTanquilla || 'Sin referencia'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {c.conductores.map((cd, cIdx) => (
                        <div
                          key={cd.id || cIdx}
                          className="flex items-center justify-between text-xs bg-white px-2.5 py-1 rounded border border-blue-100"
                        >
                          <span className="font-semibold text-slate-700">
                            {cd.categoria} ({cd.calibre})
                          </span>
                          <span className="text-blue-700 font-bold">{cd.cantidad} unidad(es)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empalmes */}
          {record.tieneAcceso === 'Si' && record.empalmes && record.empalmes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Empalmes ({record.empalmes.length})
              </h4>
              <div className="space-y-2">
                {record.empalmes.map((emp, i) => (
                  <div key={emp.id || i} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                    <div className="text-xs font-bold text-indigo-900 mb-1">
                      Empalme #{i + 1} — Tipo: <span className="font-mono">{emp.tipo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block">Lado 1</span>
                        <span className="font-semibold">{emp.cant1} ud(s)</span>
                        <p className="text-slate-500 text-[11px] truncate">Dir: {emp.dir1 || 'N/A'}</p>
                      </div>
                      <div className="p-2 bg-white rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block">Lado 2</span>
                        <span className="font-semibold">{emp.cant2} ud(s)</span>
                        <p className="text-slate-500 text-[11px] truncate">Dir: {emp.dir2 || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datos Sótano de Transformación */}
          {(record.tipo === 'Transformador' || record.tipo === 'SÓTANO DE TRANSFORMACIÓN') && (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  Especificaciones de Sótano de Transformación
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                  Sótano
                </span>
              </div>

              {/* 5. Transformador */}
              {record.sotanoData && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <span>5.</span> Transformador
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-amber-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Placa Característica:</span>
                      <span className="font-semibold text-slate-800">
                        {record.sotanoData.estadoPlaca || 'No indicado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Potencia Nominal:</span>
                      <span className="font-semibold text-slate-800">
                        {record.sotanoData.potenciaNominalKva ? `${record.sotanoData.potenciaNominalKva} KVA` : 'No indicada'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tensión de Operación:</span>
                      <span className="font-semibold text-slate-800">
                        {record.sotanoData.tensionPrimariaKv || '-'} kV / {record.sotanoData.tensionSecundariaKv || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. Protecciones y 9. Conductores MT */}
              <div className="text-xs space-y-1.5">
                <p>
                  <span className="font-semibold text-slate-700">8. Protecciones:</span>{' '}
                  {record.tieneProtecciones || 'No registrado'}
                </p>
                {record.obsProtecciones && (
                  <p className="text-slate-600 bg-white p-2 rounded border border-amber-100">
                    {record.obsProtecciones}
                  </p>
                )}
                {record.conductoresMT && record.conductoresMT.length > 0 && (
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">
                      9. Conductores MT al transformador:
                    </span>
                    <div className="space-y-1">
                      {record.conductoresMT.map((c, i) => (
                        <div key={i} className="bg-white p-1.5 rounded border border-amber-100">
                          {c.categoria} ({c.calibre}) - {c.cantidad} unidad(es)
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ficha Técnica de Casilla de Transformación ("Caseta De Tx") */}
          {record.tipo === 'CASILLA DE TRANSFORMACIÓN' && (
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Ficha Técnica: Casilla de Transformación (Caseta De Tx)
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
                  Caseta
                </span>
              </div>

              {/* 5. Transformador */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <span>5.</span> Transformador
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-lg border border-blue-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Placa Característica:</span>
                    <span className="font-semibold text-slate-800">
                      {record.casillaData?.estadoPlaca || 'No indicado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Potencia Nominal:</span>
                    <span className="font-semibold text-slate-800">
                      {record.casillaData?.potenciaNominalKva ? `${record.casillaData.potenciaNominalKva} KVA` : 'No indicada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tensión de Operación:</span>
                    <span className="font-semibold text-slate-800">
                      {record.casillaData?.tensionPrimariaKv || '-'} kV / {record.casillaData?.tensionSecundariaKv || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Protecciones */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <span>6.</span> Protecciones
                </span>
                <div className="bg-white p-2.5 rounded-lg border border-blue-100 text-[11px] space-y-1">
                  <p>
                    <span className="text-slate-400">¿Protecciones visibles/operativas?: </span>
                    <span className="font-semibold text-slate-800">
                      {record.casillaData?.tieneProtecciones || record.tieneProtecciones || 'No registrado'}
                    </span>
                  </p>
                  {(record.casillaData?.obsProtecciones || record.obsProtecciones) && (
                    <p className="text-slate-700 bg-slate-50 p-1.5 rounded text-[11px]">
                      {record.casillaData?.obsProtecciones || record.obsProtecciones}
                    </p>
                  )}
                </div>
              </div>

              {/* 8. Tablero de BT y Control de Alumbrado */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <span>8.</span> Tablero de BT y Control de Alumbrado
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-blue-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">• Breaker / Interruptor Principal:</span>
                    <span className="font-semibold text-slate-800">
                      Capacidad: {record.casillaData?.breakerCapacidadA ? `${record.casillaData.breakerCapacidadA} A` : 'No indicada'}
                    </span>
                    <span className="text-slate-500 block text-[10px]">
                      Estado: {record.casillaData?.breakerEstado || 'No indicado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">• Control de Alumbrado:</span>
                    <span className="font-semibold text-slate-800">
                      Tipo: {record.casillaData?.tipoControlAlumbrado || 'No indicado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 9. Conductores de MT */}
              {record.conductoresMT && record.conductoresMT.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <span>9.</span> Conductores de MT
                  </span>
                  <div className="space-y-1 bg-white p-2.5 rounded-lg border border-blue-100 text-[11px]">
                    {record.conductoresMT.map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-b-0">
                        <span className="font-medium text-slate-700">
                          Categoría {c.categoria} - Calibre {c.calibre}
                        </span>
                        <span className="font-bold text-blue-800">
                          {c.cantidad} unidad(es)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Datos Detallados de POSTE DE TRANSFORMACIÓN */}
          {record.tipo === 'POSTE DE TRANSFORMACIÓN' && record.posteData && (
            <div className="p-4 bg-sky-50/70 rounded-xl border border-sky-200 space-y-3.5">
              <div className="flex items-center justify-between border-b border-sky-200/60 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-sky-600" />
                  Ficha Técnica de Poste de Transformación
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-600 text-white">
                  Aéreo
                </span>
              </div>

              {/* 5. Transformador Aéreo */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-sky-900 flex items-center gap-1">
                  <span>5.</span> Transformador Aéreo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-sky-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Configuración:</span>
                    <span className="font-semibold text-slate-800">
                      {record.posteData.configuracionBanco === 'Otro'
                        ? `Otro: ${record.posteData.configuracionBancoOtro || ''}`
                        : record.posteData.configuracionBanco || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Potencia Nominal:</span>
                    <span className="font-semibold text-slate-800">
                      {record.posteData.potenciaNominalKva ? `${record.posteData.potenciaNominalKva} kVA` : 'N/A'}
                      {record.posteData.potenciaBanco3xKva ? ` (Total Banco: ${record.posteData.potenciaBanco3xKva})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tensiones Operativas:</span>
                    <span className="font-semibold text-slate-800">
                      AT: {record.posteData.tensionPrimarioKv || 'N/A'} kV | BT: {record.posteData.tensionSecundarioKv || 'N/A'} V
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tipo de Conexión:</span>
                    <span className="font-semibold text-slate-800">
                      {(record.posteData.conexion === 'Otro' || record.posteData.conexion === 'OTROS') && record.posteData.conexionOtro
                        ? `OTROS (${record.posteData.conexionOtro})`
                        : record.posteData.conexion || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 6. Descargadores de Sobretensiones y Protecciones */}
              <div className="space-y-1.5 text-xs pt-1">
                <span className="font-bold text-sky-900 flex items-center gap-1">
                  <span>6.</span> Descargadores de Sobretensiones y Protecciones
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-sky-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">¿Posee Pararrayos?:</span>
                    <span className="font-semibold text-slate-800">{record.posteData.pararrayosPresente || 'Si'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Cantidad Pararrayos:</span>
                    <span className="font-semibold text-slate-800">
                      {record.posteData.pararrayosPresente === 'No' ? 'N/A (No posee)' : (record.posteData.pararrayosCantidad || '3')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">¿Hay Portafusibles?:</span>
                    <span className="font-semibold text-slate-800">{record.posteData.portafusiblesPresente || 'Si'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Corriente del Fusible:</span>
                    <span className="font-semibold text-slate-800">
                      {record.posteData.portafusiblesPresente === 'No' ? 'N/A (Sin fusible)' : (record.posteData.corrienteFusibleAmp || record.posteData.capacidadFusibleAmp || '15A')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 8. Sistema de Puesta a Tierra */}
              <div className="space-y-1.5 text-xs pt-1">
                <span className="font-bold text-sky-900 flex items-center gap-1">
                  <span>8.</span> Sistema de Puesta a Tierra
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-white p-2.5 rounded-lg border border-sky-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Cable Visible y Continuo:</span>
                    <span className="font-semibold text-slate-800">{record.posteData.bajanteCableVisibleContinuo || 'Si'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estado Cable / Protección:</span>
                    <span className="font-semibold text-slate-800">{record.posteData.bajanteEstadoCableProteccion || 'Adecuado / Protegido con tubo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Evidencia Jabalina / Registro:</span>
                    <span className="font-semibold text-slate-800">{record.posteData.jabalinaORegistroBase || 'SI'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estado de Conexión:</span>
                    <span className="font-semibold text-slate-800">{record.posteData.estadoConexionTierra || 'Firme y en buen estado'}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Observaciones */}
          {record.observaciones && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Observaciones Generales
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                {record.observaciones}
              </div>
            </div>
          )}

          {/* Evidencias / Fotos */}
          {record.evidencias && record.evidencias.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Evidencias Fotográficas ({record.evidencias.length})
                </h4>
                <span className="text-[11px] text-slate-500">Toca una foto para ampliar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {record.evidencias.map((foto) => (
                  <div
                    key={foto.id}
                    onClick={() => setSelectedPhoto(foto)}
                    className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video relative group cursor-pointer hover:ring-2 hover:ring-blue-500 transition shadow-2xs"
                  >
                    {foto.dataUrl ? (
                      <img
                        src={foto.dataUrl}
                        alt={foto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 m-auto" />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="p-1 bg-white/90 rounded-full text-slate-800 shadow">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate text-center font-mono">
                      {foto.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-end gap-2">
          {onEditRecord && (
            <button
              onClick={() => {
                onClose();
                onEditRecord(record);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs mr-auto"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar Levantamiento Completo
            </button>
          )}

          {onSyncGoogleSheets && (
            <button
              onClick={() => onSyncGoogleSheets(record)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Sincronizar a Google Sheets
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>

      </div>

      {/* Lightbox / High Res Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-semibold truncate max-w-[240px] sm:max-w-md">
                {selectedPhoto.nombre}
              </span>
              <div className="flex items-center gap-2">
                {selectedPhoto.dataUrl && (
                  <a
                    href={selectedPhoto.dataUrl}
                    download={selectedPhoto.nombre}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </a>
                )}
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-2 flex items-center justify-center bg-black/40 overflow-auto max-h-[75vh]">
              <img
                src={selectedPhoto.dataUrl}
                alt={selectedPhoto.nombre}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
