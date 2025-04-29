// --- YouTube функционал ---
const API_KEY = 'AIzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
const searchInput = document.getElementById('youtube-search');
const searchResults = document.getElementById('search-results');
const suggestionsContainer = document.getElementById('suggestions');
const googleLoginButton = document.getElementById('google-login');
const logoutButton = document.getElementById('logout-button');
const playlistsContainer = document.getElementById('playlists');
let player;
let isPlayerReady = false;

// Временно отключаем авторизацию
googleLoginButton.style.display = 'none';
logoutButton.style.display = 'none';

function onYouTubeIframeAPIReady() {
  try {
    player = new YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      playerVars: {
        'autoplay': 1,
        'controls': 1,
      },
      events: {
        'onReady': onPlayerReady,
        'onError': (error) => {
          console.error('YouTube Player Error:', error);
          alert('Ошибка инициализации YouTube плеера.');
        },
        'onStateChange': (event) => {
          if (event.data === YT.PlayerState.ENDED) {
            alert('Видео закончилось');
          }
        }
      }
    });
  } catch (err) {
    console.error('Ошибка создания плеера:', err);
  }
}

function onPlayerReady(event) {
  isPlayerReady = true;
  console.log('Плеер готов к воспроизведению');
}

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Автодополнение для YouTube
async function fetchSuggestions(query) {
  try {
    const response = await fetch(
      `http://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Ошибка получения подсказок');
    const data = await response.json();
    return data[1] || [];
  } catch (error) {
    console.error('Ошибка автодополнения:', error);
    return [];
  }
}

function displaySuggestions(suggestions) {
  suggestionsContainer.innerHTML = '';
  if (suggestions.length === 0) {
    suggestionsContainer.style.display = 'none';
    return;
  }
  suggestions.forEach(suggestion => {
    const suggestionItem = document.createElement('div');
    suggestionItem.className = 'suggestion-item';
    suggestionItem.textContent = suggestion;
    suggestionItem.addEventListener('click', () => {
      searchInput.value = suggestion;
      suggestionsContainer.style.display = 'none';
      searchVideos(suggestion);
    });
    suggestionsContainer.appendChild(suggestionItem);
  });
  suggestionsContainer.style.display = 'block';
}

// Поиск видео
async function searchVideos(query) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`
    );
    if (!response.ok) throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    const data = await response.json();
    const videos = data.items || [];
    const videoIds = videos.map(video => video.id.videoId).join(',');
    const durations = await getVideoDurations(videoIds);
    displaySearchResults(videos, durations);
  } catch (error) {
    console.error('Ошибка поиска видео:', error);
    alert('Не удалось выполнить поиск видео. Проверьте API-ключ.');
  }
}

// Получение длительности видео
async function getVideoDurations(videoIds) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${API_KEY}`
    );
    if (!response.ok) throw new Error('Ошибка получения длительности видео');
    const data = await response.json();
    return data.items.reduce((acc, item) => {
      acc[item.id] = formatDuration(item.contentDetails.duration);
      return acc;
    }, {});
  } catch (error) {
    console.error('Ошибка получения длительности:', error);
    return {};
  }
}

function formatDuration(duration) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = (match[1] || '0H').slice(0, -1);
  const minutes = (match[2] || '0M').slice(0, -1);
  const seconds = (match[3] || '0S').slice(0, -1);
  return `${hours ? hours + ':' : ''}${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
}

function displaySearchResults(videos, durations) {
  searchResults.innerHTML = '';
  videos.forEach(video => {
    const videoId = video.id?.videoId;
    const title = video.snippet?.title;
    const thumbnail = video.snippet?.thumbnails?.default?.url;
    const duration = durations[videoId] || 'N/A';

    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    resultItem.innerHTML = `
      <img src="${thumbnail}" alt="${title}">
      <div>
        <div>${title}</div>
        <div>${duration}</div>
      </div>
    `;
    resultItem.addEventListener('click', () => playVideo(videoId));
    searchResults.appendChild(resultItem);
  });
}

function playVideo(videoId) {
  if (isPlayerReady && player && player.loadVideoById) {
    try {
      player.loadVideoById(videoId);
    } catch (err) {
      console.error('Ошибка воспроизведения:', err);
      alert('Не удалось воспроизвести видео.');
    }
  } else {
    console.error('Плеер не готов или не инициализирован.');
    alert('Плеер не готов. Подождите инициализации.');
  }
}

// Обработчики для YouTube
document.addEventListener("DOMContentLoaded", function () {
  searchInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
      const suggestions = await fetchSuggestions(query);
      displaySuggestions(suggestions);
      await searchVideos(query);
    } else {
      suggestionsContainer.style.display = 'none';
    }
  }, 300));

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
      suggestionsContainer.style.display = 'none';
    }
  });
});

// --- OpenStreetMap функционал ---
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Хранилище маркеров
let markers = JSON.parse(localStorage.getItem('markers')) || [];
let routeMarkers = [];
let routeLayer = null;
let settingPoint = null;
let waypoints = [];

// Модальное окно для добавления мест
const markerModal = document.getElementById('marker-modal');
const markerNameInput = document.getElementById('marker-name');
const markerCategorySelect = document.getElementById('marker-category');
const saveMarkerButton = document.getElementById('save-marker');
const cancelMarkerButton = document.getElementById('cancel-marker');
let tempLatLng;

// Загрузка сохранённых маркеров при старте
function loadMarkers() {
  markers.forEach(marker => {
    addMarkerToMap(marker.lat, marker.lng, marker.name, marker.category);
  });
  updatePointSelects();
}

// Добавление маркера на карту
function addMarkerToMap(lat, lng, name, category) {
  const icon = L.divIcon({
    className: 'custom-icon',
    html: `<div style="background: ${category === 'Дом' ? '#ff4444' : category === 'Работа' ? '#44ff44' : '#4444ff'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  const marker = L.marker([lat, lng], { icon }).addTo(map)
    .bindPopup(`${category}: ${name}`)
    .openPopup();
}

// Сохранение маркера
function saveMarker(lat, lng, name, category) {
  markers.push({ lat, lng, name, category });
  localStorage.setItem('markers', JSON.stringify(markers));
  addMarkerToMap(lat, lng, name, category);
  updatePointSelects();
}

// Обработчик клика по карте для добавления мест
map.on('click', (e) => {
  if (settingPoint) {
    const point = settingPoint;
    settingPoint = null;
    const marker = L.marker(e.latlng, { draggable: true }).addTo(map)
      .bindPopup(point);
    marker.on('dragend', () => {
      buildRoute();
    });
    marker.on('contextmenu', () => {
      map.removeLayer(marker);
      routeMarkers = routeMarkers.filter(m => m !== marker);
      buildRoute();
    });
    routeMarkers.push(marker);
    if (point === 'A') {
      document.getElementById('point-a').value = '';
    } else if (point === 'B') {
      document.getElementById('point-b').value = '';
    } else {
      const index = parseInt(point) - 1;
      waypoints[index].latlng = e.latlng;
      waypoints[index].marker = marker;
    }
    buildRoute();
  } else {
    tempLatLng = e.latlng;
    markerNameInput.value = '';
    markerModal.style.display = 'flex';
  }
});

// Обработчик кнопки "Сохранить" для мест
saveMarkerButton.addEventListener('click', () => {
  const name = markerNameInput.value.trim();
  const category = markerCategorySelect.value;
  if (name) {
    saveMarker(tempLatLng.lat, tempLatLng.lng, name, category);
    markerModal.style.display = 'none';
  } else {
    alert('Введите название места.');
  }
});

// Обработчик кнопки "Отмена"
cancelMarkerButton.addEventListener('click', () => {
  markerModal.style.display = 'none';
});

// --- Построение маршрутов ---
const routeMenu = document.getElementById('route-menu');
const routeButton = document.getElementById('route-button');
const routeModeSelect = document.getElementById('route-mode');
const avoidHighwaysCheckbox = document.getElementById('avoid-highways');
const pointASelect = document.getElementById('point-a');
const pointBSelect = document.getElementById('point-b');
const waypointsContainer = document.getElementById('waypoints');
const addWaypointButton = document.getElementById('add-waypoint');
const clearRouteButton = document.getElementById('clear-route');
const routeStats = document.getElementById('route-stats');
const routeDistance = document.getElementById('route-distance');
const routeTime = document.getElementById('route-time');
const routeElevation = document.getElementById('route-elevation');

// Показать/скрыть меню маршрутов
routeButton.addEventListener('click', () => {
  routeMenu.style.display = routeMenu.style.display === 'none' ? 'block' : 'none';
});

// Обновление списка сохранённых мест
function updatePointSelects() {
  const pointSelects = document.querySelectorAll('.point-select');
  pointSelects.forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">Выбрать место</option>';
    markers.forEach(marker => {
      const option = document.createElement('option');
      option.value = JSON.stringify({ lat: marker.lat, lng: marker.lng });
      option.textContent = `${marker.category}: ${marker.name}`;
      select.appendChild(option);
    });
    select.value = currentValue;
  });
}

// Выбор точки из сохранённых мест
pointASelect.addEventListener('change', () => {
  if (pointASelect.value) {
    const { lat, lng } = JSON.parse(pointASelect.value);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      .bindPopup('A');
    marker.on('dragend', () => {
      buildRoute();
    });
    marker.on('contextmenu', () => {
      map.removeLayer(marker);
      routeMarkers = routeMarkers.filter(m => m !== marker);
      buildRoute();
    });
    routeMarkers = routeMarkers.filter(m => !m.getPopup().getContent().includes('A'));
    routeMarkers.push(marker);
    buildRoute();
  }
});

pointBSelect.addEventListener('change', () => {
  if (pointBSelect.value) {
    const { lat, lng } = JSON.parse(pointBSelect.value);
    const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
      .bindPopup('B');
    marker.on('dragend', () => {
      buildRoute();
    });
    marker.on('contextmenu', () => {
      map.removeLayer(marker);
      routeMarkers = routeMarkers.filter(m => m !== marker);
      buildRoute();
    });
    routeMarkers = routeMarkers.filter(m => !m.getPopup().getContent().includes('B'));
    routeMarkers.push(marker);
    buildRoute();
  }
});

// Указание точек на карте
document.querySelectorAll('.set-point').forEach(button => {
  button.addEventListener('click', () => {
    settingPoint = button.dataset.point;
  });
});

// Добавление промежуточных точек
addWaypointButton.addEventListener('click', () => {
  if (waypoints.length < 10) {
    const index = waypoints.length + 1;
    const waypointDiv = document.createElement('div');
    waypointDiv.className = 'waypoint';
    waypointDiv.innerHTML = `
      <label>Точка ${index}:</label>
      <select class="point-select waypoint-select">
        <option value="">Выбрать место</option>
      </select>
      <button class="set-waypoint" data-index="${index}">Указать на карте</button>
      <button class="remove-waypoint" data-index="${index}">Удалить</button>
    `;
    waypointsContainer.appendChild(waypointDiv);
    waypoints.push({ index, latlng: null, marker: null });
    updatePointSelects();
    addWaypointButton.textContent = `Добавить промежуточную точку (${waypoints.length}/10)`;
    if (waypoints.length === 10) {
      addWaypointButton.disabled = true;
    }
  }
});

// Указание промежуточной точки на карте
waypointsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('set-waypoint')) {
    settingPoint = e.target.dataset.index;
  }
  if (e.target.classList.contains('remove-waypoint')) {
    const index = parseInt(e.target.dataset.index) - 1;
    const waypoint = waypoints[index];
    if (waypoint.marker) {
      map.removeLayer(waypoint.marker);
      routeMarkers = routeMarkers.filter(m => m !== waypoint.marker);
    }
    waypoints.splice(index, 1);
    waypointsContainer.innerHTML = '';
    waypoints.forEach((wp, i) => {
      const newIndex = i + 1;
      wp.index = newIndex;
      if (wp.marker) {
        wp.marker.getPopup().setContent(`${newIndex}`);
      }
      const waypointDiv = document.createElement('div');
      waypointDiv.className = 'waypoint';
      waypointDiv.innerHTML = `
        <label>Точка ${newIndex}:</label>
        <select class="point-select waypoint-select">
          <option value="">Выбрать место</option>
        </select>
        <button class="set-waypoint" data-index="${newIndex}">Указать на карте</button>
        <button class="remove-waypoint" data-index="${newIndex}">Удалить</button>
      `;
      waypointsContainer.appendChild(waypointDiv);
    });
    updatePointSelects();
    addWaypointButton.textContent = `Добавить промежуточную точку (${waypoints.length}/10)`;
    addWaypointButton.disabled = waypoints.length === 10;
    buildRoute();
  }
});

// Выбор промежуточной точки из сохранённых мест
waypointsContainer.addEventListener('change', (e) => {
  if (e.target.classList.contains('waypoint-select')) {
    const select = e.target;
    const index = parseInt(select.parentElement.querySelector('.set-waypoint').dataset.index) - 1;
    if (select.value) {
      const { lat, lng } = JSON.parse(select.value);
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map)
        .bindPopup(`${index + 1}`);
      marker.on('dragend', () => {
        buildRoute();
      });
      marker.on('contextmenu', () => {
        map.removeLayer(marker);
        routeMarkers = routeMarkers.filter(m => m !== marker);
        buildRoute();
      });
      if (waypoints[index].marker) {
        map.removeLayer(waypoints[index].marker);
        routeMarkers = routeMarkers.filter(m => m !== waypoints[index].marker);
      }
      waypoints[index].latlng = { lat, lng };
      waypoints[index].marker = marker;
      routeMarkers.push(marker);
      buildRoute();
    }
  }
});

// Построение маршрута
async function buildRoute() {
  const pointA = routeMarkers.find(m => m.getPopup().getContent() === 'A');
  const pointB = routeMarkers.find(m => m.getPopup().getContent() === 'B');
  if (!pointA || !pointB) {
    if (routeLayer) {
      map.removeLayer(routeLayer);
      routeLayer = null;
      routeStats.style.display = 'none';
    }
    addWaypointButton.disabled = true;
    return;
  }
  addWaypointButton.disabled = false;

  const coords = [];
  coords.push([pointA.getLatLng().lng, pointA.getLatLng().lat]);
  waypoints.forEach(wp => {
    if (wp.latlng) {
      coords.push([wp.latlng.lng, wp.latlng.lat]);
    }
  });
  coords.push([pointB.getLatLng().lng, pointB.getLatLng().lat]);

  const mode = routeModeSelect.value;
  const avoidHighways = avoidHighwaysCheckbox.checked;
  let profile = 'bicycle';
  let exclude = avoidHighways ? 'motorway' : '';

  if (mode === 'road') {
    profile = 'car'; // Используем профиль car для дорожного режима
  } else if (mode === 'touring') {
    profile = 'bicycle';
  } else if (mode === 'gravel') {
    profile = 'bicycle';
    exclude += exclude ? ',' : '';
    exclude += 'paved'; // Исключаем асфальтированные дороги для гравийного режима
  }

  try {
    const url = `http://router.project-osrm.org/route/v1/${profile}/${coords.map(c => c.join(',')).join(';')}?overview=full&geometries=geojson${exclude ? `&exclude=${exclude}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Ошибка построения маршрута');
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const geometry = route.geometry;

      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      routeLayer = L.geoJSON(geometry, {
        style: {
          color: mode === 'road' ? '#ff4444' : mode === 'touring' ? '#44ff44' : '#ffaa44',
          weight: 5,
          opacity: 0.7
        }
      }).addTo(map);

      // Рассчитываем статистику
      const distance = (route.distance / 1000).toFixed(1); // в километрах
      const averageSpeed = 15; // км/ч (можно сделать настраиваемым)
      const time = Math.round((route.distance / 1000) / averageSpeed * 60); // в минутах

      // Для перепада высот используем Open-Elevation API
      const coordsForElevation = geometry.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] }));
      let elevationGain = 0;
      if (coordsForElevation.length > 1) {
        const elevationResponse = await fetch('https://api.open-elevation.com/api/v1/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations: coordsForElevation })
        });
        const elevationData = await elevationResponse.json();
        const elevations = elevationData.results.map(r => r.elevation);
        for (let i = 1; i < elevations.length; i++) {
          const diff = elevations[i] - elevations[i - 1];
          if (diff > 0) elevationGain += diff;
        }
      }

      routeDistance.textContent = distance;
      routeTime.textContent = time;
      routeElevation.textContent = elevationGain.toFixed(0);
      routeStats.style.display = 'block';
    }
  } catch (error) {
    console.error('Ошибка построения маршрута:', error);
    alert('Не удалось построить маршрут.');
  }
}

// Очистка маршрута
clearRouteButton.addEventListener('click', () => {
  routeMarkers.forEach(marker => map.removeLayer(marker));
  routeMarkers = [];
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
  waypoints = [];
  waypointsContainer.innerHTML = '';
  addWaypointButton.textContent = `Добавить промежуточную точку (0/10)`;
  addWaypointButton.disabled = true;
  routeStats.style.display = 'none';
  pointASelect.value = '';
  pointBSelect.value = '';
});

// Перестроение маршрута при изменении режима или настроек
routeModeSelect.addEventListener('change', buildRoute);
avoidHighwaysCheckbox.addEventListener('change', buildRoute);

// Поиск местоположения
const mapSearchInput = document.getElementById('map-search');
mapSearchInput.addEventListener('input', debounce(async (e) => {
  const query = e.target.value;
  if (query.length > 2) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('Ошибка поиска местоположения');
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup('Местоположение найдено').openPopup();
      }
    } catch (error) {
      console.error('Ошибка поиска по карте:', error);
    }
  }
}, 300));

// Геолокация
const geoButton = document.getElementById('geo-button');
geoButton.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        map.setView([latitude, longitude], 13);
        L.marker([latitude, longitude]).addTo(map).bindPopup('Вы здесь').openPopup();
      },
      (error) => {
        alert('Геолокация недоступна: ' + error.message);
      }
    );
  } else {
    alert('Геолокация не поддерживается вашим браузером.');
  }
});

// Загружаем сохранённые маркеры при старте
loadMarkers();