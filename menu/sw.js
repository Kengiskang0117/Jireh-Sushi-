/* Service worker del panel de Jireh Sushi · Kenmake Soluciones
   Sirve para mostrar avisos del sistema (con sonido y vibración del celular) cuando entra un pedido
   o un mensaje, y para abrir el panel al tocar el aviso. No guarda nada en caché. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
/* @@AVISOS-PUSH: aviso que manda Cloudflare (functions/api/[accion].js) aunque el panel esté cerrado */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch(x) { d = { titulo: "Jireh Sushi", texto: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Jireh Sushi", {
    body: d.texto || "", tag: d.etiqueta || "jireh", renotify: true, requireInteraction: true,
    vibrate: [300, 120, 300, 120, 300], icon: "fotos/icono-192.png", badge: "fotos/icono-192.png", data: { url: d.url || "./panel.html" }
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const lista = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of lista) if (c.url.includes("panel.html")) { c.focus(); return; }
    await self.clients.openWindow("./panel.html");
  })());
});
