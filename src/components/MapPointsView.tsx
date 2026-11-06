import React, { useState, useEffect, useRef } from 'react';
import { 
  LevantamientoRecord, 
  isTransformacionTipo, 
  formatTipoDisplayName,
  EstadoLevantamiento,
  ESTADOS_LEVANTAMIENTO,
  getRecordStatus
} from '../types';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Zap, 
  Building2,
  Radio,
  AlertTriangle,
  ExternalLink, 
  Eye, 
  Navigation, 
  Maximize2,
  Compass,
  Filter,
  CheckCircle2,
  Globe,
  Pencil,
  X,
  Clock
} from 'lucide-react';
import { UCVLogo } from './UCVLogo';

interface MapPointsViewProps {
  records: LevantamientoRecord[];
  onInspectRecord: (record: LevantamientoRecord) => void;
  onEditRecord: (record: LevantamientoRecord) => void;
  onUpdateStatus?: (recordId: string, newStatus: EstadoLevantamiento) => void;
}

type FilterType = 'all' | 'tanquillas' | 'sotanos' | 'casillas' | 'postes' | 'sin_acceso' | 'inspeccionadas' | 'por_inspeccionar';
type MapLayerType = 'streets' | 'satellite';

export const MapPointsView: React.FC<MapPointsViewProps> = ({
  records,
  onInspectRecord,
  onEditRecord,
  onUpdateStatus,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [selectedRecord, setSelectedRecord] = useState<LevantamientoRecord | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [mapLayer, setMapLayer] = useState<MapLayerType>('streets');

  // Filter records that have valid coordinates
  const recordsWithCoords = records.filter(
    (r) => r.latitud !== null && r.longitud !== null && !isNaN(r.latitud) && !isNaN(r.longitud)
  );

  // Categorize by the 4 infrastructure types
  const tanquillasList = recordsWithCoords.filter((r) => r.tipo === 'Tanquilla');
  const sotanosList = recordsWithCoords.filter(
    (r) => r.tipo === 'SÓTANO DE TRANSFORMACIÓN' || r.tipo === 'Transformador'
  );
  const casillasList = recordsWithCoords.filter((r) => r.tipo === 'CASILLA DE TRANSFORMACIÓN');
  const postesList = recordsWithCoords.filter((r) => r.tipo === 'POSTE DE TRANSFORMACIÓN');
  const sinAccesoList = recordsWithCoords.filter(
    (r) => r.tieneAcceso === 'No' || getRecordStatus(r) === 'Sin acceso'
  );

  // Filtered list based on active filter
  const displayedRecords = recordsWithCoords.filter((r) => {
    const itemStatus = getRecordStatus(r);
    if (filterType === 'tanquillas') return r.tipo === 'Tanquilla';
    if (filterType === 'sotanos') return r.tipo === 'SÓTANO DE TRANSFORMACIÓN' || r.tipo === 'Transformador';
    if (filterType === 'casillas') return r.tipo === 'CASILLA DE TRANSFORMACIÓN';
    if (filterType === 'postes') return r.tipo === 'POSTE DE TRANSFORMACIÓN';
    if (filterType === 'sin_acceso') return itemStatus === 'Sin acceso' || r.tieneAcceso === 'No';
    if (filterType === 'inspeccionadas') return itemStatus === 'Inspeccionada';
    if (filterType === 'por_inspeccionar') return itemStatus === 'Por inspeccionar';
    return true;
  });

  // Default coordinate: Ciudad Universitaria de Caracas (UCV)
  const defaultLat = 10.4883;
  const defaultLng = -66.8904;

  const currentLat = recordsWithCoords.length > 0 ? recordsWithCoords[0].latitud! : defaultLat;
  const currentLng = recordsWithCoords.length > 0 ? recordsWithCoords[0].longitud! : defaultLng;

  // Custom marker generator with respective logos for each type:
  // - Tanquilla: Logo Layers (Azul)
  // - Sótano de Transformación: Logo Zap / Rayo (Anaranjado)
  // - Casilla de Transformación: Logo Building2 / Kiosco (Púrpura)
  // - Poste de Transformación: Logo Radio / Poste (Cian/Cielo)
  // - Sin Acceso: Insignia roja con advertencia sin perder el logo del tipo
  const createMarkerIcon = (record: LevantamientoRecord, isSelected: boolean) => {
    const isSinAcceso = record.tieneAcceso === 'No' || getRecordStatus(record) === 'Sin acceso';

    let bgColor = '#2563eb'; // Blue
    let borderColor = '#1d4ed8';
    let ringColor = 'rgba(37, 99, 235, 0.45)';
    // Tanquilla: Stacked layers logo
    let iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.3" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;

    if (record.tipo === 'CASILLA DE TRANSFORMACIÓN') {
      bgColor = '#7c3aed'; // Purple
      borderColor = '#5b21b6';
      ringColor = 'rgba(124, 58, 237, 0.45)';
      // Casilla: Building2 / Cabina substation logo
      iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path><path stroke-linecap="round" stroke-linejoin="round" d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path><path stroke-linecap="round" stroke-linejoin="round" d="M10 6h4"></path><path stroke-linecap="round" stroke-linejoin="round" d="M10 10h4"></path><path stroke-linecap="round" stroke-linejoin="round" d="M10 14h4"></path><path stroke-linecap="round" stroke-linejoin="round" d="M10 18h4"></path></svg>`;
    } else if (record.tipo === 'POSTE DE TRANSFORMACIÓN') {
      bgColor = '#0284c7'; // Sky / Cyan
      borderColor = '#0369a1';
      ringColor = 'rgba(2, 132, 199, 0.45)';
      // Poste: Radio / Tower pole logo
      iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path><path stroke-linecap="round" stroke-linejoin="round" d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path><circle cx="12" cy="12" r="2"></circle><path stroke-linecap="round" stroke-linejoin="round" d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path><path stroke-linecap="round" stroke-linejoin="round" d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path></svg>`;
    } else if (record.tipo === 'SÓTANO DE TRANSFORMACIÓN' || record.tipo === 'Transformador') {
      bgColor = '#ea580c'; // Orange / Amber
      borderColor = '#c2410c';
      ringColor = 'rgba(234, 88, 12, 0.45)';
      // Sótano: High voltage Zap / Rayo logo
      iconSvg = `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.3" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
    }

    // Badge indicator for Sin Acceso
    const sinAccesoBadge = isSinAcceso ? `
      <div style="position: absolute; top: -3px; right: -3px; width: 14px; height: 14px; background-color: #ef4444; border: 1.5px solid #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.5);" title="Sin Acceso">
        <span style="font-size: 9px; line-height: 1; font-weight: 900; color: white;">!</span>
      </div>
    ` : '';

    const scale = isSelected ? 'scale-125 z-50' : 'hover:scale-110';
    const shadow = isSelected 
      ? `box-shadow: 0 0 0 6px ${ringColor}, 0 10px 15px -3px rgba(0,0,0,0.4);` 
      : isSinAcceso
      ? 'box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.5), 0 4px 6px -1px rgba(0,0,0,0.3);'
      : 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);';

    const html = `
      <div class="relative flex items-center justify-center transition-transform duration-200 ${scale}">
        <div style="background-color: ${bgColor}; border: 2.5px solid ${borderColor}; ${shadow}" 
             class="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer relative">
          ${iconSvg}
          ${sinAccesoBadge}
        </div>
        <div style="background-color: ${borderColor};" class="absolute -bottom-1.5 w-2 h-2 rotate-45"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-map-marker',
      iconSize: [32, 38],
      iconAnchor: [16, 36],
      popupAnchor: [0, -34],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 16,
        zoomControl: true,
      });

      // Tile layer
      const tileUrl = mapLayer === 'streets' 
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      
      const attribution = mapLayer === 'streets'
        ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        : 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

      tileLayerRef.current = L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount if needed
    };
  }, []);

  // Update tile layer on toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl = mapLayer === 'streets' 
      ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const attribution = mapLayer === 'streets'
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      : 'Tiles &copy; Esri World Imagery';

    tileLayerRef.current = L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(mapInstanceRef.current);
  }, [mapLayer]);

  // Update markers when records, filter, or selection changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    displayedRecords.forEach((record) => {
      if (record.latitud === null || record.longitud === null) return;

      const lat = record.latitud;
      const lng = record.longitud;
      bounds.extend([lat, lng]);

      const isSelected = selectedRecord?.id === record.id;
      const icon = createMarkerIcon(record, isSelected);

      const marker = L.marker([lat, lng], { icon });

      // Build rich popup
      const recordStatus = getRecordStatus(record);
      const tipoBadge = record.tipo === 'Tanquilla'
        ? '<span style="background-color: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px;">🗂️ Tanquilla</span>'
        : record.tipo === 'CASILLA DE TRANSFORMACIÓN'
        ? '<span style="background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px;">🏢 Casilla Transf.</span>'
        : record.tipo === 'POSTE DE TRANSFORMACIÓN'
        ? '<span style="background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px;">📡 Poste Transf.</span>'
        : '<span style="background-color: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px;">⚡ Sótano Transf.</span>';
      
      const statusBadge = recordStatus === 'Inspeccionada'
        ? '<span style="background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 2px 7px; border-radius: 9999px; font-weight: 700; font-size: 10px;">✓ Inspeccionada</span>'
        : recordStatus === 'Por inspeccionar'
        ? '<span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 7px; border-radius: 9999px; font-weight: 700; font-size: 10px;">⏱ Por inspeccionar</span>'
        : '<span style="background-color: #fee2e2; color: #991b1b; border: 1px solid #fecaca; padding: 2px 7px; border-radius: 9999px; font-weight: 700; font-size: 10px;">🔴 Sin acceso</span>';

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 230px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 8px;">
            <strong style="font-size: 14px; font-weight: 800; color: #0f172a;">${record.codigoIdentificador}</strong>
            <div style="display: flex; gap: 4px; align-items: center;">
              ${statusBadge}
            </div>
          </div>
          <div style="margin-bottom: 6px;">
            ${tipoBadge}
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.35;">${record.direccion || 'Sin dirección especificada'}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #64748b; font-family: monospace; margin-bottom: 10px; border-top: 1px dashed #e2e8f0; padding-top: 6px;">
            <span>📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}</span>
            ${record.evidencias && record.evidencias.length > 0 ? `<span style="color: #0284c7; font-weight: 700;">📷 ${record.evidencias.length} foto${record.evidencias.length > 1 ? 's' : ''}</span>` : ''}
          </div>
          <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
            <button class="btn-edit-popup" id="popup-edit-btn-${record.id}" style="background-color: #f59e0b; color: #ffffff; border: none; padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">
              ✏️ Editar
            </button>
            <button class="btn-detail-popup" id="popup-btn-${record.id}" style="background-color: #2563eb; color: #ffffff; border: none; padding: 5px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              👁️ Detalle
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('click', () => {
        setSelectedRecord(record);
      });

      marker.on('popupopen', (e) => {
        const popupElement = e.popup.getElement();
        if (popupElement) {
          const editBtn = popupElement.querySelector('.btn-edit-popup') as HTMLButtonElement | null;
          if (editBtn) {
            editBtn.onclick = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onEditRecord(record);
            };
          }

          const detailBtn = popupElement.querySelector('.btn-detail-popup') as HTMLButtonElement | null;
          if (detailBtn) {
            detailBtn.onclick = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onInspectRecord(record);
            };
          }
        }
      });

      markersLayerRef.current?.addLayer(marker);
    });

    // Auto-fit bounds if we have points
    if (displayedRecords.length > 0 && bounds.isValid() && !selectedRecord) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
    }
  }, [displayedRecords, selectedRecord]);

  const handleSelectRecord = (record: LevantamientoRecord) => {
    setSelectedRecord(record);
    if (mapInstanceRef.current && record.latitud !== null && record.longitud !== null) {
      mapInstanceRef.current.flyTo([record.latitud, record.longitud], 18, {
        duration: 1.2,
      });
    }
  };

  const handleCenterAll = () => {
    if (!mapInstanceRef.current || recordsWithCoords.length === 0) return;
    const bounds = L.latLngBounds([]);
    recordsWithCoords.forEach((r) => {
      if (r.latitud && r.longitud) bounds.extend([r.latitud, r.longitud]);
    });
    if (bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-20">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center p-1 shadow-md border-2 border-slate-200 flex-shrink-0 overflow-hidden">
            <UCVLogo className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              Mapa de Puntos de Levantamiento UCV
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Visualización geoespacial con código de colores según tipo y accesibilidad en el Campus Universitario
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCenterAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition"
          >
            <Compass className="w-4 h-4 text-slate-600" />
            <span>Centrar Todo</span>
          </button>

          {recordsWithCoords.length > 0 && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${currentLat},${currentLng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition"
            >
              <Navigation className="w-4 h-4" />
              <span>Abrir en Google Maps</span>
            </a>
          )}
        </div>
      </div>

      {/* Map Legend Banner (All 4 Types with Respective Logos) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Filter className="w-4 h-4 text-slate-500" />
            Logos y Convención:
          </span>

          {/* Tanquillas (Azul - Layers) */}
          <button
            onClick={() => setFilterType(filterType === 'tanquillas' ? 'all' : 'tanquillas')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold transition active:scale-95 ${
              filterType === 'tanquillas'
                ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-blue-600 border border-blue-700 flex items-center justify-center text-white">
              <Layers className="w-2.5 h-2.5" />
            </span>
            <span>Tanquillas (Azul)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterType === 'tanquillas' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-900'
            }`}>
              {tanquillasList.length}
            </span>
          </button>

          {/* Sótanos de Transformación (Anaranjado - Zap) */}
          <button
            onClick={() => setFilterType(filterType === 'sotanos' ? 'all' : 'sotanos')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold transition active:scale-95 ${
              filterType === 'sotanos'
                ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-orange-600 border border-orange-700 flex items-center justify-center text-white">
              <Zap className="w-2.5 h-2.5" />
            </span>
            <span>Sótanos Transf. (Naranja)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterType === 'sotanos' ? 'bg-orange-700 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {sotanosList.length}
            </span>
          </button>

          {/* Casillas de Transformación (Púrpura - Building2) */}
          <button
            onClick={() => setFilterType(filterType === 'casillas' ? 'all' : 'casillas')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold transition active:scale-95 ${
              filterType === 'casillas'
                ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-purple-600 border border-purple-700 flex items-center justify-center text-white">
              <Building2 className="w-2.5 h-2.5" />
            </span>
            <span>Casillas Transf. (Púrpura)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterType === 'casillas' ? 'bg-purple-700 text-white' : 'bg-purple-200 text-purple-900'
            }`}>
              {casillasList.length}
            </span>
          </button>

          {/* Postes de Transformación (Cian - Radio) */}
          <button
            onClick={() => setFilterType(filterType === 'postes' ? 'all' : 'postes')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-semibold transition active:scale-95 ${
              filterType === 'postes'
                ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-sky-600 border border-sky-700 flex items-center justify-center text-white">
              <Radio className="w-2.5 h-2.5" />
            </span>
            <span>Postes Transf. (Cian)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterType === 'postes' ? 'bg-sky-700 text-white' : 'bg-sky-200 text-sky-900'
            }`}>
              {postesList.length}
            </span>
          </button>

          {/* Sin Acceso (Rojo) */}
          <button
            onClick={() => setFilterType(filterType === 'sin_acceso' ? 'all' : 'sin_acceso')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border font-bold transition active:scale-95 ${
              filterType === 'sin_acceso'
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                : 'bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-rose-500 border border-rose-700 flex items-center justify-center text-white">
              <AlertTriangle className="w-2.5 h-2.5" />
            </span>
            <span>Sin Acceso (Rojo)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              filterType === 'sin_acceso' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
            }`}>
              {sinAccesoList.length}
            </span>
          </button>
        </div>

        {/* Satellite vs Streets Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setMapLayer('streets')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapLayer === 'streets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Callejero
          </button>
          <button
            onClick={() => setMapLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg transition ${
              mapLayer === 'satellite' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Satélite
          </button>
        </div>
      </div>

      {/* Map Interactive Frame & Points List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Map Container */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[540px]">
          
          {/* Top Bar inside Map with Category Filters */}
          <div className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs font-semibold z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Visor Cartográfico Interactivo UCV</span>
            </div>

            {/* Quick Filter Buttons with Respective Logos */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-800 p-1 rounded-xl text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded font-bold transition ${filterType === 'all' ? 'bg-slate-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Todos ({recordsWithCoords.length})
              </button>
              <button
                onClick={() => setFilterType('tanquillas')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold transition ${filterType === 'tanquillas' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Filtrar Tanquillas"
              >
                <Layers className="w-3 h-3 text-blue-300" /> Tanquillas ({tanquillasList.length})
              </button>
              <button
                onClick={() => setFilterType('sotanos')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold transition ${filterType === 'sotanos' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Filtrar Sótanos de Transformación"
              >
                <Zap className="w-3 h-3 text-amber-300" /> Sótanos ({sotanosList.length})
              </button>
              <button
                onClick={() => setFilterType('casillas')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold transition ${filterType === 'casillas' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Filtrar Casillas de Transformación"
              >
                <Building2 className="w-3 h-3 text-purple-300" /> Casillas ({casillasList.length})
              </button>
              <button
                onClick={() => setFilterType('postes')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold transition ${filterType === 'postes' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Filtrar Postes de Transformación"
              >
                <Radio className="w-3 h-3 text-sky-300" /> Postes ({postesList.length})
              </button>
              <button
                onClick={() => setFilterType('sin_acceso')}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold transition ${filterType === 'sin_acceso' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
                title="Filtrar Sin Acceso"
              >
                <AlertTriangle className="w-3 h-3 text-rose-300" /> Sin acceso ({sinAccesoList.length})
              </button>
            </div>
          </div>

          {/* Leaflet DOM Node */}
          <div className="flex-1 relative bg-slate-100">
            {recordsWithCoords.length > 0 ? (
              <div 
                ref={mapContainerRef} 
                className="w-full h-full z-0"
                style={{ minHeight: '440px' }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <MapPin className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">No hay puntos con coordenadas aún</p>
                <p className="text-xs max-w-sm mt-1">
                  Usa el botón "📍 Capturar GPS Actual" en el formulario de campo para registrar las coordenadas exactas de cada elemento.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Points Sidebar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col h-[540px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Puntos en Mapa ({displayedRecords.length})
            </h3>
            <span className="text-[11px] text-slate-400">Toca para centrar</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {displayedRecords.map((rec) => {
              const itemStatus = getRecordStatus(rec);
              const isSinAcceso = itemStatus === 'Sin acceso' || rec.tieneAcceso === 'No';

              // Get respective category logo and styling
              let typeIcon = <Layers className="w-3 h-3 text-white" />;
              let typeBg = 'bg-blue-600 border-blue-800';
              let badgeClass = 'text-blue-700 bg-blue-50 border-blue-200';
              let badgeLabel = 'Tanquilla';

              if (rec.tipo === 'CASILLA DE TRANSFORMACIÓN') {
                typeIcon = <Building2 className="w-3 h-3 text-white" />;
                typeBg = 'bg-purple-600 border-purple-800';
                badgeClass = 'text-purple-700 bg-purple-50 border-purple-200';
                badgeLabel = 'Casilla Transf.';
              } else if (rec.tipo === 'POSTE DE TRANSFORMACIÓN') {
                typeIcon = <Radio className="w-3 h-3 text-white" />;
                typeBg = 'bg-sky-600 border-sky-800';
                badgeClass = 'text-sky-700 bg-sky-50 border-sky-200';
                badgeLabel = 'Poste Transf.';
              } else if (rec.tipo === 'SÓTANO DE TRANSFORMACIÓN' || rec.tipo === 'Transformador') {
                typeIcon = <Zap className="w-3 h-3 text-white" />;
                typeBg = 'bg-orange-600 border-orange-800';
                badgeClass = 'text-amber-700 bg-amber-50 border-amber-200';
                badgeLabel = 'Sótano Transf.';
              }

              return (
                <div
                  key={rec.id}
                  onClick={() => handleSelectRecord(rec)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    selectedRecord?.id === rec.id
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {/* Logo badge of respective type */}
                      <span 
                        className={`w-6 h-6 rounded-full border shadow-2xs flex items-center justify-center relative ${typeBg}`}
                        title={`${badgeLabel} ${isSinAcceso ? '(Sin acceso)' : ''}`}
                      >
                        {typeIcon}
                        {isSinAcceso && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white" />
                        )}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{rec.codigoIdentificador}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                        itemStatus === 'Inspeccionada'
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : itemStatus === 'Por inspeccionar'
                          ? 'text-amber-700 bg-amber-50 border-amber-200'
                          : 'text-rose-700 bg-rose-50 border-rose-200'
                      }`}>
                        {itemStatus}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5">
                    {rec.direccion}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{rec.latitud?.toFixed(5)}, {rec.longitud?.toFixed(5)}</span>
                    <div className="flex items-center gap-1.5 font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRecord(rec);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition"
                        title="Editar levantamiento"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectRecord(rec);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                      >
                        <Eye className="w-2.5 h-2.5" />
                        <span>Detalle</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {displayedRecords.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-10">
                No hay puntos con coordenadas geográficas para este filtro.
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Floating Selected Record Action Bar */}
      {selectedRecord && (
        <div className="bg-white p-4 rounded-2xl border-2 border-amber-400/90 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            {/* Respective Category Logo */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs ${
              selectedRecord.tipo === 'CASILLA DE TRANSFORMACIÓN'
                ? 'bg-purple-600'
                : selectedRecord.tipo === 'POSTE DE TRANSFORMACIÓN'
                ? 'bg-sky-600'
                : selectedRecord.tipo === 'SÓTANO DE TRANSFORMACIÓN' || selectedRecord.tipo === 'Transformador'
                ? 'bg-orange-600'
                : 'bg-blue-600'
            }`}>
              {selectedRecord.tipo === 'CASILLA DE TRANSFORMACIÓN' ? (
                <Building2 className="w-6 h-6" />
              ) : selectedRecord.tipo === 'POSTE DE TRANSFORMACIÓN' ? (
                <Radio className="w-6 h-6" />
              ) : selectedRecord.tipo === 'SÓTANO DE TRANSFORMACIÓN' || selectedRecord.tipo === 'Transformador' ? (
                <Zap className="w-6 h-6" />
              ) : (
                <Layers className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base">
                  {selectedRecord.codigoIdentificador}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  selectedRecord.tipo === 'CASILLA DE TRANSFORMACIÓN'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : selectedRecord.tipo === 'POSTE DE TRANSFORMACIÓN'
                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                    : selectedRecord.tipo === 'SÓTANO DE TRANSFORMACIÓN' || selectedRecord.tipo === 'Transformador'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {formatTipoDisplayName(selectedRecord.tipo)}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  getRecordStatus(selectedRecord) === 'Inspeccionada'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : getRecordStatus(selectedRecord) === 'Por inspeccionar'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {getRecordStatus(selectedRecord)}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                {selectedRecord.direccion || 'Sin dirección registrada'} • Coordenadas: {selectedRecord.latitud?.toFixed(5)}, {selectedRecord.longitud?.toFixed(5)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => onEditRecord(selectedRecord)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold transition shadow-sm"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Levantamiento</span>
            </button>
            <button
              onClick={() => onInspectRecord(selectedRecord)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold transition shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Ficha Completa</span>
            </button>
            <button
              onClick={() => setSelectedRecord(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Cerrar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
