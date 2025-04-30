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
      if

 (!response.ok) throw new Error('Ошибка поиска местоположения');
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