import * as XLSX from 'xlsx';
import { LevantamientoRecord } from '../types';

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

  // 1. Hoja Tanquillas
  const tanquillas = registros.filter((r) => r.tipo === 'Tanquilla');
  if (tanquillas.length > 0) {
    const dataTanquillas = tanquillas.map((r, idx) => ({
      'N°': idx + 1,
      'ID Identificador': r.codigoIdentificador,
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

  // 2. Hoja Transformadores
  const transformadores = registros.filter((r) => r.tipo === 'Transformador');
  if (transformadores.length > 0) {
    const dataTransformadores = transformadores.map((r, idx) => ({
      'N°': idx + 1,
      'ID Identificador': r.codigoIdentificador,
      'Existe en Plano': r.existeNombre,
      'ID Plano': r.idPlano || '',
      'ID Nuevo': r.idNuevo || '',
      'Dirección / Referencia': r.direccion,
      'Latitud': r.latitud !== null ? r.latitud : '',
      'Longitud': r.longitud !== null ? r.longitud : '',
      'Precisión GPS (m)': r.precisionGPS ? `±${r.precisionGPS.toFixed(1)}m` : '',
      '¿Tiene Acceso?': r.tieneAcceso,
      '¿Tiene Protecciones?': r.tieneProtecciones || 'No registrado',
      'Obs. Protecciones': r.obsProtecciones || '',
      'Conductores MT a Transformador': formatConductoresMTText(r.conductoresMT),
      'Detalle Canales y Conductores': formatCanalesText(r.canales),
      'Detalle Empalmes': formatEmpalmesText(r.empalmes),
      'Observaciones': r.observaciones || '',
      'N° Fotos Evidencia': r.evidencias?.length || 0,
      'Fecha Toma': r.fecha,
    }));

    const wsTransformadores = XLSX.utils.json_to_sheet(dataTransformadores);
    wsTransformadores['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 15 },
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 20 },
      { wch: 28 },
      { wch: 35 },
      { wch: 55 },
      { wch: 55 },
      { wch: 35 },
      { wch: 18 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTransformadores, 'Transformadores');
  }

  // 3. Hoja Consolidado General (Todos)
  const dataGeneral = registros.map((r, idx) => ({
    'N°': idx + 1,
    'Tipo': r.tipo,
    'ID Identificador': r.codigoIdentificador,
    'Dirección / Referencia': r.direccion,
    'Latitud': r.latitud !== null ? r.latitud : '',
    'Longitud': r.longitud !== null ? r.longitud : '',
    '¿Tiene Acceso?': r.tieneAcceso,
    'Total Canales': r.canales?.length || 0,
    'Total Empalmes': r.empalmes?.length || 0,
    'Protecciones': r.tipo === 'Transformador' ? r.tieneProtecciones || 'No' : 'N/A',
    'Observaciones': r.observaciones || '',
    'Fecha Toma': r.fecha,
  }));

  const wsGeneral = XLSX.utils.json_to_sheet(dataGeneral);
  wsGeneral['!cols'] = [
    { wch: 6 },
    { wch: 16 },
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

export function exportarExcelEspecifico(tipo: 'Tanquilla' | 'Transformador', registros: LevantamientoRecord[]) {
  const filtrados = registros.filter((r) => r.tipo === tipo);
  if (filtrados.length === 0) {
    throw new Error(`No hay levantamientos de ${tipo} guardados.`);
  }
  exportarExcelCompleto(filtrados, `Levantamiento_${tipo}_UCV`);
}
