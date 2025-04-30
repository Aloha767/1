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