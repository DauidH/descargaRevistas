const socket = io();

const resultado = document.getElementById('resultado')

document.getElementById("activarRecomendaciones").onclick = function() {
    var div = document.getElementById("advertencia");
    div.classList.toggle('visible'); // Alterna la clase para mostrar/ocultar el div
};

// Función que ya tienes para el clic del botón
document.getElementById('btn-descarga').addEventListener('click', manejarDescarga);

// Agregar el event listener para el input
document.getElementById('link-descarga').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        manejarDescarga(); // Llama a la misma función que usas en el clic del botón
    }
});

// Función que maneja la lógica de descarga
async function manejarDescarga() {
    // Desactivar el botón y el input para prevenir más clics y eventos
    const btnDescarga = document.getElementById('btn-descarga');
    const inputLink = document.getElementById('link-descarga');
    btnDescarga.disabled = true;  // Desactivamos el botón
    inputLink.disabled = true;    // Desactivamos el input para que no se pueda escribir ni presionar Enter

    try {
        const linkDescarga = inputLink.value;
        
        if (isValidURL(linkDescarga)) {
            console.log(linkDescarga);
            let archivoEnrutador = '';
            if (linkDescarga.includes('fliphtml5')) archivoEnrutador = 'fliphtml5';
            else if (linkDescarga.includes('anyflip')) archivoEnrutador = 'anyflip';
            else if (linkDescarga.includes('flipsnack')) archivoEnrutador = 'flipsnack';
            else if (linkDescarga.includes('camacol')) archivoEnrutador = 'camacol';
            else if (linkDescarga.includes('semana.com')) archivoEnrutador = 'semana';
            else if (linkDescarga.includes('heyzine')) archivoEnrutador = 'heyzine';
            else if (linkDescarga.includes('ladevi')) archivoEnrutador = 'ladevi';
            else if (linkDescarga.includes('calameo')) archivoEnrutador = 'calameo';
            else if (linkDescarga.includes('issuu.com')) archivoEnrutador = 'issuu';
            else if (linkDescarga.includes('tabloide.com')) archivoEnrutador = 'tabloide';
            else if (linkDescarga.includes('yumpu.com')) archivoEnrutador = 'yumpu';
            else if (linkDescarga.includes('drive.google.com')) archivoEnrutador = 'googleDrive';

            avisos('Enlace no válido.');

            // Cambia el valor de _archivo en el servidor
            await fetch('/set-archivo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ archivo: archivoEnrutador })
            });

            avisos('Descarga iniciada, espera por favor.');
            const response = await fetch('/descargar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ linkDescarga }),
            });
            const result = await response.text();
            avisos(result);

            // Abrir el enlace de descarga en una nueva pestaña
            window.open(`/descargar-archivo/${archivoEnrutador}.pdf`, '_blank');
        } else {
            avisos('Enlace no válido.');
        }
    } catch (error) {
        console.error(error);
        avisos('Hubo un error al procesar la solicitud.');
    } finally {
        // Rehabilitamos el botón y el input después de que la función haya terminado
        btnDescarga.disabled = false;
        inputLink.disabled = false;
    }
}

// Función para mostrar avisos
function avisos(aviso) {
    resultado.innerText = aviso;
    resultado.style.opacity = '1';
    setTimeout(() => {
        resultado.style.opacity = '0';
    }, 5000);
}

// Función para validar el enlace
function isValidURL(string) {
    const res = string.match(/(https?:\/\/[^\s]+)/g);
    return (res !== null);
}

// Manejar la salida del servidor
socket.on('output', (data) => {
    const terminalDiv = document.querySelector('.terminal');
    terminalDiv.innerHTML += `<div>${data}</div>`;
    terminalDiv.scrollTop = terminalDiv.scrollHeight; // Desplazar hacia abajo
});