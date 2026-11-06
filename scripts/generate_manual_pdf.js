import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

function generatePDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 16;
  const contentWidth = pageWidth - (margin * 2);

  // Logo institucional
  let logoBase64 = null;
  const logoPath = path.resolve('./public/ucv_logo.jpg');
  if (fs.existsSync(logoPath)) {
    const buffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  }

  // Colores corporativos sobrios
  const ucvBlue = [30, 58, 138];       // #1E3A8A (Azul UCV)
  const primaryNavy = [15, 23, 42];    // #0F172A
  const slateText = [51, 65, 85];      // #334155
  const slateMuted = [100, 116, 139];  // #64748B
  const lightBg = [248, 250, 252];     // #F8FAFC
  const borderLight = [226, 232, 240]; // #E2E8F0
  const amberAccent = [217, 119, 6];   // #D97706
  const greenAccent = [16, 149, 106];  // #10B981

  const TOTAL_PAGES = 4;

  function drawHeader(pageNum, sectionTitle) {
    // Barra superior decorativa
    doc.setFillColor(...ucvBlue);
    doc.rect(0, 0, pageWidth, 4, 'F');

    // Encabezado institucional
    doc.setFillColor(...lightBg);
    doc.rect(0, 4, pageWidth, 15, 'F');
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.line(0, 19, pageWidth, 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...ucvBlue);
    doc.text('UNIVERSIDAD CENTRAL DE VENEZUELA • FACULTAD DE INGENIERÍA', margin, 12.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...slateMuted);
    doc.text(sectionTitle || 'Manual Oficial de Funcionamiento', margin + 95, 12.5);

    doc.setFont('helvetica', 'bold');
    doc.text(`Pág. ${pageNum} de ${TOTAL_PAGES}`, pageWidth - margin, 12.5, { align: 'right' });
  }

  function drawFooter(pageNum) {
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text('Sistema Web de Levantamiento de Media Tensión • Escuela de Ingeniería Eléctrica • UCV', margin, pageHeight - 7);
    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${pageNum} de ${TOTAL_PAGES}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // ==========================================
  // PÁGINA 1: PORTADA INSTITUCIONAL Y VISTA GENERAL DE LA APLICACIÓN
  // ==========================================
  drawHeader(1, 'Presentación General del Sistema');

  let y = 24;

  // Banner con Escudo Oficial
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'JPEG', margin, y, 22, 22);
    } catch (e) {
      console.error(e);
    }
  }

  const headerTextX = logoBase64 ? margin + 27 : margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryNavy);
  doc.text('UNIVERSIDAD CENTRAL DE VENEZUELA', headerTextX, y + 5);

  doc.setFontSize(9.5);
  doc.setTextColor(...ucvBlue);
  doc.text('Facultad de Ingeniería • Escuela de Ingeniería Eléctrica', headerTextX, y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateMuted);
  doc.text('Red de Distribución Eléctrica del Campus Universitario • Media Tensión (MT)', headerTextX, y + 15.5);

  y += 26;
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // Título Principal
  y += 6;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ucvBlue);
  doc.text('MANUAL DE LA APLICACIÓN Y GUÍA DEL FORMULARIO DE CAMPO', margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateText);
  doc.text('Documento fiel a la interfaz y estructura real del sistema web "UCV Levantamiento de Media Tensión".', margin + 6, y + 17);

  y += 30;

  // SECCIÓN 1: ¿QUÉ HACE LA APLICACIÓN Y CÓMO FUNCIONA?
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('1. ¿QUÉ HACE ESTA APLICACIÓN WEB?', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateText);
  const introP1 = 'Esta aplicación web es una herramienta digital de catastro técnico en campo, diseñada para que profesores, ingenieros, técnicos y estudiantes de la UCV puedan realizar el levantamiento de los elementos de la red de media tensión (Tanquillas y Transformadores) directamente desde cualquier teléfono móvil o computadora.';
  const splitIntro1 = doc.splitTextToSize(introP1, contentWidth);
  doc.text(splitIntro1, margin, y);
  y += splitIntro1.length * 4.2 + 2;

  const introP2 = 'Sustituye por completo las planillas manuales de papel, resolviendo la pérdida de datos, facilitando la captura de coordenadas geográficas mediante el GPS del dispositivo, permitiendo tomar fotos in situ y organizando de forma estandarizada los canales, conductores (categoría, calibre, cantidad) y empalmes.';
  const splitIntro2 = doc.splitTextToSize(introP2, contentWidth);
  doc.text(splitIntro2, margin, y);
  y += splitIntro2.length * 4.2 + 5;

  // SECCIÓN 2: ESTRUCTURA GENERAL DE LA PÁGINA (PESTAÑAS)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('2. CÓMO FUNCIONA LA PÁGINA: MÓDULOS Y NAVEGACIÓN', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateText);
  doc.text('La barra superior de navegación (Navbar) organiza la aplicación en cuatro (4) vistas interactivas:', margin, y);
  y += 5;

  const tabs = [
    {
      num: 'A',
      title: 'Pestaña "Formulario" (Captura en Campo)',
      desc: 'Es la vista principal de recolección. Permite levantar una Tanquilla o un Transformador paso a paso, capturar el GPS, verificar el acceso físico, registrar canales, conductores y empalmes, y tomar evidencias fotográficas.',
      color: [37, 99, 235]
    },
    {
      num: 'B',
      title: 'Pestaña "Registros" (Base de Datos Local y Búsqueda)',
      desc: 'Muestra la lista de todos los puntos levantados con contadores por tipo. Incluye buscador por texto (código o ubicación), filtros por tipo (Tanquilla / Transformador) y por acceso (Sí / No). Cada registro permite "Ver Detalle" (Ficha Técnica completa con fotos en alta resolución), sincronizar con Google Sheets o eliminar.',
      color: [16, 149, 106]
    },
    {
      num: 'C',
      title: 'Pestaña "Mapa" (Visualizador Cartográfico GIS Leaflet)',
      desc: 'Sitúa geográficamente todas las tanquillas y transformadores con coordenadas en el plano de la Ciudad Universitaria. Marcadores diferenciados por color (Azul = Tanquilla con acceso, Ámbar = Transformador, Rojo = Sin Acceso). Permite conmutar vista de calles o satélite y tocar cualquier punto para ver su resumen.',
      color: [217, 119, 6]
    },
    {
      num: 'D',
      title: 'Pestaña "Exportar" (Excel, Google Sheets y Respaldo)',
      desc: 'Descarga de libros Microsoft Excel (.xlsx) estructurados en hojas especializadas (Consolidado, Tanquillas, Transformadores, Conductores y Empalmes). Conexión en vivo con Google Sheets mediante Webhook de Google Apps Script y exportación/importación de copias de seguridad en archivo .json.',
      color: [124, 58, 237]
    }
  ];

  tabs.forEach((tab) => {
    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'F');
    doc.setDrawColor(...borderLight);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'D');

    doc.setFillColor(...tab.color);
    doc.roundedRect(margin + 2.5, y + 2.5, 6, 6, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(tab.num, margin + 5.5, y + 6.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryNavy);
    doc.text(tab.title, margin + 11, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateText);
    const splitDesc = doc.splitTextToSize(tab.desc, contentWidth - 14);
    doc.text(splitDesc, margin + 11, y + 11);

    y += 20.5;
  });

  // Indicador de conexión offline
  y += 2;
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...greenAccent);
  doc.text('✔ FUNCIONAMIENTO OFFLINE (SIN INTERNET):', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateText);
  doc.text('La aplicación guarda todo en la memoria local (IndexedDB) del navegador. Puedes levantar datos en áreas sin señal del campus sin temor a perder la información. Al reconectarse a Wi-Fi, los datos se sincronizan.', margin + 4, y + 9.5);

  drawFooter(1);

  // ==========================================
  // PÁGINA 2: EXPLICACIÓN DETALLADA DEL FORMULARIO (CAMPOS 1 AL 4.5)
  // ==========================================
  doc.addPage();
  drawHeader(2, 'Campos del Formulario (Pasos 1 al 4.5)');

  y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('3. GUÍA EXACTA DEL FORMULARIO DE LEVANTAMIENTO', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...slateText);
  doc.text('El formulario presenta exactamente los siguientes campos numerados en pantalla, diseñados para capturar la realidad del campus:', margin, y);
  y += 6;

  // Paso 1
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ucvBlue);
  doc.text('CAMPO 1: TIPO DE LEVANTAMIENTO', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Selector de dos botones de opción exclusiva:', margin + 5, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.text('• Tanquilla:', margin + 7, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Estructura subterránea de paso o inspección de cables de Media Tensión.', margin + 27, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text('• Transformador:', margin + 7, y + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Subestación / Máquina de transformación (habilita secciones de protecciones y conductores MT).', margin + 35, y + 20.5);

  y += 26;

  // Paso 2
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 31, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, contentWidth, 31, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ucvBlue);
  doc.text('CAMPO 2: IDENTIFICACIÓN / NOMBRE', margin + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Pregunta: ¿Existe en el plano unifilar / topológico?', margin + 5, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.text('• Si seleccionas "Sí (Existe en plano)":', margin + 7, y + 16);
  doc.setFont('helvetica', 'bold');
  doc.text('Campo obligatorio: "ID en el Plano"', margin + 11, y + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Ejemplos válidos: TQ-04, TR-ING-01, TQ-FAU-12.', margin + 63, y + 20.5);

  doc.text('• Si seleccionas "No (Elemento nuevo no registrado)":', margin + 7, y + 25);
  doc.setFont('helvetica', 'bold');
  doc.text('Campo obligatorio: "ID Nuevo Asignado"', margin + 11, y + 29.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Ejemplos válidos: TQ-NUEVA-01, TR-ADD-03.', margin + 72, y + 29.5);

  y += 34;

  // Paso 3
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 27, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, contentWidth, 27, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ucvBlue);
  doc.text('CAMPO 3: DIRECCIÓN / REFERENCIA VISUAL', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Campo de texto obligatorio donde se describe el lugar exacto dentro del campus.', margin + 5, y + 11);
  doc.text('Ejemplo: "Frente a Escuela de Eléctrica, al lado de la caseta de vigilancia".', margin + 5, y + 15.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Botones de atajo rápido incluidos en pantalla para facilitar la escritura en el teléfono:', margin + 5, y + 20.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('+ Esc. de Eléctrica  |  + Fac. de Ingeniería  |  + Fac. de Arquitectura  |  + Fac. de Ciencias  |  + Rectorado  |  + Los Ilustres', margin + 5, y + 24.5);

  y += 30;

  // Paso 4
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...ucvBlue);
  doc.text('CAMPO 4: COORDENADAS GEOGRÁFICAS (GPS)', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('• Botón "📍 Capturar GPS Actual": Activa el sensor satelital del teléfono móvil con máxima precisión', margin + 5, y + 11);
  doc.text('  (enableHighAccuracy: true). Muestra en pantalla el margen de error estimado en metros (ej. ±3.5 m).', margin + 5, y + 15);

  doc.text('• Latitud (Grados Decimales): Coordenada Norte-Sur (ejemplo UCV: 10.488350).', margin + 5, y + 20);
  doc.text('• Longitud (Grados Decimales): Coordenada Este-Oeste (ejemplo UCV: -66.890420).', margin + 5, y + 24.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...amberAccent);
  doc.text('Nota: Si no se cuenta con GPS en el momento, las coordenadas pueden ingresarse de forma manual.', margin + 5, y + 31);

  y += 39;

  // Paso 4.5
  doc.setFillColor(254, 243, 199); // amber-100/50
  doc.roundedRect(margin, y, contentWidth, 27, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, y, contentWidth, 27, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text('CAMPO 4.5: ¿SE TIENE ACCESO AL INTERIOR?', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Condición indispensable para continuar la inspección interna de la tanquilla o transformador:', margin + 5, y + 11);
  
  doc.setFont('helvetica', 'bold');
  doc.text('• "Sí, se puede abrir e inspeccionar":', margin + 7, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Despliega inmediatamente las secciones de Canales, Conductores y Empalmes.', margin + 63, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('• "No se tiene acceso":', margin + 7, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('(Tapa sellada, soldada, inundada o con escombros). El formulario omite los cables y pasa', margin + 41, y + 21);
  doc.text('directamente a Observaciones y Fotos, registrando la imposibilidad de inspección interna.', margin + 9, y + 25);

  drawFooter(2);

  // ==========================================
  // PÁGINA 3: FORMULARIO INTERIOR (CANALES, EMPALMES, TRANSFORMADORES Y FOTOS)
  // ==========================================
  doc.addPage();
  drawHeader(3, 'Campos Técnicos Interiores (Pasos 5 al Final)');

  y = 24;

  // Paso 5: Canales y Conductores
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 47, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, contentWidth, 47, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...ucvBlue);
  doc.text('CAMPO 5: CANAL Y CONDUCTORES (DINÁMICO - MULTICANAL)', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Permite agregar tantos canales o vías como tenga la tanquilla mediante el botón "+ Agregar Nuevo Canal":', margin + 5, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('1. Referencia de Tanquilla o Destino del Canal:', margin + 7, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Indica hacia dónde va ese canal (ej. "TQ-02", "Hacia Subestación Eléctrica").', margin + 73, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('2. Conductores por Canal (+ Conductor):', margin + 7, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('Se pueden registrar uno o varios ternas de conductores dentro del mismo canal:', margin + 67, y + 21);

  doc.text('• Categoría: Desplegable con opciones exactas: PLT (Plomo), PP (Polietileno), OTROS.', margin + 11, y + 26);
  doc.text('• Calibre: Desplegable con: 1/0 AWG, 2/0 AWG, 3/0 AWG, 4/0 AWG, 250 MCM, 500 MCM, 350 MCM, OTRO.', margin + 11, y + 30.5);
  doc.text('• Cantidad: Número de conductores presentes en esa terna (ej. 3 para circuito trifásico).', margin + 11, y + 35);
  doc.text('• Cada conductor y cada canal cuenta con su respectivo botón para eliminar individualmente.', margin + 11, y + 39.5);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text('Esto modela fielmente la canalización subterránea real entre tanquillas adyacentes de la Ciudad Universitaria.', margin + 7, y + 44);

  y += 50;

  // Paso 6: Empalmes
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text('CAMPO 6: EMPALMES (DINÁMICO)', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Si dentro de la tanquilla existen uniones o empalmes de media tensión, se agregan con "+ Agregar Empalme":', margin + 5, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('• Tipo de Empalme:', margin + 7, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Selector directo de tres configuraciones: PP-PLT, PLT-PLT, o PP-PP.', margin + 35, y + 16);

  doc.setFont('helvetica', 'bold');
  doc.text('• Lado 1:', margin + 7, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('Cantidad numérica y Dirección de origen (ej. Cantidad: 1, Dirección: "hacia TQ-02, Eléctrica").', margin + 22, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('• Lado 2:', margin + 7, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.text('Cantidad numérica y Dirección de destino (ej. Cantidad: 1, Dirección: "hacia Transformador").', margin + 22, y + 26);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text('Si no hay empalmes en la tanquilla, la lista puede dejarse vacía sin bloquear el guardado.', margin + 7, y + 33);

  y += 41;

  // Pasos 7 y 8: Exclusivos de Transformador
  doc.setFillColor(254, 243, 199); // amber-50
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14); // amber-900
  doc.text('CAMPOS 7 Y 8: EXCLUSIVOS PARA TRANSFORMADORES', margin + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('Campo 7: Protecciones del Transformador', margin + 7, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('• Pregunta: ¿Tiene protecciones visibles / operativas? (Sí / No).', margin + 11, y + 16.5);
  doc.text('• Si es Sí: Campo de texto "Observaciones de Protecciones" (ej. fusibles seccionadores 15kV / 100A).', margin + 11, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('Campo 8: Conductores de MT al Transformador', margin + 7, y + 26.5);
  doc.setFont('helvetica', 'normal');
  doc.text('• Lista dinámica con botón "+ Agregar Conductor": Categoría (PLT, PP, OTROS), Calibre y Cantidad.', margin + 11, y + 31);

  y += 41;

  // Nodo Final: Observaciones y Fotos
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 39, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, contentWidth, 39, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryNavy);
  doc.text('NODO FINAL: OBSERVACIONES Y EVIDENCIAS FOTOGRÁFICAS', margin + 5, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateText);
  doc.text('• Observaciones Generales de Campo:', margin + 5, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text('Área de texto libre para notas físicas: presencia de agua, basura, tapas rotas, corrosión, etc.', margin + 58, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('• Fotos de Evidencia ("+ Tomar Foto / Subir Imagen"):', margin + 5, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.text('Permite usar directamente la cámara del celular o subir archivos desde la galería.', margin + 75, y + 18);
  doc.text('El sistema comprime y optimiza automáticamente las imágenes en el navegador antes de guardarlas.', margin + 9, y + 22.5);
  doc.text('Cada foto subida muestra miniatura, nombre y tamaño en KB, con opción de previsualizar en pantalla completa', margin + 9, y + 27);
  doc.text('(Lightbox) y botón rojo de papelera para eliminarla si salió borrosa.', margin + 9, y + 31.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...ucvBlue);
  doc.text('• Botón Azul Flotante: "Guardar Levantamiento y Agregar Otro" (Almacena de inmediato).', margin + 5, y + 36);

  drawFooter(3);

  // ==========================================
  // PÁGINA 4: GESTIÓN DE DATOS, EXPORTACIÓN Y FLUJO PASO A PASO
  // ==========================================
  doc.addPage();
  drawHeader(4, 'Gestión de Registros y Procedimiento en Campo');

  y = 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('4. CÓMO ADMINISTRAR Y EXPORTAR LA INFORMACIÓN', margin, y);
  y += 5;

  const mgmtBoxes = [
    {
      title: 'Consultar Fichas Técnicas (Pestaña Registros)',
      body: 'En la lista de registros, pulsa el botón con el ícono de ojo "Ver Detalle". Se abrirá la ficha técnica completa con todos los datos tabulados, canales con sus conductores, empalmes y la galería fotográfica completa con opción de descargar cada foto en resolución original.'
    },
    {
      title: 'Exportación a Microsoft Excel (.xlsx)',
      body: 'Desde el botón verde en la barra superior o en la pestaña "Exportar", se genera al instante un libro de Excel oficial dividido en 5 hojas limpias: Consolidado General, Tanquillas, Transformadores, Detalle de Canales y Conductores, y Empalmes.'
    },
    {
      title: 'Sincronización en la Nube con Google Sheets',
      body: 'La aplicación incluye un conector listo para Google Apps Script. Al pegar la URL del Webhook en la pestaña "Exportar", cada registro nuevo o existente puede enviarse automáticamente a una hoja de cálculo compartida en Google Drive.'
    },
    {
      title: 'Copia de Seguridad (.json)',
      body: 'Puedes pulsar "Exportar Copia de Seguridad" para guardar un archivo de respaldo con todos los registros y fotos, o importar una copia previa si cambias de teléfono o computadora.'
    }
  ];

  mgmtBoxes.forEach((b) => {
    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y, contentWidth, 19, 1.5, 1.5, 'F');
    doc.setDrawColor(...borderLight);
    doc.roundedRect(margin, y, contentWidth, 19, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...ucvBlue);
    doc.text(`▶ ${b.title}`, margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateText);
    const splitB = doc.splitTextToSize(b.body, contentWidth - 10);
    doc.text(splitB, margin + 5, y + 10.5);

    y += 21.5;
  });

  y += 2;

  // PROTOCOLO PASO A PASO EN CAMPO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...primaryNavy);
  doc.text('5. PROTOCOLO OPERATIVO EN CAMPO (PASO A PASO)', margin, y);
  y += 5.5;

  const campoSteps = [
    ['Paso 1', 'Abrir la web en el navegador del teléfono y verificar que el GPS esté encendido.'],
    ['Paso 2', 'Pararse junto a la estructura y pulsar "📍 Capturar GPS Actual". Comprobar la precisión en metros.'],
    ['Paso 3', 'Elegir Tipo (Tanquilla o Transformador) e ingresar el ID del plano o el ID nuevo asignado.'],
    ['Paso 4', 'Escribir la referencia de ubicación (puedes usar los botones sugeridos de la UCV).'],
    ['Paso 5', 'Verificar si se puede abrir la tanquilla: Si es Sí, contar canales, conductores y empalmes.'],
    ['Paso 6', 'Tomar al menos 2 fotografías (vista general del entorno y detalle interior/placa del transformador).'],
    ['Paso 7', 'Escribir cualquier observación relevante (daños, agua, tapas) y pulsar "Guardar Levantamiento".'],
    ['Paso 8', 'Al finalizar la jornada o llegar a una zona con Wi-Fi, descargar el Excel o sincronizar con Google Sheets.']
  ];

  campoSteps.forEach(([st, desc]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...ucvBlue);
    doc.text(`${st}:`, margin + 3, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateText);
    doc.text(desc, margin + 17, y);

    y += 4.5;
  });

  y += 4;

  // Pie institucional UCV
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryNavy);
  doc.text('UNIVERSIDAD CENTRAL DE VENEZUELA • PATRIMONIO DE LA HUMANIDAD (UNESCO)', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(...slateMuted);
  doc.text('Facultad de Ingeniería • Escuela de Ingeniería Eléctrica • Departamento de Potencia', margin + 5, y + 10.5);
  doc.text('Desarrollado como sistema oficial para el levantamiento, digitalización y catastro de redes de Media Tensión.', margin + 5, y + 14.5);
  doc.text('Ciudad Universitaria de Caracas, Los Chaguaramos, Caracas 1040, Venezuela.', margin + 5, y + 18.5);

  drawFooter(4);

  // Guardar archivo en disco
  const outputPath = path.resolve('./public/manual_levantamiento_ucv.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`Fiel PDF generado exitosamente en: ${outputPath} (${pdfBuffer.length} bytes, 4 páginas)`);
}

generatePDF();
