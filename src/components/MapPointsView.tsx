import React, { useState, useEffect, useRef } from 'react';
import { LevantamientoRecord } from '../types';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  Zap, 
  AlertTriangle,
  ExternalLink, 
  Eye, 
  Navigation, 
  Maximize2,
  Compass,
  Filter,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { UCVLogo } from './UCVLogo';

interface MapPointsViewProps {
  records: LevantamientoRecord[];
  onInspectRecord: (record: LevantamientoRecord) => void;
}

type FilterType = 'all' | 'tanquillas' | 'transformadores' | 'sin_acceso';
type MapLayerType = 'streets' | 'satellite';

export const MapPointsView: React.FC<MapPointsViewProps> = ({
  records,
  onInspectRecord,
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

  // Categorize
  const tanquillasConAcceso = recordsWithCoords.filter(
    (r) => r.tipo === 'Tanquilla' && r.tieneAcceso === 'Si'
  );
  const transformadoresConAcceso = recordsWithCoords.filter(
    (r) => r.tipo === 'Transformador' && r.tieneAcceso === 'Si'
  );
  const sinAcceso = recordsWithCoords.filter((r) => r.tieneAcceso === 'No');

  // Filtered list based on active filter
  const displayedRecords = recordsWithCoords.filter((r) => {
    if (filterType === 'tanquillas') return r.tipo === 'Tanquilla' && r.tieneAcceso === 'Si';
    if (filterType === 'transformadores') return r.tipo === 'Transformador' && r.tieneAcceso === 'Si';
    if (filterType === 'sin_acceso') return r.tieneAcceso === 'No';
    return true;
  });

  // Default coordinate: Ciudad Universitaria de Caracas (UCV)
  const defaultLat = 10.4883;
  const defaultLng = -66.8904;

  const currentLat = recordsWithCoords.length > 0 ? recordsWithCoords[0].latitud! : defaultLat;
  const currentLng = recordsWithCoords.length > 0 ? recordsWithCoords[0].longitud! : defaultLng;

  // Function to create custom Leaflet DivIcon with exact colors requested:
  // - Tanquilla con acceso -> Azul
  // - Transformador con acceso -> Anaranjado
  // - Sin acceso -> Rojo
  const createMarkerIcon = (record: LevantamientoRecord, isSelected: boolean) => {
    let bgColor = '#2563eb'; // Blue for Tanquilla
    let borderColor = '#1d4ed8';
    let ringColor = 'rgba(37, 99, 235, 0.4)';
    let iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>`;

    if (record.tieneAcceso === 'No') {
      bgColor = '#ef4444'; // Red for Sin Acceso
      borderColor = '#b91c1c';
      ringColor = 'rgba(239, 68, 68, 0.45)';
      iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
    } else if (record.tipo === 'Transformador') {
      bgColor = '#f97316'; // Orange for Transformador
      borderColor = '#c2410c';
      ringColor = 'rgba(249, 115, 22, 0.45)';
      iconSvg = `<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>`;
    }

    const scale = isSelected ? 'scale-125' : 'hover:scale-110';
    const shadow = isSelected ? 'box-shadow: 0 0 0 6px ' + ringColor + ', 0 10px 15px -3px rgba(0,0,0,0.4);' : 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);';

    const html = `
      <div class="relative flex items-center justify-center transition-transform duration-200 ${scale}">
        <div style="background-color: ${bgColor}; border: 2.5px solid ${borderColor}; ${shadow}" 
             class="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer">
          ${iconSvg}
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
      const statusBadge = record.tieneAcceso === 'No'
        ? '<span style="background-color: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; padding: 2px 6px; border-radius: 6px; font-weight: 700; font-size: 10px;">🔴 Sin Acceso</span>'
        : record.tipo === 'Transformador'
        ? '<span style="background-color: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; padding: 2px 6px; border-radius: 6px; font-weight: 700; font-size: 10px;">🟠 Transformador</span>'
        : '<span style="background-color: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 6px; border-radius: 6px; font-weight: 700; font-size: 10px;">🔵 Tanquilla</span>';

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0f172a;">${record.codigoIdentificador}</strong>
            ${statusBadge}
          </div>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.3;">${record.direccion || 'Sin dirección especificada'}</p>
          <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-bottom: 8px;">
            📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button id="popup-btn-${record.id}" style="background-color: #2563eb; color: white; border: none; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Ver Detalles
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedRecord(record);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-${record.id}`);
        if (btn) {
          btn.onclick = () => onInspectRecord(record);
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

      {/* Map Legend Banner (Explicit Color Codes) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            Convención de Colores:
          </span>

          {/* Tanquillas (Azul) */}
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 text-blue-900 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-blue-800 shadow-xs flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white"></span>
            </span>
            <span>Tanquillas (Azul)</span>
            <span className="bg-blue-200/80 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full">
              {tanquillasConAcceso.length}
            </span>
          </div>

          {/* Transformadores (Anaranjado) */}
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-amber-900 font-semibold">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-orange-700 shadow-xs flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white"></span>
            </span>
            <span>Transformadores (Anaranjado)</span>
            <span className="bg-amber-200/80 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full">
              {transformadoresConAcceso.length}
            </span>
          </div>

          {/* Sin Acceso (Rojo) */}
          <div className="flex items-center gap-2 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-900 font-bold">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-700 shadow-xs flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-white"></span>
            </span>
            <span>Sin Acceso (Rojo)</span>
            <span className="bg-rose-200 text-rose-900 text-[10px] px-1.5 py-0.2 rounded-full">
              {sinAcceso.length}
            </span>
          </div>
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
          
          {/* Top Bar inside Map */}
          <div className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 text-xs font-semibold z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Visor Cartográfico Interactivo UCV</span>
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded ${filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                Todos ({recordsWithCoords.length})
              </button>
              <button
                onClick={() => setFilterType('tanquillas')}
                className={`px-2 py-0.5 rounded ${filterType === 'tanquillas' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                Azul
              </button>
              <button
                onClick={() => setFilterType('transformadores')}
                className={`px-2 py-0.5 rounded ${filterType === 'transformadores' ? 'bg-orange-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                Anaranjado
              </button>
              <button
                onClick={() => setFilterType('sin_acceso')}
                className={`px-2 py-0.5 rounded ${filterType === 'sin_acceso' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:text-white'}`}
              >
                Rojo
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
              const isSinAcceso = rec.tieneAcceso === 'No';
              const isTrafo = rec.tipo === 'Transformador';

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
                      {/* Color dot indicator */}
                      <span 
                        className={`w-3 h-3 rounded-full border shadow-2xs ${
                          isSinAcceso 
                            ? 'bg-rose-500 border-rose-700' 
                            : isTrafo 
                            ? 'bg-orange-500 border-orange-700' 
                            : 'bg-blue-600 border-blue-800'
                        }`}
                        title={isSinAcceso ? 'Sin Acceso (Rojo)' : isTrafo ? 'Transformador (Anaranjado)' : 'Tanquilla (Azul)'}
                      />
                      <span className="font-bold text-xs text-slate-900">{rec.codigoIdentificador}</span>
                    </div>

                    {isSinAcceso ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Sin Acceso
                      </span>
                    ) : (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        isTrafo 
                          ? 'text-amber-700 bg-amber-50 border-amber-200' 
                          : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        {rec.tipo}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5">
                    {rec.direccion}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>{rec.latitud?.toFixed(5)}, {rec.longitud?.toFixed(5)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectRecord(rec);
                      }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Detalle
                    </button>
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

    </div>
  );
};
