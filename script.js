// --- YouTube функционал ---
const API_KEY = 'AIzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
const searchInput = document.getElementById('youtube-search');
const searchResults = document.getElementById('search-results');
const suggestionsContainer = document.getElementById('suggestions');
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
    // Получаем длительность для каждого видео
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

  // Закрытие автодополнения при клике вне
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