self.addEventListener('install', (e) => {
  // 跳过等待
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // 删除缓存
  caches.keys().then((keys) => {
    for (const key of keys) {
      if (!key.startsWith('workbox-')) continue;
      caches.delete(key);
      console.log(`删除缓存: ${key}`);
    }
  });

  // 卸载 Service Worker
  self.registration.unregister()
    .then((success) => {
      if (!success) throw new Error(self.registration.scope);
      console.log(`Service Worker 已卸载: ${self.registration.scope}`);
      return self.clients.matchAll();
    }, (err) => {
      console.log(`Service Worker 卸载失败: ${err}`);
    })
    .then((clients) => {
      clients.forEach((client) => client.navigate(client.url));
    });
});
