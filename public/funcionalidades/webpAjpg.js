import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { mandarMensaje } from './mandarMensaje.js';

let jpgPaths = []

export async function webpAjpg(filesArray, callback) {   
    jpgPaths = []  
    try {
        for (const file of filesArray) {
            const filePath = path.resolve(file);
            const fileStat = fs.statSync(filePath);

            // Verifica si es un archivo y tiene la extensión .webp
            if (fileStat.isFile() && path.extname(file).toLowerCase() === '.webp') {
                const outputFilePath = path.join(path.dirname(file), path.basename(file, '.webp') + '.jpg');

                sharp(filePath)
                    .jpeg()
                    .toFile(outputFilePath);

                mandarMensaje(`Convertido: ${file} a ${path.basename(outputFilePath)}`, callback);
                jpgPaths.push(outputFilePath); // Añade la ruta del archivo convertido a jpgPaths
            }
        }
    } catch (error) {
        console.error('Error durante la conversión:', error);
    }
    return jpgPaths;
}