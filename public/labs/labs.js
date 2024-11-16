import fs from 'fs';
import path from 'path';
import { crearPdf } from '../funcionalidades/crearPdf.js'; // Importa tu función

const carpetaDeImagenes = 'C:/Users/Julian Herrera/Desktop/SEMANAJS/archivos_descargados'; // Cambia a la ruta de tu carpeta
const networkPath = 'C:/Users/Julian Herrera/Desktop/SEMANAJS/public/labs'; // Cambia a donde quieres guardar el PDF

// Función para obtener las imágenes de la carpeta
function obtenerImagenes(carpeta) {
    const archivos = fs.readdirSync(carpeta);
    const imagenes = archivos
        .filter(archivo => {
            const ext = path.extname(archivo).toLowerCase();
            return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
        })
        .map(archivo => path.join(carpeta, archivo)); // Obtiene la ruta completa
        console.log(imagenes)
    return imagenes;
}

// Llamar a la función para obtener imágenes y pasar a crearPdf
const imagenes = obtenerImagenes(carpetaDeImagenes);
crearPdf(imagenes, networkPath, (mensaje) => {
    console.log(mensaje);
});

obtenerImagenes(carpetaDeImagenes);