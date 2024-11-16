import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { mandarMensaje } from '../funcionalidades/mandarMensaje.js';
import { eliminarArchivos } from '../funcionalidades/eliminarArchivos.js';
import { crearPdf } from '../funcionalidades/crearPdf.js';
import { crearCarpetas } from '../funcionalidades/crearCarpetas.js';
import { getGeneralPath } from '../enrutador.js';

export async function descargarPaginasBlob(linkDescarga, callback) {
    const generalPath = getGeneralPath();
    await eliminarArchivos(generalPath);
    const networkPath = await crearCarpetas();
    mandarMensaje('Links tipo blob, ten paciencia y ordena el PDF al final.', callback)    
    // Lanzar un nuevo navegador
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Navegar a la página específica
    await page.goto(linkDescarga, { waitUntil: 'networkidle2', timeout: 340000 });

    await page.waitForSelector('.page-img-content');

    // Se crea waitFor para esperar dentro puppeteer
    const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const validImageUrls = []; // Array para almacenar las URLs de las imágenes

    const updateImageList = async () => {
        // Obtener todas las imágenes visibles en la página
        const newBlobUrls = await page.evaluate(async () => {
            const blobElements = document.querySelectorAll('.page-img-content');
            const imageUrls = Array.from(blobElements).map(element => element.src);
    
            // Crear un array para almacenar las dimensiones de las imágenes
            const imageInfo = await Promise.all(imageUrls.map(async (url) => {
                const response = await fetch(url);
                const blob = await response.blob();
                const imgBitmap = await createImageBitmap(blob);
                return { url, width: imgBitmap.width, height: imgBitmap.height };
            }));
    
            return imageInfo; // Retorna la información de las imágenes (url, width, height)
        });
    
        // Agregar solo las nuevas imágenes que sean mayores a 1500x1500
        newBlobUrls.forEach(({ url, width, height }) => {
            if (width > 1000 && height > 1000 && !validImageUrls.includes(url)) {
                validImageUrls.push(url);
                mandarMensaje(`Descargando desde: ${url} (${width}x${height})`, callback);
            }
        });
    };

    const clickZoomIcon = async () => {
        try {
            try {
                // Mantén presionada la tecla "Control" y luego presiona "+"
                await page.keyboard.down('Control');
                await page.keyboard.press('+');
                await page.mouse.wheel({ deltaY: -100 });
            } catch (error) {
                console.error('No se pudo hacer zoom con periféricos.', error.message);
            }
            await waitFor(1000)
            await page.waitForSelector('a.btnZoomMore.hz-icon.hz-icn-zoom-more[data-disable-events="true"][data-disable-zoom="true"]');
            const zoomMoreElement = await page.$('a.btnZoomMore.hz-icon.hz-icn-zoom-more[data-disable-events="true"][data-disable-zoom="true"]');
            if (zoomMoreElement) {
                for (let i = 0; i < 4; i++) {
                    await zoomMoreElement.click();
                    await waitFor(1000);
                }
            } else {
                console.error('No se encontró el botón de zoom más.');
            }
            await waitFor(3000);

            // Esperar a que aparezca el ícono de zoom y hacer clic en él
            // await page.waitForSelector('a.zoom-icon.hz-icon.zoom-icon-in[data-stats="zoom"]', { visible: true, timeout: 5000 });
            // let zoomIcon = await page.$('a.zoom-icon.hz-icon.zoom-icon-in[data-stats="zoom"]');
            // if (zoomIcon) {
            //     await zoomIcon.click(); // Haz clic en el ícono de zoom
            //     await waitFor(1000)
            //     await page.waitForSelector('a.btnZoomMore.hz-icon.hz-icn-zoom-more[data-disable-events="true"][data-disable-zoom="true"]');
            //     const zoomMoreElement = await page.$('a.btnZoomMore.hz-icon.hz-icn-zoom-more[data-disable-events="true"][data-disable-zoom="true"]');
            //     await zoomMoreElement.click();
            //     await waitFor(1000)
            //     await zoomMoreElement.click();
            //     await waitFor(1000)
            //     await zoomMoreElement.click();
            //     await waitFor(1000)
            //     await zoomMoreElement.click();
            //     await waitFor(3000)
            //     console.log('Ícono de zoom clicado con éxito.');
            // } else {
            //     console.log('No se encontró el ícono de zoom.');
            // }
        } catch (error) {
            console.error('Error al hacer clic en el ícono de zoom:', error.message);
        }
    };

    const pressRightArrowKey = async () => {
        try {
            await page.keyboard.press('ArrowRight'); // Presiona la tecla flecha derecha
            console.log('Tecla flecha derecha presionada.');
            await waitFor(5000); // Espera un poco para permitir que se cargue el nuevo contenido
    
            const initialImageCount = validImageUrls.length; // Número de imágenes antes de actualizar la lista
            await updateImageList(); // Actualiza la lista de imágenes después de cada pulsación de tecla
            const newImageCount = validImageUrls.length; // Número de imágenes después de actualizar la lista
    
            if (newImageCount > initialImageCount) {
                return true; // Si hay nuevas imágenes, continúa presionando la tecla
            } else {
                mandarMensaje('No se encontraron nuevas imágenes. Deteniendo la navegación.', callback);
                return false; // Si no hay nuevas imágenes, deja de presionar la tecla
            }
        } catch (error) {
            console.error('Error al presionar la tecla flecha derecha:', error.message);
            return false; // Detén el proceso en caso de error
        }
    };

    await clickZoomIcon();
    await waitFor(5000);

    // Repetir clic en el botón correr página
    for (let i = 0; i < 500; i++) { // Cambiar por veces a intentar
        const success = await pressRightArrowKey();
        if (!success) {
            break;
        }
    }

    console.log(validImageUrls);

    // Opcionalmente, guardar cada imagen en tu disco local
    const imagePaths = [];

    for (const imageUrl of validImageUrls) {
        const imageBuffer = await page.evaluate(async (blobUrl) => {
            const response = await fetch(blobUrl);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            return Array.from(new Uint8Array(buffer)); // Convertir a un array de bytes
        }, imageUrl);
    
        const fileName = `page_${validImageUrls.indexOf(imageUrl)+1}.png`;
        const filePath = path.join(networkPath, fileName);
        fs.writeFileSync(filePath, Buffer.from(imageBuffer));
        mandarMensaje(`Imagen ${validImageUrls.indexOf(imageUrl)+1} descargada`, callback);
        imagePaths.push(filePath)
    }

    // Crear un nuevo PDF
    mandarMensaje('Creándose PDF, espera...', callback);
    await waitFor(5000);
    await crearPdf(imagePaths, networkPath, callback);
    mandarMensaje('PDF creado exitosamente en la ruta de red.', callback);
    mandarMensaje('ORDENA EL PDF!!!.', callback)
    
    await browser.close();
}
