import puppeteer from 'puppeteer';
import axios from 'axios';
import { takeScreenshots } from '../funcionalidades/takeScreenshots.js';
import { eliminarArchivos } from '../funcionalidades/eliminarArchivos.js';
import { mandarMensaje } from '../funcionalidades/mandarMensaje.js';
import { crearPdf } from '../funcionalidades/crearPdf.js';
import { crearCarpetas } from '../funcionalidades/crearCarpetas.js';
import { getGeneralPath } from '../enrutador.js';

export async function descargarCalameo(linkDescarga, callback) {
    const generalPath = getGeneralPath();
    await eliminarArchivos(generalPath);
    const networkPath = await crearCarpetas();
    // Lanzar un nuevo navegador
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    const originalLinks = [];

    mandarMensaje('Estableciendo conexión, pronto comenzará la descarga...', callback);

    // Escuchar las solicitudes de red
    page.on('response', response => {
        const url = response.url();
        if (response.request().method() === 'GET' && url.includes('.svgz')) {
            mandarMensaje(`Respuesta recibida desde: ${url}`, callback);
            originalLinks.push(url);
        }
    });

    // Navegar a la página específica
    await page.goto(linkDescarga, {waitUntil: 'networkidle2', timeout: 340000});

    // Recargar la página
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Esperar 10 segundos para que se procesen las solicitudes
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Se crea waitFor para esperar dentro puppeter
    const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    await waitFor(10000);

    if (originalLinks.length === 0) {
        mandarMensaje('Iniciando Login, espera por fa.', callback)
        // Usuario contraseña
        await page.type('input[name="login"]', '830047431');
        await page.type('input[name="password"]', '830047431');
        await page.click('button.button-submit')
        await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Tomar el primer enlace
    const firstLink = originalLinks[0];
    mandarMensaje('Descargando desde: ' + firstLink, callback);

// Función para verificar si una URL existe
const checkUrlExists = async (url) => {
    try {
        const response = await axios.head(url);
        return response.status === 200; // Devuelve true si la URL existe
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false; // Devuelve false si la URL no existe
        }
        console.error(`Error al verificar la URL: ${error.message}`);
        return false; // En cualquier otro error, también devolvemos false
    }
};

// Función para agregar la URL al array
const addUrlToArray = (url, pageNumber) => {
    return url.replace(/p\d+.svgz/, `p${pageNumber}.svgz`);
};

// Bucle para agregar URLs al array hasta que ya no existan más páginas
const svgUrlArray = [];
let pageNumber = 1;
while (true) {
    const url = addUrlToArray(firstLink, pageNumber);
    const exists = await checkUrlExists(url); // Verifica si la URL existe

    if (!exists) break; // Salir del bucle si la URL no existe
    mandarMensaje(`Página ${pageNumber} añadida al array.`, callback);
    svgUrlArray.push(url); // Agrega la URL al array
    pageNumber++;
}

    // Tomar Screenshots
    let imagePaths = []
    imagePaths = await takeScreenshots(svgUrlArray, networkPath, callback)

    // Crear un nuevo PDF
    mandarMensaje('Creándose PDF, espera...', callback);
    await waitFor(5000);
    await crearPdf(imagePaths, networkPath, callback);
    mandarMensaje('PDF creado exitosamente en la ruta de red.', callback);
    mandarMensaje('PDF ORDENADO.', callback)

    imagePaths= [];

    // Cerrar el navegador
    await browser.close();
}