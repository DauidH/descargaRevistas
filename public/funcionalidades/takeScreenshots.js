import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { mandarMensaje } from './mandarMensaje.js';

export async function takeScreenshots(urls, outputDirectory, callback) {
    // Lanza un navegador
    const browser = await puppeteer.launch();

    // Verifica que la carpeta de salida exista, si no, la crea
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }

    let screenshotPaths = []; // Array para almacenar las rutas de los archivos PNG generados

    for (let i = 0; i < urls.length; i++) {
        const page = await browser.newPage();
        const url = urls[i];
        const outputPath = path.join(outputDirectory, `page_${i + 1}.jpg`);

        try {
            // Navega a la URL proporcionada
            await page.goto(url, {
                waitUntil: 'networkidle2', // Espera hasta que no haya más de 2 conexiones de red
                timeout: 60000
            });

            // Define el tamaño del viewport
            const desiredWidth = 2160;
            const desiredHeight = 2790;

            // Ajusta el factor de escala para mejorar la calidad
            const deviceScaleFactor = 2; // Aumenta el valor para mayor calidad

            const viewportWidth = Math.floor(desiredWidth / deviceScaleFactor);
            const viewportHeight = Math.floor(desiredHeight / deviceScaleFactor);

            // Establece el tamaño del viewport
            await page.setViewport({
                width: viewportWidth,  // Ancho del viewport
                height: viewportHeight, // Alto del viewport
                deviceScaleFactor: deviceScaleFactor, // Aumenta la escala para mejorar la calidad
            });

            // Toma una captura de pantalla y guarda la ruta en el array
            await page.screenshot({ path: outputPath, fullPage: true });
            screenshotPaths.push(outputPath); // Agrega la ruta del archivo al array
            mandarMensaje(`Captura de pantalla guardada en: ${outputPath}`, callback);
        } catch (error) {
            console.error(`Error tomando la captura de ${url}:`, error);
        } finally {
            await page.close(); // Cierra la pestaña actual
        }
    }

    // Cierra el navegador
    await browser.close();

    // Retorna el array con las rutas de los archivos PNG generados
    return screenshotPaths;
}