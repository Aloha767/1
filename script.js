// YouTube API
const YOUTUBE_API_KEY = 'AlzaSyDZTr6Z8WTPti9BnNcTkmmasspiEFIpjeY';
const CLIENT_ID = '1032352910036-ovsosc6r3ot2ipuvpginuumit05988qf.apps.googleusercontent.com';
let player;

// Инициализация YouTube плеера
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '100%',
        width: '100%',
        videoId: 'M7lc1UVf-VE', // Тестовое видео
        playerVars: {
            'playsinline': 1 // Для корректной работы на iOS
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

// Поиск видео
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

// Google Sign-In
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

// OpenStreetMap с помощью Leaflet
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([55.7558, 37.6173], 13); // Москва

    // Добавляем тайлы OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Добавляем маркер
    const marker = L.marker([55.7558, 37.6173]).addTo(map);
    marker.bindPopup('Москва, Россия').openPopup();

    // Логирование для отладки
    console.log('OpenStreetMap инициализирована');
});

// Инициализация
initGoogleSignIn();