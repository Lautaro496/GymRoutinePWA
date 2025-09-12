// Elementos del DOM

const container = document.getElementById('videos-container');
const formVideos = document.getElementById('form-video');
const tituloVideo = document.getElementById('titulo');
const urlVideo = document.getElementById('url');
const id = document.getElementById('Id');
const botonSubmit = document.getElementById('boton-submit');
const mensajeVacio = document.getElementById('mensaje-vacio');
const btnInstallApp = document.getElementById('btnInstallApp');


//indexedDB para videos sin conexion
// IndexedDB
let db;

const request = indexedDB.open('gymVideosDB', 1);

request.onupgradeneeded = function(event) {
  db = event.target.result;
  if (!db.objectStoreNames.contains('videos')) {
    db.createObjectStore('videos', { keyPath: 'id', autoIncrement: true });
  }
  console.log('ObjectStore "videos" creado o actualizado.');
};

request.onsuccess = function(event) {
  db = event.target.result;
  console.log('Conexión exitosa a IndexedDB');
  leerVideos();
};

request.onerror = function(event) {
  console.error('Error al abrir IndexedDB:', event.target.error);
};

// Agregar video offline
function agregarVideo(videoData) {
  const transaction = db.transaction(['videos'], 'readwrite');
  const store = transaction.objectStore('videos');
  const requestAdd = store.add(videoData);

  requestAdd.onsuccess = function() {
    console.log('Video agregado con éxito:', videoData.titulo);
    leerVideos();
  };

  requestAdd.onerror = function(event) {
    console.error('Error al agregar video:', event.target.error);
  };
}

// Leer videos y mostrar
function leerVideos() {
  const transaction = db.transaction(['videos'], 'readonly');
  const store = transaction.objectStore('videos');
  const requestGetAll = store.getAll();

  requestGetAll.onsuccess = function() {
    const videos = requestGetAll.result;
    console.log('Videos en DB:', videos);
    mostrarVideos(videos);
  };
}

// Mostrar videos y reproducir al click
function mostrarVideos(videos) {
  const videoList = document.getElementById('video-list');
  videoList.innerHTML = '';

  if (videos.length === 0) {
    document.getElementById('mensaje-vacio').style.display = 'block';
    return;
  } else {
    document.getElementById('mensaje-vacio').style.display = 'none';
  }

  videos.forEach(video => {
    const li = document.createElement('li');

    // Título del video
    const span = document.createElement('span');
    span.textContent = video.titulo;

    // Botón de eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.style.marginLeft = '10px';

    // Evento para eliminar
    btnEliminar.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita que también reproduzca el video
      eliminarVideo(video.id);
    });

    li.appendChild(span);
    li.appendChild(btnEliminar);

    // Evento click para reproducir
    li.addEventListener('click', () => {
      const player = document.getElementById('player');
      player.src = video.data;
      player.style.display = 'block';
      player.play();
    });

    videoList.appendChild(li);
  });
}

// Función para eliminar un video por ID
function eliminarVideo(id) {
  const transaction = db.transaction(['videos'], 'readwrite');
  const store = transaction.objectStore('videos');
  const requestDelete = store.delete(id);

  requestDelete.onsuccess = function() {
    console.log('Video eliminado:', id);
    leerVideos(); // Actualizar la lista
  };

  requestDelete.onerror = function(event) {
    console.error('Error al eliminar video:', event.target.error);
  };
}


// Subir video offline desde input
document.getElementById('add-video-btn').addEventListener('click', () => {
  const fileInput = document.getElementById('video-upload');
  if (fileInput.files.length === 0) return alert('Selecciona un video');

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const videoData = {
      titulo: file.name,
      data: e.target.result
    };
    agregarVideo(videoData);
  };

  reader.readAsDataURL(file);
});





// Generar ID único
let ultimotimestamp = 0;
let contador = 0;
function generarID() {
  const ahora = Date.now();
  if (ahora === ultimotimestamp) {
    contador++;
  } else {
    ultimotimestamp = ahora;
    contador = 0;
  }
  console.log(ahora - contador);
  return `${ahora}-${contador}`;
}

// Cargar videos desde localStorage
function cargarVideos() {
  const videosGuardados = JSON.parse(localStorage.getItem('listaVideos'));
  if (Array.isArray(videosGuardados)) {
    return videosGuardados;
  } else {
    return [];
  }
}

// Guardar videos en localStorage
function guardarVideos(lista) {
  localStorage.setItem('listaVideos', JSON.stringify(lista));
}

// Cargar estados de visto
function cargarEstadosVistos() {
  const vistos = JSON.parse(localStorage.getItem('videosVistos'));
  if (vistos && typeof vistos === 'object') {
    return vistos;
  } else {
    return {};
  }
}

// Guardar estados de visto
function guardarEstadosVistos(vistos) {
  localStorage.setItem('videosVistos', JSON.stringify(vistos));
}

// Crear botón "Visto"
function botonVideoVisto(video, vistos) {
  const boton = document.createElement('button');

  if (vistos[video.id]) {
    boton.classList.add('visto');
    boton.textContent = 'Visto ✅';
  } else {
    boton.classList.add('marcar-btn');
    boton.textContent = 'Marcar como visto';
  }

  boton.addEventListener('click', function () {
    const yaVisto = boton.classList.contains('visto');

    if (yaVisto) {
      boton.classList.remove('visto');
      boton.classList.add('marcar-btn');
      boton.textContent = 'Marcar como visto';
      delete vistos[video.id];
    } else {
      boton.classList.remove('marcar-btn');
      boton.classList.add('visto');
      boton.textContent = 'Visto ✅';
      vistos[video.id] = true;
    }

    guardarEstadosVistos(vistos);
  });

  return boton;
}

// Crear botón "Eliminar"
function botonEliminarVideo(video, listaVideos) {
  const boton = document.createElement('button');
  boton.textContent = '🗑 Eliminar';
  boton.classList.add('marcar-btn');

  boton.addEventListener('click', function () {
    const nuevaLista = [];

    for (let i = 0; i < listaVideos.length; i++) {
      if (listaVideos[i].id !== video.id) {
        nuevaLista.push(listaVideos[i]);
      }
    }
    guardarVideos(nuevaLista);
    iniciarApp();
  });

  return boton;
}

// Crear botón "Editar"
function botonEditarVideo(video) {
  const boton = document.createElement('button');
  boton.textContent = '✏️ Editar';
  boton.classList.add('marcar-btn');

  boton.addEventListener('click', function () {
    tituloVideo.value = video.titulo;
    urlVideo.value = video.url;
    id.value = video.id;
    botonSubmit.textContent = 'Guardar Cambios';
  });

  return boton;
}

// Renderizar un video
function renderizarVideo(video, vistos, listaVideos) {
  const div = document.createElement('div');
  div.classList.add('video');

  div.innerHTML = `<h2>${video.titulo}</h2>
    <iframe
      width="100%"
      height="200"
      src="${video.url}"
      frameborder="0"
      allowfullscreen>
    </iframe>
  `; 

  div.appendChild(botonVideoVisto(video, vistos));
  div.appendChild(botonEditarVideo(video));
  div.appendChild(botonEliminarVideo(video, listaVideos));

  container.appendChild(div);
}

// Iniciar la app
function iniciarApp() {
  container.innerHTML = '';
  const listaVideos = cargarVideos();
  const estadosVistos = cargarEstadosVistos();

  if (listaVideos.length === 0) {
    mensajeVacio.style.display = 'block';
  } else {
    mensajeVacio.style.display = 'none';

    for (let i = 0; i < listaVideos.length; i++) {
      renderizarVideo(listaVideos[i], estadosVistos, listaVideos);
    }
  }
}

// Evento del formulario
formVideos.addEventListener('submit', function (e) {
  e.preventDefault();

  console.log('Formulario enviado');
  console.log('Título:', tituloVideo.value);
  console.log('URL:', urlVideo.value);
  console.log('ID actual:', id.value);

  let idFinal = id.value;
  if (idFinal === '') {
    idFinal = generarID();
  }

  const nuevoVideo = {
    titulo: tituloVideo.value,
    url: formatearURL(urlVideo.value),
    id: idFinal
  };

  let videos = cargarVideos();
  let estabaVacio = videos.length === 0;
  let actualizado = false;

  for (let i = 0; i < videos.length; i++) {
    if (videos[i].id === nuevoVideo.id) {
      videos[i] = nuevoVideo;
      actualizado = true;
    }
  }

  if (actualizado === false) {
    videos.push(nuevoVideo);
  }

  guardarVideos(videos);

  // Limpiar campos del formulario
  tituloVideo.value = '';
  urlVideo.value = '';
  id.value = '';
  botonSubmit.textContent = 'Agregar Video';

  // Si era el primer video, recargamos la página para renderizar correctamente
iniciarApp();
});

// ==========================
// FORMATEAR URL DE VIDEO
// ==========================
function formatearURL(url) {
  // YouTube
  const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^\s&]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // YouTube short links
  const ytShort = url.match(/(?:https?:\/\/)?youtu\.be\/([^\s&]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}`;

  // Otros (videos locales .mp4/.webm/.ogg)
  return url;
}

// modificar boton ui de google para instalar como app en la pc.
let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  btnInstallApp.removeAttribute("hidden");
  console.log("PWA instalable, botón visible");
});

btnInstallApp.addEventListener('click', async () => {
  if (installPrompt) {
    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }
    installPrompt = null;
    btnInstallApp.setAttribute("hidden", "");
  }
});

// Iniciar
iniciarApp();
