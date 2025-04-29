const YOUTUBE_API_KEY = 'AlzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY'; // Замените, если ключ недействителен
let player;

function onYouTubeIframeAPIReady() {
    console.log('Инициализация YouTube плеера...');
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: 'M7lc1UVf-VE',
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onError': onPlayerError
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube плеер готов');
}

function onPlayerError(error) {
    console.error('Ошибка YouTube плеера:', error);
    alert('Ошибка загрузки YouTube плеера. Проверьте консоль.');
}

function searchVideos() {
    const query = document.getElementById('searchInput').value;
    if (!query) {
        alert('Введите запрос для поиска!');
        return;
    }
    console.log('Начинаем поиск видео:', query);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=10&type=video`;
    console.log('URL запроса:', url);
    fetch(url)
        .then(response => {
            console.log('Ответ от YouTube API:', response);
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Данные от YouTube API:', data);
            const videoList = document.getElementById('videoList');
            videoList.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.snippet.title;
                    li.onclick = () => {
                        console.log('Загрузка видео:', item.id.videoId);
                        player.loadVideoById(item.id.videoId);
                    };
                    videoList.appendChild(li);
                });
            } else {
                videoList.innerHTML = '<li>Видео не найдены</li>';
            }
        })
        .catch(error => {
            console.error('Ошибка поиска видео:', error);
            alert('Ошибка при поиске видео. Проверьте консоль для деталей.');
        });
}

ymaps.ready(() => {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Элемент #map не найден на странице!');
        return;
    }

    const map = new ymaps.Map('map', {
        center: [55.7558, 37.6173],
        zoom: 13,
        controls: ['zoomControl', 'geolocationControl']
    }, {
        suppressMapOpenBlock: true
    });

    const searchInput = document.getElementById('mapSearchInput');
    if (!searchInput) {
        console.error('Поле поиска #mapSearchInput не найдено!');
        return;
    }

    const searchControl = new ymaps.control.SearchControl({
        options: {
            provider: 'yandex#search',
            noPlacemark: false,
            placeholderContent: 'Введите адрес или место'
        }
    });
    map.controls.add(searchControl);

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const query = searchInput.value;
            if (query) {
                console.log('Поиск места на карте:', query);
                searchControl.search(query);
            }
        }
    });

    searchControl.events.add('resultselect', function (e) {
        const index = e.get('index');
        searchControl.getResult(index).then(result => {
            const coords = result.geometry.getCoordinates();
            map.setCenter(coords, 15);
            console.log('Место найдено, новые координаты:', coords);
        }).catch(error => {
            console.error('Ошибка при выборе результата поиска:', error);
        });
    });

    const marker = new ymaps.Placemark([55.7558, 37.6173], {
        hintContent: 'Москва',
        balloonContent: 'Столица России'
    });
    map.geoObjects.add(marker);

    console.log('Яндекс.Карты инициализированы успешно');
}).catch(error => {
    console.error('Ошибка инициализации Яндекс.Карт:', error);
    alert('Ошибка загрузки Яндекс.Карт. Проверьте консоль для деталей.');
});