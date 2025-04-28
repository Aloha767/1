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
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    // Плеер готов
}

// Поиск видео
function searchVideos() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;
    fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=10&type=video`)
        .then(response => response.json())
        .then(data => {
            const videoList = document.getElementById('videoList');
            videoList.innerHTML = '';
            if (data.items) {
                data.items.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item.snippet.title;
                    li.onclick = () => player.loadVideoById(item.id.videoId);
                    videoList.appendChild(li);
                });
            }
        })
        .catch(error => console.error('Ошибка поиска:', error));
}

// Google Sign-In
function initGoogleSignIn() {
    gapi.load('auth2', () => {
        gapi.auth2.init({
            client_id: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/youtube.readonly' // Доступ к данным YouTube
        }).then(() => {
            const signInButton = document.getElementById('signInButton');
            signInButton.onclick = () => {
                gapi.auth2.getAuthInstance().signIn().then(googleUser => {
                    const profile = googleUser.getBasicProfile();
                    document.getElementById('userInfo').textContent = `Привет, ${profile.getName()}!`;
                    signInButton.style.display = 'none';
                }).catch(error => console.error('Ошибка входа:', error));
            };
        }).catch(error => console.error('Ошибка инициализации:', error));
    });
}

// Карты (Leaflet)
const map = L.map('map').setView([55.7558, 37.6173], 13); // Москва
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
L.marker([55.7558, 37.6173]).addTo(map).bindPopup('Москва').openPopup();

// Инициализация
initGoogleSignIn();