// Elementos del DOM

const container = document.getElementById('videos-container');
const formVideos = document.getElementById('form-video');
const tituloVideo = document.getElementById('titulo');
const urlVideo = document.getElementById('url');
const id = document.getElementById('Id');
const botonSubmit = document.getElementById('boton-submit');
const mensajeVacio = document.getElementById('mensaje-vacio');
const installAppbtn = document.getElementById('btn-install');

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
installAppbtn.addEventListener('click', async () => {
  if (installPrompt) {
    installPrompt.prompt();

    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
    } else {
      console.log('Usuario rechazó instalar la PWA');
    }
    installPrompt = null;
    installAppbtn.setAttribute("hidden", "");
  }
});

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installAppbtn.removeAttribute("hidden");
});


// Iniciar
iniciarApp();
