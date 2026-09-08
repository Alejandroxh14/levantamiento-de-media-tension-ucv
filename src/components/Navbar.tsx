import React from 'react';
import { 
  Zap, 
  FileSpreadsheet, 
  PlusCircle, 
  Database, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Download,
  Share2
} from 'lucide-react';
import { UCVLogo } from './UCVLogo';

interface NavbarProps {
  activeTab: 'form' | 'records' | 'export' | 'map';
  setActiveTab: (tab: 'form' | 'records' | 'export' | 'map') => void;
  totalRecords: number;
  tanquillasCount: number;
  transformadoresCount: number;
  isOnline: boolean;
  onQuickExcelExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalRecords,
  tanquillasCount,
  transformadoresCount,
  isOnline,
  onQuickExcelExport,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-4 cursor-pointer select-none py-1" onClick={() => setActiveTab('form')}>
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white p-0.5 flex items-center justify-center shadow-lg border-2 border-amber-400/80 hover:scale-105 transition duration-200 overflow-hidden flex-shrink-0">
              <UCVLogo className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-serif">
                  UCV <span className="font-sans font-bold text-blue-300">Levantamiento de Media Tensión</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium hidden sm:block tracking-wide">
                Universidad Central de Venezuela • Facultad de Ingeniería
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Online/Offline Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-emerald-400 hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 hidden sm:inline">Offline (Local)</span>
                </>
              )}
            </div>

            {/* Quick Excel Export Button */}
            <button
              id="btn_quick_excel"
              onClick={onQuickExcelExport}
              disabled={totalRecords === 0}
              title="Descargar Excel con todos los registros guardados"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white transition-all shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden md:inline">Descargar Excel</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-[11px]">
                {totalRecords}
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 sm:space-x-2 border-t border-slate-800/80 py-2 overflow-x-auto scrollbar-none">
          
          <button
            id="nav_tab_form"
            onClick={() => setActiveTab('form')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'form'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-blue-200" />
            <span>Nuevo Levantamiento</span>
          </button>

          <button
            id="nav_tab_records"
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'records'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-blue-200" />
            <span>Base de Datos</span>
            <span className="ml-1 px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-slate-800 text-slate-200 border border-slate-700">
              {totalRecords}
            </span>
          </button>

          <button
            id="nav_tab_export"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'export'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-4 h-4 text-blue-200" />
            <span>Google Sheets & Excel</span>
          </button>

          <button
            id="nav_tab_map"
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4 text-blue-200" />
            <span>Mapa de Puntos</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
