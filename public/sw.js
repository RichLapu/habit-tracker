const CACHE_NAME = 'habit-tracker-v1';

// --- LÓGICA DE PWA (CACHE E OFFLINE) ---

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalado!');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado e pronto para background!');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Limpando cache antigo');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// --- LÓGICA DE NOTIFICAÇÕES PUSH ---

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Hábito!', body: 'Hora de concluir seu hábito.' };
  
  const options = {
    body: data.body,
    icon: '/icon-256.png', 
    badge: '/icon-256.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/' // Guarda a URL para onde ir ao clicar
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Lógica aprimorada para abrir a janela correta
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Verifica se já existe uma aba do app aberta e foca nela
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Se não houver aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});