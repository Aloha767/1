const API_KEY = 'AIzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
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