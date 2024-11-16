import puppeteer from 'puppeteer';
import axios from 'axios';
import fs, { link } from 'fs';
import path from 'path';
import { mandarMensaje } from '../funcionalidades/mandarMensaje.js';
import { eliminarArchivos } from '../funcionalidades/eliminarArchivos.js';
import { crearPdf } from '../funcionalidades/crearPdf.js';
import { getArchivo, getGeneralPath } from '../enrutador.js';
import { webpAjpg } from '../funcionalidades/webpAjpg.js';
import { crearCarpetas } from '../funcionalidades/crearCarpetas.js';

export async function descargarPaginasIteradas(linkDescarga, callback) {
    const generalPath = getGeneralPath();
    await eliminarArchivos(generalPath);
    const networkPath = await crearCarpetas();
    console.log(networkPath)
    // Lanzar un nuevo navegador
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    let originalLinks = [];

    mandarMensaje('Estableciendo conexión, pronto comenzará la descarga...', callback);

    let largestWidth = 0;
    const regex = /\/page_\d+\.jpg$/;
    // Escuchar las solicitudes de red
    page.on('response', response => {
        const url = response.url();
        if (response.request().method() === 'GET' &&
            (url.includes('original') || url.includes('.jpg?') || regex.test(url) || (url.includes('page=') && url.includes('/img?') && url.includes('w=')))) {
    
            if (getArchivo() === 'googleDrive') {
                // Extrae el valor de `w=` usando una expresión regular
                const widthMatch = url.match(/w=(\d+)/);
                if (widthMatch) {
                    const width = parseInt(widthMatch[1], 10);
        
                    if (width > largestWidth) {
                        // Actualiza el mayor ancho encontrado y resetea el array con el nuevo valor más alto
                        largestWidth = width;
                        originalLinks = [url]; // Reinicia el array con el enlace actual
                    } else if (width === largestWidth) {
                        // Solo agrega el enlace si tiene el mismo ancho máximo
                        originalLinks.push(url);
                    }
                }
                mandarMensaje(`Respuesta recibida desde: ${url} (ancho más grande encontrado: ${largestWidth})`, callback);
            } else {
                mandarMensaje(`Respuesta recibida desde: ${url}`, callback);
                originalLinks.push(url);
            }
            
        }
    });

    await page.goto(linkDescarga, { waitUntil: 'networkidle2', timeout: 340000 });

    // Recargar la página
    await page.reload({ waitUntil: 'networkidle2' });
    
    // Esperar 5 segundos para que se procesen las solicitudes
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Se crea waitFor para esperar dentro puppeter
    const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    if (getArchivo() === 'googleDrive') {
        await page.waitForSelector('[aria-label="Ampliar"]');
        await waitFor(1500);
    
        for (let i = 0; i < 12; i++) {
            await page.click('[aria-label="Ampliar"]');
        }
    }

    await waitFor(10000);

    // Tomar el primer enlace
    let firstLink = originalLinks[0];
    if (getArchivo() === 'yumpu') {
        originalLinks = originalLinks.filter(url => {
            const match = url.match(/(\d+)x(\d+)/);  // Buscamos el formato WxH
            if (match) {
                const width = parseInt(match[1]);
                const height = parseInt(match[2]);
                return width >= 1000 && height >= 1000;  // Filtramos si ambos valores son >= 1000
            }
            return false;  // Si no se encuentra resolución, no la incluimos
        });
        firstLink = originalLinks[0]
    }
    mandarMensaje('Descargando desde: ' + firstLink, callback);

    let formato = 'jpg';
    // Función para descargar la imagen
    const downloadImage = async (url, pageNumber) => {
        let newUrl;

        if (getArchivo() === 'flipsnack') {
            newUrl = url.replace(/page_\d+/, `page_${pageNumber}`); // para flipsnack
        } else if (getArchivo() === 'camacol') {
            newUrl = url.replace(/page\/\d+/, `page/${pageNumber}`); // para camacol
        } else if (getArchivo() === 'issuu') {
            newUrl = url.replace(/page_\d+/, `page_${pageNumber}`); // para issuu
            formato = 'webp'
        } else if (getArchivo() === 'yumpu') {
            newUrl = url.replace(/(https:\/\/img\.yumpu\.com\/\d+)\/(\d+)(\/)/, `$1/${pageNumber}$3`);
        } else if (getArchivo() === 'googleDrive') {
            newUrl = url.replace(/page=\d+/, `page=${pageNumber}`);  // para google drive
            formato = 'webp'
        }
        try {
            mandarMensaje(`Página ${pageNumber} = ${newUrl}`, callback)
            const response = await axios.get(newUrl, { responseType: 'arraybuffer' });
            const filePath = path.join(networkPath, `page_${pageNumber}.${formato}`); // Guardar en ruta de red
            fs.writeFileSync(filePath, response.data);
            return filePath;
        } catch (error) {
            console.error(`Error al descargar la página ${pageNumber}:`, error.message);
            return null; // Retornar null si hay un error
        }
    };

    // Bucle para descargar imágenes hasta el error 404
    let webpPaths = [];
    let imagePaths = [];
    let pageNumber = 1;
    if (getArchivo() === 'googleDrive') pageNumber = 0;
    console.log(pageNumber)
    while (true) {
        const result = await downloadImage(firstLink, pageNumber);
        if (result === null) break; // Salir si hay un error
        mandarMensaje(`Página ${pageNumber} descargada.`, callback);
        // if (getArchivo() != 'issuu' || getArchivo() != 'googleDrive' ) {imagePaths.push(result)}
        if (getArchivo() === 'issuu' || getArchivo() === 'googleDrive') {webpPaths.push(result)    
        } else {imagePaths.push(result)}
        pageNumber++;
    }

    if (formato === 'webp') {
        console.log(webpPaths)
        imagePaths = await webpAjpg(webpPaths, callback);
        console.log(imagePaths);
        // Limpiar imágenes descargadas
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            webpPaths.forEach(webpPath => {
                fs.unlinkSync(webpPath);
            });
            console.log('Archivos Webp eliminados correctamente.')
        } catch (error) {
            console.error('error al eliminar los webp: ' + error.message)
        }
    };

    // Crear un nuevo PDF
    mandarMensaje('Creándose PDF, espera...', callback);
    await waitFor(5000)
    await crearPdf(imagePaths, networkPath, callback);
    mandarMensaje('PDF ORDENADO.', callback)

    // Limpieza de arrays
    originalLinks = [];
    webpPaths = []
    imagePaths = [];

    // Cerrar el navegador
    await browser.close();
}