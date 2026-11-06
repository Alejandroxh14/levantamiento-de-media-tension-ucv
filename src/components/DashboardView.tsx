import React from 'react';
import { 
  LevantamientoRecord, 
  getRecordStatus, 
  formatTipoDisplayName, 
  ESTADOS_LEVANTAMIENTO 
} from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  Layers, 
  Zap, 
  Building2, 
  Radio, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileSpreadsheet, 
  PlusCircle, 
  Database, 
  MapPin, 
  Eye, 
  Calendar, 
  ArrowUpRight,
  TrendingUp,
  Activity,
  Compass
} from 'lucide-react';
import { UCVLogo } from './UCVLogo';

interface DashboardViewProps {
  records: LevantamientoRecord[];
  onGoToForm: () => void;
  onGoToRecords: () => void;
  onGoToMap: () => void;
  onInspectRecord: (record: LevantamientoRecord) => void;
  onQuickExcelExport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  onGoToForm,
  onGoToRecords,
  onGoToMap,
  onInspectRecord,
  onQuickExcelExport,
}) => {
  const total = records.length;
  const tanquillas = records.filter((r) => r.tipo === 'Tanquilla').length;
  const sotanos = records.filter((r) => r.tipo === 'SÓTANO DE TRANSFORMACIÓN' || r.tipo === 'Transformador').length;
  const casillas = records.filter((r) => r.tipo === 'CASILLA DE TRANSFORMACIÓN').length;
  const postes = records.filter((r) => r.tipo === 'POSTE DE TRANSFORMACIÓN').length;

  const inspeccionadas = records.filter((r) => getRecordStatus(r) === 'Inspeccionada').length;
  const porInspeccionar = records.filter((r) => getRecordStatus(r) === 'Por inspeccionar').length;
  const sinAcceso = records.filter((r) => getRecordStatus(r) === 'Sin acceso' || r.tieneAcceso === 'No').length;

  const pct = (val: number) => (total > 0 ? Math.round((val / total) * 100) : 0);

  // Latest record registered/updated
  const ultimoRegistro = records.length > 0
    ? [...records].sort((a, b) => {
        const timeA = a.updatedAt || a.createdAt || a.fecha || '';
        const timeB = b.updatedAt || b.createdAt || b.fecha || '';
        return timeB.localeCompare(timeA);
      })[0]
    : null;

  // Recent 4 records
  const ultimosRegistros = records.length > 0
    ? [...records]
        .sort((a, b) => {
          const timeA = a.updatedAt || a.createdAt || a.fecha || '';
          const timeB = b.updatedAt || b.createdAt || b.fecha || '';
          return timeB.localeCompare(timeA);
        })
        .slice(0, 4)
    : [];

  // Data for Infrastructure Bar Chart
  const barDataTipos = [
    {
      categoria: 'Tanquillas',
      cantidad: tanquillas,
      porcentaje: pct(tanquillas),
      color: '#2563eb', // blue-600
    },
    {
      categoria: 'Sótanos',
      cantidad: sotanos,
      porcentaje: pct(sotanos),
      color: '#d97706', // amber-600
    },
    {
      categoria: 'Casillas',
      cantidad: casillas,
      porcentaje: pct(casillas),
      color: '#9333ea', // purple-600
    },
    {
      categoria: 'Postes',
      cantidad: postes,
      porcentaje: pct(postes),
      color: '#0284c7', // sky-600
    },
  ];

  // Data for Status Distribution Chart
  const barDataEstados = [
    {
      estado: 'Inspeccionada',
      cantidad: inspeccionadas,
      porcentaje: pct(inspeccionadas),
      color: '#10b981', // emerald-500
    },
    {
      estado: 'Por inspeccionar',
      cantidad: porInspeccionar,
      porcentaje: pct(porInspeccionar),
      color: '#f59e0b', // amber-500
    },
    {
      estado: 'Sin acceso',
      cantidad: sinAcceso,
      porcentaje: pct(sinAcceso),
      color: '#f43f5e', // rose-500
    },
  ];

  const CustomTooltipTipos = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-sm text-slate-100">{data.categoria}</p>
          <p className="text-slate-300">
            Cantidad: <span className="font-bold text-white">{data.cantidad}</span> levantamiento(s)
          </p>
          <p className="text-slate-400">
            Proporción: <span className="font-semibold text-emerald-400">{data.porcentaje}%</span> del total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipEstados = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
          <p className="font-bold text-sm text-slate-100">{data.estado}</p>
          <p className="text-slate-300">
            Cantidad: <span className="font-bold text-white">{data.cantidad}</span> registro(s)
          </p>
          <p className="text-slate-400">
            Avance: <span className="font-semibold text-sky-400">{data.porcentaje}%</span> del total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Executive Header Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center p-1 shadow-md border-2 border-slate-200 flex-shrink-0 overflow-hidden">
            <UCVLogo className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard de Levantamientos MT
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Universidad Central de Venezuela
            </p>
          </div>
        </div>

        {/* Action Shortcut */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onGoToForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Levantamiento</span>
          </button>
        </div>
      </div>

      {/* 5 Main Category Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Levantamientos */}
        <div 
          onClick={onGoToRecords}
          className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm border border-slate-800 cursor-pointer hover:border-blue-500 transition group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">
              Total Levantamientos
            </span>
            <span className="p-1.5 rounded-lg bg-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
              <Compass className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {total}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">{pct(inspeccionadas)}%</span> validados en campo
            </p>
          </div>
        </div>

        {/* Tanquillas */}
        <div 
          onClick={onGoToRecords}
          className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs cursor-pointer hover:border-blue-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-blue-900 uppercase">
              Tanquillas
            </span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-700">
              {tanquillas}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-bold text-blue-700">{pct(tanquillas)}%</span> del total registrado
            </p>
          </div>
        </div>

        {/* Sótanos de Transformación */}
        <div 
          onClick={onGoToRecords}
          className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-amber-900 uppercase">
              Sótanos Transf.
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {sotanos}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-bold text-amber-700">{pct(sotanos)}%</span> subterráneos MT
            </p>
          </div>
        </div>

        {/* Casillas de Transformación */}
        <div 
          onClick={onGoToRecords}
          className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs cursor-pointer hover:border-purple-400 hover:shadow-md transition group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-purple-900 uppercase">
              Casillas Transf.
            </span>
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-700">
              {casillas}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-bold text-purple-700">{pct(casillas)}%</span> en superficie
            </p>
          </div>
        </div>

        {/* Postes de Transformación */}
        <div 
          onClick={onGoToRecords}
          className="bg-white p-4 rounded-2xl border border-sky-200 shadow-xs cursor-pointer hover:border-sky-400 hover:shadow-md transition group flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-sky-900 uppercase">
              Postes Transf.
            </span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition">
              <Radio className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-700">
              {postes}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <span className="font-bold text-sky-700">{pct(postes)}%</span> transformación aérea
            </p>
          </div>
        </div>

      </div>

      {/* Grid: Charts & Último Registro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (2 cols): Bar Chart with Recharts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Bar Chart: Distribución por Infraestructura */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Distribución de Infraestructura Eléctrica MT
                </h2>
                <p className="text-xs text-slate-500">
                  Comparativa de tanquillas, sótanos, casillas y postes de transformación
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 self-start sm:self-auto">
                Total: {total} unidades
              </span>
            </div>

            {total === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center space-y-2">
                <Database className="w-8 h-8 text-slate-300" />
                <p>No hay levantamientos registrados aún para generar el gráfico.</p>
                <button
                  onClick={onGoToForm}
                  className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                >
                  + Agregar primer levantamiento
                </button>
              </div>
            ) : (
              <div className="w-full h-64 sm:h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barDataTipos}
                    margin={{ top: 10, right: 15, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="categoria" 
                      tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltipTipos />} />
                    <Bar 
                      dataKey="cantidad" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={55}
                    >
                      {barDataTipos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Quick Stat Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                <span className="w-3 h-3 rounded-full bg-blue-600 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-500 font-medium">Tanquillas</p>
                  <p className="font-bold text-blue-900">{tanquillas} ({pct(tanquillas)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/60 border border-amber-100">
                <span className="w-3 h-3 rounded-full bg-amber-600 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-500 font-medium">Sótanos</p>
                  <p className="font-bold text-amber-900">{sotanos} ({pct(sotanos)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-500 font-medium">Casillas</p>
                  <p className="font-bold text-purple-900">{casillas} ({pct(casillas)}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-50/60 border border-sky-100">
                <span className="w-3 h-3 rounded-full bg-sky-600 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-[10px] text-slate-500 font-medium">Postes</p>
                  <p className="font-bold text-sky-900">{postes} ({pct(postes)}%)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Bar Chart: Avance por Estado de Inspección */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Estado de Inspección y Validación de Campo
                </h3>
                <p className="text-xs text-slate-500">
                  Progreso de levantamientos inspeccionados, pendientes y sin acceso
                </p>
              </div>
            </div>

            {total === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Sin datos de inspección.</p>
            ) : (
              <div className="w-full h-44 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barDataEstados}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 35, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis 
                      type="category" 
                      dataKey="estado" 
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltipEstados />} />
                    <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={22}>
                      {barDataEstados.map((entry, index) => (
                        <Cell key={`cell-st-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (1 col): Acceso Rápido al Último Registro + Historial */}
        <div className="space-y-6">
          
          {/* Tarjeta de Acceso Rápido al Último Registro */}
          <div className="bg-white p-5 rounded-2xl border-2 border-blue-500/30 shadow-md relative overflow-hidden space-y-4">
            
            {/* Header Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[11px] tracking-wide uppercase">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                Último Levantamiento
              </span>
              {ultimoRegistro && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {ultimoRegistro.fecha}
                </span>
              )}
            </div>

            {ultimoRegistro ? (
              <div className="space-y-4">
                
                {/* ID & Type */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {ultimoRegistro.codigoIdentificador}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      {formatTipoDisplayName(ultimoRegistro.tipo)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{ultimoRegistro.direccion || 'Sin dirección registrada'}</span>
                  </p>
                </div>

                {/* Status & Technical Specs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Estado Actual</span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                      getRecordStatus(ultimoRegistro) === 'Inspeccionada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : getRecordStatus(ultimoRegistro) === 'Por inspeccionar'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {getRecordStatus(ultimoRegistro)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Acceso en Campo</span>
                    <span className={`font-bold text-xs mt-1 block ${
                      ultimoRegistro.tieneAcceso === 'Si' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {ultimoRegistro.tieneAcceso === 'Si' ? '✓ Con acceso' : '✗ Sin acceso'}
                    </span>
                  </div>
                </div>

                {/* Coordinates if GPS active */}
                {ultimoRegistro.latitud !== null && ultimoRegistro.longitud !== null && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between">
                    <span className="text-[11px] text-blue-900 font-semibold flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      GPS: {ultimoRegistro.latitud.toFixed(5)}, {ultimoRegistro.longitud.toFixed(5)}
                    </span>
                    <button
                      onClick={onGoToMap}
                      className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      Ver mapa <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Quick Inspection Action */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onInspectRecord(ultimoRegistro)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm active:scale-95"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Inspeccionar Registro Completo</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Database className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No hay registros creados todavía.</p>
                <button
                  onClick={onGoToForm}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Crear primer registro
                </button>
              </div>
            )}

          </div>

          {/* Últimos 4 Registros (Lista Rápida) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Historial Reciente
              </h4>
              <button
                onClick={onGoToRecords}
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Ver todos <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {ultimosRegistros.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Sin actividad reciente.</p>
            ) : (
              <div className="space-y-2">
                {ultimosRegistros.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onInspectRecord(item)}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-200 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                          {item.codigoIdentificador}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-200 text-slate-700 truncate max-w-[120px]">
                          {formatTipoDisplayName(item.tipo)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {item.direccion || item.fecha}
                      </p>
                    </div>

                    <span className="text-slate-400 group-hover:text-blue-600 transition flex-shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
