import React, { useState } from 'react';
import { 
  LevantamientoRecord, 
  isTransformacionTipo, 
  formatTipoDisplayName,
  EstadoLevantamiento,
  ESTADOS_LEVANTAMIENTO,
  getRecordStatus 
} from '../types';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  Layers, 
  Zap, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  AlertTriangle, 
  Share2, 
  ExternalLink, 
  Pencil,
  Database,
  Building2,
  Clock
} from 'lucide-react';
import { exportarExcelCompleto, exportarExcelEspecifico } from '../services/excelService';
import { UCVLogo } from './UCVLogo';

interface RecordsListProps {
  records: LevantamientoRecord[];
  onDeleteRecord: (id: string) => void;
  onInspectRecord: (record: LevantamientoRecord) => void;
  onEditRecord: (record: LevantamientoRecord) => void;
  onSyncGoogleSheets: (record: LevantamientoRecord) => void;
  onUpdateStatus?: (recordId: string, newStatus: EstadoLevantamiento) => void;
  onGoToForm: () => void;
}

export const RecordsList: React.FC<RecordsListProps> = ({
  records,
  onDeleteRecord,
  onInspectRecord,
  onEditRecord,
  onSyncGoogleSheets,
  onUpdateStatus,
  onGoToForm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<
    'Todos' | 'Tanquilla' | 'SÓTANO DE TRANSFORMACIÓN' | 'CASILLA DE TRANSFORMACIÓN' | 'POSTE DE TRANSFORMACIÓN'
  >('Todos');
  const [filterStatus, setFilterStatus] = useState<'Todos' | EstadoLevantamiento>('Todos');
  const [filterAcceso, setFilterAcceso] = useState<'Todos' | 'Si' | 'No'>('Todos');

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const itemStatus = getRecordStatus(r);
    const matchesSearch =
      r.codigoIdentificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.observaciones?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTipo =
      filterTipo === 'Todos' ||
      r.tipo === filterTipo ||
      (filterTipo === 'SÓTANO DE TRANSFORMACIÓN' && r.tipo === 'Transformador');
    
    const matchesStatus = filterStatus === 'Todos' || itemStatus === filterStatus;
    const matchesAcceso = filterAcceso === 'Todos' || r.tieneAcceso === filterAcceso;

    return matchesSearch && matchesTipo && matchesStatus && matchesAcceso;
  });

  const tanquillas = records.filter((r) => r.tipo === 'Tanquilla');
  const sotanos = records.filter((r) => r.tipo === 'SÓTANO DE TRANSFORMACIÓN' || r.tipo === 'Transformador');
  const casillas = records.filter((r) => r.tipo === 'CASILLA DE TRANSFORMACIÓN');
  const postes = records.filter((r) => r.tipo === 'POSTE DE TRANSFORMACIÓN');
  const transformaciones = records.filter((r) => isTransformacionTipo(r.tipo));

  const inspeccionadas = records.filter((r) => getRecordStatus(r) === 'Inspeccionada');
  const porInspeccionar = records.filter((r) => getRecordStatus(r) === 'Por inspeccionar');
  const sinAcceso = records.filter((r) => getRecordStatus(r) === 'Sin acceso' || r.tieneAcceso === 'No');

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
              Universidad Central de Venezuela • Registro histórico 
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Levantamientos */}
        <div 
          onClick={() => {
            setFilterTipo('Todos');
            setFilterAcceso('Todos');
          }}
          className={`p-3.5 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all hover:shadow-md hover:border-slate-300 ${
            filterTipo === 'Todos' && filterAcceso === 'Todos' ? 'ring-2 ring-slate-800 border-slate-300 bg-slate-50/50' : 'border-slate-200'
          }`}
          title="Ver todos los levantamientos"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              TOTAL DE LEVANTAMIENTOS
            </span>
            <Database className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{records.length}</span>
          <span className="text-[10px] text-slate-400 font-medium">Registrados</span>
        </div>

        {/* Tanquillas */}
        <div 
          onClick={() => setFilterTipo(filterTipo === 'Tanquilla' ? 'Todos' : 'Tanquilla')}
          className={`p-3.5 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${
            filterTipo === 'Tanquilla' ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50/50' : 'border-blue-100'
          }`}
          title="Filtrar por Tanquillas"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wider">
              TANQUILLAS
            </span>
            <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
          </div>
          <span className="text-2xl font-extrabold text-blue-900 mt-1 block">{tanquillas.length}</span>
          <span className="text-[10px] text-blue-500 font-medium">Registradas</span>
        </div>

        {/* Sótanos de Transformación */}
        <div 
          onClick={() => setFilterTipo(filterTipo === 'SÓTANO DE TRANSFORMACIÓN' ? 'Todos' : 'SÓTANO DE TRANSFORMACIÓN')}
          className={`p-3.5 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all hover:shadow-md hover:border-amber-300 ${
            filterTipo === 'SÓTANO DE TRANSFORMACIÓN' ? 'ring-2 ring-amber-500 border-amber-300 bg-amber-50/50' : 'border-amber-100'
          }`}
          title="Filtrar por Sótanos de Transformación"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-amber-700 uppercase tracking-wider leading-tight mr-1" title="SÓTANOS DE TRANSFORMACIÓN">
              SÓTANOS DE TRANSFORMACIÓN
            </span>
            <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
          </div>
          <span className="text-2xl font-extrabold text-amber-900 mt-1 block">{sotanos.length}</span>
          <span className="text-[10px] text-amber-600 font-medium truncate block">Registrados</span>
        </div>

        {/* Casillas de Transformación */}
        <div 
          onClick={() => setFilterTipo(filterTipo === 'CASILLA DE TRANSFORMACIÓN' ? 'Todos' : 'CASILLA DE TRANSFORMACIÓN')}
          className={`p-3.5 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all hover:shadow-md hover:border-purple-300 ${
            filterTipo === 'CASILLA DE TRANSFORMACIÓN' ? 'ring-2 ring-purple-500 border-purple-300 bg-purple-50/50' : 'border-purple-100'
          }`}
          title="Filtrar por Casillas de Transformación"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-purple-700 uppercase tracking-wider leading-tight mr-1" title="CASILLAS DE TRANSFORMACIÓN">
              CASILLAS DE TRANSFORMACIÓN
            </span>
            <Building2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
          </div>
          <span className="text-2xl font-extrabold text-purple-900 mt-1 block">{casillas.length}</span>
          <span className="text-[10px] text-purple-600 font-medium truncate block">Registradas</span>
        </div>

        {/* Postes de Transformación */}
        <div 
          onClick={() => setFilterTipo(filterTipo === 'POSTE DE TRANSFORMACIÓN' ? 'Todos' : 'POSTE DE TRANSFORMACIÓN')}
          className={`p-3.5 bg-white rounded-2xl border shadow-xs cursor-pointer transition-all hover:shadow-md hover:border-sky-300 ${
            filterTipo === 'POSTE DE TRANSFORMACIÓN' ? 'ring-2 ring-sky-500 border-sky-300 bg-sky-50/50' : 'border-sky-100'
          }`}
          title="Filtrar por Postes de Transformación"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold text-sky-700 uppercase tracking-wider leading-tight mr-1" title="POSTES DE TRANSFORMACIÓN">
              POSTES DE TRANSFORMACIÓN
            </span>
            <svg className="w-4 h-4 text-sky-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M5 7h14M7 12h10M9 7l3 5 3-5" />
            </svg>
          </div>
          <span className="text-2xl font-extrabold text-sky-900 mt-1 block">{postes.length}</span>
          <span className="text-[10px] text-sky-600 font-medium truncate block">Registrados</span>
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
              placeholder="Buscar por ID (TQ-01, ST-02, CT-01), ubicación o referencia..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => exportarExcelCompleto(records)}
              disabled={records.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-xs"
              title="Descargar libro Excel completo con todas las pestañas"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Todo</span>
            </button>
            <button
              onClick={() => exportarExcelEspecifico('Tanquilla', records)}
              disabled={tanquillas.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 disabled:opacity-50 text-xs font-semibold transition"
            >
              <span>Excel Tanquillas ({tanquillas.length})</span>
            </button>
            <button
              onClick={() => exportarExcelEspecifico('SÓTANO DE TRANSFORMACIÓN', records)}
              disabled={sotanos.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 disabled:opacity-50 text-xs font-semibold transition"
            >
              <span>Excel Sótanos ({sotanos.length})</span>
            </button>
            <button
              onClick={() => exportarExcelEspecifico('CASILLA DE TRANSFORMACIÓN', records)}
              disabled={casillas.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 disabled:opacity-50 text-xs font-semibold transition"
            >
              <span>Excel Casillas ({casillas.length})</span>
            </button>
            <button
              onClick={() => exportarExcelEspecifico('POSTE DE TRANSFORMACIÓN', records)}
              disabled={postes.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 disabled:opacity-50 text-xs font-semibold transition"
            >
              <span>Excel Postes ({postes.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Pills - Estados (Nuevo) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Estado:
          </span>
          <button
            onClick={() => setFilterStatus('Todos')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterStatus === 'Todos'
                ? 'bg-slate-900 text-white font-bold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({records.length})
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'Inspeccionada' ? 'Todos' : 'Inspeccionada')}
            className={`px-3 py-1 rounded-lg font-medium transition inline-flex items-center gap-1.5 ${
              filterStatus === 'Inspeccionada'
                ? 'bg-emerald-700 text-white font-bold shadow-xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
            title="El levantamiento ha sido ejecutado y validado en campo."
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Inspeccionada ({inspeccionadas.length})</span>
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'Por inspeccionar' ? 'Todos' : 'Por inspeccionar')}
            className={`px-3 py-1 rounded-lg font-medium transition inline-flex items-center gap-1.5 ${
              filterStatus === 'Por inspeccionar'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
            title="El punto o tramo está registrado o asignado, pero aún no se ha realizado la inspección."
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Por inspeccionar ({porInspeccionar.length})</span>
          </button>
          <button
            onClick={() => setFilterStatus(filterStatus === 'Sin acceso' ? 'Todos' : 'Sin acceso')}
            className={`px-3 py-1 rounded-lg font-medium transition inline-flex items-center gap-1.5 ${
              filterStatus === 'Sin acceso'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
            title="Sin acceso al punto o infraestructura."
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Sin acceso ({sinAcceso.length})</span>
          </button>
        </div>

        {/* Filter Pills - Tipo de Levantamiento */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filtrar tipo:
          </span>
          {(
            [
              'Todos',
              'Tanquilla',
              'SÓTANO DE TRANSFORMACIÓN',
              'CASILLA DE TRANSFORMACIÓN',
              'POSTE DE TRANSFORMACIÓN',
            ] as const
          ).map((t) => (
            <button
              key={t}
              onClick={() => setFilterTipo(t)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterTipo === t
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'SÓTANO DE TRANSFORMACIÓN'
                ? 'Sótano Transf.'
                : t === 'CASILLA DE TRANSFORMACIÓN'
                ? 'Casilla Transf.'
                : t === 'POSTE DE TRANSFORMACIÓN'
                ? 'Poste Transf.'
                : t}
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
          {filteredRecords.map((item) => {
            const itemStatus = getRecordStatus(item);
            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Left Column: Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        item.tipo === 'SÓTANO DE TRANSFORMACIÓN' || item.tipo === 'Transformador'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : item.tipo === 'CASILLA DE TRANSFORMACIÓN'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                          : item.tipo === 'POSTE DE TRANSFORMACIÓN'
                          ? 'bg-teal-50 text-teal-800 border-teal-300'
                          : 'bg-blue-50 text-blue-800 border-blue-300'
                      }`}
                    >
                      {formatTipoDisplayName(item.tipo)}
                    </span>

                    <span className="font-mono font-bold text-slate-900 text-base">
                      {item.codigoIdentificador}
                    </span>

                    <span className="text-xs text-slate-400">
                      ({item.existeNombre === 'Si' ? 'En plano' : 'Nuevo ID'})
                    </span>

                    {/* Status Badge with Admin quick-toggle selector */}
                    <div className="relative inline-flex items-center">
                      {onUpdateStatus ? (
                        <select
                          value={itemStatus}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as EstadoLevantamiento)}
                          title="Cambiar estado del levantamiento (Inspeccionada, Por inspeccionar, Sin acceso)"
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border cursor-pointer appearance-none pr-5 transition shadow-2xs ${ESTADOS_LEVANTAMIENTO[itemStatus]?.badgeClass || 'bg-slate-100'}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.35rem center',
                            backgroundSize: '0.75em 0.75em',
                            backgroundRepeat: 'no-repeat',
                          }}
                        >
                          <option value="Inspeccionada">✓ Inspeccionada</option>
                          <option value="Por inspeccionar">⏱ Por inspeccionar</option>
                          <option value="Sin acceso">⚠️ Sin acceso</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${ESTADOS_LEVANTAMIENTO[itemStatus]?.badgeClass || 'bg-slate-100'}`}>
                          {itemStatus === 'Inspeccionada' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {itemStatus === 'Por inspeccionar' && <Clock className="w-3 h-3 text-amber-600" />}
                          {itemStatus === 'Sin acceso' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {itemStatus}
                        </span>
                      )}
                    </div>
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
                      {isTransformacionTipo(item.tipo) && item.conductoresMT && (
                        <>
                          <span>•</span>
                          <span>Cond. MT: <strong>{item.conductoresMT.length}</strong></span>
                        </>
                      )}
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

              {/* Right Column: Actions (Now with prominent EDIT icon button!) */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* 1. Edit Full Record Button */}
                <button
                  onClick={() => onEditRecord(item)}
                  title="Editar levantamiento en su totalidad"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold transition shadow-2xs active:scale-95"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Editar</span>
                </button>

                {/* 2. Detail Button */}
                <button
                  onClick={() => onInspectRecord(item)}
                  title="Ver detalle completo"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>Detalle</span>
                </button>

                {/* 3. Google Sheets Sync */}
                <button
                  onClick={() => onSyncGoogleSheets(item)}
                  title="Sincronizar a Google Sheets"
                  className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* 4. Delete Record */}
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de eliminar el levantamiento de ${formatTipoDisplayName(item.tipo)} [${item.codigoIdentificador}]?`)) {
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
          );
        })}
        </div>
      )}

    </div>
  );
};

