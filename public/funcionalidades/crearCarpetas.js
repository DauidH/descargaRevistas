import fs from 'fs';
import path from 'path';
import { getArchivo, getGeneralPath } from '../enrutador.js';

let _carpeta = '';
let _nombreArchivo = '';
export async function getNameFile() {
    return _nombreArchivo
}

export async function crearCarpetas() {
    // Obtener la fecha y hora actuales
    const generalPath = getGeneralPath();
    const now = new Date();
    const fecha = now.toISOString().split('T')[0].replace(/-/g, ''); // YYYY-MM-DD
    const hora = now.toTimeString().split(' ')[0].replace(/:/g, ''); // HH-MM-SS

    // Crear un nombre de carpeta
    const nombreCarpeta = `${getArchivo()}${fecha}_${hora}`;
    _nombreArchivo = nombreCarpeta;
    const rutaCarpeta = path.join(generalPath, nombreCarpeta);

    // Crear la carpeta
    if (!fs.existsSync(rutaCarpeta)) {
        fs.mkdirSync(rutaCarpeta);
        console.log(`Carpeta creada: ${rutaCarpeta}`);
    }
    _carpeta = nombreCarpeta;

    return rutaCarpeta; // Devuelve la ruta de la carpeta creada
};

export function getCarpeta () {
    return _carpeta;
};