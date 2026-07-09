let pulseras = []; // Esta variable contendrá los productos activos de la página actual
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

// ==========================================================================
// 1. CARGAR BASE DE DATOS DINÁMICA (CORREGIDA PARA AMBAS CARDS)
// ==========================================================================
async function cargarBaseDeDatos() {
    try {
        // Por defecto cargamos las pulseras individuales
        let archivoJSON = './productos.json';

        // DETECCIÓN AUTOMÁTICA DE BASE DE DATOS SEGÚN LA PÁGINA
        if (window.location.href.includes('paquetes.html')) {
            archivoJSON = './paquete.json';
        } 
        // CORRECCIÓN: Agregamos explícitamente paqcard.html para que detecte el origen correcto
        else if (window.location.href.includes('pulcard.html') || window.location.href.includes('paqcard.html')) {
            const origen = sessionStorage.getItem('origenCatalogo');
            if (origen === 'paquetes') {
                archivoJSON = './paquete.json';
            }
        }

        // Petición al servidor con protección estricta anticaché para GitHub Pages
        const respuesta = await fetch(`${archivoJSON}?v=${new Date().getTime()}`);
        
        if (!respuesta.ok) {
            throw new Error(`No se pudo encontrar el archivo ${archivoJSON} (Código: ${respuesta.status})`);
        }
        
        pulseras = await respuesta.json();

        // Renderizado selectivo según los elementos estructurales presentes en el HTML
        if (document.querySelector('.Autos__menu')) {
            renderizarCatalogo();
        } 
        else if (document.getElementById('carrito') && document.getElementById('totalCarrito')) {
            renderizarResumenPedido();
        } 
        // Se ejecuta si encuentra el contenedor detalleNombre (común en ambas cards)
        else if (document.getElementById('detalleNombre')) {
            renderizarDetalleIndividual();
        }
    } catch (error) {
        console.error('Error al cargar la base de datos dinámica:', error);
    }
}

// ==========================================================================
// 2. DETALLE INDIVIDUAL (SOPORTA INTERFAZ PULCARD.HTML Y PAQCARD.HTML)
// ==========================================================================
function renderizarDetalleIndividual() {
    const idSeleccionado = parseInt(sessionStorage.getItem('autoDetalleId')); 
    if (!idSeleccionado) {
        window.location.href = 'index.html'; // Te devuelve al inicio por seguridad si no hay ID
        return;
    }

    const producto = pulseras.find(p => p.id === idSeleccionado);
    if (!producto) {
        console.error("No se encontró el producto con ID:", idSeleccionado);
        return;
    }

    // Inyectamos los datos básicos comunes presentes en ambas fichas técnicas
    document.getElementById('detalleNombre').textContent = producto.nombre;
    document.getElementById('detalleImagen').src = producto.imagen;
    document.getElementById('detalleImagen').alt = producto.nombre;
    document.getElementById('detallePrecio').innerHTML = `<strong>Precio:</strong> $${producto.precio.toLocaleString('es-AR')}`;
    document.getElementById('detalleDescripcion').textContent = producto.descripcion;

    // SI LA PÁGINA ABIERTA ES PULCARD.HTML (Busca la propiedad Medida)
    const elementoMedida = document.getElementById('detalleMedida');
    if (elementoMedida) {
        elementoMedida.innerHTML = `<strong>Medida:</strong> ${producto.Medida || 'No especificada'}`;
    }

    // SI LA PÁGINA ABIERTA ES PAQCARD.HTML (Muestra el bloque de Contenido)
    const elementoContenido = document.getElementById('detalleContenido');
    if (elementoContenido) {
        elementoContenido.innerHTML = `<strong>Contenido:</strong> Combo de Regalo Especial`;
    }

    // Inyectamos el botón de compra vinculando su ID único
    const contenedorBoton = document.getElementById('contenedorBotonComprar');
    if (contenedorBoton) {
        contenedorBoton.innerHTML = `
            <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">Agregar al Pedido</button>
        `;
    }
}

// ==========================================================================
// 3. CATÁLOGO GENERAL (INYECTA TARJETAS EN PULSERAS.HTML O PAQUETES.HTML)
// ==========================================================================
function renderizarCatalogo() {
    const menuProductos = document.querySelector('.Autos__menu');
    if (!menuProductos) return;
    menuProductos.innerHTML = '';

    pulseras.forEach(producto => {
        const articulo = document.createElement('article');
        articulo.classList.add('auto-tarjeta'); 
        articulo.innerHTML = `
            <section class="Autos__menu__div">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="auto-img" onclick="verDetalleAuto(${producto.id})" style="cursor: pointer;">
                <div class="auto-info">
                    <h3>${producto.nombre}</h3>
                    <p class="auto-hp">${producto.Medida ? `<strong>Medida:</strong> ${producto.Medida}` : producto.descripcion}</p>
                    <p class="auto-precio"><strong>Precio:</strong> $${producto.precio.toLocaleString('es-AR')}</p>
                    <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">Agregar al Pedido</button>
                </div>
            </section>
        `;
        menuProductos.appendChild(articulo);
    });
}

// VIAJE DEL CATÁLOGO A LA CARD: Elige dinámicamente si redirigir a pulcard.html o paqcard.html
function verDetalleAuto(id) {
    sessionStorage.setItem('autoDetalleId', Number(id));
    
    // Si la URL actual es la de paquetes, dejamos asentado el origen y mandamos a paqcard.html
    if (window.location.href.includes('paquetes.html')) {
        sessionStorage.setItem('origenCatalogo', 'paquetes');
        window.location.href = 'paqcard.html';
    } else {
        sessionStorage.setItem('origenCatalogo', 'pulseras');
        window.location.href = 'pulcard.html';
    }
}

// ==========================================================================
// 4. LOGICA DEL CARRITO DE COMPRAS Y PERSISTENCIA
// ==========================================================================
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

function renderizarResumenPedido() {
    const contenedorCarrito = document.getElementById('carrito');
    const contenedorTotal = document.getElementById('totalCarrito');
    if (!contenedorCarrito) return;

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = '<p class="carrito-vacio">No elegiste ningún artículo todavía.</p>';
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
                    <button class="btn-quitar" onclick="quitarDelCarrito(${item.id})"><img src="./borrar.png" alt="Quitar"></button>
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

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

// ==========================================================================
// 5. ENVÍO DEL PEDIDO A WHATSAPP Y MENSAJES FLOTANTES
// ==========================================================================
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
        alert('Tu carrito está vacío. Vuelve al catálogo para elegir sus artículos.');
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

    mensaje += `*DETALLE DE LAS PULSERAS Y COMBOS*%0A`;
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

    const urlWhatsApp = `https://wa.me{numeroWhatsApp}?text=${mensaje}`;

    localStorage.removeItem('carrito');
    carrito = [];

    window.open(urlWhatsApp, '_blank');
}

function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

function mostrarMensaje(texto) {
    const divMensaje = document.getElementById('mensaje');
    if (divMensaje) {
        divMensaje.textContent = texto;
        divMensaje.classList.add('mostrar');
        setTimeout(() => divMensaje.classList.remove('mostrar'), 2500);
    }
}

// ==========================================================================
// CONFIGURACIÓN OPTIMIZADA Y SEGURA DE PARTICLES.JS
// ==========================================================================
if (typeof particlesJS !== "undefined" && document.getElementById("particles-js")) {
    particlesJS("particles-js", {
        particles: {
            number: { 
                value: 150, 
                density: { enable: true, value_area: 800 } 
            },
            color: { value: "#ff6b6b" },
            shape: {
                type: "circle",
                stroke: { width: 0, color: "#000000" },
                polygon: { nb_sides: 5 }
            },
            opacity: {
                value: 1,
                random: true,
                anim: { enable: false, speed: 1, opacity_min: 0.1, sync: false }
            },
            size: {
                value: 10,
                random: true,
                anim: { enable: false, speed: 40, size_min: 0.1, sync: false }
            },
            line_linked: { enable: false },
            move: {
                enable: true,
                speed: 2,
                direction: "bottom",
                random: true,
                straight: true,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "bubble" },
                onclick: { enable: true, mode: "repulse" },
                resize: true
            },
            modes: {
                grab: { 
                    distance: 400, 
                    line_linked: { opacity: 1 } 
                },
                bubble: { 
                    distance: 250, 
                    size: 0, 
                    duration: 2, 
                    opacity: 0, 
                    speed: 3 
                },
                repulse: { distance: 400, duration: 0.4 },
                push: { particles_nb: 4 },
                remove: { particles_nb: 2 }
            }
        },
        retina_detect: true
    });
}

// Disparador del arranque de la base de datos al inicializar la ventana
document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);
