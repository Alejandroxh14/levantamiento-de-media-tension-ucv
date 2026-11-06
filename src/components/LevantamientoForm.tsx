import React, { useState, useEffect, useRef } from 'react';
import { 
  TipoLevantamiento, 
  EstadoLevantamiento,
  ESTADOS_LEVANTAMIENTO,
  getRecordStatus,
  OpcionSiNo, 
  CanalItem, 
  EmpalmeItem, 
  ConductorMTItem, 
  EvidenciaFoto, 
  LevantamientoRecord,
  isTransformacionTipo,
  ConfiguracionBancoPoste,
  TipoConexionPoste,
  FugasAceitePoste,
  CorrosionTanquePoste,
  BushingPrimarioPoste,
  BushingSecundarioPoste,
  NivelAceitePoste,
  TierraTanquePoste,
  PararrayosEstadoFisico,
  PararrayosTierra,
  ProteccionPrimariaTipo,
  PortafusibleEstado,
  AisladorSoporteEstado,
  ConductorSalidaBT,
  ProteccionBT,
  EstadoConexionesBT,
  BajanteEstadoCablePoste,
  TuboProteccionBajante,
  JabalinaBasePoste,
  EstadoConexionTierraPoste,
  MaterialPoste,
  EstadoPoste,
  CrucetasHerrajes,
  AlturaPosteAprox,
  PosteTransformacionData,
  EstadoPlacaCasilla,
  EstadoBreakerPrincipal,
  TipoControlAlumbrado,
  TipoRefrigeracionCasilla,
  CasillaTransformacionData,
  SotanoTransformacionData
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
  X,
  Building2,
  Radio,
  Pencil,
  Shield,
  Activity,
  Check,
  Save,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { UCVLogo } from './UCVLogo';

export const STANDARD_CALIBRES = ['1/0AWG', '2/0AWG', '3/0AWG', '4/0AWG', '250MCM', '350MCM', '500MCM'];

interface LevantamientoFormProps {
  onRecordSaved: (record: LevantamientoRecord) => void;
  onViewRecords: () => void;
  editingRecord?: LevantamientoRecord | null;
  onCancelEdit?: () => void;
}

export const LevantamientoForm: React.FC<LevantamientoFormProps> = ({
  onRecordSaved,
  onViewRecords,
  editingRecord,
  onCancelEdit,
}) => {
  // Form State
  const [tipo, setTipo] = useState<TipoLevantamiento>('Tanquilla');
  const [status, setStatus] = useState<EstadoLevantamiento>('Inspeccionada');
  const [motivoSinAcceso, setMotivoSinAcceso] = useState<string>('');
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

  // Dinámicos (Tanquillas, Sótanos y Casillas)
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

  // Exclusivo Sótano / Casilla / Transformador
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

  // Exclusivo Poste de Transformación (Pasos 5 al 10 de la ficha de Poste)
  // 5. Transformador Aéreo
  const [configuracionBanco, setConfiguracionBanco] = useState<ConfiguracionBancoPoste>('Monofásico (1 unidad)');
  const [configuracionBancoOtro, setConfiguracionBancoOtro] = useState<string>('');
  const [potenciaNominalKva, setPotenciaNominalKva] = useState<string>('25');
  const [potenciaBanco3xKva, setPotenciaBanco3xKva] = useState<string>('');
  const [tensionPrimarioKv, setTensionPrimarioKv] = useState<string>('13.8');
  const [tensionSecundarioKv, setTensionSecundarioKv] = useState<string>('120/240');
  const [conexionPoste, setConexionPoste] = useState<TipoConexionPoste>('Monofásica (F-N o F-F)');
  const [conexionPosteOtro, setConexionPosteOtro] = useState<string>('');
  const [fugasAceite, setFugasAceite] = useState<FugasAceitePoste>('No');
  const [corrosionTanque, setCorrosionTanque] = useState<CorrosionTanquePoste>('Ninguna');
  const [bushingPrimario, setBushingPrimario] = useState<BushingPrimarioPoste>('Bueno');
  const [bushingSecundario, setBushingSecundario] = useState<BushingSecundarioPoste>('Bueno');
  const [nivelAceite, setNivelAceite] = useState<NivelAceitePoste>('Normal');
  const [tierraTanque, setTierraTanque] = useState<TierraTanquePoste>('Conectada y firme');

  // 6. Descargadores de Sobretensiones y Protecciones (Poste)
  const [pararrayosPresente, setPararrayosPresente] = useState<OpcionSiNo>('Si');
  const [pararrayosCantidad, setPararrayosCantidad] = useState<string>('3');
  const [portafusiblesPresente, setPortafusiblesPresente] = useState<OpcionSiNo>('Si');
  const [corrienteFusibleAmp, setCorrienteFusibleAmp] = useState<string>('15A');

  // 7. Sistema de Puesta a Tierra del Poste
  const [bajanteCableVisibleContinuo, setBajanteCableVisibleContinuo] = useState<OpcionSiNo>('Si');
  const [bajanteEstadoCableProteccion, setBajanteEstadoCableProteccion] = useState<string>('Adecuado / Protegido con tubo');
  const [jabalinaORegistroBase, setJabalinaORegistroBase] = useState<string>('SI');
  const [estadoConexionTierra, setEstadoConexionTierra] = useState<string>('Firme y en buen estado');

  // Sótano de Transformación: Sección 5 Transformador (misma que Casilla)
  const [sotanoEstadoPlaca, setSotanoEstadoPlaca] = useState<EstadoPlacaCasilla>('Legible');
  const [sotanoPotenciaNominalKva, setSotanoPotenciaNominalKva] = useState<string>('');
  const [sotanoTensionPrimariaKv, setSotanoTensionPrimariaKv] = useState<string>('13.8');
  const [sotanoTensionSecundariaKv, setSotanoTensionSecundariaKv] = useState<string>('208/120');

  // Exclusivo Casilla de Transformación ("Caseta De Tx")
  const [casillaEstadoPlaca, setCasillaEstadoPlaca] = useState<EstadoPlacaCasilla>('Legible');
  const [casillaPotenciaNominalKva, setCasillaPotenciaNominalKva] = useState<string>('');
  const [casillaTensionPrimariaKv, setCasillaTensionPrimariaKv] = useState<string>('13.8');
  const [casillaTensionSecundariaKv, setCasillaTensionSecundariaKv] = useState<string>('208/120');
  const [casillaTipoRefrigeracion, setCasillaTipoRefrigeracion] = useState<TipoRefrigeracionCasilla>('Sumergido en aceite');
  const [casillaTieneProtecciones, setCasillaTieneProtecciones] = useState<OpcionSiNo>('Si');
  const [casillaObsProtecciones, setCasillaObsProtecciones] = useState<string>('');
  const [casillaBreakerCapacidadA, setCasillaBreakerCapacidadA] = useState<string>('');
  const [casillaBreakerEstado, setCasillaBreakerEstado] = useState<EstadoBreakerPrincipal>('Operativo');
  const [casillaTipoControlAlumbrado, setCasillaTipoControlAlumbrado] = useState<TipoControlAlumbrado>('Fotocelda');
  const [casillaObsTableroBT, setCasillaObsTableroBT] = useState<string>('');

  // Finales
  const [observaciones, setObservaciones] = useState<string>('');
  const [evidencias, setEvidencias] = useState<EvidenciaFoto[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState<boolean>(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<EvidenciaFoto | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [draftRecovered, setDraftRecovered] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load editing record or draft on mount / editingRecord change
  useEffect(() => {
    if (editingRecord) {
      const rawTipo = editingRecord.tipo;
      const mappedTipo: TipoLevantamiento = rawTipo === 'Transformador' ? 'SÓTANO DE TRANSFORMACIÓN' : rawTipo;
      setTipo(mappedTipo);
      setExisteNombre(editingRecord.existeNombre || 'Si');
      setIdPlano(editingRecord.idPlano || '');
      setIdNuevo(editingRecord.idNuevo || '');
      setDireccion(editingRecord.direccion || '');
      setLatitud(editingRecord.latitud !== null && editingRecord.latitud !== undefined ? String(editingRecord.latitud) : '');
      setLongitud(editingRecord.longitud !== null && editingRecord.longitud !== undefined ? String(editingRecord.longitud) : '');
      setPrecisionGPS(editingRecord.precisionGPS ?? null);
      setTieneAcceso(editingRecord.tieneAcceso || 'Si');
      
      if (editingRecord.canales && editingRecord.canales.length > 0) {
        setCanales(JSON.parse(JSON.stringify(editingRecord.canales)));
      } else {
        setCanales([{
          id: `canal_${Date.now()}_1`,
          refTanquilla: '',
          conductores: [{ id: `cond_${Date.now()}_1`, categoria: 'PLT', calibre: '4/0AWG', cantidad: 3 }]
        }]);
      }

      if (editingRecord.empalmes && editingRecord.empalmes.length > 0) {
        setEmpalmes(JSON.parse(JSON.stringify(editingRecord.empalmes)));
      } else {
        setEmpalmes([{
          id: `emp_${Date.now()}_1`,
          tipo: 'PP-PLT',
          cant1: 1,
          dir1: '',
          cant2: 1,
          dir2: ''
        }]);
      }

      setTieneProtecciones(editingRecord.tieneProtecciones || 'No');
      setObsProtecciones(editingRecord.obsProtecciones || '');

      if (editingRecord.conductoresMT && editingRecord.conductoresMT.length > 0) {
        setConductoresMT(JSON.parse(JSON.stringify(editingRecord.conductoresMT)));
      } else {
        setConductoresMT([{
          id: `cmt_${Date.now()}_1`,
          categoria: 'PP',
          calibre: '4/0AWG',
          cantidad: 3
        }]);
      }

      if (editingRecord.posteData) {
        const pd = editingRecord.posteData;
        setConfiguracionBanco(pd.configuracionBanco || 'Monofásico (1 unidad)');
        setConfiguracionBancoOtro(pd.configuracionBancoOtro || '');
        setPotenciaNominalKva(pd.potenciaNominalKva || '');
        setPotenciaBanco3xKva(pd.potenciaBanco3xKva || '');
        setTensionPrimarioKv(pd.tensionPrimarioKv || '13.8');
        setTensionSecundarioKv(pd.tensionSecundarioKv || '120/240');
        setConexionPoste(pd.conexion || 'Monofásica (F-N o F-F)');
        setConexionPosteOtro(pd.conexionOtro || '');
        setFugasAceite(pd.fugasAceite || 'No');
        setCorrosionTanque(pd.corrosionTanque || 'Ninguna');
        setBushingPrimario(pd.bushingPrimario || 'Bueno');
        setBushingSecundario(pd.bushingSecundario || 'Bueno');
        setNivelAceite(pd.nivelAceite || 'Normal');
        setTierraTanque(pd.tierraTanque || 'Conectada y firme');

        setPararrayosPresente(pd.pararrayosPresente || 'Si');
        setPararrayosCantidad(pd.pararrayosCantidad || '3');
        setPortafusiblesPresente(pd.portafusiblesPresente || 'Si');
        setCorrienteFusibleAmp(pd.corrienteFusibleAmp || pd.capacidadFusibleAmp || '15A');

        setBajanteCableVisibleContinuo(pd.bajanteCableVisibleContinuo || 'Si');
        setBajanteEstadoCableProteccion(pd.bajanteEstadoCableProteccion || 'Adecuado / Protegido con tubo');
        setJabalinaORegistroBase(pd.jabalinaORegistroBase || 'SI');
        setEstadoConexionTierra(pd.estadoConexionTierra || 'Firme y en buen estado');
      }

      if (editingRecord.casillaData) {
        const cd = editingRecord.casillaData;
        setCasillaEstadoPlaca(cd.estadoPlaca || 'Legible');
        setCasillaPotenciaNominalKva(cd.potenciaNominalKva || '');
        setCasillaTensionPrimariaKv(cd.tensionPrimariaKv || '13.8');
        setCasillaTensionSecundariaKv(cd.tensionSecundariaKv || '208/120');
        setCasillaTipoRefrigeracion((cd.tipoRefrigeracion as TipoRefrigeracionCasilla) || 'Sumergido en aceite');
        setCasillaTieneProtecciones(cd.tieneProtecciones || 'Si');
        setCasillaObsProtecciones(cd.obsProtecciones || '');
        setCasillaBreakerCapacidadA(cd.breakerCapacidadA || '');
        setCasillaBreakerEstado(cd.breakerEstado || 'Operativo');
        setCasillaTipoControlAlumbrado(cd.tipoControlAlumbrado || 'Fotocelda');
        setCasillaObsTableroBT(cd.obsTableroBT || '');
      }

        setObservaciones(editingRecord.observaciones || '');
      setEvidencias(editingRecord.evidencias ? JSON.parse(JSON.stringify(editingRecord.evidencias)) : []);
      if (editingRecord.sotanoData) {
        const sd = editingRecord.sotanoData;
        setSotanoEstadoPlaca(sd.estadoPlaca || 'Legible');
        setSotanoPotenciaNominalKva(sd.potenciaNominalKva || '');
        setSotanoTensionPrimariaKv(sd.tensionPrimariaKv || '13.8');
        setSotanoTensionSecundariaKv(sd.tensionSecundariaKv || '208/120');
      }
      setDraftRecovered(false);
      return;
    }

    // Load draft if not editing
    const draft = getDraft();
    if (draft && draft.direccion) {
      if (draft.tipo) {
        setTipo(draft.tipo === 'Transformador' ? 'SÓTANO DE TRANSFORMACIÓN' : draft.tipo);
      }
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
      if ((draft as any).sotanoData) {
        const sd = (draft as any).sotanoData;
        if (sd.estadoPlaca) setSotanoEstadoPlaca(sd.estadoPlaca);
        if (sd.potenciaNominalKva) setSotanoPotenciaNominalKva(sd.potenciaNominalKva);
        if (sd.tensionPrimariaKv) setSotanoTensionPrimariaKv(sd.tensionPrimariaKv);
        if (sd.tensionSecundariaKv) setSotanoTensionSecundariaKv(sd.tensionSecundariaKv);
      }
      if ((draft as any).posteData) {
        const pd = (draft as any).posteData;
        if (pd.configuracionBanco) setConfiguracionBanco(pd.configuracionBanco);
        if (pd.configuracionBancoOtro) setConfiguracionBancoOtro(pd.configuracionBancoOtro);
        if (pd.potenciaNominalKva) setPotenciaNominalKva(pd.potenciaNominalKva);
        if (pd.potenciaBanco3xKva) setPotenciaBanco3xKva(pd.potenciaBanco3xKva);
        if (pd.tensionPrimarioKv) setTensionPrimarioKv(pd.tensionPrimarioKv);
        if (pd.tensionSecundarioKv) setTensionSecundarioKv(pd.tensionSecundarioKv);
        if (pd.conexion) setConexionPoste(pd.conexion);
        if (pd.conexionOtro) setConexionPosteOtro(pd.conexionOtro);
        if (pd.fugasAceite) setFugasAceite(pd.fugasAceite);
        if (pd.corrosionTanque) setCorrosionTanque(pd.corrosionTanque);
        if (pd.bushingPrimario) setBushingPrimario(pd.bushingPrimario);
        if (pd.bushingSecundario) setBushingSecundario(pd.bushingSecundario);
        if (pd.nivelAceite) setNivelAceite(pd.nivelAceite);
        if (pd.tierraTanque) setTierraTanque(pd.tierraTanque);

        if (pd.pararrayosPresente) setPararrayosPresente(pd.pararrayosPresente);
        if (pd.pararrayosCantidad) setPararrayosCantidad(pd.pararrayosCantidad);
        if (pd.portafusiblesPresente) setPortafusiblesPresente(pd.portafusiblesPresente);
        if (pd.corrienteFusibleAmp) setCorrienteFusibleAmp(pd.corrienteFusibleAmp);
        else if (pd.capacidadFusibleAmp) setCorrienteFusibleAmp(pd.capacidadFusibleAmp);

        if (pd.bajanteCableVisibleContinuo) setBajanteCableVisibleContinuo(pd.bajanteCableVisibleContinuo);
        if (pd.bajanteEstadoCableProteccion) setBajanteEstadoCableProteccion(pd.bajanteEstadoCableProteccion);
        if (pd.jabalinaORegistroBase) setJabalinaORegistroBase(pd.jabalinaORegistroBase);
        if (pd.estadoConexionTierra) setEstadoConexionTierra(pd.estadoConexionTierra);
      }

      if ((draft as any).casillaData) {
        const cd = (draft as any).casillaData;
        if (cd.estadoPlaca) setCasillaEstadoPlaca(cd.estadoPlaca);
        if (cd.potenciaNominalKva) setCasillaPotenciaNominalKva(cd.potenciaNominalKva);
        if (cd.tensionPrimariaKv) setCasillaTensionPrimariaKv(cd.tensionPrimariaKv);
        if (cd.tensionSecundariaKv) setCasillaTensionSecundariaKv(cd.tensionSecundariaKv);
        if (cd.tipoRefrigeracion) setCasillaTipoRefrigeracion(cd.tipoRefrigeracion);
        if (cd.tieneProtecciones) setCasillaTieneProtecciones(cd.tieneProtecciones);
        if (cd.obsProtecciones) setCasillaObsProtecciones(cd.obsProtecciones);
        if (cd.breakerCapacidadA) setCasillaBreakerCapacidadA(cd.breakerCapacidadA);
        if (cd.breakerEstado) setCasillaBreakerEstado(cd.breakerEstado);
        if (cd.tipoControlAlumbrado) setCasillaTipoControlAlumbrado(cd.tipoControlAlumbrado);
        if (cd.obsTableroBT) setCasillaObsTableroBT(cd.obsTableroBT);
      }

      if (draft.observaciones) setObservaciones(draft.observaciones);
      setDraftRecovered(true);
    }
  }, [editingRecord]);

  // Auto-save draft on changes (only when not in edit mode)
  useEffect(() => {
    if (editingRecord) return;
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
        posteData: {
          configuracionBanco,
          configuracionBancoOtro,
          potenciaNominalKva,
          potenciaBanco3xKva,
          tensionPrimarioKv,
          tensionSecundarioKv,
          conexion: conexionPoste,
          conexionOtro: conexionPosteOtro,
          fugasAceite,
          corrosionTanque,
          bushingPrimario,
          bushingSecundario,
          nivelAceite,
          tierraTanque,

          pararrayosPresente,
          pararrayosCantidad,
          portafusiblesPresente,
          corrienteFusibleAmp,

          bajanteCableVisibleContinuo,
          bajanteEstadoCableProteccion,
          jabalinaORegistroBase,
          estadoConexionTierra,
        },
        sotanoData: {
          estadoPlaca: sotanoEstadoPlaca,
          potenciaNominalKva: sotanoPotenciaNominalKva,
          tensionPrimariaKv: sotanoTensionPrimariaKv,
          tensionSecundariaKv: sotanoTensionSecundariaKv,
        },
        casillaData: {
          estadoPlaca: casillaEstadoPlaca,
          potenciaNominalKva: casillaPotenciaNominalKva,
          tensionPrimariaKv: casillaTensionPrimariaKv,
          tensionSecundariaKv: casillaTensionSecundariaKv,
          tipoRefrigeracion: casillaTipoRefrigeracion,
          tieneProtecciones: casillaTieneProtecciones,
          obsProtecciones: casillaObsProtecciones,
          breakerCapacidadA: casillaBreakerCapacidadA,
          breakerEstado: casillaBreakerEstado,
          tipoControlAlumbrado: casillaTipoControlAlumbrado,
          obsTableroBT: casillaObsTableroBT,
        },
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
    sotanoEstadoPlaca,
    sotanoPotenciaNominalKva,
    sotanoTensionPrimariaKv,
    sotanoTensionSecundariaKv,
    configuracionBanco,
    configuracionBancoOtro,
    potenciaNominalKva,
    potenciaBanco3xKva,
    tensionPrimarioKv,
    tensionSecundarioKv,
    conexionPoste,
    conexionPosteOtro,
    fugasAceite,
    corrosionTanque,
    bushingPrimario,
    bushingSecundario,
    nivelAceite,
    tierraTanque,
    pararrayosPresente,
    pararrayosCantidad,
    portafusiblesPresente,
    corrienteFusibleAmp,
    bajanteCableVisibleContinuo,
    bajanteEstadoCableProteccion,
    jabalinaORegistroBase,
    estadoConexionTierra,
    casillaEstadoPlaca,
    casillaPotenciaNominalKva,
    casillaTensionPrimariaKv,
    casillaTensionSecundariaKv,
    casillaTipoRefrigeracion,
    casillaTieneProtecciones,
    casillaObsProtecciones,
    casillaBreakerCapacidadA,
    casillaBreakerEstado,
    casillaTipoControlAlumbrado,
    casillaObsTableroBT,
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
    if (editingRecord && onCancelEdit) {
      onCancelEdit();
      return;
    }
    setTipo('Tanquilla');
    setStatus('Inspeccionada');
    setMotivoSinAcceso('');
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
    setConfiguracionBanco('Monofásico (1 unidad)');
    setConfiguracionBancoOtro('');
    setPotenciaNominalKva('25');
    setPotenciaBanco3xKva('');
    setTensionPrimarioKv('13.8');
    setTensionSecundarioKv('120/240');
    setConexionPoste('Monofásica (F-N o F-F)');
    setConexionPosteOtro('');
    setFugasAceite('No');
    setCorrosionTanque('Ninguna');
    setBushingPrimario('Bueno');
    setBushingSecundario('Bueno');
    setNivelAceite('Normal');
    setTierraTanque('Conectada y firme');
    setPararrayosPresente('Si');
    setPararrayosCantidad('3');
    setPortafusiblesPresente('Si');
    setCorrienteFusibleAmp('15A');
    setBajanteCableVisibleContinuo('Si');
    setBajanteEstadoCableProteccion('Adecuado / Protegido con tubo');
    setJabalinaORegistroBase('SI');
    setEstadoConexionTierra('Firme y en buen estado');
    setCasillaEstadoPlaca('Legible');
    setCasillaPotenciaNominalKva('');
    setCasillaTensionPrimariaKv('13.8');
    setCasillaTensionSecundariaKv('208/120');
    setCasillaTipoRefrigeracion('Sumergido en aceite');
    setCasillaTieneProtecciones('Si');
    setCasillaObsProtecciones('');
    setCasillaBreakerCapacidadA('');
    setCasillaBreakerEstado('Operativo');
    setCasillaTipoControlAlumbrado('Fotocelda');
    setCasillaObsTableroBT('');
    setSotanoEstadoPlaca('Legible');
    setSotanoPotenciaNominalKva('');
    setSotanoTensionPrimariaKv('13.8');
    setSotanoTensionSecundariaKv('208/120');
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

    // If status is 'Sin acceso', enforce tieneAcceso = 'No'
    const computedTieneAcceso: OpcionSiNo = status === 'Sin acceso' ? 'No' : tieneAcceso;

    // Objeto específico para Sótano de Transformación
    const sotanoDataToSave: SotanoTransformacionData | undefined =
      (tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador') && computedTieneAcceso === 'Si'
        ? {
            estadoPlaca: sotanoEstadoPlaca,
            potenciaNominalKva: sotanoPotenciaNominalKva.trim() || undefined,
            tensionPrimariaKv: sotanoTensionPrimariaKv.trim() || undefined,
            tensionSecundariaKv: sotanoTensionSecundariaKv.trim() || undefined,
          }
        : undefined;

    // Objeto específico para Poste de Transformación
    const posteDataToSave: PosteTransformacionData | undefined =
      tipo === 'POSTE DE TRANSFORMACIÓN' && computedTieneAcceso === 'Si'
        ? {
            configuracionBanco,
            configuracionBancoOtro: configuracionBanco === 'Otro' ? configuracionBancoOtro.trim() : undefined,
            potenciaNominalKva: potenciaNominalKva.trim(),
            potenciaBanco3xKva: potenciaBanco3xKva.trim() || undefined,
            tensionPrimarioKv: tensionPrimarioKv.trim(),
            tensionSecundarioKv: tensionSecundarioKv.trim(),
            conexion: conexionPoste,
            conexionOtro: conexionPoste === 'Otro' ? conexionPosteOtro.trim() : undefined,
            fugasAceite,
            corrosionTanque,
            bushingPrimario,
            bushingSecundario,
            nivelAceite,
            tierraTanque,

            pararrayosPresente,
            pararrayosCantidad: pararrayosPresente === 'Si' ? pararrayosCantidad : undefined,
            portafusiblesPresente,
            corrienteFusibleAmp: portafusiblesPresente === 'Si' ? corrienteFusibleAmp.trim() : undefined,

            bajanteCableVisibleContinuo,
            bajanteEstadoCableProteccion,
            jabalinaORegistroBase,
            estadoConexionTierra,
          }
        : undefined;

    // Objeto específico para Casilla de Transformación ("Caseta De Tx")
    const casillaDataToSave: CasillaTransformacionData | undefined =
      tipo === 'CASILLA DE TRANSFORMACIÓN' && computedTieneAcceso === 'Si'
        ? {
            estadoPlaca: casillaEstadoPlaca,
            potenciaNominalKva: casillaPotenciaNominalKva.trim() || undefined,
            tensionPrimariaKv: casillaTensionPrimariaKv.trim() || undefined,
            tensionSecundariaKv: casillaTensionSecundariaKv.trim() || undefined,
            tipoRefrigeracion: casillaTipoRefrigeracion,
            tieneProtecciones: casillaTieneProtecciones,
            obsProtecciones: casillaTieneProtecciones === 'Si' ? casillaObsProtecciones.trim() : undefined,
            breakerCapacidadA: casillaBreakerCapacidadA.trim() || undefined,
            breakerEstado: casillaBreakerEstado,
            tipoControlAlumbrado: casillaTipoControlAlumbrado,
            obsTableroBT: casillaObsTableroBT.trim() || undefined,
          }
        : undefined;

    const recordToSave: LevantamientoRecord = editingRecord
      ? {
          ...editingRecord,
          tipo,
          status,
          motivoSinAcceso: status === 'Sin acceso' ? motivoSinAcceso.trim() : undefined,
          existeNombre,
          idPlano: existeNombre === 'Si' ? idPlano.trim() : undefined,
          idNuevo: existeNombre === 'No' ? idNuevo.trim() : undefined,
          codigoIdentificador,
          direccion: direccion.trim(),
          latitud: latitud ? parseFloat(latitud) : null,
          longitud: longitud ? parseFloat(longitud) : null,
          precisionGPS: precisionGPS,
          tieneAcceso: computedTieneAcceso,
          canales: computedTieneAcceso === 'Si' ? canales : [],
          empalmes: computedTieneAcceso === 'Si' && tipo !== 'POSTE DE TRANSFORMACIÓN' && tipo !== 'CASILLA DE TRANSFORMACIÓN' ? empalmes : [],
          tieneProtecciones:
            tipo === 'CASILLA DE TRANSFORMACIÓN'
              ? casillaTieneProtecciones
              : isTransformacionTipo(tipo) && tipo !== 'POSTE DE TRANSFORMACIÓN' && computedTieneAcceso === 'Si'
              ? tieneProtecciones
              : undefined,
          obsProtecciones:
            tipo === 'CASILLA DE TRANSFORMACIÓN'
              ? casillaTieneProtecciones === 'Si' ? casillaObsProtecciones.trim() : undefined
              : isTransformacionTipo(tipo) && tipo !== 'POSTE DE TRANSFORMACIÓN' && tieneProtecciones === 'Si'
              ? obsProtecciones.trim()
              : undefined,
          conductoresMT:
            computedTieneAcceso === 'Si' && (tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'CASILLA DE TRANSFORMACIÓN' || tipo === 'Transformador')
              ? conductoresMT
              : undefined,
          posteData: posteDataToSave,
          casillaData: casillaDataToSave,
          sotanoData: sotanoDataToSave,
          observaciones: observaciones.trim(),
          evidencias,
          updatedAt: now.toISOString(),
        }
      : {
          id: `lev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tipo,
          status,
          motivoSinAcceso: status === 'Sin acceso' ? motivoSinAcceso.trim() : undefined,
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
          tieneAcceso: computedTieneAcceso,
          canales: computedTieneAcceso === 'Si' ? canales : [],
          empalmes: computedTieneAcceso === 'Si' && tipo !== 'POSTE DE TRANSFORMACIÓN' && tipo !== 'CASILLA DE TRANSFORMACIÓN' ? empalmes : [],
          tieneProtecciones:
            tipo === 'CASILLA DE TRANSFORMACIÓN'
              ? casillaTieneProtecciones
              : isTransformacionTipo(tipo) && tipo !== 'POSTE DE TRANSFORMACIÓN' && computedTieneAcceso === 'Si'
              ? tieneProtecciones
              : undefined,
          obsProtecciones:
            tipo === 'CASILLA DE TRANSFORMACIÓN'
              ? casillaTieneProtecciones === 'Si' ? casillaObsProtecciones.trim() : undefined
              : isTransformacionTipo(tipo) && tipo !== 'POSTE DE TRANSFORMACIÓN' && tieneProtecciones === 'Si'
              ? obsProtecciones.trim()
              : undefined,
          conductoresMT:
            computedTieneAcceso === 'Si' && (tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'CASILLA DE TRANSFORMACIÓN' || tipo === 'Transformador')
              ? conductoresMT
              : undefined,
          posteData: posteDataToSave,
          casillaData: casillaDataToSave,
          sotanoData: sotanoDataToSave,
          observaciones: observaciones.trim(),
          evidencias,
          sincronizadoGoogleSheets: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };

    try {
      await saveRecord(recordToSave);
      
      // Check if autoSync with Google Sheets is configured
      const gsConfig = getGoogleSheetsConfig();
      if (gsConfig.webhookUrl) {
        syncRecordToGoogleSheets(recordToSave).catch((err) =>
          console.warn('Auto-sync a Google Sheets en background:', err)
        );
      }

      onRecordSaved(recordToSave);
      setBannerSuccess(
        editingRecord
          ? `¡Levantamiento [${codigoIdentificador}] actualizado exitosamente en su totalidad!`
          : `¡Levantamiento de ${tipo} [${codigoIdentificador}] guardado exitosamente!`
      );
      
      if (editingRecord) {
        if (onCancelEdit) onCancelEdit();
      } else {
        resetForm();
      }
      
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

  const renderSeccionCanalYConductores = (seccionNumero: string | number) => (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {seccionNumero}
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
                        value={STANDARD_CALIBRES.includes(cond.calibre) ? cond.calibre : 'OTROS'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'OTROS') {
                            actualizarConductorDeCanal(
                              canal.id,
                              cond.id,
                              'calibre',
                              STANDARD_CALIBRES.includes(cond.calibre) ? 'OTROS' : cond.calibre
                            );
                          } else {
                            actualizarConductorDeCanal(canal.id, cond.id, 'calibre', val);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-slate-50 focus:bg-white"
                      >
                        <option value="1/0AWG">1/0 AWG</option>
                        <option value="2/0AWG">2/0 AWG</option>
                        <option value="3/0AWG">3/0 AWG</option>
                        <option value="4/0AWG">4/0 AWG</option>
                        <option value="250MCM">250 MCM</option>
                        <option value="350MCM">350 MCM</option>
                        <option value="500MCM">500 MCM</option>
                        <option value="OTROS">OTROS (Especificar...)</option>
                      </select>

                      {/* Input para especificar calibre cuando se selecciona OTROS */}
                      {(!STANDARD_CALIBRES.includes(cond.calibre) || cond.calibre === 'OTROS' || cond.calibre === 'OTRO') && (
                        <div className="mt-1.5 animate-in fade-in">
                          <input
                            type="text"
                            value={cond.calibre === 'OTROS' || cond.calibre === 'OTRO' ? '' : cond.calibre}
                            onChange={(e) =>
                              actualizarConductorDeCanal(canal.id, cond.id, 'calibre', e.target.value)
                            }
                            placeholder="Especificar calibre (ej. 750 MCM, 2 AWG, etc.)"
                            className="w-full px-2.5 py-1 rounded-md border-2 border-blue-400 bg-white text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs"
                          />
                        </div>
                      )}
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
  );

  return (
    <div className="max-w-4xl mx-auto pb-24">
      
      {/* Editing mode banner */}
      {editingRecord && (
        <div className="mb-5 p-4 sm:p-5 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-200 text-amber-900 rounded-xl flex-shrink-0">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  Modo Edición Total: {editingRecord.codigoIdentificador}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200 text-amber-900 border border-amber-300">
                  {editingRecord.tipo}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                Puedes editar libremente cualquier dato: tipo, ubicación, coordenadas, canales, calibres, empalmes, protecciones y fotos.
              </p>
            </div>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition shadow-2xs self-start sm:self-auto"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      )}

      {/* Draft recovery banner */}
      {draftRecovered && !editingRecord && (
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
                  {editingRecord ? 'Editar Levantamiento MT' : 'Formulario de Levantamiento MT'}
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
              {editingRecord ? 'Restablecer Valores' : 'Limpiar Campos'}
            </button>
          </div>

          {/* 1. Tipo de Levantamiento (4 opciones: Tanquilla, Sótano de Transf, Casilla de Transf, Poste de Transf) */}
          <div className="mt-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
              1. Tipo de Levantamiento / Estructura
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tanquilla */}
              <label
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  tipo === 'Tanquilla'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-sm font-semibold'
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
                <div className="flex items-center gap-2 mb-1">
                  <Layers className={`w-5 h-5 ${tipo === 'Tanquilla' ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold">TANQUILLA</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">Cámara subterránea de paso</span>
              </label>

              {/* Sótano de Transformación */}
              <label
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador'
                    ? 'border-amber-600 bg-amber-50/70 text-amber-900 shadow-sm font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_levantamiento"
                  value="SÓTANO DE TRANSFORMACIÓN"
                  checked={tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador'}
                  onChange={() => setTipo('SÓTANO DE TRANSFORMACIÓN')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-5 h-5 ${tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold">SÓTANO DE TRANSFORMACIÓN</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">Bóveda subterránea de transformación</span>
              </label>

              {/* Casilla de Transformación */}
              <label
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  tipo === 'CASILLA DE TRANSFORMACIÓN'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-sm font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_levantamiento"
                  value="CASILLA DE TRANSFORMACIÓN"
                  checked={tipo === 'CASILLA DE TRANSFORMACIÓN'}
                  onChange={() => setTipo('CASILLA DE TRANSFORMACIÓN')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className={`w-5 h-5 ${tipo === 'CASILLA DE TRANSFORMACIÓN' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold">CASILLA DE TRANSFORMACIÓN</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">Caseta en superficie / kiosco</span>
              </label>

              {/* Poste de Transformación */}
              <label
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  tipo === 'POSTE DE TRANSFORMACIÓN'
                    ? 'border-teal-600 bg-teal-50/70 text-teal-900 shadow-sm font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="tipo_levantamiento"
                  value="POSTE DE TRANSFORMACIÓN"
                  checked={tipo === 'POSTE DE TRANSFORMACIÓN'}
                  onChange={() => setTipo('POSTE DE TRANSFORMACIÓN')}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-1">
                  <svg className={`w-5 h-5 ${tipo === 'POSTE DE TRANSFORMACIÓN' ? 'text-teal-600' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M5 6h14M7 11h10" />
                  </svg>
                  <span className="text-sm font-bold">POSTE DE TRANSFORMACIÓN</span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">Transformador aéreo en poste</span>
              </label>
            </div>
          </div>
        </div>

        {/* Estado del Levantamiento (Gestión de Estados) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                E
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Estado del Levantamiento
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Atributo de estado asignado manualmente por el usuario o administrador
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${ESTADOS_LEVANTAMIENTO[status]?.badgeClass || 'bg-slate-100 text-slate-700 border-slate-300'}`}>
              <span className={`w-2 h-2 rounded-full ${ESTADOS_LEVANTAMIENTO[status]?.bgLight || 'bg-slate-400'}`} />
              {status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Inspeccionada */}
            <div
              onClick={() => {
                setStatus('Inspeccionada');
                setTieneAcceso('Si');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                status === 'Inspeccionada'
                  ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-400'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Inspeccionada
                  </span>
                  {status === 'Inspeccionada' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed">
                  El levantamiento ha sido ejecutado y validado en campo.
                </p>
              </div>
            </div>

            {/* 2. Por inspeccionar */}
            <div
              onClick={() => {
                setStatus('Por inspeccionar');
                setTieneAcceso('Si');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                status === 'Por inspeccionar'
                  ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-1 ring-amber-400'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    Por inspeccionar
                  </span>
                  {status === 'Por inspeccionar' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-amber-800/90 leading-relaxed">
                  El punto o tramo está registrado o asignado, pero aún no se ha realizado la inspección.
                </p>
              </div>
            </div>

            {/* 3. Sin acceso */}
            <div
              onClick={() => {
                setStatus('Sin acceso');
                setTieneAcceso('No');
              }}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                status === 'Sin acceso'
                  ? 'border-rose-500 bg-rose-50/70 shadow-sm ring-1 ring-rose-400'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    Sin acceso
                  </span>
                  {status === 'Sin acceso' && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-rose-800/90 leading-relaxed">
                  Sin acceso al punto o infraestructura (condición especial en campo).
                </p>
              </div>
            </div>
          </div>

          {status === 'Sin acceso' && (
            <div className="pt-2 animate-in fade-in">
              <label htmlFor="motivo_sin_acceso" className="block text-xs font-semibold text-rose-800 mb-1">
                Motivo / Justificación de Falta de Acceso (Opcional)
              </label>
              <input
                type="text"
                id="motivo_sin_acceso"
                value={motivoSinAcceso}
                onChange={(e) => setMotivoSinAcceso(e.target.value)}
                placeholder="Ej. Tapa con candado sin llave, cámara anegada, cerca cerrada con candado..."
                className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-900 text-xs focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
            </div>
          )}
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

        {/* 4.5 ¿Se tiene acceso / es inspeccionable? */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              4.5
            </span>
            <h2 className="text-base font-bold text-slate-800">
              {tipo === 'POSTE DE TRANSFORMACIÓN'
                ? '¿Es accesible e inspeccionable el poste y transformador?'
                : '¿Se tiene acceso al interior?'}
            </h2>
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
                onChange={() => {
                  setTieneAcceso('Si');
                  if (status === 'Sin acceso') setStatus('Inspeccionada');
                }}
                className="sr-only"
              />
              <span>
                {tipo === 'POSTE DE TRANSFORMACIÓN'
                  ? 'Sí, es accesible e inspeccionable'
                  : 'Sí, se puede abrir e inspeccionar'}
              </span>
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
                onChange={() => {
                  setTieneAcceso('No');
                  setStatus('Sin acceso');
                }}
                className="sr-only"
              />
              <span>
                {tipo === 'POSTE DE TRANSFORMACIÓN'
                  ? 'No es accesible (Sin paso / Cercado / Bloqueado)'
                  : 'No se tiene acceso (Sellada / Inundada / Bloqueada)'}
              </span>
            </label>
          </div>
        </div>

        {/* SECCIÓN CONDICIONAL: DETALLES SI TIENE ACCESO */}
        {tieneAcceso === 'Si' && (
          <div className="space-y-6 animate-in fade-in">

            {/* 5. Transformador (Exclusivo para Sótano de Transformación) */}
            {(tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador') && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Transformador
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Estado de placa característica, potencia nominal y tensiones de operación
                    </p>
                  </div>
                </div>

                {/* Estado de Placa Característica */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Estado de Placa Característica
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Legible', 'Ilegible', 'Sin placa'] as const).map((estado) => (
                      <label
                        key={estado}
                        className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                          sotanoEstadoPlaca === estado
                            ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="sotano_estado_placa"
                          value={estado}
                          checked={sotanoEstadoPlaca === estado}
                          onChange={() => setSotanoEstadoPlaca(estado)}
                          className="sr-only"
                        />
                        <span>{estado}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Potencia Nominal (KVA) */}
                <div>
                  <label htmlFor="sotano_potencia" className="block text-xs font-semibold text-slate-700 mb-1">
                    Potencia Nominal (KVA)
                  </label>
                  <input
                    type="text"
                    id="sotano_potencia"
                    value={sotanoPotenciaNominalKva}
                    onChange={(e) => setSotanoPotenciaNominalKva(e.target.value)}
                    placeholder="Ejemplo: 75, 100, 150, 225, 300, 500..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] text-slate-400">Valores usuales:</span>
                    {['25', '50', '75', '100', '150', '225', '300', '500'].map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setSotanoPotenciaNominalKva(k)}
                        className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                      >
                        {k} KVA
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tensión de Operación: kV (Primario) / kV (Secundario) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Tensión de Operación
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <label htmlFor="sotano_tension_primaria" className="block text-[11px] font-semibold text-slate-600 mb-1">
                        kV (Primario)
                      </label>
                      <input
                        type="text"
                        id="sotano_tension_primaria"
                        value={sotanoTensionPrimariaKv}
                        onChange={(e) => setSotanoTensionPrimariaKv(e.target.value)}
                        placeholder="Ejemplo: 13.8 o 4.8"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="mt-1.5 flex gap-1.5">
                        {['13.8', '4.8'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setSotanoTensionPrimariaKv(v)}
                            className="px-2 py-0.5 text-[10px] font-medium rounded bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                          >
                            {v} kV
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="sotano_tension_secundaria" className="block text-[11px] font-semibold text-slate-600 mb-1">
                        kV o V (Secundario)
                      </label>
                      <input
                        type="text"
                        id="sotano_tension_secundaria"
                        value={sotanoTensionSecundariaKv}
                        onChange={(e) => setSotanoTensionSecundariaKv(e.target.value)}
                        placeholder="Ejemplo: 0.208 (208/120V) o 0.480 (480/277V)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="mt-1.5 flex gap-1.5">
                        {['208/120', '480/277', '240/120'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setSotanoTensionSecundariaKv(v)}
                            className="px-2 py-0.5 text-[10px] font-medium rounded bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                          >
                            {v} V
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN CANALES Y EMPALMES: Exclusivo para Tanquillas y Sótanos de Transformación */}
            {(tipo === 'Tanquilla' || tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador') && (
              <>
                {/* Canales y Conductores DINÁMICOS */}
                {renderSeccionCanalYConductores(tipo === 'Tanquilla' ? '5' : '6')}

            {/* 6. Empalmes DINÁMICOS */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-blue-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    {tipo === 'Tanquilla' ? '6' : '7'}
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

            {/* SECCIÓN EXCLUSIVA PARA SÓTANO DE TRANSFORMACIÓN (Protecciones y Conductores MT) */}
            {(tipo === 'SÓTANO DE TRANSFORMACIÓN' || tipo === 'Transformador') && (
              <div className="space-y-6 animate-in fade-in">
                
                {/* 8. Protecciones */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                      8
                    </span>
                    <h2 className="text-base font-bold text-slate-800">
                      Protecciones de Transformación ({tipo})
                    </h2>
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

                {/* 9. Conductores de MT al Transformador */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                        9
                      </span>
                      <h2 className="text-base font-bold text-slate-800">
                        Conductores de MT ({tipo})
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
                            value={STANDARD_CALIBRES.includes(cond.calibre) ? cond.calibre : 'OTROS'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'OTROS') {
                                actualizarConductorMT(
                                  cond.id,
                                  'calibre',
                                  STANDARD_CALIBRES.includes(cond.calibre) ? 'OTROS' : cond.calibre
                                );
                              } else {
                                actualizarConductorMT(cond.id, 'calibre', val);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                          >
                            <option value="1/0AWG">1/0 AWG</option>
                            <option value="2/0AWG">2/0 AWG</option>
                            <option value="3/0AWG">3/0 AWG</option>
                            <option value="4/0AWG">4/0 AWG</option>
                            <option value="250MCM">250 MCM</option>
                            <option value="350MCM">350 MCM</option>
                            <option value="500MCM">500 MCM</option>
                            <option value="OTROS">OTROS (Especificar...)</option>
                          </select>

                          {(!STANDARD_CALIBRES.includes(cond.calibre) || cond.calibre === 'OTROS' || cond.calibre === 'OTRO') && (
                            <div className="mt-1.5 animate-in fade-in">
                              <input
                                type="text"
                                value={cond.calibre === 'OTROS' || cond.calibre === 'OTRO' ? '' : cond.calibre}
                                onChange={(e) =>
                                  actualizarConductorMT(cond.id, 'calibre', e.target.value)
                                }
                                placeholder="Especificar calibre (ej. 750 MCM, 2 AWG, etc.)"
                                className="w-full px-2.5 py-1 rounded-md border-2 border-amber-400 bg-white text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-amber-500 shadow-2xs"
                              />
                            </div>
                          )}
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

              </>
            )}

            {/* VISTA EXCLUSIVA PARA CASILLA DE TRANSFORMACIÓN ("Caseta De Tx", PUNTOS 5 AL 8 SEGÚN PLANILLA DE CAMPO) */}
            {tipo === 'CASILLA DE TRANSFORMACIÓN' && (
              <div className="space-y-6 animate-in fade-in">

                {/* 5. Transformador */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        Transformador
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Estado de placa característica, potencia nominal y tensiones de operación
                      </p>
                    </div>
                  </div>

                  {/* Estado de Placa Característica */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Estado de Placa Característica
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['Legible', 'Ilegible', 'Sin placa'] as const).map((estado) => (
                        <label
                          key={estado}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            casillaEstadoPlaca === estado
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="casilla_estado_placa"
                            value={estado}
                            checked={casillaEstadoPlaca === estado}
                            onChange={() => setCasillaEstadoPlaca(estado)}
                            className="sr-only"
                          />
                          <span>{estado}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Potencia Nominal (KVA) */}
                  <div>
                    <label htmlFor="casilla_potencia" className="block text-xs font-semibold text-slate-700 mb-1">
                      Potencia Nominal (KVA)
                    </label>
                    <input
                      type="text"
                      id="casilla_potencia"
                      value={casillaPotenciaNominalKva}
                      onChange={(e) => setCasillaPotenciaNominalKva(e.target.value)}
                      placeholder="Ejemplo: 75, 100, 150, 225, 300, 500..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-slate-400">Valores usuales:</span>
                      {['25', '50', '75', '100', '150', '225', '300', '500'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCasillaPotenciaNominalKva(k)}
                          className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                        >
                          {k} KVA
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tensión de Operación: kV (Primario) / kV (Secundario) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Tensión de Operación
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <label htmlFor="casilla_tension_primaria" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          kV (Primario)
                        </label>
                        <input
                          type="text"
                          id="casilla_tension_primaria"
                          value={casillaTensionPrimariaKv}
                          onChange={(e) => setCasillaTensionPrimariaKv(e.target.value)}
                          placeholder="Ejemplo: 13.8 o 4.8"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-1.5 flex gap-1.5">
                          {['13.8', '4.8'].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setCasillaTensionPrimariaKv(v)}
                              className="px-2 py-0.5 text-[10px] font-medium rounded bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                            >
                              {v} kV
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="casilla_tension_secundaria" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          kV o V (Secundario)
                        </label>
                        <input
                          type="text"
                          id="casilla_tension_secundaria"
                          value={casillaTensionSecundariaKv}
                          onChange={(e) => setCasillaTensionSecundariaKv(e.target.value)}
                          placeholder="Ejemplo: 0.208 (208/120V) o 0.480 (480/277V)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-1.5 flex gap-1.5">
                          {['208/120', '480/277', '240/120'].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setCasillaTensionSecundariaKv(v)}
                              className="px-2 py-0.5 text-[10px] font-medium rounded bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                            >
                              {v} V
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Protecciones */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      6
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-blue-600" />
                        Protecciones
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Inspección visual de protecciones en media tensión y observaciones técnicas
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      ¿Tiene protecciones visibles/operativas?
                    </label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name="casilla_tiene_protecciones"
                          value="Si"
                          checked={casillaTieneProtecciones === 'Si'}
                          onChange={() => setCasillaTieneProtecciones('Si')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span>Si tiene protecciones</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                        <input
                          type="radio"
                          name="casilla_tiene_protecciones"
                          value="No"
                          checked={casillaTieneProtecciones === 'No'}
                          onChange={() => setCasillaTieneProtecciones('No')}
                          className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <span>No tiene protecciones</span>
                      </label>
                    </div>
                  </div>

                  {casillaTieneProtecciones === 'Si' && (
                    <div className="pt-2 animate-in fade-in">
                      <label htmlFor="casilla_obs_protecciones" className="block text-xs font-semibold text-slate-700 mb-1">
                        Observaciones de Protecciones
                      </label>
                      <textarea
                        id="casilla_obs_protecciones"
                        name="casilla_obs_protecciones"
                        rows={2}
                        value={casillaObsProtecciones}
                        onChange={(e) => setCasillaObsProtecciones(e.target.value)}
                        placeholder="Tipo de cortacorriente, seccionador tripolar bajo carga, fusibles de potencia, capacidad..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* 7. Canal y Conductores */}
                {renderSeccionCanalYConductores('7')}

                {/* 8. Tablero de BT y Control de Alumbrado */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      8
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Tablero de BT y Control de Alumbrado
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Breaker / interruptor principal y sistema de control de alumbrado
                      </p>
                    </div>
                  </div>

                  {/* Breaker / Interruptor Principal */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      • Breaker / Interruptor Principal
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Capacidad: _____ A */}
                      <div>
                        <label htmlFor="casilla_breaker_cap" className="block text-xs font-semibold text-slate-700 mb-1">
                          Capacidad (A)
                        </label>
                        <input
                          type="text"
                          id="casilla_breaker_cap"
                          value={casillaBreakerCapacidadA}
                          onChange={(e) => setCasillaBreakerCapacidadA(e.target.value)}
                          placeholder="Ejemplo: 100, 150, 200, 250, 400..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {['100', '150', '200', '250', '400', '600'].map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setCasillaBreakerCapacidadA(a)}
                              className="px-2 py-0.5 text-[10px] font-medium rounded bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition"
                            >
                              {a} A
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Estado: [ ] Operativo  [ ] Directo/Sin breaker */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Estado
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Operativo', 'Directo / Sin breaker'] as const).map((est) => (
                            <label
                              key={est}
                              className={`flex items-center justify-center p-2.5 rounded-lg border-2 cursor-pointer text-xs font-semibold transition text-center ${
                                casillaBreakerEstado === est
                                  ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="casilla_breaker_estado"
                                value={est}
                                checked={casillaBreakerEstado === est}
                                onChange={() => setCasillaBreakerEstado(est)}
                                className="sr-only"
                              />
                              <span>{est}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Control de Alumbrado */}
                  <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      • Control de Alumbrado
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">
                        Tipo de control (opciones)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {([
                          'Fotocelda',
                          'Reloj temporizador',
                          'Contactor manual',
                          'Directo',
                        ] as const).map((tipoCtrl) => (
                          <label
                            key={tipoCtrl}
                            className={`flex items-center justify-center p-2.5 rounded-lg border-2 cursor-pointer text-xs font-semibold transition text-center ${
                              casillaTipoControlAlumbrado === tipoCtrl
                                ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="casilla_tipo_control_alumbrado"
                              value={tipoCtrl}
                              checked={casillaTipoControlAlumbrado === tipoCtrl}
                              onChange={() => setCasillaTipoControlAlumbrado(tipoCtrl)}
                              className="sr-only"
                            />
                            <span>{tipoCtrl}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 9. Conductores de MT */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        9
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-600" />
                          Conductores de MT
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Categoría (PP, PLT, OTROS), Calibre y Cantidad de conductores
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={agregarConductorMT}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Conductor</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {conductoresMT.map((cond, idx) => (
                      <div
                        key={cond.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 items-end"
                      >
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Categoría #{idx + 1}
                          </label>
                          <select
                            value={cond.categoria}
                            onChange={(e) => actualizarConductorMT(cond.id, 'categoria', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="PP">PP (Polietileno)</option>
                            <option value="PLT">PLT (Plomo)</option>
                            <option value="OTROS">OTROS</option>
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Calibre
                          </label>
                          <select
                            value={STANDARD_CALIBRES.includes(cond.calibre) ? cond.calibre : 'OTROS'}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'OTROS') {
                                actualizarConductorMT(
                                  cond.id,
                                  'calibre',
                                  STANDARD_CALIBRES.includes(cond.calibre) ? 'OTROS' : cond.calibre
                                );
                              } else {
                                actualizarConductorMT(cond.id, 'calibre', val);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1/0AWG">1/0 AWG</option>
                            <option value="2/0AWG">2/0 AWG</option>
                            <option value="3/0AWG">3/0 AWG</option>
                            <option value="4/0AWG">4/0 AWG</option>
                            <option value="250MCM">250 MCM</option>
                            <option value="350MCM">350 MCM</option>
                            <option value="500MCM">500 MCM</option>
                            <option value="OTROS">OTROS</option>
                          </select>

                          {(!STANDARD_CALIBRES.includes(cond.calibre) || cond.calibre === 'OTROS' || cond.calibre === 'OTRO') && (
                            <div className="mt-1.5 animate-in fade-in">
                              <input
                                type="text"
                                value={cond.calibre === 'OTROS' || cond.calibre === 'OTRO' ? '' : cond.calibre}
                                onChange={(e) =>
                                  actualizarConductorMT(cond.id, 'calibre', e.target.value)
                                }
                                placeholder="Especificar calibre..."
                                className="w-full px-2.5 py-1 rounded-md border border-blue-400 bg-white text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:ring-2 focus:ring-blue-500 shadow-2xs"
                              />
                            </div>
                          )}
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
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="sm:col-span-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => eliminarConductorMT(cond.id)}
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
            )}

            {/* VISTA EXCLUSIVA PARA POSTE DE TRANSFORMACIÓN (TRANSFORMADOR AÉREO, PARARRAYOS Y PUESTA A TIERRA) */}
            {tipo === 'POSTE DE TRANSFORMACIÓN' && (
              <div className="space-y-6 animate-in fade-in">

                {/* 5. Transformador Aéreo */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" />
                        Transformador Aéreo
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Configuración, potencia nominal, tensiones de operación y tipo de conexión
                      </p>
                    </div>
                  </div>

                  {/* Configuración */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Configuración del Transformador
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[
                        'Monofásico (1 unidad)',
                        'Banco Monofásico (2 unidades)',
                        'Banco Monofásico (3 unidades)',
                        'Trifásico (1 unidad)',
                        'Otro',
                      ].map((cfg) => (
                        <label
                          key={cfg}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs font-semibold transition text-center ${
                            configuracionBanco === cfg
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_config_banco"
                            value={cfg}
                            checked={configuracionBanco === cfg}
                            onChange={() => setConfiguracionBanco(cfg as ConfiguracionBancoPoste)}
                            className="sr-only"
                          />
                          <span>{cfg}</span>
                        </label>
                      ))}
                    </div>
                    {configuracionBanco === 'Otro' && (
                      <div className="mt-2.5 animate-in fade-in">
                        <label htmlFor="poste_config_otro" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Especificar Configuración
                        </label>
                        <input
                          id="poste_config_otro"
                          type="text"
                          value={configuracionBancoOtro}
                          onChange={(e) => setConfiguracionBancoOtro(e.target.value)}
                          placeholder="Especificar configuración..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Potencia Nominal [kVA] */}
                  <div>
                    <label htmlFor="poste_potencia" className="block text-xs font-semibold text-slate-700 mb-1">
                      Potencia Nominal (kVA)
                    </label>
                    <input
                      id="poste_potencia"
                      type="text"
                      value={potenciaNominalKva}
                      onChange={(e) => setPotenciaNominalKva(e.target.value)}
                      placeholder="Ejemplo: 15, 25, 37.5, 50, 75, 100, 167..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-slate-400">Valores usuales:</span>
                      {['15', '25', '37.5', '50', '75', '100', '167'].map((k) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setPotenciaNominalKva(k)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                            potenciaNominalKva === k
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-200'
                          }`}
                        >
                          {k} kVA
                        </button>
                      ))}
                    </div>

                    {(configuracionBanco.includes('Banco') || configuracionBanco.includes('unidades')) && (
                      <div className="mt-3">
                        <label htmlFor="poste_potencia_banco" className="block text-xs font-semibold text-slate-700 mb-1">
                          Potencia Total del Banco (kVA)
                        </label>
                        <input
                          id="poste_potencia_banco"
                          type="text"
                          value={potenciaBanco3xKva}
                          onChange={(e) => setPotenciaBanco3xKva(e.target.value)}
                          placeholder="Ejemplo: 3x25 = 75 kVA o 2x15 = 30 kVA"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tensión de Operación: kV (Primario) / V (Secundario) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Tensión de Operación
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <label htmlFor="poste_tension_primaria" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          kV (Primario)
                        </label>
                        <input
                          type="text"
                          id="poste_tension_primaria"
                          value={tensionPrimarioKv}
                          onChange={(e) => setTensionPrimarioKv(e.target.value)}
                          placeholder="Ejemplo: 13.8 o 4.8"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-1.5 flex gap-1.5">
                          {['13.8', '4.8'].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setTensionPrimarioKv(v)}
                              className={`px-2 py-0.5 text-[10px] font-medium rounded border transition ${
                                tensionPrimarioKv === v
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                  : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-200'
                              }`}
                            >
                              {v} kV
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="poste_tension_secundaria" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          V (Secundario)
                        </label>
                        <input
                          type="text"
                          id="poste_tension_secundaria"
                          value={tensionSecundarioKv}
                          onChange={(e) => setTensionSecundarioKv(e.target.value)}
                          placeholder="Ejemplo: 120/240 o 208Y/120"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {['120/240', '208Y/120', '480Y/277'].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setTensionSecundarioKv(v)}
                              className={`px-2 py-0.5 text-[10px] font-medium rounded border transition ${
                                tensionSecundarioKv === v
                                  ? 'bg-blue-600 text-white border-blue-600 font-bold'
                                  : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-200'
                              }`}
                            >
                              {v} V
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tipo de Conexión: Y-Y, Δ-Δ, Δ-Y, OTROS */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Tipo de Conexión
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {(['Y-Y', 'Δ-Δ', 'Δ-Y', 'OTROS'] as const).map((cx) => (
                        <label
                          key={cx}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            conexionPoste === cx
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_tipo_conexion"
                            value={cx}
                            checked={conexionPoste === cx}
                            onChange={() => setConexionPoste(cx)}
                            className="sr-only"
                          />
                          <span>{cx}</span>
                        </label>
                      ))}
                    </div>
                    {(conexionPoste === 'OTROS' || conexionPoste === 'Otro') && (
                      <div className="mt-2.5 animate-in fade-in">
                        <label htmlFor="poste_conexion_otro" className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Especificar Tipo de Conexión
                        </label>
                        <input
                          id="poste_conexion_otro"
                          type="text"
                          value={conexionPosteOtro}
                          onChange={(e) => setConexionPosteOtro(e.target.value)}
                          placeholder="Especificar tipo de conexión..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        />
                      </div>
                    )}
                  </div>

                </div>

                {/* 6. Descargadores de Sobretensiones y Protecciones */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      6
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Descargadores de Sobretensiones y Protecciones
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Presencia y cantidad de pararrayos, y evaluación de portafusibles y corriente del fusible
                      </p>
                    </div>
                  </div>

                  {/* PARARRAYOS */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      ¿Posee Descargadores de Sobretensiones / Pararrayos?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Si', 'No'] as const).map((op) => (
                        <label
                          key={op}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            pararrayosPresente === op
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_pararrayos_presente"
                            value={op}
                            checked={pararrayosPresente === op}
                            onChange={() => setPararrayosPresente(op)}
                            className="sr-only"
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>

                    {pararrayosPresente === 'Si' && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in space-y-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Cantidad de Pararrayos
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {['1', '2', '3', 'Otro'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setPararrayosCantidad(c)}
                              className={`py-2 rounded-lg border text-xs font-semibold transition text-center ${
                                pararrayosCantidad === c
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        {pararrayosCantidad === 'Otro' && (
                          <div className="mt-2 animate-in fade-in">
                            <input
                              type="text"
                              value={pararrayosCantidad === 'Otro' ? '' : pararrayosCantidad}
                              onChange={(e) => setPararrayosCantidad(e.target.value)}
                              placeholder="Indicar cantidad..."
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* PROTECCIONES / PORTAFUSIBLES */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">
                      ¿Hay portafusibles?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Si', 'No'] as const).map((op) => (
                        <label
                          key={op}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            portafusiblesPresente === op
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_portafusibles_presente"
                            value={op}
                            checked={portafusiblesPresente === op}
                            onChange={() => setPortafusiblesPresente(op)}
                            className="sr-only"
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>

                    {portafusiblesPresente === 'Si' && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 animate-in fade-in space-y-2">
                        <label htmlFor="poste_corriente_fusible" className="block text-xs font-semibold text-slate-700">
                          Corriente del Fusible
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {['5A', '10A', '15A', '20A', '25A'].map((amp) => (
                            <button
                              key={amp}
                              type="button"
                              onClick={() => setCorrienteFusibleAmp(amp)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                                corrienteFusibleAmp === amp
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 border-slate-200'
                              }`}
                            >
                              {amp}
                            </button>
                          ))}
                        </div>
                        <input
                          id="poste_corriente_fusible"
                          type="text"
                          value={corrienteFusibleAmp}
                          onChange={(e) => setCorrienteFusibleAmp(e.target.value)}
                          placeholder="Ejemplo: 15A Tipo K, 25A Tipo T..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 7. Canal y Conductores */}
                {renderSeccionCanalYConductores('7')}

                {/* 8. Sistema de Puesta a Tierra */}
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      8
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Sistema de Puesta a Tierra
                      </h2>
                      <p className="text-xs text-slate-500 font-medium">
                        Continuidad del bajante, estado del cable/protección, evidencia de jabalina y estado de conexión
                      </p>
                    </div>
                  </div>

                  {/* 1. ¿Cable conductor visible y continuo en el sistema de bajante de puesta a tierra? */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      ¿Cable conductor visible y continuo en el sistema de bajante de puesta a tierra?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Si', 'No'] as const).map((op) => (
                        <label
                          key={op}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            bajanteCableVisibleContinuo === op
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_cable_bajante_visible"
                            value={op}
                            checked={bajanteCableVisibleContinuo === op}
                            onChange={() => setBajanteCableVisibleContinuo(op)}
                            className="sr-only"
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 2. ¿Estado del cable/protección? */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      ¿Estado del cable / protección?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        'Adecuado / Protegido con tubo',
                        'Sulfatado / Suelto',
                        'Cortado',
                      ].map((op) => (
                        <label
                          key={op}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            bajanteEstadoCableProteccion === op
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_estado_cable_proteccion"
                            value={op}
                            checked={bajanteEstadoCableProteccion === op}
                            onChange={() => setBajanteEstadoCableProteccion(op)}
                            className="sr-only"
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 3. ¿Se evidencia jabalina enterrada o su caja de registro en la base del poste? */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      ¿Se evidencia jabalina enterrada o su caja de registro en la base del poste?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        'SI',
                        'No',
                        'No visible / enterrada',
                      ].map((op) => (
                        <label
                          key={op}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            jabalinaORegistroBase === op
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_evidencia_jabalina"
                            value={op}
                            checked={jabalinaORegistroBase === op}
                            onChange={() => setJabalinaORegistroBase(op)}
                            className="sr-only"
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 4. ¿Estado de conexión? */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      ¿Estado de conexión?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        'Firme y en buen estado',
                        'Oxidada / Floja',
                        'Ausente',
                      ].map((op) => (
                        <label
                          key={op}
                          className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer text-xs sm:text-sm font-semibold transition text-center ${
                            estadoConexionTierra === op
                              ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="poste_estado_conexion_tierra"
                            value={op}
                            checked={estadoConexionTierra === op}
                            onChange={() => setEstadoConexionTierra(op)}
                            className="sr-only"
                          />
                          <span>{op}</span>
                        </label>
                      ))}
                    </div>
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
              {editingRecord ? (
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-amber-400" />
                  Editando: <strong className="text-white">{tipo}</strong> [{editingRecord.codigoIdentificador}]
                </span>
              ) : (
                <>
                  Levantamiento: <span className="font-bold text-white">{tipo}</span> | ID:{' '}
                  <span className="font-mono font-bold text-blue-300">
                    {existeNombre === 'Si' ? idPlano || '(Por definir)' : idNuevo || '(Por definir)'}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {editingRecord && onCancelEdit && (
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition"
                >
                  Cancelar
                </button>
              )}

              <button
                type="submit"
                id="btn_guardar_levantamiento"
                disabled={isSaving}
                className={`w-full sm:w-auto flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 ${
                  editingRecord
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                }`}
              >
                {editingRecord ? (
                  <>
                    <Save className="w-5 h-5 text-amber-100" />
                    <span>{isSaving ? 'Guardando...' : 'Guardar y Actualizar Levantamiento'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-blue-200" />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Levantamiento y Agregar Otro'}</span>
                  </>
                )}
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
