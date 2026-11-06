import * as XLSX from 'xlsx';
import { LevantamientoRecord, isTransformacionTipo, formatTipoDisplayName, getRecordStatus } from '../types';

export function formatCanalesText(canales: LevantamientoRecord['canales']): string {
  if (!canales || canales.length === 0) return 'Sin canales registrados';
  return canales
    .map((c, i) => {
      const conds = c.conductores
        .map((cd) => `${cd.categoria || 'N/A'} (${cd.calibre || 'N/A'}): ${cd.cantidad || 0} ud(s)`)
        .join(' | ');
      return `Canal ${i + 1} [Ref: ${c.refTanquilla || 'S/Ref'}] -> ${conds || 'Sin conductores'}`;
    })
    .join('\n');
}

export function formatEmpalmesText(empalmes: LevantamientoRecord['empalmes']): string {
  if (!empalmes || empalmes.length === 0) return 'Sin empalmes registrados';
  return empalmes
    .map((e, i) => {
      const partes = (e.tipo || 'PP-PLT').split('-');
      const mismo = partes[0] === partes[1];
      const et1 = mismo ? `${partes[0]} (Lado 1)` : partes[0];
      const et2 = mismo ? `${partes[1]} (Lado 2)` : partes[1];
      return `Empalme ${i + 1} [${e.tipo}] -> ${et1}: ${e.cant1 || 0} (Dir: ${e.dir1 || 'N/A'}) | ${et2}: ${e.cant2 || 0} (Dir: ${e.dir2 || 'N/A'})`;
    })
    .join('\n');
}

export function formatConductoresMTText(conductoresMT?: LevantamientoRecord['conductoresMT']): string {
  if (!conductoresMT || conductoresMT.length === 0) return 'N/A';
  return conductoresMT
    .map((c, i) => `Cond. ${i + 1} -> ${c.categoria || 'N/A'} (${c.calibre || 'N/A'}): ${c.cantidad || 0} ud(s)`)
    .join(' | ');
}

export function exportarExcelCompleto(registros: LevantamientoRecord[], filenamePrefix = 'Levantamiento_Media_Tension_UCV') {
  if (registros.length === 0) {
    throw new Error('No hay registros para exportar');
  }

  const wb = XLSX.utils.book_new();

  // Helper para columnas de hojas de transformación (Sótano de Transformación)
  const transformacionCols = [
    { wch: 6 },
    { wch: 28 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 }, // 5. Placa Característica
    { wch: 22 }, // 5. Potencia Nominal (KVA)
    { wch: 20 }, // 5. Tensión Primaria (kV)
    { wch: 22 }, // 5. Tensión Secundaria (V/kV)
    { wch: 20 },
    { wch: 28 },
    { wch: 35 },
    { wch: 55 },
    { wch: 55 },
    { wch: 35 },
    { wch: 18 },
    { wch: 20 },
  ];

  const mapTransformacionRows = (items: LevantamientoRecord[]) =>
    items.map((r, idx) => ({
      'N°': idx + 1,
      'Tipo de Transformación': formatTipoDisplayName(r.tipo),
      'ID Identificador': r.codigoIdentificador,
      'Estado (Status)': getRecordStatus(r),
      'Existe en Plano': r.existeNombre,
      'ID Plano': r.idPlano || '',
      'ID Nuevo': r.idNuevo || '',
      'Dirección / Referencia': r.direccion,
      'Latitud': r.latitud !== null ? r.latitud : '',
      'Longitud': r.longitud !== null ? r.longitud : '',
      'Precisión GPS (m)': r.precisionGPS ? `±${r.precisionGPS.toFixed(1)}m` : '',
      '¿Tiene Acceso?': r.tieneAcceso,
      '5. Placa Característica': r.sotanoData?.estadoPlaca || '',
      '5. Potencia Nominal (KVA)': r.sotanoData?.potenciaNominalKva || '',
      '5. Tensión Primaria (kV)': r.sotanoData?.tensionPrimariaKv || '',
      '5. Tensión Secundaria (V/kV)': r.sotanoData?.tensionSecundariaKv || '',
      '¿Tiene Protecciones?': r.tieneProtecciones || 'No registrado',
      'Obs. Protecciones': r.obsProtecciones || '',
      'Conductores MT a Transformador': formatConductoresMTText(r.conductoresMT),
      'Detalle Canales y Conductores': formatCanalesText(r.canales),
      'Detalle Empalmes': formatEmpalmesText(r.empalmes),
      'Observaciones': r.observaciones || '',
      'N° Fotos Evidencia': r.evidencias?.length || 0,
      'Fecha Toma': r.fecha,
    }));

  // 1. Hoja Tanquillas
  const tanquillas = registros.filter((r) => r.tipo === 'Tanquilla');
  if (tanquillas.length > 0) {
    const dataTanquillas = tanquillas.map((r, idx) => ({
      'N°': idx + 1,
      'ID Identificador': r.codigoIdentificador,
      'Estado (Status)': getRecordStatus(r),
      'Existe en Plano': r.existeNombre,
      'ID Plano': r.idPlano || '',
      'ID Nuevo': r.idNuevo || '',
      'Dirección / Referencia': r.direccion,
      'Latitud': r.latitud !== null ? r.latitud : '',
      'Longitud': r.longitud !== null ? r.longitud : '',
      'Precisión GPS (m)': r.precisionGPS ? `±${r.precisionGPS.toFixed(1)}m` : '',
      '¿Tiene Acceso?': r.tieneAcceso,
      'Detalle Canales y Conductores': formatCanalesText(r.canales),
      'Detalle Empalmes': formatEmpalmesText(r.empalmes),
      'Observaciones': r.observaciones || '',
      'N° Fotos Evidencia': r.evidencias?.length || 0,
      'Fecha Toma': r.fecha,
    }));

    const wsTanquillas = XLSX.utils.json_to_sheet(dataTanquillas);
    wsTanquillas['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 55 },
      { wch: 55 },
      { wch: 35 },
      { wch: 18 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTanquillas, 'Tanquillas');
  }

  // 2. Hoja Sótanos de Transformación
  const sotanos = registros.filter((r) => r.tipo === 'SÓTANO DE TRANSFORMACIÓN' || r.tipo === 'Transformador');
  if (sotanos.length > 0) {
    const wsSotanos = XLSX.utils.json_to_sheet(mapTransformacionRows(sotanos));
    wsSotanos['!cols'] = transformacionCols;
    XLSX.utils.book_append_sheet(wb, wsSotanos, 'Sotanos_Transformacion');
  }

  // Helper para columnas y mapeo de Casillas de Transformación ("Caseta De Tx")
  const mapCasillaRows = (list: LevantamientoRecord[]) =>
    list.map((r, idx) => ({
      'N°': idx + 1,
      'ID Identificador': r.codigoIdentificador,
      'Estado (Status)': getRecordStatus(r),
      'Existe en Plano': r.existeNombre,
      'ID Plano': r.idPlano || '',
      'ID Nuevo': r.idNuevo || '',
      'Dirección / Referencia': r.direccion,
      'Latitud': r.latitud !== null ? r.latitud : '',
      'Longitud': r.longitud !== null ? r.longitud : '',
      'Precisión GPS (m)': r.precisionGPS ? `±${r.precisionGPS.toFixed(1)}m` : '',
      '¿Tiene Acceso?': r.tieneAcceso,
      '5. Placa Transformador': r.casillaData?.estadoPlaca || '',
      '5. Potencia Nominal (KVA)': r.casillaData?.potenciaNominalKva || '',
      '5. Tensión Primaria (kV)': r.casillaData?.tensionPrimariaKv || '',
      '5. Tensión Secundaria (V/kV)': r.casillaData?.tensionSecundariaKv || '',
      '6. ¿Tiene Protecciones MT?': r.casillaData?.tieneProtecciones || r.tieneProtecciones || '',
      '6. Obs. Protecciones MT': r.casillaData?.obsProtecciones || r.obsProtecciones || '',
      '7. Canales y Conductores': formatCanalesText(r.canales),
      '8. Breaker Principal Capacidad (A)': r.casillaData?.breakerCapacidadA || '',
      '8. Breaker Principal Estado': r.casillaData?.breakerEstado || '',
      '8. Control de Alumbrado': r.casillaData?.tipoControlAlumbrado || '',
      '9. Conductores MT a Casilla': formatConductoresMTText(r.conductoresMT),
      'Observaciones': r.observaciones || '',
      'N° Fotos Evidencia': r.evidencias?.length || 0,
      'Fecha Toma': r.fecha,
    }));

  const casillaCols = [
    { wch: 6 },  // N°
    { wch: 20 }, // ID Identificador
    { wch: 18 }, // Estado
    { wch: 12 }, // Existe Plano
    { wch: 14 }, // ID Plano
    { wch: 14 }, // ID Nuevo
    { wch: 30 }, // Dirección
    { wch: 14 }, // Lat
    { wch: 14 }, // Lng
    { wch: 16 }, // ¿Accesible?
    { wch: 22 }, // Placa Tx
    { wch: 24 }, // Potencia KVA
    { wch: 22 }, // Tensión Primaria
    { wch: 24 }, // Tensión Secundaria
    { wch: 24 }, // ¿Protecciones MT?
    { wch: 32 }, // Obs Protecciones MT
    { wch: 55 }, // Canales y Conductores
    { wch: 28 }, // Capacidad Breaker A
    { wch: 24 }, // Estado Breaker
    { wch: 24 }, // Control Alumbrado
    { wch: 45 }, // Conductores MT
    { wch: 35 }, // Observaciones
    { wch: 18 }, // N° Fotos
    { wch: 20 }, // Fecha
  ];

  // 3. Hoja Casillas de Transformación
  const casillas = registros.filter((r) => r.tipo === 'CASILLA DE TRANSFORMACIÓN');
  if (casillas.length > 0) {
    const wsCasillas = XLSX.utils.json_to_sheet(mapCasillaRows(casillas));
    wsCasillas['!cols'] = casillaCols;
    XLSX.utils.book_append_sheet(wb, wsCasillas, 'Casillas_Transformacion');
  }

  // Helper para columnas de Postes de Transformación
  const posteCols = [
    { wch: 6 },  // N°
    { wch: 20 }, // ID Identificador
    { wch: 18 }, // Estado
    { wch: 12 }, // Existe Plano
    { wch: 14 }, // ID Plano
    { wch: 14 }, // ID Nuevo
    { wch: 30 }, // Dirección
    { wch: 14 }, // Lat
    { wch: 14 }, // Lng
    { wch: 16 }, // ¿Accesible?
    { wch: 28 }, // 5. Configuración Tx
    { wch: 18 }, // Potencia (kVA)
    { wch: 20 }, // Potencia Banco (kVA)
    { wch: 18 }, // Tensión Primaria (kV)
    { wch: 20 }, // Tensión Secundaria (V)
    { wch: 24 }, // Tipo de Conexión
    { wch: 22 }, // 6. ¿Posee Pararrayos?
    { wch: 16 }, // Cant. Pararrayos
    { wch: 20 }, // 6. ¿Hay Portafusibles?
    { wch: 20 }, // Corriente Fusible
    { wch: 55 }, // 7. Canales y Conductores
    { wch: 30 }, // 8. Conductor Visible y Continuo
    { wch: 30 }, // 8. Estado Cable / Protección
    { wch: 32 }, // 8. Evidencia Jabalina / Registro
    { wch: 26 }, // 8. Estado Conexión Tierra
    { wch: 35 }, // Observaciones
    { wch: 16 }, // Fotos
    { wch: 20 }, // Fecha
  ];

  const mapPosteRows = (items: LevantamientoRecord[]) =>
    items.map((r, idx) => {
      const p = r.posteData || {};
      const conexionTexto = (p.conexion === 'Otro' || p.conexion === 'OTROS') && p.conexionOtro
        ? `OTROS (${p.conexionOtro})`
        : p.conexion || '';

      return {
        'N°': idx + 1,
        'ID Identificador': r.codigoIdentificador,
        'Estado (Status)': getRecordStatus(r),
        'Existe en Plano': r.existeNombre,
        'ID Plano': r.idPlano || '',
        'ID Nuevo': r.idNuevo || '',
        'Dirección / Ubicación': r.direccion,
        'Latitud': r.latitud !== null ? r.latitud : '',
        'Longitud': r.longitud !== null ? r.longitud : '',
        '¿Es Accesible?': r.tieneAcceso,
        '5. Configuración Tx Aéreo': p.configuracionBanco === 'Otro' ? `Otro: ${p.configuracionBancoOtro || ''}` : p.configuracionBanco || '',
        '5. Potencia Nominal (kVA)': p.potenciaNominalKva || '',
        '5. Potencia Total Banco (kVA)': p.potenciaBanco3xKva || '',
        '5. Tensión Primaria (kV)': p.tensionPrimarioKv || '',
        '5. Tensión Secundaria (V)': p.tensionSecundarioKv || '',
        '5. Tipo de Conexión': conexionTexto,
        '6. ¿Posee Pararrayos?': p.pararrayosPresente || '',
        '6. Cant. Pararrayos': p.pararrayosPresente === 'No' ? 'N/A' : (p.pararrayosCantidad || ''),
        '6. ¿Hay Portafusibles?': p.portafusiblesPresente || '',
        '6. Corriente Fusible': p.portafusiblesPresente === 'No' ? 'N/A' : (p.corrienteFusibleAmp || p.capacidadFusibleAmp || ''),
        '7. Canales y Conductores': formatCanalesText(r.canales),
        '8. Conductor Bajante Visible y Continuo': p.bajanteCableVisibleContinuo || '',
        '8. Estado Cable / Protección': p.bajanteEstadoCableProteccion || '',
        '8. Evidencia Jabalina / Caja Registro': p.jabalinaORegistroBase || '',
        '8. Estado Conexión Tierra': p.estadoConexionTierra || '',
        'Observaciones': r.observaciones || '',
        'N° Fotos Evidencia': r.evidencias?.length || 0,
        'Fecha Toma': r.fecha,
      };
    });

  // 4. Hoja Postes de Transformación
  const postes = registros.filter((r) => r.tipo === 'POSTE DE TRANSFORMACIÓN');
  if (postes.length > 0) {
    const wsPostes = XLSX.utils.json_to_sheet(mapPosteRows(postes));
    wsPostes['!cols'] = posteCols;
    XLSX.utils.book_append_sheet(wb, wsPostes, 'Postes_Transformacion');
  }

  // 3. Hoja Consolidado General (Todos)
  const dataGeneral = registros.map((r, idx) => ({
    'N°': idx + 1,
    'Tipo': formatTipoDisplayName(r.tipo),
    'ID Identificador': r.codigoIdentificador,
    'Estado (Status)': getRecordStatus(r),
    'Dirección / Referencia': r.direccion,
    'Latitud': r.latitud !== null ? r.latitud : '',
    'Longitud': r.longitud !== null ? r.longitud : '',
    '¿Tiene Acceso?': r.tieneAcceso,
    'Total Canales': r.canales?.length || 0,
    'Total Empalmes': r.empalmes?.length || 0,
    'Protecciones': isTransformacionTipo(r.tipo) ? r.tieneProtecciones || 'No' : 'N/A',
    'Observaciones': r.observaciones || '',
    'Fecha Toma': r.fecha,
  }));

  const wsGeneral = XLSX.utils.json_to_sheet(dataGeneral);
  wsGeneral['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Consolidado_General');

  // 4. Hoja Detalle Granular de Conductores por Canal (Excelente para cómputo de cables de ingeniería)
  const filasDetalleConductores: Record<string, any>[] = [];
  let itemCondIndex = 1;

  registros.forEach((r) => {
    if (r.tieneAcceso === 'Si' && r.canales && r.canales.length > 0) {
      r.canales.forEach((canal, cIndex) => {
        if (canal.conductores && canal.conductores.length > 0) {
          canal.conductores.forEach((cond) => {
            filasDetalleConductores.push({
              'Item': itemCondIndex++,
              'ID Elemento': r.codigoIdentificador,
              'Tipo': r.tipo,
              'Dirección / Ubicación': r.direccion,
              'Canal #': cIndex + 1,
              'Ref. Tanquilla Destino': canal.refTanquilla || 'S/Ref',
              'Categoría': cond.categoria,
              'Calibre': cond.calibre,
              'Cantidad (ud)': cond.cantidad,
            });
          });
        }
      });
    }
  });

  if (filasDetalleConductores.length > 0) {
    const wsDetalleCond = XLSX.utils.json_to_sheet(filasDetalleConductores);
    wsDetalleCond['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 16 },
      { wch: 28 },
      { wch: 10 },
      { wch: 24 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalleCond, 'Detalle_Conductores');
  }

  // 5. Hoja Detalle Granular de Empalmes
  const filasDetalleEmpalmes: Record<string, any>[] = [];
  let itemEmpIndex = 1;

  registros.forEach((r) => {
    if (r.tieneAcceso === 'Si' && r.empalmes && r.empalmes.length > 0) {
      r.empalmes.forEach((emp, eIndex) => {
        const partes = (emp.tipo || 'PP-PLT').split('-');
        filasDetalleEmpalmes.push({
          'Item': itemEmpIndex++,
          'ID Elemento': r.codigoIdentificador,
          'Tipo': r.tipo,
          'Dirección / Ubicación': r.direccion,
          'Empalme #': eIndex + 1,
          'Tipo de Empalme': emp.tipo,
          [`Cant. ${partes[0] || 'Lado 1'}`]: emp.cant1,
          [`Dir. ${partes[0] || 'Lado 1'}`]: emp.dir1,
          [`Cant. ${partes[1] || 'Lado 2'}`]: emp.cant2,
          [`Dir. ${partes[1] || 'Lado 2'}`]: emp.dir2,
        });
      });
    }
  });

  if (filasDetalleEmpalmes.length > 0) {
    const wsDetalleEmp = XLSX.utils.json_to_sheet(filasDetalleEmpalmes);
    wsDetalleEmp['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 16 },
      { wch: 28 },
      { wch: 12 },
      { wch: 16 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
      { wch: 24 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetalleEmp, 'Detalle_Empalmes');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fullFilename = `${filenamePrefix}_${timestamp}.xlsx`;
  XLSX.writeFile(wb, fullFilename);
}

export function exportarExcelEspecifico(tipo: 'Tanquilla' | 'SÓTANO DE TRANSFORMACIÓN' | 'CASILLA DE TRANSFORMACIÓN' | 'POSTE DE TRANSFORMACIÓN' | 'Transformador' | string, registros: LevantamientoRecord[]) {
  const norm = tipo.toUpperCase().trim();
  let filtrados: LevantamientoRecord[] = [];
  let prefix = 'Levantamiento';

  if (norm === 'TANQUILLA' || norm === 'TANQUILLAS') {
    filtrados = registros.filter((r) => r.tipo === 'Tanquilla');
    prefix = 'Levantamiento_Tanquillas_UCV';
  } else if (norm.includes('SÓTANO') || norm.includes('SOTANO')) {
    filtrados = registros.filter((r) => r.tipo === 'SÓTANO DE TRANSFORMACIÓN' || r.tipo === 'Transformador');
    prefix = 'Levantamiento_Sotanos_Transformacion_UCV';
  } else if (norm.includes('CASILLA')) {
    filtrados = registros.filter((r) => r.tipo === 'CASILLA DE TRANSFORMACIÓN');
    prefix = 'Levantamiento_Casillas_Transformacion_UCV';
  } else if (norm.includes('POSTE')) {
    filtrados = registros.filter((r) => r.tipo === 'POSTE DE TRANSFORMACIÓN');
    prefix = 'Levantamiento_Postes_Transformacion_UCV';
  } else if (norm === 'TRANSFORMADOR' || norm.includes('TRANSFORMA')) {
    filtrados = registros.filter((r) => isTransformacionTipo(r.tipo));
    prefix = 'Levantamiento_Transformacion_UCV';
  } else {
    filtrados = registros.filter((r) => r.tipo === tipo);
    prefix = `Levantamiento_${tipo.replace(/\s+/g, '_')}_UCV`;
  }

  if (filtrados.length === 0) {
    throw new Error(`No hay levantamientos de ${formatTipoDisplayName(tipo)} guardados.`);
  }
  
  exportarExcelCompleto(filtrados, prefix);
}
