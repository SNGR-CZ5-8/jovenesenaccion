// --- PASO 1: CONFIGURACIÓN ---
// ¡¡IMPORTANTE!! Pega la URL de tu Google Apps Script aquí
const API_URL = "https://script.google.com/macros/s/AKfycbyhoY_XIO7WXtr_9EI5o84UMstYUcq2UnE6hExOTxcn5b8ZMhgCax2TZnKbvjR2SDA/exec";


// --- PASO 2: OBTENER ELEMENTOS DEL HTML ---
const searchButton = document.getElementById('searchButton');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const loader = document.getElementById('loader');
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
let currentResultsData = [];


// --- PASO 3: LÓGICA DE BÚSQUEDA ---
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
                    
                    // --- CAMBIO AQUÍ ---
                    // Ahora usamos las llaves limpias: 'nombres' y 'apellidos'
                    let nombreMostrado = `${participante.nombres || ''} ${participante.apellidos || ''}`.trim();
                    if (!nombreMostrado) {
                        // Y 'cedula' como fallback
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


// --- PASO 4: LÓGICA DEL MODAL ---

function openModal(index) {
    const p = currentResultsData[index];
    modalBody.innerHTML = '';
    
    // --- CAMBIO AQUÍ ---
    // El objeto 'p' ahora tiene llaves limpias. 
    // ej: p.cedula, p.actividades_general, p.direccion
    
    // Título
    const titulo = document.createElement('h3');
    titulo.textContent = `${p.nombres || ''} ${p.apellidos || ''}`.trim();
    modalBody.appendChild(titulo);
    
    const crearFila = (etiqueta, valor) => {
        const pElement = document.createElement('p');
        const strong = document.createElement('strong');
        strong.textContent = etiqueta + ":";
        pElement.appendChild(strong);
        pElement.appendChild(document.createTextNode(` ${valor || 'N/A'}`)); 
        modalBody.appendChild(pElement);
    };

    // --- CAMBIO GRANDE AQUÍ ---
    // Usamos las llaves normalizadas (minúsculas, sin tildes, con guion bajo)
    // No importa si tu hoja dice "Cédula", "ACTIVIDADES GENERLAL" o "Dirección".
    
    crearFila("Cédula", p.cedula);
    crearFila("Apellidos", p.apellidos);
    crearFila("Nombres", p.nombres);
    crearFila("Actividad General", p.actividades_generlal); // Corregido de tu tipeo
    crearFila("Actividad Específica", p.actividades_especificas);
    crearFila("Sexo", p.sexo);
    crearFila("Provincia", p.provincia);
    crearFila("Ciudad", p.ciudad);
    crearFila("Parroquia", p.parroquia);
    crearFila("Dirección", p.direccion);
    crearFila("Celular", p.celular);
    crearFila("Correo", p.correo);
    
    // --- FIN DEL CAMBIO ---

    modalOverlay.style.display = 'flex';
}

function closeModal() {
    modalOverlay.style.display = 'none';
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

function showNoResults(message) {
    resultsContainer.innerHTML = `<li class="no-results">${message}</li>`;
}
