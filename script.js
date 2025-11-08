// --- PASO 1: CONFIGURACIÓN ---
// ¡¡IMPORTANTE!! Pega la URL de tu Google Apps Script aquí
const API_URL = "https://script.google.com/macros/s/AKfycbyhoY_XIO7WXtr_9EI5o84UMstYUcq2UnE6hExOTxcn5b8ZMhgCax2TZnKbvjR2SDA/exec";


// --- PASO 2: OBTENER ELEMENTOS DEL HTML ---
// No necesitas tocar esta parte

// Elementos del formulario
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');

// Elementos de resultados
const resultsContainer = document.getElementById('resultsContainer');
const loader = document.getElementById('loader');

// Elementos del Modal
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// Variable para guardar los datos de la última búsqueda
let currentResultsData = [];


// --- PASO 3: LÓGICA DE BÚSQUEDA ---

// Se ejecuta cuando el usuario hace clic en "Buscar"
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();

    // Validar que el campo no esté vacío
    if (query === "") {
        alert("Por favor, escribe un término de búsqueda (cédula, nombre o apellido).");
        return;
    }

    // Mostrar el spinner y limpiar resultados anteriores
    loader.style.display = 'block';
    resultsContainer.innerHTML = ''; 
    currentResultsData = []; // Limpiar datos guardados

    // Construir la URL completa (ej: .../exec?buscar=Ana)
    const fullUrl = `${API_URL}?buscar=${encodeURIComponent(query)}`;

    // Llamar a la API
    fetch(fullUrl)
        .then(response => response.json()) // Convertir la respuesta a JSON
        .then(data => {
            // Ocultar el spinner
            loader.style.display = 'none';

            // Manejar errores de la API (ej: hoja no encontrada)
            if (data.error) {
                showNoResults(`Error: ${data.error}`);
            } 
            // Manejar búsqueda sin resultados
            else if (data.length === 0) {
                showNoResults(`No se encontraron resultados para "${query}".`);
            } 
            // ¡Resultados encontrados!
            else {
                // Guardar los datos completos para usarlos en el modal
                currentResultsData = data;
                
                // Crear la lista de nombres clicables
                data.forEach((participante, index) => {
                    const item = document.createElement('li');
                    item.className = 'result-item';
                    
                    // IMPORTANTE: Asegúrate que los encabezados 'NOMBRES' y 'APELLIDOS'
                    // coincidan exactamente con tu Google Sheet.
                    let nombreMostrado = `${participante.NOMBRES || ''} ${participante.APELLIDOS || ''}`.trim();
                    if (!nombreMostrado) {
                        nombreMostrado = `Cédula: ${participante.CEDULA || 'Sin Identificación'}`;
                    }
                    item.textContent = nombreMostrado;
                    
                    // Guardar el índice del participante (0, 1, 2, etc.)
                    item.dataset.index = index; 
                    
                    // Añadir el evento para que al hacer clic, se abra el modal
                    item.addEventListener('click', () => openModal(index));
                    
                    resultsContainer.appendChild(item);
                });
            }
        })
        .catch(error => {
            // Manejar errores de red (ej: sin internet)
            loader.style.display = 'none';
            showNoResults('Error de conexión. Revisa tu internet e intenta de nuevo.');
            console.error('Error en fetch:', error);
        });
});


// --- PASO 4: LÓGICA DEL MODAL ---

/**
 * Abre el modal y lo llena con los datos del participante seleccionado.
 * @param {number} index - El índice (posición) del participante en el array 'currentResultsData'
 */
function openModal(index) {
    // Obtener los datos del participante que se hizo clic
    const p = currentResultsData[index]; // 'p' es el objeto del participante
    
    // Limpiar el cuerpo del modal
    modalBody.innerHTML = '';
    
    // --- CONTENIDO DEL MODAL PERSONALIZADO ---
    
    // 1. Título (Nombres y Apellidos)
    // (Asegúrate que 'NOMBRES' y 'APELLIDOS' coincidan con tu Sheet)
    const titulo = document.createElement('h3');
    titulo.textContent = `${p.NOMBRES || ''} ${p.APELLIDOS || ''}`.trim();
    modalBody.appendChild(titulo);
    
    // 2. Función ayudante para crear las filas <p><strong>Campo:</strong> Valor</p>
    const crearFila = (etiqueta, valor) => {
        const pElement = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = etiqueta + ":";
        
        pElement.appendChild(strong);
        
        // Añade el texto (valor) después del <strong>
        pElement.appendChild(document.createTextNode(` ${valor || 'N/A'}`)); 
        modalBody.appendChild(pElement);
    };

    // 3. Crear las filas en el orden exacto que pediste
    // IMPORTANTE: Los nombres (ej: 'CEDULA', 'ACTIVIDADES GENERLAL') 
    // deben coincidir EXACTAMENTE con tus encabezados en Google Sheets.
    
    crearFila("Cédula", p.CEDULA);
    crearFila("Apellidos", p.APELLIDOS);
    crearFila("Nombres", p.NOMBRES);
    crearFila("Actividad General", p["ACTIVIDADES GENERLAL"]); // Usar corchetes por el espacio
    crearFila("Actividad Específica", p["ACTIVIDADES ESPECIFICAS"]); // Usar corchetes por el espacio
    crearFila("Sexo", p.SEXO);
    crearFila("Provincia", p.PROVINCIA);
    crearFila("Ciudad", p.CIUDAD);
    crearFila("Parroquia", p.PARROQUIA);
    crearFila("Dirección", p.DIRECCION);
    crearFila("Celular", p.CELULAR);
    crearFila("Correo", p.CORREO);
    
    // --- FIN DEL CONTENIDO ---

    // 4. Mostrar el modal
    modalOverlay.style.display = 'flex';
}

/**
 * Cierra el modal
 */
function closeModal() {
    modalOverlay.style.display = 'none';
}

// Evento para cerrar el modal con el botón 'X'
modalClose.addEventListener('click', closeModal);

// Evento para cerrar el modal haciendo clic FUERA del contenido
modalOverlay.addEventListener('click', (event) => {
    // Si el clic fue en el fondo oscuro (overlay) y no en el modal-content
    if (event.target === modalOverlay) {
        closeModal();
    }
});

/**
 * Muestra un mensaje (ej: "No hay resultados") en el contenedor
 * @param {string} message - El mensaje a mostrar
 */
function showNoResults(message) {
    resultsContainer.innerHTML = `<li class="no-results">${message}</li>`;
}
