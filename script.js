let autos = [];

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
//  EL CARRITO
async function cargarBaseDeDatos() {
    try {
        const respuesta = await fetch('productos.json');
        autos = await respuesta.json();

        // Ejecutar la función correspondiente según la página actual
        if (document.querySelector('.Autos__menu')) {
            renderizarCatalogo();
        }
        if (document.getElementById('carrito')) {
            renderizarResumenPedido();
        }
        if (document.getElementById('detalleNombre')) {
            renderizarDetalleIndividual();
        }
    } catch (error) {
        console.error('Error al cargar la base de datos de autos:', error);
    }
}
// PARA QUE SE VEA LA CARD
function renderizarDetalleIndividual() {
    const idSeleccionado = parseInt(sessionStorage.getItem('autoDetalleId'));
    if (!idSeleccionado) {
        window.location.href = 'index.html';
        return;
    }

    const auto = autos.find(a => a.id === idSeleccionado);
    if (!auto) return;

    document.getElementById('detalleNombre').textContent = auto.nombre;
    document.getElementById('detalleImagen').src = auto.imagen;
    document.getElementById('detalleImagen').alt = auto.nombre;
    document.getElementById('detallePotencia').innerHTML = `<strong>Potencia:</strong> ${auto.caballos_de_fuerza} HP`;
    document.getElementById('detallePrecio').innerHTML = `<strong>Precio:</strong> $${auto.precio.toLocaleString('es-AR')}`;
    document.getElementById('detalleDescripcion').textContent = auto.descripcion;

    const contenedorBoton = document.getElementById('contenedorBotonComprar');
    contenedorBoton.innerHTML = `
        <button class="btn-agregar" onclick="agregarAlCarrito(${auto.id})">Agregar al Pedido</button>
    `;
}

// MOSTRAR LOS AUTOS EN EL CATÁLOGO (index.html)
function renderizarCatalogo() {
    const menuAutos = document.querySelector('.Autos__menu');
    menuAutos.innerHTML = '';

    autos.forEach(auto => {
        const articulo = document.createElement('article');
        articulo.classList.add('auto-tarjeta');
        articulo.innerHTML = `
    <!-- Al agregar onclick y cursor pointer, la imagen se vuelve cliqueable -->
    <section class="Autos__menu__div">
    <img src="${auto.imagen}" alt="${auto.nombre}" class="auto-img" onclick="verDetalleAuto(${auto.id})" style="cursor: pointer;">
    
    <div class="auto-info">
        <h3>${auto.nombre}</h3>
        <p class="auto-hp"><strong>Potencia:</strong> ${auto.caballos_de_fuerza} HP</p>
        <p class="auto-precio"><strong>Precio:</strong> $${auto.precio.toLocaleString('es-AR')}</p>
        <button class="btn-agregar" onclick="agregarAlCarrito(${auto.id})">Agregar al Pedido</button>
    </div>
    </section>
`;
        menuAutos.appendChild(articulo);
    });
}

//  AGREGAR UN AUTO AL CARRITO 
function agregarAlCarrito(id) {
    const autoSeleccionado = autos.find(auto => auto.id === id);
    const itemExistente = carrito.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({
            id: autoSeleccionado.id,
            nombre: autoSeleccionado.nombre,
            precio: autoSeleccionado.precio,
            cantidad: 1
        });
    }

    guardarCarrito();
    mostrarMensaje(`¡${autoSeleccionado.nombre} agregado al pedido!`);
}

// VER QUE ESTOY COMPRANDO
function renderizarResumenPedido() {
    const contenedorCarrito = document.getElementById('carrito');
    const contenedorTotal = document.getElementById('totalCarrito');

    if (carrito.length === 0) {
        contenedorCarrito.innerHTML = '<p class="carrito-vacio">No elegiste ningún auto todavía.</p>';
        contenedorTotal.textContent = '$0';
        return;
    }

    contenedorCarrito.innerHTML = '';
    let totalAcumulado = 0;

    carrito.forEach(item => {
        const datosCompletosAuto = autos.find(auto => auto.id === item.id);

        
        const imagen = datosCompletosAuto ? datosCompletosAuto.imagen : 'Autos img/default.jpg';
        const hp = datosCompletosAuto ? datosCompletosAuto.caballos_de_fuerza : 'N/A';
        const descripcion = datosCompletosAuto ? datosCompletosAuto.descripcion : '';

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

    contenedorTotal.textContent = `Total del Pedido: $${totalAcumulado.toLocaleString('es-AR')}`;
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

// ENVIAR EL MENSAJE POR WHATSAPP (es mi numero para que se use de ejemplo)
function enviarWhatsApp() {
    // Capturamos los datos y les quitamos los espacios de más al inicio y final
    const nombre = document.getElementById('clienteNombre').value.trim();
    const telefono = document.getElementById('clienteTelefono').value.trim();
    const provincia = document.getElementById('clienteProvincia').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();

    //  Que ningún campo esté vacío
    if (!nombre || !telefono || !provincia || !direccion) {

        return;
    }



    //  Que el carrito no esté vacío
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. Vuelve al catálogo para elegir un auto.');
        return;
    }

    // Si pasa todas las validaciones, se arma el mensaje para WhatsApp
    const numeroWhatsApp = "541128884710";
    let mensaje = ` *¡Quiero estos autos ya!* %0A`;
    mensaje += `────────────────────%0A%0A`;

    mensaje += ` *DATOS DEL COMPRADOR*%0A`;
    mensaje += ` *Me llamo:* ${nombre}%0A`;
    mensaje += ` *Teléfono:* ${telefono}%0A`;
    mensaje += ` *Provincia:* ${provincia}%0A`;
    mensaje += ` *Dirección:* ${direccion}%0A%0A`;

    mensaje += ` *DETALLE DEL GARAJE*%0A`;
    mensaje += `────────────────────%0A`;

    let totalAcumulado = 0;

    carrito.forEach(item => {
        mensaje += ` *${item.nombre}*%0A`;
        mensaje += `   Cantidad: x${item.cantidad}%0A`;
        mensaje += `   Subtotal: $${(item.precio * item.cantidad).toLocaleString('es-AR')}%0A`;
        mensaje += ` ────────────────────%0A`;
        totalAcumulado += item.precio * item.cantidad;
    });

    mensaje += `%0A *TOTAL NETO ESTIMADO:*%0A`;
    mensaje += ` *--- $${totalAcumulado.toLocaleString('es-AR')} ARS ---*%0A%0A`;
    mensaje += ` _Pedido generado automáticamente desde la web del catálogo._`;


    const urlWhatsApp = `https://wa.me/5491128884710?text=${mensaje}`;

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

document.addEventListener('DOMContentLoaded', cargarBaseDeDatos);

function verDetalleAuto(id) {
    sessionStorage.setItem('autoDetalleId', id);
    window.location.href = 'autocard.html';
}

particlesJS("particles-js", {
  particles: {
    number: { value: 160, density: { enable: true, value_area: 800 } },
    color: { value: "#dd5800" },
    shape: {
      type: "circle",
      stroke: { width: 0, color: "#dd5800" },
      polygon: { nb_sides: 5 },
      image: { src: "img/github.svg", width: 100, height: 100 }
    },
    opacity: {
      value: 1,
      random: true,
      anim: { enable: true, speed: 1, opacity_min: 0, sync: false }
    },
    size: {
      value: 12,
      random: true,
      anim: { enable: false, speed: 4, size_min: 0.3, sync: false }
    },
    line_linked: {
      enable: false,
      distance: 150,
      color: "#ffffff",
      opacity: 0.4,
      width: 1
    },
    move: {
      enable: true,
      speed: 1,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: { enable: false, rotateX: 600, rotateY: 600 }
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
      grab: { distance: 400, line_linked: { opacity: 1 } },
      bubble: { distance: 250, size: 0, duration: 2, opacity: 0, speed: 3 },
      repulse: { distance: 400, duration: 0.4 },
      push: { particles_nb: 4 },
      remove: { particles_nb: 2 }
    }
  },
  retina_detect: true
});
var count_particles, stats, update;
stats = new Stats();
stats.setMode(0);
stats.domElement.style.position = "absolute";
stats.domElement.style.left = "0px";
stats.domElement.style.top = "0px";
document.body.appendChild(stats.domElement);
count_particles = document.querySelector(".js-count-particles");
update = function () {
  stats.begin();
  stats.end();
  if (window.pJSDom[0].pJS.particles && window.pJSDom[0].pJS.particles.array) {
    count_particles.innerText = window.pJSDom[0].pJS.particles.array.length;
  }
  requestAnimationFrame(update);
};
requestAnimationFrame(update);