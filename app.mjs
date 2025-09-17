import { openDB } from "https://cdn.jsdelivr.net/npm/idb@7/+esm";

// -----------------------
// Elementos del DOM
// -----------------------
const container = document.getElementById('videos-container');
const formVideos = document.getElementById('form-video');
const tituloVideo = document.getElementById('titulo');
const urlVideo = document.getElementById('url');
const idInput = document.getElementById('Id');
const botonSubmit = document.getElementById('boton-submit');
const mensajeVacio = document.getElementById('mensaje-vacio');
const videoUpload = document.getElementById('video-upload');
const addVideoBtn = document.getElementById('add-video-btn');
const player = document.getElementById('player');

// -----------------------
// Inicializar IndexedDB
// -----------------------
async function initDB() {
  return await openDB('videosDB', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos', { keyPath: 'id' });
      }
    }
  });
}

// -----------------------
// Guardar video (Agregar o Editar)
// -----------------------
async function saveVideo(videoData) {
  if (!videoData.id) videoData.id = crypto.randomUUID();
  const db = await initDB();
  const tx = db.transaction('videos', 'readwrite');
  await tx.store.put(videoData);
  await tx.done;
  console.log('Video agregado/actualizado:', videoData.titulo, videoData.id);
}

// -----------------------
// Eliminar video
// -----------------------
async function deleteVideo(videoId) {
  const db = await initDB();
  const tx = db.transaction('videos', 'readwrite');
  await tx.store.delete(videoId);
  await tx.done;
  console.log('Video eliminado:', videoId);
  renderVideos();
}

// -----------------------
// Obtener todos los videos
// -----------------------
async function getAllVideos() {
  const db = await initDB();
  return await db.getAll('videos');
}

// -----------------------
// Guardar / Cargar estados de "Visto"
// -----------------------
function cargarEstadosVistos() {
  const vistos = JSON.parse(localStorage.getItem('videosVistos'));
  return vistos && typeof vistos === 'object' ? vistos : {};
}

function guardarEstadosVistos(vistos) {
  localStorage.setItem('videosVistos', JSON.stringify(vistos));
}

// -----------------------
// Crear botones dinámicos
// -----------------------
function crearBotonVisto(video, vistos) {
  const boton = document.createElement('button');
  boton.textContent = vistos[video.id] ? 'Visto ✅' : 'Marcar como visto';
  boton.className = vistos[video.id] ? 'visto' : 'marcar-btn';

  boton.addEventListener('click', (e) => {
    e.stopPropagation();
    if (vistos[video.id]) {
      delete vistos[video.id];
      boton.className = 'marcar-btn';
      boton.textContent = 'Marcar como visto';
    } else {
      vistos[video.id] = true;
      boton.className = 'visto';
      boton.textContent = 'Visto ✅';
    }
    guardarEstadosVistos(vistos);
  });

  return boton;
}

function crearBotonEliminar(video) {
  const boton = document.createElement('button');
  boton.textContent = '🗑 Eliminar';
  boton.classList.add('marcar-btn');

  boton.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteVideo(video.id);
  });

  return boton;
}

function crearBotonEditar(video) {
  const boton = document.createElement('button');
  boton.textContent = '✏️ Editar';
  boton.classList.add('marcar-btn');

  boton.addEventListener('click', () => {
    tituloVideo.value = video.titulo;
    urlVideo.value = video.url || '';
    idInput.value = video.id;
    botonSubmit.textContent = 'Guardar Cambios';
  });

  return boton;
}

// -----------------------
// Renderizar videos
// -----------------------
async function renderVideos() {
  container.innerHTML = '';
  const videos = await getAllVideos();
  const vistos = cargarEstadosVistos();

  if (videos.length === 0) {
    mensajeVacio.style.display = 'block';
    return;
  } else {
    mensajeVacio.style.display = 'none';
  }

  videos.forEach(video => {
    const div = document.createElement('div');
    div.classList.add('video');
    
    if (video.url) {
      // YouTube
      div.innerHTML = `<h2>${video.titulo}</h2>
        <iframe width="100%" height="200" src="${video.url}" frameborder="0" allowfullscreen></iframe>`;
    } else if (video.data) {
      // Video offline
      div.innerHTML = `<h2>${video.titulo}</h2>`;
      div.addEventListener('click', () => {
        player.src = video.data;
        player.style.display = 'block';
        player.play();
      });
    }

    div.appendChild(crearBotonVisto(video, vistos));
    div.appendChild(crearBotonEditar(video));
    div.appendChild(crearBotonEliminar(video));

    container.appendChild(div);
  });
}

// -----------------------
// Formulario Agregar/Editar
// -----------------------
formVideos.addEventListener('submit', async (e) => {
  e.preventDefault();

  const videoData = {
    titulo: tituloVideo.value,
    url: formatearURL(urlVideo.value),
    id: idInput.value || crypto.randomUUID()
  };

  await saveVideo(videoData);

  // Limpiar formulario
  tituloVideo.value = '';
  urlVideo.value = '';
  idInput.value = '';
  botonSubmit.textContent = 'Agregar Video';

  renderVideos();
});

// -----------------------
// Subir video offline
// -----------------------
addVideoBtn.addEventListener('click', () => {
  if (!videoUpload.files.length) return alert('Selecciona un video');

  const file = videoUpload.files[0];
  const reader = new FileReader();

  reader.onload = async (e) => {
    const videoData = {
      id: crypto.randomUUID(),
      titulo: file.name,
      data: e.target.result
    };
    await saveVideo(videoData);
    renderVideos();
  };

  reader.readAsDataURL(file);
});

// -----------------------
// Formatear URL YouTube
// -----------------------
function formatearURL(url) {
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^\s&]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const ytShort = url.match(/(?:https?:\/\/)?youtu\.be\/([^\s&]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;
  return url;
}

// -----------------------
// Inicializar
// -----------------------
renderVideos();
