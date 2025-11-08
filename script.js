// --- PASO 1: CONFIGURACIÓN ---
const API_URL = "https://script.google.com/macros/s/AKfycbyhoY_XIO7WXtr_9EI5o84UMstYUcq2UnE6hExOTxcn5b8ZMhgCax2TZnKbvjR2SDA/exec"; // Asegúrate que esta URL esté correcta


// --- DOM ---
const searchButton = document.getElementById('searchButton');
const clearButton  = document.getElementById('clearButton');
const searchInput  = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');
const loader = document.getElementById('loader');
const helperText = document.getElementById('helperText');

const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalClose2  = document.getElementById('modalClose2');
const modalTitle   = document.getElementById('modalTitle');
const modalBody    = document.getElementById('modalDesc');
const modalAvatar  = document.getElementById('modalAvatar');

let currentResultsData = [];
let lastFocusedElement = null;

// Helpers
const qs  = (sel, ctx=document) => ctx.querySelector(sel);
const qsa = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const safe = (v) => (v ?? '').toString().trim();

function currentCriterion(){
  return (qs('input[name="crit"]:checked')?.value) || 'cedula';
}
function placeholderByCriterion(){
  const c = currentCriterion();
  if (c === 'apellidos') return "Ej.: 'Quilumba'";
  if (c === 'nombres')   return "Ej.: 'Karoly'";
  return "Ej.: 1753631652";
}
function initialsFrom(nombres, apellidos){
  const A = safe(apellidos).split(' ')[0]?.[0] || '';
  const N = safe(nombres).split(' ')[0]?.[0] || '';
  const ii = (N + A).toUpperCase().slice(0,2);
  return ii || 'SN';
}
function highlight(text, term){
  const v = safe(text);
  if (!v || !term) return v;
  const t = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${t})`, 'ig');
  return v.replace(re, '<mark>$1</mark>');
}

// Restringe caracteres si es cédula (solo dígitos)
function enforceCedulaMask(){
  if (currentCriterion() === 'cedula'){
    const digits = searchInput.value.replace(/\D+/g,'');
    if (searchInput.value !== digits) searchInput.value = digits;
  }
}

// React al cambio de criterio
qsa('input[name="crit"]').forEach(r=>{
  r.addEventListener('change', ()=>{
    searchInput.placeholder = placeholderByCriterion();
    enforceCedulaMask();
    searchInput.focus();
  });
});
searchInput.placeholder = placeholderByCriterion();

// Buscar
function performSearch(){
  const criterio = currentCriterion();
  let query = safe(searchInput.value);

  if (!query){
    alert("Escribe un término de búsqueda.");
    searchInput.focus();
    return;
  }

  // Normaliza query según criterio
  if (criterio === 'cedula'){
    query = query.replace(/\D+/g,''); // solo dígitos
    if (!query){
      alert("Para cédula, ingresa solo números.");
      searchInput.focus();
      return;
    }
  } else {
    query = query.toLowerCase();
  }

  loader.style.display = 'block';
  resultsContainer.innerHTML = '';
  currentResultsData = [];

  const url = `${API_URL}?buscar=${encodeURIComponent(query)}&criterio=${encodeURIComponent(criterio)}`;

  fetch(url)
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP '+r.status)))
    .then(data => {
      loader.style.display = 'none';

      if (!data || data.error){
        showNoResults(data?.error ? `Error: ${data.error}` : 'Respuesta vacía de la API.');
        return;
      }

      // FILTRO ESTRICTO EN EL CLIENTE SEGÚN CRITERIO
      const filtered = (Array.isArray(data) ? data : []).filter(p => matchesCriterion(p, criterio, query));

      if (filtered.length === 0){
        showNoResults(`No se encontraron resultados para "${safe(searchInput.value)}" con criterio "${criterio}".`);
        return;
      }

      currentResultsData = filtered;
      renderResults(filtered, safe(searchInput.value));
    })
    .catch(err=>{
      console.error('Error en fetch:', err);
      loader.style.display = 'none';
      showNoResults('Error de conexión. Verifica tu internet e inténtalo de nuevo.');
    });
}

function matchesCriterion(p, criterio, q){
  const ap = safe(p.apellidos).toLowerCase();
  const no = safe(p.nombres).toLowerCase();
  const ce = safe(p.cedula);

  if (criterio === 'cedula'){
    // coincide si contiene la secuencia numérica
    return ce.includes(q);
  }
  if (criterio === 'apellidos'){
    return ap.includes(q);
  }
  if (criterio === 'nombres'){
    return no.includes(q);
  }
  return false;
}

function showNoResults(msg){
  resultsContainer.innerHTML = `<li class="no-results">${msg}</li>`;
}

function renderResults(list, needle){
  resultsContainer.innerHTML = '';
  list.forEach((p, idx)=>{
    const nombre = `${safe(p.nombres)} ${safe(p.apellidos)}`.trim() || '(Sin nombre)';
    const cedula = safe(p.cedula);
    const provincia = safe(p.provincia);
    const ciudad = safe(p.ciudad);

    const li = document.createElement('li');
    li.className = 'item';
    li.tabIndex = 0;
    li.setAttribute('role','button');
    li.setAttribute('aria-label', `Abrir detalle de ${nombre}`);

    li.innerHTML = `
      <div class="i-main">
        <div class="avatar">${initialsFrom(p.nombres, p.apellidos)}</div>
        <div class="i-text">
          <div class="i-name">${highlight(nombre, needle)}</div>
          <div class="i-sub">Cédula: ${highlight(cedula, needle)}</div>
          <div class="i-sub">${[provincia, ciudad].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <span class="badge">Ver detalle</span>
    `;

    li.addEventListener('click', ()=>openModal(idx, li));
    li.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); openModal(idx, li);} });
    resultsContainer.appendChild(li);
  });
}

// Modal
function openModal(index, originEl=null){
  const p = currentResultsData[index];
  if (!p) return;

  lastFocusedElement = originEl || document.activeElement;

  modalTitle.textContent = `${safe(p.nombres)} ${safe(p.apellidos)}`.trim() || 'Participante';
  modalAvatar.textContent = initialsFrom(p.nombres, p.apellidos);

  modalBody.innerHTML = '';

  const col1 = document.createElement('div');
  const col2 = document.createElement('div');

  const pair = (label, value) => {
    const d = document.createElement('div');
    d.className = 'pair';
    d.innerHTML = `<strong>${label}</strong><span>${safe(value) || 'N/A'}</span>`;
    return d;
  };

  // Columna 1: Datos
  col1.appendChild(pair('Cédula', p.cedula));
  col1.appendChild(pair('Apellidos', p.apellidos));
  col1.appendChild(pair('Nombres', p.nombres));
  col1.appendChild(pair('Sexo', p.sexo));
  col1.appendChild(pair('Celular', p.celular));
  col1.appendChild(pair('Correo', p.correo));

  // Columna 2: Ubicación / Actividad
  col2.appendChild(pair('Provincia', p.provincia));
  col2.appendChild(pair('Ciudad', p.ciudad));
  col2.appendChild(pair('Parroquia', p.parroquia));
  col2.appendChild(pair('Dirección', p.direccion));
  col2.appendChild(pair('Actividad General', p.actividades_general));
  col2.appendChild(pair('Actividad Específica', p.actividades_especificas));

  modalBody.appendChild(col1);
  modalBody.appendChild(col2);

  modalOverlay.classList.add('show');
  modalClose.focus();

  document.addEventListener('keydown', handleModalKeys);
  modalOverlay.addEventListener('click', clickOutsideToClose);
}

function closeModal(){
  modalOverlay.classList.remove('show');
  document.removeEventListener('keydown', handleModalKeys);
  modalOverlay.removeEventListener('click', clickOutsideToClose);
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function'){
    lastFocusedElement.focus();
  }
}

function handleModalKeys(e){
  if (e.key === 'Escape'){ closeModal(); }
}

function clickOutsideToClose(e){
  if (e.target === modalOverlay){ closeModal(); }
}

// Eventos
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ performSearch(); }});
searchInput.addEventListener('input', enforceCedulaMask);

clearButton.addEventListener('click', ()=>{
  // Reset a estado inicial
  qs('#crit-cedula').checked = true;
  searchInput.value = '';
  searchInput.placeholder = placeholderByCriterion();
  resultsContainer.innerHTML = '';
  helperText.textContent = 'Presiona Enter para buscar rápidamente.';
  searchInput.focus();
});

modalClose.addEventListener('click', closeModal);
modalClose2.addEventListener('click', closeModal);
