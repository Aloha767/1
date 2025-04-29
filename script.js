const YOUTUBE_API_KEY = 'AlzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
const CLIENT_ID = '1032352910036-ovsosc6r3ot2ipuvpginuumit05988qf.apps.googleusercontent.com';
let player;

function onYouTubeIframeAPIReady() {
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
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=10&type=video`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const videoList = document.getElementById('videoList');
            videoList.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.snippet.title;
                    li.onclick = () => player.loadVideoById(item.id.videoId);
                    videoList.appendChild(li);
                });
            } else {
                videoList.innerHTML = '<li>Видео не найдены</li>';
            }
        })
        .catch(error => {
            console.error('Ошибка поиска:', error);
            alert('Ошибка при поиске видео. Проверьте консоль для деталей.');
        });
}

function initGoogleSignIn() {
    gapi.load('auth2', () => {
        gapi.auth2.init({
            client_id: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/youtube.readonly'
        }).then(() => {
            const signInButton = document.getElementById('signInButton');
            const authInstance = gapi.auth2.getAuthInstance();
            if (authInstance.isSignedIn.get()) {
                const profile = authInstance.currentUser.get().getBasicProfile();
                document.getElementById('userInfo').textContent = `Привет, ${profile.getName()}!`;
                signInButton.style.display = 'none';
            }
            signInButton.onclick = () => {
                authInstance.signIn().then(googleUser => {
                    const profile = googleUser.getBasicProfile();
                    document.getElementById('userInfo').textContent = `Привет, ${profile.getName()}!`;
                    signInButton.style.display = 'none';
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
        controls: ['zoomControl', 'geolocationControl', 'searchControl']
    }, {
        suppressMapOpenBlock: true
    });

    const searchControl = map.controls.get('searchControl');
    searchControl.options.set({
        provider: 'yandex#search',
        noPlacemark: false,
        placeholderContent: 'Введите адрес или место'
    });

    const marker = new ymaps.Placemark([55.7558, 37.6173], {
        hintContent: 'Москва',
        balloonContent: 'Столица России'
    });
    map.geoObjects.add(marker);

    searchControl.events.add('resultselect', function (e) {
        const index = e.get('index');
        searchControl.getResult(index).then(result => {
            const coords = result.geometry.getCoordinates();
            map.setCenter(coords, 15);
        });
    });

    console.log('Яндекс.Карты инициализированы успешно');
}).catch(error => {
    console.error('Ошибка инициализации Яндекс.Карт:', error);
    alert('Ошибка загрузки Яндекс.Карт. Проверьте консоль для деталей.');
});

initGoogleSignIn();