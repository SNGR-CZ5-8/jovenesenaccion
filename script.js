// --- PASO 1: CONFIGURACIÓN ---
const API_URL = "https://script.google.com/macros/s/AKfycbyhoY_XIO7WXtr_9EI5o84UMstYUcq2UnE6hExOTxcn5b8ZMhgCax2TZnKbvjR2SDA/exec"; // Asegúrate que esta URL esté correcta


// --- PASO 2: OBTENER ELEMENTOS DEL HTML ---
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const loader = document.getElementById('loader');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle'); // <--- Importante
let currentResultsData = [];


// --- PASO 3: LÓGICA DE BÚSQUEDA (No cambia) ---
searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query === "") {
        alert("Por favor, escribe un término de búsqueda (cédula, nombre o apellido).");
        return;
    }

    loader.style.display = 'block';
    resultsContainer.innerHTML = ''; 
    currentResultsData = []; 

    const fullUrl = `${API_URL}?buscar=${encodeURIComponent(query)}`;

    fetch(fullUrl)
        .then(response => response.json())
        .then(data => {
            loader.style.display = 'none';
            if (data.error) {
                showNoResults(`Error: ${data.error}`);
            } else if (data.length === 0) {
                showNoResults(`No se encontraron resultados para "${query}".`);
            } else {
                currentResultsData = data;
                data.forEach((participante, index) => {
                    const item = document.createElement('li');
                    item.className = 'result-item';
                    let nombreMostrado = `${participante.nombres || ''} ${participante.apellidos || ''}`.trim();
                    if (!nombreMostrado) {
                        nombreMostrado = `Cédula: ${participante.cedula || 'Sin Identificación'}`;
                    }
                    item.textContent = nombreMostrado;
                    item.dataset.index = index; 
                    item.addEventListener('click', () => openModal(index));
                    resultsContainer.appendChild(item);
                });
            }
        })
        .catch(error => {
            loader.style.display = 'none';
            showNoResults('Error de conexión. Revisa tu internet e intenta de nuevo.');
            console.error('Error en fetch:', error);
        });
});


// --- PASO 4: LÓGICA DEL MODAL (¡LA PARTE IMPORTANTE!) ---

function openModal(index) {
    const p = currentResultsData[index];
    
    // Limpiar el cuerpo del modal
    modalBody.innerHTML = '';
    
    // 1. Poner el Título en el h3
    modalTitle.textContent = `${p.nombres || ''} ${p.apellidos || ''}`.trim();
    
    // 2. Crear las dos columnas
    const col1 = document.createElement('div');
    col1.className = 'modal-col-1';
    
    const col2 = document.createElement('div');
    col2.className = 'modal-col-2';

    // 3. Función ayudante para el NUEVO formato (Etiqueta arriba, valor abajo)
    const crearFila = (etiqueta, valor) => {
        const div = document.createElement('div');
        div.className = 'data-pair'; // <-- Usa la clase CSS
        
        const strong = document.createElement('strong');
        strong.textContent = etiqueta + ":";
        
        const span = document.createElement('span');
        span.textContent = valor || 'N/A';
        
        div.appendChild(strong);
        div.appendChild(span);
        return div;
    };

    // 4. Llenar Columna 1: Datos Personales
    col1.appendChild(crearFila("Cédula", p.cedula));
    col1.appendChild(crearFila("Apellidos", p.apellidos));
    col1.appendChild(crearFila("Nombres", p.nombres));
    col1.appendChild(crearFila("Sexo", p.sexo));
    col1.appendChild(crearFila("Celular", p.celular));
    col1.appendChild(crearFila("Correo", p.correo));

    // 5. Llenar Columna 2: Ubicación y Actividad
    col2.appendChild(crearFila("Provincia", p.provincia));
    col2.appendChild(crearFila("Ciudad", p.ciudad));
    col2.appendChild(crearFila("Parroquia", p.parroquia));
    col2.appendChild(crearFila("Dirección", p.direccion));
    col2.appendChild(crearFila("Actividad General", p.actividades_general)); // Con 'a'
    col2.appendChild(crearFila("Actividad Específica", p.actividades_especificas));
    
    // 6. Añadir las columnas al cuerpo del modal (que es el grid)
    modalBody.appendChild(col1);
    modalBody.appendChild(col2);
    
    // 7. Mostrar el modal
    modalOverlay.style.display = 'flex';
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

// --- PASO 5: EVENTOS (No cambia) ---
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

function showNoResults(message) {
    resultsContainer.innerHTML = `<li class="no-results">${message}</li>`;
}
