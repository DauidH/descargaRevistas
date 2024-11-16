import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { mandarMensaje } from '../funcionalidades/mandarMensaje.js';
import { eliminarArchivos } from '../funcionalidades/eliminarArchivos.js';
import { crearCarpetas, getNameFile } from '../funcionalidades/crearCarpetas.js';
import { getGeneralPath } from '../enrutador.js';

export async function descargarTabloide(linkDescarga, callback) {
    const generalPath = getGeneralPath();
    await eliminarArchivos(generalPath);
    const networkPath = await crearCarpetas();
    console.log('El networkpath es: ' + networkPath)
    mandarMensaje('Link de tabloide, sólo es ingresar y descargar el PDF. Toma unos instantes ;)', callback)    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    let originalLinks = [];

    page.on('response', async response => {
        const url = response.url();
        if (response.request().method() === 'GET' && (url.includes('.pdf'))) {
            mandarMensaje(`Respuesta recibida desde: ${url}`, callback);
            originalLinks.push(url);
        }
    });

    await page.setViewport({ width: 1025, height: 768 });
    await page.goto(linkDescarga, { waitUntil: 'networkidle2', timeout: 340000 });
    const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    async function logInTabloide() {
        mandarMensaje('Iniciando Login, espera por fa...', callback)
        let elemento = '.jeg_popuplink';
        await page.waitForSelector(elemento); 
        await page.click(elemento);
        await waitFor(5000);
        const inputSelector = 'input[placeholder="Usuario"]';
        await page.type(inputSelector, 'globalnews.group colombia');
        const passwordInputSelector = 'input[type="password"][placeholder="Contraseña"]';
        await page.type(passwordInputSelector, 'Globalnews2021')
        await page.click('input[name="jeg_login_button"]');
    }

    // Función para descargar la imagen
    const downloadPdf = async () => {
        const firstLink = originalLinks[0];
        mandarMensaje(`Descargando desde: ${firstLink}`, callback);
        try {
            const response = await axios.get(firstLink, { responseType: 'arraybuffer' });
            const filePath = path.join(networkPath, `${await getNameFile()}.pdf`); // Guardar en ruta de red
            fs.writeFileSync(filePath, response.data);
            return filePath;
        } catch (error) {
            console.error(`Error al descargar el pdf: `, error.message);
            return null; // Retornar null si hay un error
        }
    };

    await logInTabloide();
    await waitFor(10000);
    await page.evaluate((link) => {window.location.href = link}, linkDescarga);
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await waitFor(5000)
    await page.evaluate(() => window.scrollBy(0, 800));
    await waitFor(10000);
    mandarMensaje('Realizando descarga...', callback);
    await downloadPdf();

    mandarMensaje('PDF descargado exitosamente en la ruta de red.', callback);
    mandarMensaje('PDF ORDENADO.', callback)

    // Limpieza de arrays
    originalLinks = [];

    // Cerrar el navegador
    await browser.close();
}
