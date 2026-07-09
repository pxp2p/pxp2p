let pulseras = [];
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// CARGAR BASE DE DATOS
async function cargarBaseDeDatos() {
    try {
        // El './' asegura la búsqueda en la carpeta actual del repositorio de GitHub
        const respuesta = await fetch('./productos.json');
        
        // Verificación de seguridad para atrapar el error 404 antes de que rompa el JSON
        if (!respuesta.ok) {
            throw new Error(`No se pudo encontrar el archivo productos.json (Código: ${respuesta.status})`);
        }
        
        pulseras = await respuesta.json();

        // CORRECCIÓN: Separamos las ejecuciones para que una página no rompa a la otra
        if (document.querySelector('.Autos__menu')) {
            renderizarCatalogo();
        } 
        else if (document.getElementById('carrito') && document.getElementById('totalCarrito')) {
            renderizarResumenPedido();
        } 
        else if (document.getElementById('detalleNombre')) {
            renderizarDetalleIndividual();
        }
    } catch (error) {
        console.error('Error al cargar la base de datos de pulseras:', error);
    }
}

// PARA QUE SE VEA LA CARD INDIVIDUAL (pulcard.html)
function renderizarDetalleIndividual() {
    const idSeleccionado = parseInt(sessionStorage.getItem('autoDetalleId')); 
    if (!idSeleccionado) {
        window.location.href = 'pulseras.html';
        return;
    }

    const pulsera = pulseras.find(p => p.id === idSeleccionado);
    if (!pulsera) return;

    document.getElementById('detalleNombre').textContent = pulsera.nombre;
    document.getElementById('detalleImagen').src = pulsera.imagen;
    document.getElementById('detalleImagen').alt = pulsera.nombre;
    
    // Lee exactamente "Medida" desde tu JSON
    const elementoMedida = document.getElementById('detalleMedida');
    if (elementoMedida) {
        elementoMedida.innerHTML = `<strong>Medida:</strong> ${pulsera.Medida || 'No especificada'}`;
    }
    
    document.getElementById('detallePrecio').innerHTML = `<strong>Precio:</strong> $${pulsera.precio.toLocaleString('es-AR')}`;
    document.getElementById('detalleDescripcion').textContent = pulsera.descripcion;

    const contenedorBoton = document.getElementById('contenedorBotonComprar');
    if (contenedorBoton) {
        contenedorBoton.innerHTML = `
            <button class="btn-agregar" onclick="agregarAlCarrito(${pulsera.id})">Agregar al Pedido</button>
        `;
    }
}

// MOSTRAR LAS PULSERAS EN EL CATÁLOGO (pulseras.html)
function renderizarCatalogo() {
    const menuPulseras = document.querySelector('.Autos__menu');
    if (!menuPulseras) return;
    menuPulseras.innerHTML = '';

    pulseras.forEach(pulsera => {
        const articulo = document.createElement('article');
        articulo.classList.add('auto-tarjeta'); 
        articulo.innerHTML = `
            <section class="Autos__menu__div">
                <img src="${pulsera.imagen}" alt="${pulsera.nombre}" class="auto-img" onclick="verDetalleAuto(${pulsera.id})" style="cursor: pointer;">
                <div class="auto-info">
                    <h3>${pulsera.nombre}</h3>
                    <p class="auto-hp"><strong>Medida:</strong> ${pulsera.Medida}</p>
                    <p class="auto-precio"><strong>Precio:</strong> $${pulsera.precio.toLocaleString('es-AR')}</p>
                    <button class="btn-agregar" onclick="agregarAlCarrito(${pulsera.id})">Agregar al Pedido</button>
                </div>
            </section>
        `;
        menuPulseras.appendChild(articulo);
    });
}

// AGREGAR UNA PULSERA AL CARRITO 
function agregarAlCarrito(id) {
    const pulseraSeleccionada = pulseras.find(p => p.id === id);
    if (!pulseraSeleccionada) return;

    const itemExistente = carrito.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({
            id: pulseraSeleccionada.id,
            nombre: pulseraSeleccionada.nombre,
            precio: pulseraSeleccionada.precio,
            cantidad: 1
        });
    }

    guardarCarrito();
    mostrarMensaje(`¡${pulseraSeleccionada.nombre} agregada al pedido!`);
    
    if (document.getElementById('carrito')) {
        renderizarResumenPedido();
    }
}

// VER QUÉ ESTOY COMPRANDO (carrito.html)
function renderizarResumenPedido() {
    const contenedorCarrito = document.getElementById('carrito');
    const contenedorTotal = document.getElementById('totalCarrito');
    if (!contenedorCarrito) return;

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = '<p class="carrito-vacio">No elegiste ninguna pulsera todavía.</p>';
        if (contenedorTotal) contenedorTotal.textContent = '$0';
        return;
    }

    contenedorCarrito.innerHTML = '';
    let totalAcumulado = 0;

    carrito.forEach(item => {
        const datosCompletosPulsera = pulseras.find(p => p.id === item.id);
        const imagen = datosCompletosPulsera ? datosCompletosPulsera.imagen : 'Pulsera/default.png';

        const articulo = document.createElement('article');
        articulo.classList.add('auto-tarjeta', 'auto-tarjeta-resumen');

        articulo.innerHTML = `
            <section class="final-carrito-section">
                <img src="${imagen}" alt="${item.nombre}" class="auto-img-final" onclick="verDetalleAuto(${item.id})" style="cursor: pointer;">
                <div class="auto-info">
                    <h3>${item.nombre} (x${item.cantidad})</h3>
                    <p class="auto-precio"><strong>Total:</strong> $${(item.precio * item.cantidad).toLocaleString('es-AR')}</p>
                    <button class="btn-quitar" onclick="quitarDelCarrito(${item.id})">Quitar del pedido</button>
                </div>
            </section>
        `;
        contenedorCarrito.appendChild(articulo);
        totalAcumulado += item.precio * item.cantidad;
    });

    if (contenedorTotal) {
        contenedorTotal.textContent = `Total del Pedido: $${totalAcumulado.toLocaleString('es-AR')}`;
    }
}

function quitarDelCarrito(id) {
    const itemExistente = carrito.find(item => item.id === id);

    if (itemExistente) {
        if (itemExistente.cantidad > 1) {
            itemExistente.cantidad--;
        } else {
            carrito = carrito.filter(item => item.id !== id);
        }
    }
    guardarCarrito();
    renderizarResumenPedido();
}

// ENVIAR EL MENSAJE POR WHATSAPP
function enviarWhatsApp() {
    const nombre = document.getElementById('clienteNombre').value.trim();
    const telefono = document.getElementById('clienteTelefono').value.trim();
    const provincia = document.getElementById('clienteProvincia').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();

    if (!nombre || !telefono || !provincia || !direccion) {
        alert('Por favor, completa todos los campos del formulario antes de enviar.');
        return;
    }

    if (carrito.length === 0) {
        alert('Tu carrito está vacío. Vuelve al catálogo para elegir una pulsera.');
        return;
    }

    const numeroWhatsApp = "541128884710"; 
    let mensaje = `*¡Quiero esto!*%0A`;
    mensaje += `────────────────────%0A%0A`;

    mensaje += `*DATOS DEL COMPRADOR*%0A`;
    mensaje += `*Me llamo:* ${nombre}%0A`;
    mensaje += `*Teléfono:* ${telefono}%0A`;
    mensaje += `*Provincia:* ${provincia}%0A`;
    mensaje += `*Dirección:* ${direccion}%0A%0A`;

    mensaje += `*DETALLE DE LAS PULSERAS*%0A`;
    mensaje += `────────────────────%0A`;

    let totalAcumulado = 0;

    carrito.forEach(item => {
        mensaje += `*${item.nombre}*%0A`;
        mensaje += `  Cantidad: x${item.cantidad}%0A`;
        mensaje += `  Subtotal: $${(item.precio * item.cantidad).toLocaleString('es-AR')}%0A`;
        mensaje += `────────────────────%0A`;
        totalAcumulado += item.precio * item.cantidad;
    });

    mensaje += `%0A*TOTAL NETO ESTIMADO:*%0A`;
    mensaje += `*--- $${totalAcumulado.toLocaleString('es-AR')} ARS ---*%0A%0A`;
    mensaje += `_Pedido generado automáticamente desde la web del catálogo._`;

    // CORRECCIÓN: Agregada la barra inclinada '/' antes del número de teléfono para que la API de WhatsApp resuelva la URL
    const urlWhatsApp = `https://wa.me/${541128884710}?text=${mensaje}`;

    localStorage.removeItem('carrito');
    carrito = [];

    window.open(urlWhatsApp, '_blank');
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// CORRECCIÓN: Completada la función que había quedado cortada en el cierre
function mostrarMensaje(texto) {
    const divMensaje = document.getElementById('mensaje');
    if (divMensaje) {
        divMensaje.textContent = texto;
        divMensaje.classList.add('mostrar');
        setTimeout(() => divMensaje.classList.remove('mostrar'), 2500);
    }
}

function verDetalleAuto(id) {
    sessionStorage.setItem('autoDetalleId', id);
    window.location.href = 'pulcard.html';
}

// Ejecución al cargar el documento HTML
document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
