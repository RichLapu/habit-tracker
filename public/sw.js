// public/sw.js

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado!');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado e pronto para background!');
});

// Fica escutando os eventos de notificação enviados pelo servidor (Push API)
self.addEventListener('push', function(event) {
  // Se recebermos dados, usamos eles. Senão, usamos um padrão.
  const data = event.data ? event.data.json() : { title: 'Hábito!', body: 'Hora de concluir seu hábito.' };
  
  const options = {
    body: data.body,
    icon: 'https://www.svgrepo.com/show/474347/calendar.svg', // Ícone que aparece na notificação do Windows
    vibrate: [200, 100, 200], // Vibração para celulares
  };

  // Acorda o Windows/Mac e joga a notificação na tela
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Quando o usuário clicar na notificação do Windows, o app abre
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});