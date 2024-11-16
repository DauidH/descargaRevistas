import { descargarPaginasIteradas } from './revistas/descargarPaginasIteradas.js';
import { descargarPaginasCifradas } from './revistas/descargarPaginasCifradas.js';
import { descargarPaginasBlob } from './revistas/descargarPaginasBlob.js';
import { descargarCalameo } from './revistas/calameo.js';
import { descargarTabloide } from './revistas/tabloide.js';

let _archivo = '';
let _generalPath = '\\\\192.168.1.153\\Area-Tecnologia\\DESCARGAREVISTASJS';

export function getGeneralPath() {
    return _generalPath;
}
export function getArchivo() {
    return _archivo;
}
export async function setArchivo(nuevoNombre) {
    _archivo = nuevoNombre;
}
export async function descargar(linkDescarga, callback) {
    if (_archivo === 'flipsnack' || _archivo === 'camacol' || _archivo === 'issuu' || _archivo === 'yumpu' || _archivo === 'googleDrive') {await descargarPaginasIteradas(linkDescarga, callback)} // Páginas iteradas
    else if (_archivo === 'anyflip' || _archivo === 'semana' || _archivo === "fliphtml5") {await descargarPaginasCifradas(linkDescarga, callback)} // Páginas cifradas
    else if (_archivo === 'heyzine' || _archivo === 'ladevi') {await descargarPaginasBlob(linkDescarga, callback)} // URLs Blob cifradas
    else if (_archivo === 'calameo') {await descargarCalameo(linkDescarga, callback)} // Screenshot
    else if (_archivo === 'tabloide') {await descargarTabloide(linkDescarga, callback)} // Sólo toma el PDF y ya.
}