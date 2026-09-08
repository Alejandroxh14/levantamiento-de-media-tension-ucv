import React, { useState, useEffect, useRef } from 'react';
import { 
  TipoLevantamiento, 
  OpcionSiNo, 
  CanalItem, 
  EmpalmeItem, 
  ConductorMTItem, 
  EvidenciaFoto, 
  LevantamientoRecord 
} from '../types';
import { saveRecord, saveDraft, getDraft, clearDraft } from '../services/storageService';
import { syncRecordToGoogleSheets, getGoogleSheetsConfig } from '../services/googleSheetsService';
import { processAndCompressImage } from '../utils/imageHelper';
import { 
  MapPin, 
  Navigation, 
  Plus, 
  Trash2, 
  Camera, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  GitBranch, 
  ShieldAlert, 
  Zap, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { UCVLogo } from './UCVLogo';

interface LevantamientoFormProps {
  initialRecord?: LevantamientoRecord | null;
  onRecordSaved: (record: LevantamientoRecord) => void;
  onViewRecords: () => void;
  onCancelEdit?: () => void;
}

export const LevantamientoForm: React.FC<LevantamientoFormProps> = ({
  initialRecord,
  onRecordSaved,
  onViewRecords,
  onCancelEdit,
}) => {
  // Form State
  const [tipo, setTipo] = useState<TipoLevantamiento>('Tanquilla');
  const [existeNombre, setExisteNombre] = useState<OpcionSiNo>('Si');
  const [idPlano, setIdPlano] = useState<string>('');
  const [idNuevo, setIdNuevo] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [latitud, setLatitud] = useState<string>('');
  const [longitud, setLongitud] = useState<string>('');
  const [precisionGPS, setPrecisionGPS] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [tieneAcceso, setTieneAcceso] = useState<OpcionSiNo>('Si');

  // Dinámicos
  const [canales, setCanales] = useState<CanalItem[]>([
    {
      id: `canal_${Date.now()}_1`,
      refTanquilla: '',
      conductores: [
        { id: `cond_${Date.now()}_1`, categoria: 'PLT', calibre: '4/0AWG', cantidad: 3 },
      ],
    },
  ]);

  const [empalmes, setEmpalmes] = useState<EmpalmeItem[]>([
    {
      id: `emp_${Date.now()}_1`,
      tipo: 'PP-PLT',
      cant1: 1,
      dir1: '',
      cant2: 1,
      dir2: '',
    },
  ]);

  // Exclusivo Transformador
  const [tieneProtecciones, setTieneProtecciones] = useState<OpcionSiNo>('No');
  const [obsProtecciones, setObsProtecciones] = useState<string>('');
  const [conductoresMT, setConductoresMT] = useState<ConductorMTItem[]>([
    {
      id: `cmt_${Date.now()}_1`,
      categoria: 'PP',
      calibre: '4/0AWG',
      cantidad: 3,
    },
  ]);

  // Finales
  const [observaciones, setObservaciones] = useState<string>('');
  const [evidencias, setEvidencias] = useState<EvidenciaFoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<EvidenciaFoto | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [draftRecovered, setDraftRecovered] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRecordIntoForm = (record: LevantamientoRecord) => {
    setTipo(record.tipo);
    setExisteNombre(record.existeNombre);
    setIdPlano(record.idPlano || '');
    setIdNuevo(record.idNuevo || '');
    setDireccion(record.direccion);
    setLatitud(record.latitud !== null ? String(record.latitud) : '');
    setLongitud(record.longitud !== null ? String(record.longitud) : '');
    setPrecisionGPS(record.precisionGPS ?? null);
    setTieneAcceso(record.tieneAcceso);
    setCanales(record.canales?.length ? record.canales : []);
    setEmpalmes(record.empalmes?.length ? record.empalmes : []);
    setTieneProtecciones(record.tieneProtecciones || 'No');
    setObsProtecciones(record.obsProtecciones || '');
    setConductoresMT(record.conductoresMT?.length ? record.conductoresMT : []);
    setObservaciones(record.observaciones || '');
    setEvidencias(record.evidencias || []);
    setDraftRecovered(false);
  };

  // Load the selected record when editing; otherwise recover an unfinished draft.
  useEffect(() => {
    if (initialRecord) {
      loadRecordIntoForm(initialRecord);
      return;
    }

    const draft = getDraft();
    if (draft && draft.direccion) {
      if (draft.tipo) setTipo(draft.tipo);
      if (draft.existeNombre) setExisteNombre(draft.existeNombre);
      if (draft.idPlano) setIdPlano(draft.idPlano);
      if (draft.idNuevo) setIdNuevo(draft.idNuevo);
      if (draft.direccion) setDireccion(draft.direccion);
      if (draft.latitud !== undefined && draft.latitud !== null) setLatitud(String(draft.latitud));
      if (draft.longitud !== undefined && draft.longitud !== null) setLongitud(String(draft.longitud));
      if (draft.tieneAcceso) setTieneAcceso(draft.tieneAcceso);
      if (draft.canales && draft.canales.length > 0) setCanales(draft.canales);
      if (draft.empalmes && draft.empalmes.length > 0) setEmpalmes(draft.empalmes);
      if (draft.tieneProtecciones) setTieneProtecciones(draft.tieneProtecciones);
      if (draft.obsProtecciones) setObsProtecciones(draft.obsProtecciones);
      if (draft.conductoresMT && draft.conductoresMT.length > 0) setConductoresMT(draft.conductoresMT);
      if (draft.observaciones) setObservaciones(draft.observaciones);
      setDraftRecovered(true);
    }
  }, [initialRecord]);

  // Auto-save draft on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft({
        tipo,
        existeNombre,
        idPlano,
        idNuevo,
        direccion,
        latitud: latitud ? parseFloat(latitud) : null,
        longitud: longitud ? parseFloat(longitud) : null,
        tieneAcceso,
        canales,
        empalmes,
        tieneProtecciones,
        obsProtecciones,
        conductoresMT,
        observaciones,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [
    tipo,
    existeNombre,
    idPlano,
    idNuevo,
    direccion,
    latitud,
    longitud,
    tieneAcceso,
    canales,
    empalmes,
    tieneProtecciones,
    obsProtecciones,
    conductoresMT,
    observaciones,
  ]);

  // GPS Location Handler
  const obtenerUbicacionGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('La geolocalización no es soportada por este navegador o dispositivo.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitud(position.coords.latitude.toFixed(6));
        setLongitud(position.coords.longitude.toFixed(6));
        setPrecisionGPS(position.coords.accuracy);
        setGpsLoading(false);
      },
      (error) => {
        setGpsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGpsError('Permiso de GPS denegado. Habilita los permisos de ubicación en el navegador.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGpsError('Información de ubicación no disponible. Verifica que el GPS esté activo.');
            break;
          case error.TIMEOUT:
            setGpsError('Tiempo de espera agotado al consultar el GPS.');
            break;
          default:
            setGpsError('Error al capturar coordenadas GPS.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  // Canal handlers
  const agregarCanal = () => {
    const nuevoCanal: CanalItem = {
      id: `canal_${Date.now()}_${canales.length + 1}`,
      refTanquilla: '',
      conductores: [
        { id: `cond_${Date.now()}_1`, categoria: 'PLT', calibre: '4/0AWG', cantidad: 3 },
      ],
    };
    setCanales([...canales, nuevoCanal]);
  };

  const eliminarCanal = (canalId: string) => {
    if (canales.length === 1) {
      // Dejar al menos uno vacío o resetear
      setCanales([{
        id: `canal_${Date.now()}`,
        refTanquilla: '',
        conductores: [{ id: `cond_${Date.now()}`, categoria: 'PLT', calibre: '4/0AWG', cantidad: 1 }],
      }]);
      return;
    }
    setCanales(canales.filter((c) => c.id !== canalId));
  };

  const actualizarRefCanal = (canalId: string, ref: string) => {
    setCanales(
      canales.map((c) => (c.id === canalId ? { ...c, refTanquilla: ref } : c))
    );
  };

  const agregarConductorACanal = (canalId: string) => {
    setCanales(
      canales.map((c) => {
        if (c.id === canalId) {
          const nuevoCond: CanalItem['conductores'][0] = {
            id: `cond_${Date.now()}_${c.conductores.length + 1}`,
            categoria: 'PLT',
            calibre: '4/0AWG',
            cantidad: 3,
          };
          return { ...c, conductores: [...c.conductores, nuevoCond] };
        }
        return c;
      })
    );
  };

  const eliminarConductorDeCanal = (canalId: string, condId: string) => {
    setCanales(
      canales.map((c) => {
        if (c.id === canalId) {
          return {
            ...c,
            conductores: c.conductores.filter((cd) => cd.id !== condId),
          };
        }
        return c;
      })
    );
  };

  const actualizarConductorDeCanal = (
    canalId: string,
    condId: string,
    field: 'categoria' | 'calibre' | 'cantidad',
    value: any
  ) => {
    setCanales(
      canales.map((c) => {
        if (c.id === canalId) {
          return {
            ...c,
            conductores: c.conductores.map((cd) =>
              cd.id === condId ? { ...cd, [field]: value } : cd
            ),
          };
        }
        return c;
      })
    );
  };

  // Empalme handlers
  const agregarEmpalme = () => {
    const nuevoEmpalme: EmpalmeItem = {
      id: `emp_${Date.now()}_${empalmes.length + 1}`,
      tipo: 'PP-PLT',
      cant1: 1,
      dir1: '',
      cant2: 1,
      dir2: '',
    };
    setEmpalmes([...empalmes, nuevoEmpalme]);
  };

  const eliminarEmpalme = (empId: string) => {
    if (empalmes.length === 1) {
      setEmpalmes([]);
      return;
    }
    setEmpalmes(empalmes.filter((e) => e.id !== empId));
  };

  const actualizarEmpalme = (
    empId: string,
    field: keyof EmpalmeItem,
    value: any
  ) => {
    setEmpalmes(
      empalmes.map((e) => (e.id === empId ? { ...e, [field]: value } : e))
    );
  };

  // Conductor MT handlers (Transformador)
  const agregarConductorMT = () => {
    const nuevo: ConductorMTItem = {
      id: `cmt_${Date.now()}_${conductoresMT.length + 1}`,
      categoria: 'PP',
      calibre: '4/0AWG',
      cantidad: 3,
    };
    setConductoresMT([...conductoresMT, nuevo]);
  };

  const eliminarConductorMT = (id: string) => {
    setConductoresMT(conductoresMT.filter((c) => c.id !== id));
  };

  const actualizarConductorMT = (
    id: string,
    field: keyof ConductorMTItem,
    value: any
  ) => {
    setConductoresMT(
      conductoresMT.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Evidencias / Fotos handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    try {
      const fileList: File[] = Array.from(files);
      const processed = await Promise.all(
        fileList.map((file: File) => processAndCompressImage(file, 1600, 1600, 0.82))
      );

      setEvidencias((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error('Error procesando fotos:', err);
      alert('Hubo un inconveniente procesando alguna de las imágenes.');
    } finally {
      setIsProcessingPhotos(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const eliminarFoto = (fotoId: string) => {
    setEvidencias(evidencias.filter((f) => f.id !== fotoId));
  };

  // Reset form
  const resetForm = () => {
    setTipo('Tanquilla');
    setExisteNombre('Si');
    setIdPlano('');
    setIdNuevo('');
    setDireccion('');
    setLatitud('');
    setLongitud('');
    setPrecisionGPS(null);
    setTieneAcceso('Si');
    setCanales([
      {
        id: `canal_${Date.now()}_1`,
        refTanquilla: '',
        conductores: [
          { id: `cond_${Date.now()}_1`, categoria: 'PLT', calibre: '4/0AWG', cantidad: 3 },
        ],
      },
    ]);
    setEmpalmes([
      {
        id: `emp_${Date.now()}_1`,
        tipo: 'PP-PLT',
        cant1: 1,
        dir1: '',
        cant2: 1,
        dir2: '',
      },
    ]);
    setTieneProtecciones('No');
    setObsProtecciones('');
    setConductoresMT([
      {
        id: `cmt_${Date.now()}_1`,
        categoria: 'PP',
        calibre: '4/0AWG',
        cantidad: 3,
      },
    ]);
    setObservaciones('');
    setEvidencias([]);
    clearDraft();
    setDraftRecovered(false);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const codigoIdentificador =
      existeNombre === 'Si'
        ? idPlano.trim() || 'SIN_ID_PLANO'
        : idNuevo.trim() || 'SIN_ID_NUEVO';

    if (!direccion.trim()) {
      alert('Por favor ingresa la dirección o referencia del punto.');
      return;
    }

    setIsSaving(true);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    const newRecord: LevantamientoRecord = {
      id: initialRecord?.id || `lev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tipo,
      fecha: formattedDate,
      timestamp: Date.now(),
      existeNombre,
      idPlano: existeNombre === 'Si' ? idPlano.trim() : undefined,
      idNuevo: existeNombre === 'No' ? idNuevo.trim() : undefined,
      codigoIdentificador,
      direccion: direccion.trim(),
      latitud: latitud ? parseFloat(latitud) : null,
      longitud: longitud ? parseFloat(longitud) : null,
      precisionGPS: precisionGPS,
      tieneAcceso,
      canales: tieneAcceso === 'Si' ? canales : [],
      empalmes: tieneAcceso === 'Si' ? empalmes : [],
      tieneProtecciones: tipo === 'Transformador' && tieneAcceso === 'Si' ? tieneProtecciones : undefined,
      obsProtecciones:
        tipo === 'Transformador' && tieneProtecciones === 'Si' ? obsProtecciones.trim() : undefined,
      conductoresMT:
        tipo === 'Transformador' && tieneAcceso === 'Si' ? conductoresMT : undefined,
      observaciones: observaciones.trim(),
      evidencias,
      sincronizadoGoogleSheets: initialRecord?.sincronizadoGoogleSheets || false,
      createdAt: initialRecord?.createdAt || now.toISOString(),
      updatedAt: now.toISOString(),
    };

    try {
      await saveRecord(newRecord);
      
      // Check if autoSync with Google Sheets is configured
      const gsConfig = getGoogleSheetsConfig();
      if (gsConfig.webhookUrl) {
        syncRecordToGoogleSheets(newRecord).catch((err) =>
          console.warn('Auto-sync a Google Sheets en background:', err)
        );
      }

      onRecordSaved(newRecord);
      setBannerSuccess(`¡Levantamiento de ${tipo} [${codigoIdentificador}] ${initialRecord ? 'actualizado' : 'guardado'} exitosamente!`);
      resetForm();
      onCancelEdit?.();
      
      // Auto dismiss success after 5s
      setTimeout(() => {
        setBannerSuccess(null);
      }, 5000);
    } catch (error) {
      alert('Error al guardar el levantamiento. Por favor intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      
      {/* Draft recovery banner */}
      {draftRecovered && (
        <div className="mb-4 p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>Se restauró tu borrador anterior no guardado.</span>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="text-xs font-semibold text-blue-700 underline hover:text-blue-900 ml-2"
          >
            Descartar borrador
          </button>
        </div>
      )}

      {/* Success banner */}
      {bannerSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl flex items-start justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">{bannerSuccess}</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Almacenado localmente en tu base de datos y listo para exportar a Excel / Google Sheets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onViewRecords}
            className="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Ver en Registros
          </button>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header Title */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          {/* Subtle decorative watermark */}
          <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-6 translate-y-6">
            <UCVLogo className="w-48 h-48 text-slate-900" variant="dark" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center p-1 shadow-md border-2 border-slate-200 flex-shrink-0 overflow-hidden">
                <UCVLogo className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Formulario de Levantamiento MT
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                  Universidad Central de Venezuela • Red de Distribución Eléctrica Campus Universitario
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 self-start sm:self-auto py-1.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpiar Campos
            </button>
            {initialRecord && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onCancelEdit?.();
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 self-start sm:self-auto py-1.5 px-3 rounded-xl border border-amber-200 hover:bg-amber-50 transition"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {/* 1. Tipo de Levantamiento (Tanquilla vs Transformador) */}
          <div className="mt-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Tipo de Levantamiento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`relative flex items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  tipo === 'Tanquilla'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_levantamiento"
                  value="Tanquilla"
                  checked={tipo === 'Tanquilla'}
                  onChange={() => setTipo('Tanquilla')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <Layers className={`w-5 h-5 ${tipo === 'Tanquilla' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm sm:text-base">Tanquilla</span>
                </div>
              </label>

              <label
                className={`relative flex items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  tipo === 'Transformador'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 shadow-sm font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_levantamiento"
                  value="Transformador"
                  checked={tipo === 'Transformador'}
                  onChange={() => setTipo('Transformador')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <Zap className={`w-5 h-5 ${tipo === 'Transformador' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm sm:text-base">Transformador</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Nombre & Identificación */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-base font-bold text-slate-800">Identificación / Nombre</h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              ¿Existe en el plano unifilar / topológico?
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="radio"
                  name="existe_nombre"
                  value="Si"
                  checked={existeNombre === 'Si'}
                  onChange={() => setExisteNombre('Si')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Sí (Existe en plano)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="radio"
                  name="existe_nombre"
                  value="No"
                  checked={existeNombre === 'No'}
                  onChange={() => setExisteNombre('No')}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>No (Elemento nuevo no registrado)</span>
              </label>
            </div>
          </div>

          {existeNombre === 'Si' ? (
            <div className="pt-2 animate-in fade-in">
              <label htmlFor="id_plano" className="block text-xs font-semibold text-slate-700 mb-1">
                ID en el Plano <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id_plano"
                name="id_plano"
                value={idPlano}
                onChange={(e) => setIdPlano(e.target.value)}
                placeholder="Ejemplo: TQ-04, TR-ING-01, TQ-FAU-12"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          ) : (
            <div className="pt-2 animate-in fade-in">
              <label htmlFor="id_nuevo" className="block text-xs font-semibold text-slate-700 mb-1">
                ID Nuevo Asignado <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="id_nuevo"
                name="id_nuevo"
                value={idNuevo}
                onChange={(e) => setIdNuevo(e.target.value)}
                placeholder="Ejemplo: TQ-NUEVA-01, TR-ADD-03"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          )}
        </div>

        {/* 3. Dirección y Ubicación */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-base font-bold text-slate-800">Dirección / Referencia</h2>
          </div>

          <div>
            <label htmlFor="direccion" className="block text-xs font-semibold text-slate-700 mb-1">
              Ubicación dentro del Campus / Referencia Visual <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej. Frente a Escuela de Eléctrica, al lado de la caseta de vigilancia"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            {/* Quick Campus UCV location presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-400">Sugerencias UCV:</span>
              {[
                'Escuela de Ingeniería Eléctrica',
                'Facultad de Ingeniería',
                'Facultad de Arquitectura',
                'Facultad de Ciencias',
                'Paseo Los Ilustres',
                'Plaza Cubierta / Rectorado',
                'Estadio Olímpico',
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setDireccion((prev) => (prev ? `${prev} - ${sug}` : sug))}
                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Coordenadas GPS */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-base font-bold text-slate-800">Coordenadas Geográficas</h2>
            </div>

            {/* GPS capture button */}
            <button
              id="btn_capturar_gps"
              type="button"
              onClick={obtenerUbicacionGPS}
              disabled={gpsLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>{gpsLoading ? 'Capturando GPS...' : '📍 Capturar GPS Actual'}</span>
            </button>
          </div>

          {gpsError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>{gpsError}</span>
            </div>
          )}

          {precisionGPS && (
            <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Coordenadas fijadas con precisión estimada de ±{precisionGPS.toFixed(1)} metros</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latitud" className="block text-xs font-semibold text-slate-700 mb-1">
                Latitud (Grados Decimales)
              </label>
              <input
                type="number"
                step="any"
                id="latitud"
                name="latitud"
                value={latitud}
                onChange={(e) => setLatitud(e.target.value)}
                placeholder="Ejemplo: 10.488350"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              />
            </div>

            <div>
              <label htmlFor="longitud" className="block text-xs font-semibold text-slate-700 mb-1">
                Longitud (Grados Decimales)
              </label>
              <input
                type="number"
                step="any"
                id="longitud"
                name="longitud"
                value={longitud}
                onChange={(e) => setLongitud(e.target.value)}
                placeholder="Ejemplo: -66.890420"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* 4.5 ¿Se tiene acceso? */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              4.5
            </span>
            <h2 className="text-base font-bold text-slate-800">¿Se tiene acceso al interior?</h2>
          </div>

          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-sm font-semibold transition ${
                tieneAcceso === 'Si'
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="tiene_acceso"
                value="Si"
                checked={tieneAcceso === 'Si'}
                onChange={() => setTieneAcceso('Si')}
                className="sr-only"
              />
              <span>Sí, se puede abrir e inspeccionar</span>
            </label>

            <label
              className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-sm font-semibold transition ${
                tieneAcceso === 'No'
                  ? 'border-amber-600 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="tiene_acceso"
                value="No"
                checked={tieneAcceso === 'No'}
                onChange={() => setTieneAcceso('No')}
                className="sr-only"
              />
              <span>No se tiene acceso (Sellada / Inundada / Bloqueada)</span>
            </label>
          </div>
        </div>

        {/* SECCIÓN CONDICIONAL: DETALLES SI TIENE ACCESO */}
        {tieneAcceso === 'Si' && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* 5. Canales y Conductores DINÁMICOS */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Canal y Conductores</h2>
                    <p className="text-xs text-slate-500">
                      Asocia canales y conductores (Categoría / Calibre / Cantidad)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={agregarCanal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Nuevo Canal</span>
                </button>
              </div>

              {/* Lista de Canales */}
              <div className="space-y-4">
                {canales.map((canal, index) => (
                  <div
                    key={canal.id}
                    className="p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold">
                          Canal #{index + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => eliminarCanal(canal.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Eliminar Canal
                      </button>
                    </div>

                    {/* Referencia de tanquilla vecina */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Referencia de Tanquilla o Destino del Canal
                      </label>
                      <input
                        type="text"
                        value={canal.refTanquilla}
                        onChange={(e) => actualizarRefCanal(canal.id, e.target.value)}
                        placeholder="Ej. TQ-01, Hacia Subestación, Hacia Transformador N° 2"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Conductores de este canal */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                          Conductores en Canal #{index + 1}
                        </label>
                        <button
                          type="button"
                          onClick={() => agregarConductorACanal(canal.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Conductor</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {canal.conductores.map((cond) => (
                          <div
                            key={cond.id}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-lg bg-white border border-slate-200 items-end shadow-2xs"
                          >
                            <div className="sm:col-span-4">
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Categoría
                              </label>
                              <select
                                value={cond.categoria}
                                onChange={(e) =>
                                  actualizarConductorDeCanal(canal.id, cond.id, 'categoria', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                              >
                                <option value="PLT">PLT (Plomo)</option>
                                <option value="PP">PP (Polietileno)</option>
                                <option value="OTROS">OTROS</option>
                              </select>
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Calibre
                              </label>
                              <select
                                value={cond.calibre}
                                onChange={(e) =>
                                  actualizarConductorDeCanal(canal.id, cond.id, 'calibre', e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                              >
                                <option value="1/0AWG">1/0 AWG</option>
                                <option value="2/0AWG">2/0 AWG</option>
                                <option value="3/0AWG">3/0 AWG</option>
                                <option value="4/0AWG">4/0 AWG</option>
                                <option value="250MCM">250 MCM</option>
                                <option value="500MCM">500 MCM</option>
                                <option value="350MCM">350 MCM</option>
                                <option value="OTRO">OTRO</option>
                              </select>
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Cantidad
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={cond.cantidad}
                                onChange={(e) =>
                                  actualizarConductorDeCanal(
                                    canal.id,
                                    cond.id,
                                    'cantidad',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                              />
                            </div>

                            <div className="sm:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => eliminarConductorDeCanal(canal.id, cond.id)}
                                title="Eliminar conductor"
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Empalmes DINÁMICOS */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    6
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Empalmes</h2>
                    <p className="text-xs text-slate-500">
                      Indica tipo, cantidad y dirección de cada lado del empalme
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={agregarEmpalme}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Empalme</span>
                </button>
              </div>

              {empalmes.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-xs text-slate-500">No hay empalmes registrados en esta tanquilla.</p>
                  <button
                    type="button"
                    onClick={agregarEmpalme}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Agregar primer empalme
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {empalmes.map((emp, index) => {
                    const partes = (emp.tipo || 'PP-PLT').split('-');
                    const mismoTipo = partes[0] === partes[1];
                    const etiqueta1 = mismoTipo ? `${partes[0]} (Lado 1)` : partes[0];
                    const etiqueta2 = mismoTipo ? `${partes[1]} (Lado 2)` : partes[1];

                    return (
                      <div
                        key={emp.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-bold">
                            Empalme #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => eliminarEmpalme(emp.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>

                        {/* Tipo de empalme selector */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Tipo de Empalme
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {['PP-PLT', 'PLT-PLT', 'PP-PP'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => actualizarEmpalme(emp.id, 'tipo', t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                  emp.tipo === t
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Campos de cada lado */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          
                          {/* Lado 1 */}
                          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                            <span className="text-xs font-bold text-indigo-700">
                              Lado 1: {etiqueta1}
                            </span>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Cantidad
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={emp.cant1}
                                onChange={(e) =>
                                  actualizarEmpalme(emp.id, 'cant1', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Dirección {etiqueta1}
                              </label>
                              <input
                                type="text"
                                value={emp.dir1}
                                onChange={(e) => actualizarEmpalme(emp.id, 'dir1', e.target.value)}
                                placeholder="Ej. hacia TQ-02, Escuela de Eléctrica"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              />
                            </div>
                          </div>

                          {/* Lado 2 */}
                          <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                            <span className="text-xs font-bold text-indigo-700">
                              Lado 2: {etiqueta2}
                            </span>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Cantidad
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={emp.cant2}
                                onChange={(e) =>
                                  actualizarEmpalme(emp.id, 'cant2', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                                Dirección {etiqueta2}
                              </label>
                              <input
                                type="text"
                                value={emp.dir2}
                                onChange={(e) => actualizarEmpalme(emp.id, 'dir2', e.target.value)}
                                placeholder="Ej. hacia Transformador, Caseta Básica"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                              />
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECCIÓN EXCLUSIVA PARA TRANSFORMADOR (Pasos 7 y 8) */}
            {tipo === 'Transformador' && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* 7. Protecciones */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                      7
                    </span>
                    <h2 className="text-base font-bold text-slate-800">Protecciones del Transformador</h2>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      ¿Tiene protecciones visibles / operativas?
                    </label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name="tiene_protecciones"
                          value="Si"
                          checked={tieneProtecciones === 'Si'}
                          onChange={() => setTieneProtecciones('Si')}
                          className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                        />
                        <span>Sí tiene protecciones</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name="tiene_protecciones"
                          value="No"
                          checked={tieneProtecciones === 'No'}
                          onChange={() => setTieneProtecciones('No')}
                          className="w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
                        />
                        <span>No tiene protecciones</span>
                      </label>
                    </div>
                  </div>

                  {tieneProtecciones === 'Si' && (
                    <div className="pt-2 animate-in fade-in">
                      <label htmlFor="obs_protecciones" className="block text-xs font-semibold text-slate-700 mb-1">
                        Observaciones de Protecciones (Tipo de fusible, cortacorrientes, seccionador, etc.)
                      </label>
                      <textarea
                        id="obs_protecciones"
                        name="obs_protecciones"
                        rows={2}
                        value={obsProtecciones}
                        onChange={(e) => setObsProtecciones(e.target.value)}
                        placeholder="Ej. Fusibles seccionadores tipo cortacorriente 15kV / 100A, puesta a tierra en barra de cobre..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 8. Conductores de MT al Transformador */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                        8
                      </span>
                      <h2 className="text-base font-bold text-slate-800">
                        Conductores de MT al Transformador
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={agregarConductorMT}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Conductor</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {conductoresMT.map((cond, idx) => (
                      <div
                        key={cond.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-amber-50/40 border border-amber-200 items-end"
                      >
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Categoría #{idx + 1}
                          </label>
                          <select
                            value={cond.categoria}
                            onChange={(e) => actualizarConductorMT(cond.id, 'categoria', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          >
                            <option value="PLT">PLT (Plomo)</option>
                            <option value="PP">PP (Polietileno)</option>
                            <option value="OTROS">OTROS</option>
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Calibre
                          </label>
                          <select
                            value={cond.calibre}
                            onChange={(e) => actualizarConductorMT(cond.id, 'calibre', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          >
                            <option value="1/0AWG">1/0 AWG</option>
                            <option value="2/0AWG">2/0 AWG</option>
                            <option value="3/0AWG">3/0 AWG</option>
                            <option value="4/0AWG">4/0 AWG</option>
                            <option value="250MCM">250 MCM</option>
                            <option value="500MCM">500 MCM</option>
                            <option value="350MCM">350 MCM</option>
                            <option value="OTRO">OTRO</option>
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={cond.cantidad}
                            onChange={(e) =>
                              actualizarConductorMT(cond.id, 'cantidad', parseInt(e.target.value) || 1)
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => eliminarConductorMT(cond.id)}
                            title="Eliminar"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* NODO FINAL: Observaciones y Evidencias Fotográficas */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
              📌
            </span>
            <h2 className="text-base font-bold text-slate-800">
              Observaciones Finales y Evidencia Fotográfica
            </h2>
          </div>

          <div>
            <label htmlFor="observaciones" className="block text-xs font-semibold text-slate-700 mb-1">
              Observaciones Generales de Campo
            </label>
            <textarea
              id="observaciones"
              name="observaciones"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej. Tapa fracturada, presencia de agua en el fondo, necesidad de achique, conexiones oxidadas..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Fotos Evidencia */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Fotos de Evidencia ({evidencias.length})
                </label>
                {isProcessingPhotos && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Optimizando fotos...
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={isProcessingPhotos}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5 text-blue-600" />
                <span>+ Tomar Foto / Subir Imagen</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {evidencias.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {evidencias.map((foto) => (
                  <div
                    key={foto.id}
                    onClick={() => setPreviewPhotoModal(foto)}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                  >
                    {foto.dataUrl ? (
                      <img
                        src={foto.dataUrl}
                        alt={foto.nombre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                    
                    {/* Hover action overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                      <span className="p-1.5 bg-white/90 text-slate-800 rounded-full shadow">
                        <Eye className="w-4 h-4" />
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarFoto(foto.id);
                      }}
                      className="absolute top-1 right-1 p-1 bg-rose-600/90 text-white rounded-md opacity-90 hover:opacity-100 transition shadow z-10"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] px-1.5 py-0.5 truncate text-center font-mono">
                      {foto.nombre} {foto.size ? `(${(foto.size / 1024).toFixed(0)} KB)` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:bg-slate-50 transition"
              >
                <Camera className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-600 font-medium">
                  Toca para abrir la cámara de tu móvil o adjuntar fotos del punto
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Puedes adjuntar múltiples fotos de tanquillas, cables, empalmes y estado general.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Bar - Sticky at bottom for mobile comfort */}
        <div className="sticky bottom-4 z-30 pt-2">
          <div className="bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-xl border border-slate-700 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
            <div className="text-xs text-slate-300 hidden sm:block">
              Levantamiento: <span className="font-bold text-white">{tipo}</span> | ID:{' '}
              <span className="font-mono font-bold text-blue-300">
                {existeNombre === 'Si' ? idPlano || '(Por definir)' : idNuevo || '(Por definir)'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="submit"
                id="btn_guardar_levantamiento"
                disabled={isSaving}
                className="w-full sm:w-auto flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-blue-200" />
                <span>{isSaving ? 'Guardando...' : 'Guardar Levantamiento y Agregar Otro'}</span>
              </button>
            </div>
          </div>
        </div>

      </form>

      {/* Lightbox / Full Photo Preview Modal */}
      {previewPhotoModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-950/80 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2 truncate">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold truncate">{previewPhotoModal.nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPhotoModal.dataUrl}
                  download={previewPhotoModal.nombre}
                  className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
                >
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-2 flex items-center justify-center bg-black/40 overflow-auto max-h-[75vh]">
              <img
                src={previewPhotoModal.dataUrl}
                alt={previewPhotoModal.nombre}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
