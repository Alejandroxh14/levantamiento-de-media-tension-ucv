import { LevantamientoRecord, GoogleSheetsConfig } from '../types';
import { formatCanalesText, formatEmpalmesText, formatConductoresMTText } from './excelService';

const GOOGLE_SHEETS_CONFIG_KEY = 'ucv_mt_google_sheets_config';

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  try {
    const saved = localStorage.getItem(GOOGLE_SHEETS_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error leyendo config de Google Sheets:', e);
  }
  return {
    webhookUrl: '',
    autoSync: false,
  };
}

export function saveGoogleSheetsConfig(config: GoogleSheetsConfig): void {
  localStorage.setItem(GOOGLE_SHEETS_CONFIG_KEY, JSON.stringify(config));
}

export function transformRecordForSheet(record: LevantamientoRecord) {
  return {
    id: record.id,
    timestamp: record.timestamp,
    fecha: record.fecha,
    tipo: record.tipo,
    codigoIdentificador: record.codigoIdentificador,
    existeNombre: record.existeNombre,
    idPlano: record.idPlano || '',
    idNuevo: record.idNuevo || '',
    direccion: record.direccion,
    latitud: record.latitud,
    longitud: record.longitud,
    precisionGPS: record.precisionGPS ? `±${record.precisionGPS.toFixed(1)}m` : '',
    tieneAcceso: record.tieneAcceso,
    canalesDetalle: formatCanalesText(record.canales),
    empalmesDetalle: formatEmpalmesText(record.empalmes),
    tieneProtecciones: record.tipo === 'Transformador' ? record.tieneProtecciones || 'No' : 'N/A',
    obsProtecciones: record.obsProtecciones || '',
    conductoresMTDetalle: record.tipo === 'Transformador' ? formatConductoresMTText(record.conductoresMT) : 'N/A',
    observaciones: record.observaciones || '',
    numEvidencias: record.evidencias?.length || 0,
    nombresEvidencias: record.evidencias?.map((e) => e.nombre).join(', ') || 'Ninguna',
  };
}

export async function syncRecordToGoogleSheets(
  record: LevantamientoRecord,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const config = getGoogleSheetsConfig();
  const webhookUrl = (customUrl || config.webhookUrl).trim();

  if (!webhookUrl) {
    return {
      success: false,
      message: 'No se ha configurado la URL de Webhook de Google Sheets.',
    };
  }

  const payload = {
    action: 'insert_record',
    data: transformRecordForSheet(record),
  };

  try {
    // We send payload as text/plain to avoid CORS preflight issues with Google Apps Script webhooks
    const response = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Standard Google Apps Script Webhook execution mode
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Levantamiento enviado exitosamente a Google Sheets.',
    };
  } catch (error: any) {
    console.error('Error enviando a Google Sheets:', error);
    return {
      success: false,
      message: `Error al conectar con Google Sheets: ${error?.message || 'Error de red'}`,
    };
  }
}

export async function syncBatchToGoogleSheets(
  records: LevantamientoRecord[],
  customUrl?: string
): Promise<{ success: boolean; message: string; count: number }> {
  const config = getGoogleSheetsConfig();
  const webhookUrl = (customUrl || config.webhookUrl).trim();

  if (!webhookUrl) {
    return {
      success: false,
      message: 'No se ha configurado la URL de Webhook de Google Sheets.',
      count: 0,
    };
  }

  const payload = {
    action: 'insert_batch',
    items: records.map(transformRecordForSheet),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `Se enviaron ${records.length} registros a Google Sheets.`,
      count: records.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error en envío por lotes: ${error?.message || 'Error de red'}`,
      count: 0,
    };
  }
}

export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT - LEVANTAMIENTO DE MEDIA TENSIÓN UCV
 * Universidad Central de Venezuela - Sistema de Digitalización de Campo
 * ==============================================================================
 * 
 * INSTRUCCIONES RÁPIDAS PARA CONECTAR GOOGLE SHEETS:
 * 1. Abre una hoja de cálculo en blanco en Google Sheets (drive.google.com).
 * 2. En el menú superior, ve a: Extensiones -> Apps Script.
 * 3. Borra todo el código que aparezca en el editor y PEGA este código completo.
 * 4. Haz clic en "Guardar" (ícono de disquete).
 * 5. Haz clic en el botón azul superior: "Implementar" -> "Nueva implementación".
 * 6. En "Seleccionar tipo", haz clic en el engranaje y elige "Aplicación web".
 * 7. En "Descripción" escribe: "Webhook Levantamiento UCV".
 * 8. En "Quién tiene acceso", selecciona: "Cualquier usuario" (Anyone).
 * 9. Haz clic en "Implementar" y autoriza los permisos con tu cuenta de Google.
 * 10. Copia la "URL de la aplicación web" resultante y pégala en la app en el botón "Sincronizar con Google Sheets".
 * ¡Listo! Cada registro de campo se insertará automáticamente en tu hoja de cálculo.
 */

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var parsed = JSON.parse(contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (parsed.action === 'insert_batch' && parsed.items) {
      for (var i = 0; i < parsed.items.length; i++) {
        saveItem(ss, parsed.items[i]);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', count: parsed.items.length }))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (parsed.data) {
      saveItem(ss, parsed.data);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'ignored' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveItem(ss, d) {
  var sheetName = d.tipo === 'Transformador' ? 'Transformadores' : 'Tanquillas';
  var sheet = ss.getSheetByName(sheetName);
  
  // Si la pestaña no existe, la creamos con encabezados con estilo
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var headers = [
      'Fecha', 'ID Identificador', 'Tipo', 'Existe en Plano', 'ID Plano', 'ID Nuevo',
      'Dirección / Referencia', 'Latitud', 'Longitud', 'Precisión GPS', '¿Tiene Acceso?',
      'Canales y Conductores', 'Empalmes', 'Protecciones', 'Obs Protecciones',
      'Conductores MT a Transf.', 'Observaciones', 'N° Evidencias'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#1e40af').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  
  sheet.appendRow([
    d.fecha || new Date().toLocaleString(),
    d.codigoIdentificador || '',
    d.tipo || '',
    d.existeNombre || '',
    d.idPlano || '',
    d.idNuevo || '',
    d.direccion || '',
    d.latitud || '',
    d.longitud || '',
    d.precisionGPS || '',
    d.tieneAcceso || '',
    d.canalesDetalle || '',
    d.empalmesDetalle || '',
    d.tieneProtecciones || '',
    d.obsProtecciones || '',
    d.conductoresMTDetalle || '',
    d.observaciones || '',
    d.numEvidencias || 0
  ]);
}
`;
}
