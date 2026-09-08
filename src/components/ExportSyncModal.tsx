import React, { useState, useEffect } from 'react';
import { LevantamientoRecord } from '../types';
import { 
  FileSpreadsheet, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Upload, 
  Download, 
  Send, 
  Layers, 
  Zap, 
  AlertCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import { exportarExcelCompleto, exportarExcelEspecifico } from '../services/excelService';
import { 
  getGoogleSheetsConfig, 
  saveGoogleSheetsConfig, 
  syncBatchToGoogleSheets, 
  generateGoogleAppsScriptCode 
} from '../services/googleSheetsService';
import { UCVLogo } from './UCVLogo';

interface ExportSyncModalProps {
  records: LevantamientoRecord[];
  onImportRecords?: (imported: LevantamientoRecord[]) => void;
}

export const ExportSyncModal: React.FC<ExportSyncModalProps> = ({
  records,
  onImportRecords,
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSync, setAutoSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  const tanquillas = records.filter((r) => r.tipo === 'Tanquilla');
  const transformadores = records.filter((r) => r.tipo === 'Transformador');
  const scriptCode = generateGoogleAppsScriptCode();

  useEffect(() => {
    const config = getGoogleSheetsConfig();
    setWebhookUrl(config.webhookUrl || '');
    setAutoSync(config.autoSync || false);
  }, []);

  const handleSaveConfig = () => {
    saveGoogleSheetsConfig({
      webhookUrl: webhookUrl.trim(),
      autoSync,
    });
    alert('Configuración de Google Sheets guardada correctamente.');
  };

  const handleSyncAllToGoogleSheets = async () => {
    if (!webhookUrl.trim()) {
      alert('Por favor ingresa la URL de la aplicación web de Google Apps Script.');
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    const res = await syncBatchToGoogleSheets(records, webhookUrl.trim());
    setIsSyncing(false);
    if (res.success) {
      setSyncStatus(`¡Sincronización completada! Se enviaron ${records.length} levantamientos a tu Google Sheet.`);
    } else {
      setSyncStatus(`Error: ${res.message}`);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Levantamiento_UCV_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchorElem.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && onImportRecords) {
          onImportRecords(parsed);
          alert(`Se importaron ${parsed.length} levantamientos correctamente.`);
        }
      } catch (err) {
        alert('Archivo JSON no válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center p-1 shadow-md border-2 border-slate-200 flex-shrink-0 overflow-hidden">
          <UCVLogo className="w-full h-full object-contain" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Exportación de Datos y Conexión con Google Sheets
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
            Universidad Central de Venezuela • Generación de Libros Excel (.xlsx) estructurados y Sincronización en la Nube
          </p>
        </div>
      </div>

      {/* SECCIÓN 1: DESCARGA DE EXCEL PROFESIONAL */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-emerald-100 pb-3">
          <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
            📊
          </span>
          <div>
            <h3 className="text-base font-bold text-slate-900">Descargar Archivo Excel (.xlsx)</h3>
            <p className="text-xs text-slate-500">
              Genera un libro de Excel con formato de celdas, anchos automáticos y hojas separadas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          {/* Opción 1: Todo Consolidado */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase">Libro Completo</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[11px] font-bold">
                  {records.length} reg.
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Incluye 5 pestañas: <em>Consolidado, Tanquillas, Transformadores, Detalle Conductores y Detalle Empalmes</em>.
              </p>
            </div>

            <button
              onClick={() => exportarExcelCompleto(records)}
              disabled={records.length === 0}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Libro Completo</span>
            </button>
          </div>

          {/* Opción 2: Solo Tanquillas */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-800 uppercase">Solo Tanquillas</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 text-[11px] font-bold">
                  {tanquillas.length} reg.
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Exporta únicamente las tanquillas levantadas con sus canales, conductores y empalmes.
              </p>
            </div>

            <button
              onClick={() => exportarExcelEspecifico('Tanquilla', records)}
              disabled={tanquillas.length === 0}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Layers className="w-4 h-4" />
              <span>Descargar Tanquillas</span>
            </button>
          </div>

          {/* Opción 3: Solo Transformadores */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 uppercase">Solo Transformadores</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-bold">
                  {transformadores.length} reg.
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Exporta los transformadores con sus protecciones, conductores de MT y observaciones.
              </p>
            </div>

            <button
              onClick={() => exportarExcelEspecifico('Transformador', records)}
              disabled={transformadores.length === 0}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Descargar Transformadores</span>
            </button>
          </div>

        </div>
      </div>

      {/* SECCIÓN 2: CONEXIÓN AUTOMÁTICA CON GOOGLE SHEETS */}
      <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-sm flex items-center justify-center">
              <Share2 className="w-4 h-4 text-blue-600" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sincronización en Tiempo Real con Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Permite que el formulario registre cada punto automáticamente en tu hoja de Google Drive
              </p>
            </div>
          </div>
        </div>

        {/* Guía en 3 pasos */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            ¿Cómo conectar tu Google Sheet en 1 minuto?
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
            <li>
              Crea una hoja en blanco en <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">sheets.new</a>.
            </li>
            <li>
              En el menú superior ve a: <strong>Extensiones &gt; Apps Script</strong>.
            </li>
            <li>
              Copia el código de integración de abajo, pégalo en el editor y haz clic en <strong>Implementar &gt; Nueva implementación &gt; Aplicación Web</strong> (Acceso: <em>Cualquier usuario</em>).
            </li>
            <li>
              Pega la URL obtenida en el campo inferior y haz clic en <strong>Guardar y Sincronizar</strong>.
            </li>
          </ol>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowScriptCode(!showScriptCode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition"
            >
              <Code className="w-3.5 h-3.5 text-blue-600" />
              <span>{showScriptCode ? 'Ocultar Código de Google Apps Script' : 'Ver y Copiar Código de Google Apps Script'}</span>
            </button>
          </div>
        </div>

        {/* Editor de código de Apps Script desplegable */}
        {showScriptCode && (
          <div className="p-4 bg-slate-900 rounded-xl text-slate-200 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">GoogleAppsScript_UCV_Levantamiento.js</span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '¡Copiado al portapapeles!' : 'Copiar Código'}</span>
              </button>
            </div>
            <pre className="text-[11px] font-mono p-3 bg-black/40 rounded-lg overflow-x-auto max-h-56 leading-relaxed text-blue-200">
              {scriptCode}
            </pre>
          </div>
        )}

        {/* Webhook Configuration Input */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              URL de la Aplicación Web (Webhook de Google Sheets)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
              />
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Guardar URL
              </button>
            </div>
          </div>

          {/* Sync actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSyncAllToGoogleSheets}
              disabled={isSyncing || records.length === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>{isSyncing ? 'Enviando datos...' : `Sincronizar ${records.length} Levantamientos con Google Sheets`}</span>
            </button>
          </div>

          {syncStatus && (
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: RESPALDO Y COPIAS DE SEGURIDAD (JSON) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>💾</span> Copia de Seguridad Local (JSON)
        </h3>
        <p className="text-xs text-slate-500">
          Exporta una copia de seguridad cruda de todos los levantamientos o impórtala desde otro dispositivo móvil o computadora.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            disabled={records.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Respaldo JSON ({records.length})</span>
          </button>

          <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Restaurar desde JSON</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

    </div>
  );
};
