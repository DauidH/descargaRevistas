import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { descargar, getArchivo, getGeneralPath, setArchivo } from './public/enrutador.js';
import { getNameFile } from './public/funcionalidades/crearCarpetas.js';

import http from 'http';
import { Server } from 'socket.io';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Nueva ruta para actualizar la variable _archivo
app.post('/set-archivo', async (req, res) => {
    const { archivo } = req.body;
    if (archivo) {
        await setArchivo(archivo);  // Actualiza _archivo en enrutador.js
        console.log('El archivo es: ' + getArchivo())
        res.send(`Archivo actualizado a: ${archivo}`);
    } else {
        res.status(400).send('Archivo no válido.');
    }
});

app.post('/descargar', async (req, res) => {
    const { linkDescarga } = req.body;
    io.emit('output', 'Iniciando descarga...');

    try {
        await descargar(linkDescarga, (output) => {
            io.emit('output', output); // Envía cada mensaje de la descarga
        });
        res.send('Descarga realizada exitosamente.');
    } catch (error) {
        console.error('Error al iniciar la descarga:', error);
        res.status(500).send('Error al iniciar la descarga: ' + error.message);
    }
});

// Nueva ruta para descargar archivos almacenados
app.get('/descargar-archivo/:nombreArchivo', async (req, res) => {
    try {
        const generalPath = getGeneralPath();
        const folderName = await getNameFile(); // Asegúrate de que esto esté en una función async

        const filePath = path.join(`${generalPath}\\${folderName}`, `${folderName}.pdf`);
        console.log('filepath en el server: ' + filePath);

        // Verifica si el archivo existe
        fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
                return res.status(404).send('No se pudo descargar el PDF, pero verifica en la ruta de red, tal vez encuentres el PDF o las imágenes.');
            }

            // Envía el archivo como descarga
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error al descargar el archivo:', err);
                    res.status(500).send('Error al descargar el archivo');
                }
            });
        });
    } catch (error) {
        console.error('Error al obtener el nombre del archivo:', error);
        res.status(500).send('Error interno del servidor');
    }
});


io.on('connection', (socket) => {
    console.log('Un usuario se ha conectado');
});

server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});