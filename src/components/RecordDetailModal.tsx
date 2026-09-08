import React, { useState } from 'react';
import { LevantamientoRecord, EvidenciaFoto } from '../types';
import { 
  X, 
  MapPin, 
  Layers, 
  Zap, 
  Calendar, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Image as ImageIcon,
  Share2,
  Eye,
  Download
} from 'lucide-react';
import { formatCanalesText, formatEmpalmesText, formatConductoresMTText } from '../services/excelService';
import { UCVLogo } from './UCVLogo';

interface RecordDetailModalProps {
  record: LevantamientoRecord | null;
  onClose: () => void;
  onSyncGoogleSheets?: (record: LevantamientoRecord) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  onClose,
  onSyncGoogleSheets,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<EvidenciaFoto | null>(null);

  if (!record) return null;

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
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{record.codigoIdentificador}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  {record.tipo}
                </span>
                {record.tieneAcceso === 'No' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                    Sin Acceso
                  </span>
                )}
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

          {/* Datos Transformador */}
          {record.tipo === 'Transformador' && (
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Especificaciones de Transformador
              </h4>
              <div className="text-xs space-y-1.5">
                <p>
                  <span className="font-semibold text-slate-700">Protecciones:</span>{' '}
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
                      Conductores MT al transformador:
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
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2">
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
