// Crear un nuevo PDF
import { mandarMensaje } from "./mandarMensaje.js";
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import sharp from "sharp";
import { getNameFile } from "./crearCarpetas.js";

export async function crearPdf(imagePaths, networkPath, callback) {
    try {
        const pdfDoc = await PDFDocument.create();
        let p = 1;

        for (const imagePath of imagePaths) {
            mandarMensaje(`Creando página ${p}.`, callback);
            let imageBytes;

            // Verifica si la imagen existe
            if (!fs.existsSync(imagePath)) {
                throw new Error(`La imagen no existe: ${imagePath}`);
            }

            let isPng = imagePath.toLowerCase().endsWith('.png');

            try {
                if (isPng) {
                    // Convertir PNG a JPG utilizando sharp
                    imageBytes = await sharp(imagePath)
                        .jpeg()
                        .toBuffer();

                    // Verifica el tamaño del buffer
                    if (imageBytes.length === 0) {
                        throw new Error(`El buffer de la imagen está vacío: ${imagePath}`);
                    }
                } else {
                    // Leer la imagen JPG directamente
                    imageBytes = fs.readFileSync(imagePath);
                    
                    // Verifica el tamaño del buffer
                    if (imageBytes.length === 0) {
                        throw new Error(`El buffer de la imagen JPG está vacío: ${imagePath}`);
                    }
                }
            } catch (error) {
                throw new Error(`Error al procesar la imagen: ${imagePath}. Detalles: ${error.message}`);
            }

            const jpgImage = await pdfDoc.embedJpg(imageBytes);
            const page = pdfDoc.addPage([jpgImage.width, jpgImage.height]);
            page.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: jpgImage.width,
                height: jpgImage.height,
            });

            p++;
        }

        // Verifica que `networkPath` sea accesible
        if (!fs.existsSync(networkPath)) {
            throw new Error(`La ruta de red no es válida: ${networkPath}`);
        }

        // Guardar el PDF en la ruta de red
        const pdfPath = path.join(networkPath, `${await getNameFile()}.pdf`);
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(pdfPath, pdfBytes);
        
        mandarMensaje('PDF creado exitosamente.', callback);
    } catch (error) {
        mandarMensaje(`Error: ${error.message}`, callback);
    }
}
