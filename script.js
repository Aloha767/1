// --- YouTube ---
const API_KEY = 'AIzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
let player;
let isPlayerReady = false;

function onYouTubeIframeAPIReady() {
  try {
    player = new YT.Player('youtube-player', {
      height: '100%',
      width: '100%',
      playerVars: { autoplay: 1, controls: 1 },
      events: {
        onReady: onPlayerReady,
        onError: (error) => console.error('Ошибка плеера:', error),
      },
    });
  } catch (err) {
    console.error('Ошибка инициализации:', err);
  }
}

function onPlayerReady(event) {
  isPlayerReady = true;
}

// --- Поиск видео ---
function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

const searchInput = document.getElementById('youtube-search');
const searchResults = document.getElementById('search-results');

async function searchVideos(query) {
  if (!query.trim()) return;
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`
    );
    if (!response.ok) throw new Error('Ошибка сети');
    const data = await response.json();
    displaySearchResults(data.items || []);
  } catch (error) {
    console.error('Ошибка поиска:', error);
  }
}

function displaySearchResults(videos) {
  searchResults.innerHTML = '';
  videos.forEach(video => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    item.innerHTML = `
      <img src="${video.snippet.thumbnails.default.url}" alt="${video.snippet.title}" />
      <div>${video.snippet.title}</div>
    `;
    item.addEventListener('click', () => playVideo(video.id.videoId));
    searchResults.appendChild(item);
  });
}

function playVideo(videoId) {
  if (isPlayerReady) player.loadVideoById(videoId);
}

// --- Карта и геолокация ---
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

// --- Геолокация ---
const geoButton = document.getElementById('geo-button');
const lastLocationBtn = document.getElementById('last-location-btn');

geoButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Геолокация не поддерживается');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 13);
      L.marker([latitude, longitude]).addTo(map).bindPopup('Вы здесь').openPopup();
      saveLastLocation(latitude, longitude);
    },
    (error) => alert(`Ошибка геолокации: ${error.message}`)
  );
});

// --- Последнее местоположение ---
let lastKnownLocation = null;

function saveLastLocation(lat, lon) {
  localStorage.setItem('lastLocation', JSON.stringify({ lat, lon }));
}

function loadLastLocation() {
  const saved = localStorage.getItem('lastLocation');
  if (saved) lastKnownLocation = JSON.parse(saved);
}

lastLocationBtn.addEventListener('click', () => {
  loadLastLocation();
  if (lastKnownLocation) {
    map.setView([lastKnownLocation.lat, lastKnownLocation.lon], 13);
    L.marker([lastKnownLocation.lat, lastKnownLocation.lon])
      .addTo(map)
      .bindPopup('Последнее местоположение')
      .openPopup();
  } else {
    alert('Последнее местоположение не найдено');
  }
});

// --- Поиск по карте ---
const mapSearchInput = document.getElementById('map-search');
mapSearchInput.addEventListener('input', debounce(async (e) => {
  const query = e.target.value;
  if (query.length > 2) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      if (!response.ok) throw new Error('Ошибка поиска');
      const data = await response.json();
      if (data.length > 0) {
        const { lat, lon } = data[0];
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup('Найдено').openPopup();
      }
    } catch (error) {
      console.error('Ошибка поиска по карте:', error);
    }
  }
}, 300));

// Инициализация
loadLastLocation();