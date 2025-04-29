const YOUTUBE_API_KEY = 'AlzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
const CLIENT_ID = '1032352910036-ovsosc6r3ot2ipuvpginuumit05988qf.apps.googleusercontent.com';
let player;

// Проверка загрузки Google API
if (typeof gapi === 'undefined') {
    console.error('Google API (gapi) не загружен! Проверьте скрипт https://apis.google.com/js/platform.js');
}

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

function initGoogleSignIn() {
    console.log('Инициализация Google Sign-In...');
    if (!window.gapi) {
        console.error('gapi не определён! Проверьте загрузку Google API.');
        return;
    }
    gapi.load('auth2', () => {
        console.log('Библиотека auth2 загружена');
        gapi.auth2.init({
            client_id: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/youtube.readonly'
        }).then(() => {
            console.log('Google Sign-In инициализирован');
            const signInButton = document.getElementById('signInButton');
            if (!signInButton) {
                console.error('Кнопка #signInButton не найдена!');
                return;
            }
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
                const profile = authInstance.currentUser.get().getBasicProfile();
                document.getElementById('userInfo').textContent = `Привет, ${profile.getName()}!`;
                signInButton.style.display = 'none';
                console.log('Пользователь уже авторизован:', profile.getName());
            }
            signInButton.onclick = () => {
                console.log('Нажата кнопка "Войти в Google"');
                authInstance.signIn().then(googleUser => {
                    const profile = googleUser.getBasicProfile();
                    document.getElementById('userInfo').textContent = `Привет, ${profile.getName()}!`;
                    signInButton.style.display = 'none';
                    console.log('Авторизация успешна:', profile.getName());
                }).catch(error => {
                    console.error('Ошибка входа:', error);
                    alert('Ошибка авторизации. Проверьте консоль.');
                });
            };
        }).catch(error => {
            console.error('Ошибка инициализации Google Sign-In:', error);
            alert('Ошибка инициализации авторизации. Проверьте консоль.');
        });
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    console.log('Документ загружен, запускаем initGoogleSignIn...');
    initGoogleSignIn();
});