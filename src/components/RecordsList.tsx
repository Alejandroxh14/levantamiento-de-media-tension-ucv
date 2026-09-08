import React, { useState } from 'react';
import { LevantamientoRecord } from '../types';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Pencil,
  FileSpreadsheet, 
  Layers, 
  Zap, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Share2,
  ExternalLink
} from 'lucide-react';
import { exportarExcelCompleto, exportarExcelEspecifico } from '../services/excelService';
import { UCVLogo } from './UCVLogo';

interface RecordsListProps {
  records: LevantamientoRecord[];
  onDeleteRecord: (id: string) => void;
  onInspectRecord: (record: LevantamientoRecord) => void;
  onEditRecord: (record: LevantamientoRecord) => void;
  onSyncGoogleSheets: (record: LevantamientoRecord) => void;
  onGoToForm: () => void;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  records,
  onDeleteRecord,
  onInspectRecord,
  onEditRecord,
  onSyncGoogleSheets,
  onGoToForm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Tanquilla' | 'Transformador'>('Todos');
  const [filterAcceso, setFilterAcceso] = useState<'Todos' | 'Si' | 'No'>('Todos');

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.codigoIdentificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo = filterTipo === 'Todos' || r.tipo === filterTipo;
    const matchesAcceso = filterAcceso === 'Todos' || r.tieneAcceso === filterAcceso;

    return matchesSearch && matchesTipo && matchesAcceso;
  });

  const tanquillas = records.filter((r) => r.tipo === 'Tanquilla');
  const transformadores = records.filter((r) => r.tipo === 'Transformador');
  const sinAcceso = records.filter((r) => r.tieneAcceso === 'No');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Top Banner with UCV Seal */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center p-1 shadow-md border-2 border-slate-200 flex-shrink-0 overflow-hidden">
            <UCVLogo className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Base de Datos de Levantamientos MT
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Universidad Central de Venezuela • Registro histórico de tanquillas, transformadores y canalizaciones
            </p>
          </div>
        </div>

        <button
          onClick={onGoToForm}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          + Nuevo Levantamiento
        </button>
      </div>

      {/* Metrics Header Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Levantamientos</span>
          <span className="text-2xl font-extrabold text-slate-900">{records.length}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Tanquillas</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-extrabold text-blue-900">{tanquillas.length}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Transformadores</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-amber-900">{transformadores.length}</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600">Sin Acceso</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-extrabold text-rose-900">
            {sinAcceso.length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID (TQ-01, TR-02), ubicación o referencia..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportarExcelCompleto(records)}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Todo a Excel</span>
            </button>
            <button
              onClick={() => exportarExcelEspecifico('Tanquilla', records)}
              disabled={tanquillas.length === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 disabled:opacity-50 text-xs font-semibold transition"
            >
              <span>Excel Tanquillas ({tanquillas.length})</span>
            </button>
            <button
              onClick={() => exportarExcelEspecifico('Transformador', records)}
              disabled={transformadores.length === 0}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 text-xs font-semibold transition"
            >
              <span>Excel Transf. ({transformadores.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar tipo:
          </span>
          {(['Todos', 'Tanquilla', 'Transformador'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterTipo === t
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}

          <span className="font-semibold text-slate-500 ml-2">Condición:</span>
          {(['Todos', 'No', 'Si'] as const).map((a) => (
            <button
              key={a}
              onClick={() => setFilterAcceso(a)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterAcceso === a
                  ? 'bg-slate-800 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {a === 'Todos' ? 'Todos' : a === 'No' ? '⚠️ Sin Acceso' : 'Con Acceso'}
            </button>
          ))}
        </div>
      </div>

      {/* Records Listing */}
      {filteredRecords.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <Layers className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No se encontraron levantamientos</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {records.length === 0
              ? 'Aún no has registrado ningún levantamiento. Completa el formulario de campo para empezar.'
              : 'Ningún levantamiento coincide con los filtros aplicados.'}
          </p>
          {records.length === 0 && (
            <button
              onClick={onGoToForm}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
            >
              Comenzar primer levantamiento
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Column: Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      item.tipo === 'Transformador'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-blue-50 text-blue-800 border-blue-300'
                    }`}
                  >
                    {item.tipo}
                  </span>

                  <span className="font-mono font-bold text-slate-900 text-base">
                    {item.codigoIdentificador}
                  </span>

                  <span className="text-xs text-slate-400">
                    ({item.existeNombre === 'Si' ? 'En plano' : 'Nuevo ID'})
                  </span>

                  {item.tieneAcceso === 'No' && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Sin Acceso
                    </span>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-start gap-1.5 text-xs text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{item.direccion}</span>
                </div>

                {/* Summary badges */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.fecha}
                  </span>

                  {item.tieneAcceso === 'Si' ? (
                    <>
                      <span>•</span>
                      <span>Canales: <strong>{item.canales?.length || 0}</strong></span>
                      <span>•</span>
                      <span>Empalmes: <strong>{item.empalmes?.length || 0}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>•</span>
                      <span className="text-rose-600 font-medium">Inspección externa (Sin acceso interior)</span>
                    </>
                  )}

                  {item.evidencias && item.evidencias.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 font-medium">
                        📷 {item.evidencias.length} foto(s)
                      </span>
                    </>
                  )}

                  {item.latitud !== null && item.longitud !== null && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-600">
                        {item.latitud.toFixed(4)}, {item.longitud.toFixed(4)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => onInspectRecord(item)}
                  title="Ver detalle completo"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Detalle</span>
                </button>

                <button
                  onClick={() => onEditRecord(item)}
                  title="Editar levantamiento"
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onSyncGoogleSheets(item)}
                  title="Sincronizar a Google Sheets"
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar el levantamiento de ${item.tipo} [${item.codigoIdentificador}]?`)) {
                      onDeleteRecord(item.id);
                    }
                  }}
                  title="Eliminar registro"
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
