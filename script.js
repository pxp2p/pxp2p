let pulseras = []; // Esta variable contendrá los productos activos de la página actual
let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let colorSeleccionadoActual = 'todos'; // Variable global para recordar el filtro activo

// ==========================================================================
// 1. CARGAR BASE DE DATOS DINÁMICA
// ==========================================================================
async function cargarBaseDeDatos() {
    try {
        let archivoJSON = './productos.json';

        if (window.location.href.includes('paquetes.html')) {
            archivoJSON = './paquete.json';
        } 
        else if (window.location.href.includes('pulcard.html') || window.location.href.includes('paqcard.html')) {
            const origen = sessionStorage.getItem('origenCatalogo');
            if (origen === 'paquetes') {
                archivoJSON = './paquete.json';
            }
        }

        const respuesta = await fetch(`${archivoJSON}?v=${new Date().getTime()}`);
        
        if (!respuesta.ok) {
            throw new Error(`No se pudo encontrar el archivo ${archivoJSON} (Código: ${respuesta.status})`);
        }
        
        pulseras = await respuesta.json();

        if (document.querySelector('.Autos__menu')) {
            renderizarCatalogo('todos'); // Al arrancar, muestra todos los productos
        } 
        else if (document.getElementById('carrito') && document.getElementById('totalCarrito')) {
            renderizarResumenPedido();
        } 
        else if (document.getElementById('detalleNombre')) {
            renderizarDetalleIndividual();
        }
    } catch (error) {
        console.error('Error al cargar la base de datos dinámica:', error);
    }
}

// ==========================================================================
// 2. DETALLE INDIVIDUAL (PULCARD Y PAQCARD)
// ==========================================================================
function renderizarDetalleIndividual() {
    const idSeleccionado = parseInt(sessionStorage.getItem('autoDetalleId')); 
    if (!idSeleccionado) {
        window.location.href = 'index.html';
        return;
    }

    const producto = pulseras.find(p => p.id === idSeleccionado);
    if (!producto) {
        console.error("No se encontró el producto con ID:", idSeleccionado);
        return;
    }

    document.getElementById('detalleNombre').textContent = producto.nombre;
    document.getElementById('detalleImagen').src = producto.imagen;
    document.getElementById('detalleImagen').alt = producto.nombre;
    document.getElementById('detallePrecio').innerHTML = `<strong>Precio:</strong> $${producto.precio.toLocaleString('es-AR')}`;
    document.getElementById('detalleDescripcion').textContent = producto.descripcion;

    const elementoMedida = document.getElementById('detalleMedida');
    if (elementoMedida) {
        elementoMedida.innerHTML = `<strong>Medida:</strong> ${producto.Medida || 'No especificada'}`;
    }

    const elementoContenido = document.getElementById('detalleContenido');
    if (elementoContenido) {
        elementoContenido.innerHTML = `<strong>Contenido:</strong> Combo de Regalo Especial`;
    }

    const contenedorBoton = document.getElementById('contenedorBotonComprar');
    if (contenedorBoton) {
        contenedorBoton.innerHTML = `
            <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">Agregar al Pedido</button>
        `;
    }
}

// ==========================================================================
// 3. CATÁLOGO GENERAL CON FILTRADO POR COLOR INTEGRADO
// ==========================================================================
function renderizarCatalogo(colorAFiltrar) {
    const menuProductos = document.querySelector('.Autos__menu');
    if (!menuProductos) return;
    menuProductos.innerHTML = '';

    // Filtrado inteligente: si es 'todos' muestra todo el JSON, sino compara estrictamente el color
    let productosAMostrar = pulseras;
    if (colorAFiltrar !== 'todos') {
        productosAMostrar = pulseras.filter(producto => producto.color === colorAFiltrar);
    }

    // Si el filtro no arroja resultados (ej: no hay pulseras rojas cargadas)
    if (productosAMostrar.length === 0) {
        menuProductos.innerHTML = '<p class="carrito-vacio" style="color: #6C757D;">No hay productos disponibles en este color por el momento.</p>';
        return;
    }

    productosAMostrar.forEach(producto => {
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

// Función que ejecutan los botones HTML al hacer clic
function filtrarPorColor(color) {
    colorSeleccionadoActual = color;
    renderizarCatalogo(color);

    // Lógica para mover la clase 'active' al botón presionado
    const botones = document.querySelectorAll('.btn-filtro');
    botones.forEach(btn => btn.classList.remove('active'));

    // Buscamos el botón que ejecutó la acción para encenderlo
    const botonActivo = Array.from(botones).find(btn => btn.getAttribute('onclick').includes(`'${color}'`));
    if (botonActivo) {
        botonActivo.classList.add('active');
    }
}

function verDetalleAuto(id) {
    sessionStorage.setItem('autoDetalleId', Number(id));
    if (window.location.href.includes('paquetes.html')) {
        sessionStorage.setItem('origenCatalogo', 'paquetes');
        window.location.href = 'paqcard.html';
    } else {
        sessionStorage.setItem('origenCatalogo', 'pulseras');
        window.location.href = 'pulcard.html';
    }
}

// ==========================================================================
// 4. LOGICA DEL CARRITO DE COMPRAS
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
            imagen: pulseraSeleccionada.imagen, 
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
        let imagen = item.imagen ? item.imagen : 'Pulsera/default.png';

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

    const urlWhatsApp = `https://wa.me{5491128884710}?text=${mensaje}`;

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
