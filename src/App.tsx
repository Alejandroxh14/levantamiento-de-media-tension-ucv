import React, { useState, useEffect } from 'react';
import { LevantamientoRecord } from './types';
import { getAllRecords, deleteRecord, saveRecord } from './services/storageService';
import { exportarExcelCompleto } from './services/excelService';
import { syncRecordToGoogleSheets, getGoogleSheetsConfig } from './services/googleSheetsService';
import { Navbar } from './components/Navbar';
import { LevantamientoForm } from './components/LevantamientoForm';
import { RecordsList } from './components/RecordsList';
import { ExportSyncModal } from './components/ExportSyncModal';
import { MapPointsView } from './components/MapPointsView';
import { RecordDetailModal } from './components/RecordDetailModal';
import { UCVLogo } from './components/UCVLogo';

export default function App() {
  const [records, setRecords] = useState<LevantamientoRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'form' | 'records' | 'export' | 'map'>('form');
  const [inspectingRecord, setInspectingRecord] = useState<LevantamientoRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<LevantamientoRecord | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load records on mount
  useEffect(() => {
    getAllRecords().then((data) => {
      setRecords(data);
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSetActiveTab = (tab: 'form' | 'records' | 'export' | 'map') => {
    if (tab === 'form') {
      setEditingRecord(null);
    }
    setActiveTab(tab);
  };

  const handleGoToNewRecord = () => {
    setEditingRecord(null);
    setActiveTab('form');
  };

  const handleRecordSaved = (newRecord: LevantamientoRecord) => {
    setRecords((prev) => {
      const idx = prev.findIndex((r) => r.id === newRecord.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newRecord;
        return copy;
      }
      return [newRecord, ...prev];
    });
    showToast(`Levantamiento [${newRecord.codigoIdentificador}] guardado en la base de datos.`);
  };

  const handleDeleteRecord = async (id: string) => {
    const updated = await deleteRecord(id);
    setRecords(updated);
    showToast('Registro eliminado correctamente.');
  };

  const handleSyncSingleRecord = async (record: LevantamientoRecord) => {
    const config = getGoogleSheetsConfig();
    if (!config.webhookUrl) {
      setActiveTab('export');
      showToast('Por favor, configura la URL de Google Sheets primero.');
      return;
    }

    const res = await syncRecordToGoogleSheets(record);
    if (res.success) {
      showToast(`¡${record.codigoIdentificador} sincronizado con Google Sheets!`);
    } else {
      showToast(`Error: ${res.message}`);
    }
  };

  const handleQuickExcelExport = () => {
    try {
      exportarExcelCompleto(records);
      showToast('Libro Excel descargado exitosamente.');
    } catch (e: any) {
      showToast(e.message || 'Error al exportar a Excel');
    }
  };

  const handleImportRecords = (imported: LevantamientoRecord[]) => {
    setRecords((prev) => {
      const mergedMap = new Map<string, LevantamientoRecord>();
      prev.forEach((r) => mergedMap.set(r.id, r));
      imported.forEach((r) => mergedMap.set(r.id, r));
      const combined = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      return combined;
    });
    showToast(`Se importaron ${imported.length} registros exitosamente.`);
  };

  const tanquillasCount = records.filter((r) => r.tipo === 'Tanquilla').length;
  const transformadoresCount = records.filter((r) => r.tipo === 'Transformador').length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
        totalRecords={records.length}
        tanquillasCount={tanquillasCount}
        transformadoresCount={transformadoresCount}
        isOnline={isOnline}
        onQuickExcelExport={handleQuickExcelExport}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Dynamic Views */}
        {activeTab === 'form' && (
          <LevantamientoForm
            initialRecord={editingRecord}
            onRecordSaved={handleRecordSaved}
            onViewRecords={() => setActiveTab('records')}
            onCancelEdit={() => setEditingRecord(null)}
          />
        )}

        {activeTab === 'records' && (
          <RecordsList
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onInspectRecord={(rec) => setInspectingRecord(rec)}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setActiveTab('form');
            }}
            onSyncGoogleSheets={handleSyncSingleRecord}
            onGoToForm={handleGoToNewRecord}
          />
        )}

        {activeTab === 'export' && (
          <ExportSyncModal
            records={records}
            onImportRecords={handleImportRecords}
          />
        )}

        {activeTab === 'map' && (
          <MapPointsView
            records={records}
            onInspectRecord={(rec) => setInspectingRecord(rec)}
          />
        )}

      </main>

      {/* Inspection Modal */}
      <RecordDetailModal
        record={inspectingRecord}
        onClose={() => setInspectingRecord(null)}
        onSyncGoogleSheets={handleSyncSingleRecord}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}

      {/* Footer with UCV Engineering attribution */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center p-1 shadow-md border-2 border-slate-200 overflow-hidden flex-shrink-0">
              <UCVLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm sm:text-base">
                Universidad Central de Venezuela (UCV)
              </p>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Facultad de Ingeniería • Escuela de Ingeniería Eléctrica
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="font-semibold text-slate-700">
              Sistema de Levantamiento Geoespacial de Media Tensión
            </p>
            <p className="mt-0.5 text-slate-400 text-[11px]">
              Ciudad Universitaria de Caracas • Patrimonio Mundial UNESCO
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
