// Инициализация карты Яндекс
ymaps.ready(init);

function init() {
    var map = new ymaps.Map("map", {
        center: [55.7558, 37.6173], // Москва по умолчанию
        zoom: 10
    });
    
    // Добавление метки на карту
    var placemark = new ymaps.Placemark([55.7558, 37.6173], {
        balloonContent: 'Это Москва!'
    });
    map.geoObjects.add(placemark);
}

// Функция для создания YouTube плеера
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId: 'dQw4w9WgXcQ', // Изначальное видео
    });
}

// Обработчик поиска на YouTube
const youtubeSearchResults = document.getElementById('youtube-search-results');
const searchInput = document.getElementById('search');

searchInput.addEventListener('input', async (event) => {
    const query = event.target.value;
    if (query.length > 2) {
        const results = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=AIzaSyDZTr6Z8WTPti9BnNc-TkmmasspiEFIpjeY`);
        const data = await results.json();

        youtubeSearchResults.innerHTML = '';
        data.items.forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('result-item');
            resultItem.innerText = item.snippet.title;
            resultItem.addEventListener('click', () => {
                player.loadVideoById(item.id.videoId);
                youtubeSearchResults.innerHTML = ''; // Скрыть результаты
            });
            youtubeSearchResults.appendChild(resultItem);
        });
    } else {
        youtubeSearchResults.innerHTML = '';
    }
});