// --- YouTube функционал (оставляем без изменений) ---
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
          showNotification('Ошибка инициализации YouTube плеера.');
        },
        'onStateChange': (event) => {
          if (event.data === YT.PlayerState.ENDED) {
            showNotification('Видео закончилось');
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
    showNotification('Не удалось выполнить поиск видео. Проверьте API-ключ.');
  }
}

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
      showNotification('Не удалось воспроизвести видео.');
    }
  } else {
    console.error('Плеер не готов или не инициализирован.');
    showNotification('Плеер не готов. Подождите инициализации.');
  }
}

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
let locationMarker = null;
let locationWatchId = null;
let infraLayer = null;
let gpxLayer = null;

// Кастомные уведомления
const notificationElement = document.getElementById('notification');
function showNotification(message) {
  notificationElement.textContent = message;
  notificationElement.style.display = 'block';
  notificationElement.classList.add('show');
  setTimeout(() => {
    notificationElement.classList.remove('show');
    setTimeout(() => {
      notificationElement.style.display = 'none';
    }, 300);
  }, 3000);
}

// Загрузка сохранённых маркеров при старте
function loadMarkers() {
  markers.forEach(marker => {
    addMarkerToMap(marker.lat, marker.lng, marker.name, marker.category);
  });
  updatePointSelects();
}

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

function saveMarker(lat, lng, name, category) {
  markers.push({ lat, lng, name, category });
  localStorage.setItem('markers', JSON.stringify(markers));
  addMarkerToMap(lat, lng, name, category);
  updatePointSelects();
}

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
      document.getElementById('point-a-input').value = '';
    } else if (point === 'B') {
      document.getElementById('point-b-input').value = '';
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

const markerModal = document.getElementById('marker-modal');
const markerNameInput = document.getElementById('marker-name');
const markerCategorySelect = document.getElementById('marker-category');
const saveMarkerButton = document.getElementById('save-marker');
const cancelMarkerButton = document.getElementById('cancel-marker');
let tempLatLng;

saveMarkerButton.addEventListener('click', () => {
  const name = markerNameInput.value.trim();
  const category = markerCategorySelect.value;
  if (name) {
    saveMarker(tempLatLng.lat, tempLatLng.lng, name, category);
    markerModal.style.display = 'none';
  } else {
    showNotification('Введите название места.');
  }
});

cancelMarkerButton.addEventListener('click', () => {
  markerModal.style.display = 'none';
});

// --- Построение маршрутов ---
const routeMenu = document.getElementById('route-menu');
const routeButton = document.getElementById('route-button');
const closeRouteMenuButton = document.getElementById('close-route-menu');
const routeModeSelect = document.getElementById('route-mode');
const avoidHighwaysCheckbox = document.getElementById('avoid-highways');
const pointAInput = document.getElementById('point-a-input');
const pointBInput = document.getElementById('point-b-input');
const pointASuggestions = document.getElementById('point-a-suggestions');
const pointBSuggestions = document.getElementById('point-b-suggestions');
const pointASelect = document.getElementById('point-a');
const pointBSelect = document.getElementById('point-b');
const waypointsContainer = document.getElementById('waypoints');
const addWaypointButton = document.getElementById('add-waypoint');
const clearRouteButton = document.getElementById('clear-route');
const routeStats = document.getElementById('route-stats');
const routeDistance = document.getElementById('route-distance');
const routeTime = document.getElementById('route-time');
const routeElevation = document.getElementById('route-elevation');

routeButton.addEventListener('click', () => {
  const isHidden = routeMenu.classList.contains('hidden');
  routeMenu.classList.toggle('hidden', !isHidden);
  routeButton.classList.toggle('active', isHidden);
});

closeRouteMenuButton.addEventListener('click', () => {
  routeMenu.classList.add('hidden');
  routeButton.classList.remove('active');
});

// Поиск адреса для точек А и Б
const USER_AGENT = 'yt-osm-app/1.0';
async function searchLocation(query, suggestionsContainer, point) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': USER_AGENT }
      }
    );
    if (!response.ok) throw new Error(`Ошибка поиска местоположения: ${response.status}`);
    const data = await response.json();
    suggestionsContainer.innerHTML = '';
    if (data.length === 0) {
      suggestionsContainer.style.display = 'none';
      return;
    }
    data.forEach(item => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'point-suggestion-item';
      suggestionItem.textContent = item.display_name;
      suggestionItem.addEventListener('click', () => {
        const { lat, lon } = item;
        const marker = L.marker([lat, lon], { draggable: true }).addTo(map)
          .bindPopup(point);
        marker.on('dragend', () => {
          buildRoute();
        });
        marker.on('contextmenu', () => {
          map.removeLayer(marker);
          routeMarkers = routeMarkers.filter(m => m !== marker);
          buildRoute();
        });
        routeMarkers = routeMarkers.filter(m => !m.getPopup().getContent().includes(point));
        routeMarkers.push(marker);
        if (point === 'A') {
          pointAInput.value = item.display_name;
        } else {
          pointBInput.value = item.display_name;
        }
        suggestionsContainer.style.display = 'none';
        buildRoute();
      });
      suggestionsContainer.appendChild(suggestionItem);
    });
    suggestionsContainer.style.display = 'block';
  } catch (error) {
    console.error('Ошибка поиска адреса:', error);
    showNotification('Не удалось найти адрес. Попробуйте снова.');
  }
}

pointAInput.addEventListener('input', debounce((e) => {
  const query = e.target.value.trim();
  if (query.length > 2) {
    searchLocation(query, pointASuggestions, 'A');
  } else {
    pointASuggestions.style.display = 'none';
  }
}, 300));

pointBInput.addEventListener('input', debounce((e) => {
  const query = e.target.value.trim();
  if (query.length > 2) {
    searchLocation(query, pointBSuggestions, 'B');
  } else {
    pointBSuggestions.style.display = 'none';
  }
}, 300));

document.addEventListener('click', (e) => {
  if (!pointAInput.contains(e.target) && !pointASuggestions.contains(e.target)) {
    pointASuggestions.style.display = 'none';
  }
  if (!pointBInput.contains(e.target) && !pointBSuggestions.contains(e.target)) {
    pointBSuggestions.style.display = 'none';
  }
});

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
    pointAInput.value = pointASelect.options[pointASelect.selectedIndex].text;
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
    pointBInput.value = pointBSelect.options[pointBSelect.selectedIndex].text;
    buildRoute();
  }
});

document.querySelectorAll('.set-point').forEach(button => {
  button.addEventListener('click', () => {
    settingPoint = button.dataset.point;
  });
});

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
    showNotification('Выберите точки А и Б для построения маршрута.');
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
    profile = 'car';
  } else if (mode === 'touring') {
    profile = 'bicycle';
  } else if (mode === 'gravel') {
    profile = 'bicycle';
    exclude += exclude ? ',' : '';
    exclude += 'paved';
  }

  // Основной и резервный сервер OSRM
  const osrmServers = [
    `http://router.project-osrm.org/route/v1`,
    `https://router.project-osrm.org/route/v1` // Резервный сервер
  ];

  let routeBuilt = false;
  for (const server of osrmServers) {
    try {
      const url = `${server}/${profile}/${coords.map(c => c.join(',')).join(';')}?overview=full&geometries=geojson${exclude ? `&exclude=${exclude}` : ''}`;
      console.log('Запрос к OSRM:', url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Ошибка построения маршрута: ${response.status}`);
      const data = await response.json();
      console.log('Ответ от OSRM:', data);
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

        const distance = (route.distance / 1000).toFixed(1);
        const averageSpeed = 15;
        const time = Math.round((route.distance / 1000) / averageSpeed * 60);

        let elevationGain = 0;
        const coordsForElevation = geometry.coordinates.map(coord => ({ latitude: coord[1], longitude: coord[0] }));
        if (coordsForElevation.length > 1) {
          try {
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
          } catch (error) {
            console.error('Ошибка получения данных о высоте:', error);
            elevationGain = 0; // Если API недоступен, показываем 0
          }
        }

        routeDistance.textContent = distance;
        routeTime.textContent = time;
        routeElevation.textContent = elevationGain.toFixed(0);
        routeStats.style.display = 'block';
        routeBuilt = true;
        break; // Успешно построили маршрут, выходим из цикла
      }
    } catch (error) {
      console.error(`Ошибка построения маршрута с ${server}:`, error);
    }
  }

  if (!routeBuilt) {
    showNotification('Не удалось построить маршрут. Попробуйте снова.');
  }
}

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
  pointAInput.value = '';
  pointBInput.value = '';
  pointASelect.value = '';
  pointBSelect.value = '';
});

routeModeSelect.addEventListener('change', buildRoute);
avoidHighwaysCheckbox.addEventListener('change', buildRoute);

// Поиск местоположения
const mapSearchInput = document.getElementById('map-search');
mapSearchInput.addEventListener('input', debounce(async (e) => {
  const query = e.target.value;
  if (query.length > 2) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
        {
          headers: { 'User-Agent': USER_AGENT }
        }
      );
      if (!response.ok) throw new Error(`Ошибка поиска местоположения: ${response.status}`);
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup('Местоположение найдено').openPopup();
      } else {
        showNotification('Местоположение не найдено.');
      }
    } catch (error) {
      console.error('Ошибка поиска по карте:', error);
      showNotification('Не удалось найти местоположение. Попробуйте снова.');
    }
  }
}, 300));

// Геолокация в реальном времени
const geoButton = document.getElementById('geo-button');
async function checkGeolocationPermission() {
  if ('permissions' in navigator) {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state === 'granted';
  }
  return true; // Если API разрешений недоступен, предполагаем, что доступ есть
}

async function startGeolocation() {
  const hasPermission = await checkGeolocationPermission();
  if (!hasPermission) {
    showNotification('Геолокация недоступна: нет разрешения.');
    return false;
  }

  if (navigator.geolocation) {
    showNotification('Поиск местоположения...');
    let attempts = 0;
    const maxAttempts = 3;

    function tryGeolocation() {
      locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (!locationMarker) {
            locationMarker = L.circleMarker([latitude, longitude], {
              radius: 8,
              color: '#3388ff',
              fillColor: '#3388ff',
              fillOpacity: 0.5
            }).addTo(map).bindPopup('Вы здесь');
          } else {
            locationMarker.setLatLng([latitude, longitude]);
          }
          map.setView([latitude, longitude], 13);
          geoButton.classList.add('active');
          attempts = 0; // Сбрасываем попытки при успешном получении
        },
        (error) => {
          console.error('Ошибка геолокации:', error);
          if (error.code === error.TIMEOUT && attempts < maxAttempts) {
            attempts++;
            showNotification(`Тайм-аут геолокации, попытка ${attempts}/${maxAttempts}...`);
            setTimeout(tryGeolocation, 2000); // Повторная попытка через 2 секунды
          } else {
            showNotification('Геолокация недоступна: ' + error.message);
            stopGeolocation();
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000 // Увеличили тайм-аут до 10 секунд
        }
      );
    }

    tryGeolocation();
    return true;
  } else {
    showNotification('Геолокация не поддерживается вашим браузером.');
    return false;
  }
}

function stopGeolocation() {
  if (locationWatchId) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
  if (locationMarker) {
    map.removeLayer(locationMarker);
    locationMarker = null;
  }
  geoButton.classList.remove('active');
}

geoButton.addEventListener('click', async () => {
  if (!locationWatchId) {
    await startGeolocation();
  } else {
    stopGeolocation();
  }
});

// Отображение велоинфраструктуры
const infraButton = document.getElementById('infra-button');
async function loadInfrastructure() {
  if (infraLayer) {
    map.removeLayer(infraLayer);
    infraLayer = null;
    infraButton.classList.remove('active');
    return;
  }

  try {
    const bounds = map.getBounds();
    const center = bounds.getCenter();
    // Ограничиваем область запроса радиусом 5 км от центра карты
    const lat = center.lat;
    const lon = center.lng;
    const latDiff = 0.045; // Примерно 5 км по широте
    const lonDiff = 0.045; // Примерно 5 км по долготе
    const bbox = `${lat - latDiff},${lon - lonDiff},${lat + latDiff},${lon + lonDiff}`;

    const overpassServers = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];

    let infraLoaded = false;
    for (const server of overpassServers) {
      try {
        const query = `
          [out:json];
          (
            way["highway"="cycleway"](${bbox});
            node["amenity"="bicycle_parking"](${bbox});
            node["shop"="bicycle"](${bbox});
            node["amenity"="bicycle_rental"](${bbox});
          );
          out body;
          >;
          out skel qt;
        `;
        console.log(`Запрос к Overpass (${server}):`, query);
        const response = await fetch(server, {
          method: 'POST',
          body: query,
          headers: { 'User-Agent': USER_AGENT }
        });
        if (!response.ok) throw new Error(`Ошибка загрузки инфраструктуры: ${response.status}`);
        const data = await response.json();
        console.log('Ответ от Overpass:', data);

        infraLayer = L.layerGroup();
        if (data.elements && data.elements.length > 0) {
          data.elements.forEach(element => {
            if (element.type === 'way' && element.tags.highway === 'cycleway') {
              const coords = element.nodes.map(nodeId => {
                const node = data.elements.find(el => el.id === nodeId && el.type === 'node');
                return [node.lat, node.lon];
              });
              L.polyline(coords, { color: '#00ff00', weight: 3 }).addTo(infraLayer).bindPopup('Велодорожка');
            } else if (element.type === 'node') {
              const { lat, lon } = element;
              let popupText = '';
              if (element.tags.amenity === 'bicycle_parking') popupText = 'Велопарковка';
              else if (element.tags.shop === 'bicycle') popupText = 'Веломагазин';
              else if (element.tags.amenity === 'bicycle_rental') popupText = 'Прокат велосипедов';
              L.marker([lat, lon]).addTo(infraLayer).bindPopup(popupText);
            }
          });
          infraLayer.addTo(map);
          infraButton.classList.add('active');
          infraLoaded = true;
          break;
        }
      } catch (error) {
        console.error(`Ошибка загрузки инфраструктуры с ${server}:`, error);
      }
    }

    if (!infraLoaded) {
      showNotification('Не удалось загрузить велоинфраструктуру. Попробуйте снова.');
    }
  } catch (error) {
    console.error('Ошибка отображения инфраструктуры:', error);
    showNotification('Не удалось загрузить велоинфраструктуру. Попробуйте снова.');
  }
}

infraButton.addEventListener('click', loadInfrastructure);

// Загрузка GPX
const gpxButton = document.getElementById('gpx-button');
const gpxFileInput = document.getElementById('gpx-file-input');
gpxButton.addEventListener('click', () => {
  if (gpxLayer) {
    map.removeLayer(gpxLayer);
    gpxLayer = null;
    routeStats.style.display = 'none';
    gpxButton.classList.remove('active');
    gpxFileInput.value = '';
  }
  gpxFileInput.click();
});

gpxFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const gpxContent = event.target.result;
    console.log('Содержимое GPX-файла:', gpxContent);

    // Простая проверка валидности GPX
    if (!gpxContent.includes('<gpx') || !gpxContent.includes('<trk>')) {
      showNotification('Файл GPX повреждён или имеет неподдерживаемый формат.');
      return;
    }

    try {
      gpxLayer = new L.GPX(gpxContent, {
        async: true,
        marker_options: {
          startIconUrl: null,
          endIconUrl: null,
          shadowUrl: null
        },
        polyline_options: {
          color: '#3388ff',
          weight: 5,
          opacity: 0.7
        }
      }).on('loaded', (e) => {
        console.log('GPX загружен:', e);
        map.fitBounds(e.target.getBounds());
        const distance = (e.target.get_distance() / 1000).toFixed(1);
        const averageSpeed = 15;
        const time = Math.round((e.target.get_distance() / 1000) / averageSpeed * 60);
        const elevationGain = e.target.get_elevation_gain().toFixed(0);

        routeDistance.textContent = distance;
        routeTime.textContent = time;
        routeElevation.textContent = elevationGain;
        routeStats.style.display = 'block';
        gpxButton.classList.add('active');
      }).on('error', (e) => {
        console.error('Ошибка загрузки GPX:', e);
        showNotification('Не удалось загрузить GPX-трек: ' + e.error);
      }).addTo(map);
    } catch (error) {
      console.error('Ошибка обработки GPX:', error);
      showNotification('Не удалось загрузить GPX-трек.');
    }
  };
  reader.onerror = () => {
    console.error('Ошибка чтения GPX-файла');
    showNotification('Не удалось прочитать GPX-файл.');
  };
  reader.readAsText(file);
});

// Загружаем сохранённые маркеры при старте
loadMarkers();