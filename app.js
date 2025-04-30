// --- YouTube функционал ---
const API_KEY = 'AIzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY'; // Ваш действующий ключ
const searchInput = document.getElementById('youtube-search');
const searchResults = document.getElementById('search-results');
let player;
let isPlayerReady = false;

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

async function searchVideos(query) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&key=${API_KEY}`
    );
    if (!response.ok) {
      throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    }
    const data = await response.json();
    displaySearchResults(data.items || []);
  } catch (error) {
    console.error('Ошибка поиска видео:', error);
    alert('Не удалось выполнить поиск видео. Проверьте API-ключ.');
  }
}

function displaySearchResults(videos) {
  searchResults.innerHTML = '';
  videos.forEach(video => {
    const videoId = video.id?.videoId;
    const title = video.snippet?.title;
    const thumbnail = video.snippet?.thumbnails?.default?.url;
    const duration = '3:45';

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

document.addEventListener("DOMContentLoaded", function () {
  searchInput.addEventListener('input', debounce(async (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
      try {
        await searchVideos(query);
      } catch (error) {
        console.error('Ошибка поиска:', error);
      }
    }
  }, 300));
});

// --- OpenStreetMap функционал ---
const map = L.map('map').setView([51.505, -0.09], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const mapSearchInput = document.getElementById('map-search');
mapSearchInput.addEventListener('input', async (e) => {
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
});

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

// Регистрация сервис-воркера
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker зарегистрирован:', registration);
      })
      .catch(error => {
        console.error('Ошибка регистрации Service Worker:', error);
      });
  });
}