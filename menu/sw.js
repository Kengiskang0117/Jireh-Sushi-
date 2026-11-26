/* Service worker del panel de Jireh Sushi · Kenmake Soluciones
   Sirve para mostrar avisos del sistema (con sonido y vibración del celular) cuando entra un pedido
   o un mensaje, y para abrir el panel al tocar el aviso. No guarda nada en caché. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil((async () => {
    const lista = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of lista) if (c.url.includes("panel.html")) { c.focus(); return; }
    await self.clients.openWindow("./panel.html");
  })());
});
