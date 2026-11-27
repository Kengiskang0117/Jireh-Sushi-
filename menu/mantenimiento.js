/* =========================================================
   @@MANTENIMIENTO — pantalla "Estamos mejorando la página"
   Se prende y se apaga desde el panel de la cocina (botón 🛠️). Lo usan la portada y el menú.
   - Se apaga sola a las 6 horas por si se olvida.
   - Los pedidos que ya están en "Mi pedido" siguen funcionando.
   - Para ver la página mientras trabajas (solo tú): ábrela con  ?ver=kenmake  al final
       ej.: jireh-sushi.pages.dev/?ver=kenmake   (se recuerda mientras no cierres la pestaña)
   ========================================================= */
(function(){
  try { if (/[?&]ver=kenmake\b/.test(location.search)) sessionStorage.setItem("saltar-mantenimiento", "1"); } catch(e) {}
  const saltar = () => { try { return sessionStorage.getItem("saltar-mantenimiento") === "1"; } catch(e) { return false; } };
  const css = `#mant{position:fixed;inset:0;z-index:9999;background:radial-gradient(circle at 50% 30%,#2a0a0c,#0B0B0C 70%);color:#F4F1EC;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:inherit}
  #mant .caja{max-width:440px}#mant img{width:150px;height:auto;margin:0 auto 18px;display:block}
  #mant h1{font-size:clamp(26px,6vw,36px);margin:0 0 10px;font-weight:900;font-style:italic}#mant p{color:#C9C3B8;font-size:16px;line-height:1.5;margin:0 0 22px}
  #mant .botones{display:flex;flex-direction:column;gap:10px}#mant a{display:flex;align-items:center;justify-content:center;min-height:52px;border-radius:999px;font-weight:800;text-decoration:none;font-size:16px}
  #mant .wa{background:#E3121B;color:#fff}#mant .ig{border:1.5px solid #555;color:#F4F1EC}#mant small{display:block;margin-top:18px;color:#8C867E}
  #mant-aviso{position:fixed;left:10px;right:10px;bottom:10px;z-index:9999;background:#7B1D1D;color:#fff;padding:10px 14px;border-radius:12px;font:700 14px/1.3 sans-serif;text-align:center}`;
  window.aplicarMantenimiento = function(config, whatsapp, raiz){
    const m = config && config.mantenimiento && config.mantenimiento.hasta > Date.now();
    let capa = document.getElementById("mant"), aviso = document.getElementById("mant-aviso");
    if (!document.getElementById("mant-css")) { const s = document.createElement("style"); s.id = "mant-css"; s.textContent = css; document.head.append(s); }
    if (!m) { if (capa) capa.remove(); if (aviso) aviso.remove(); document.documentElement.style.overflow = ""; return; }
    if (saltar()) {   // tú ves la página normal, con un aviso abajo
      if (!aviso) { aviso = document.createElement("div"); aviso.id = "mant-aviso"; aviso.textContent = "🛠️ Modo mantenimiento: los clientes ven la pantalla de \"Estamos mejorando\". Tú la ves normal."; document.body.append(aviso); }
      return;
    }
    if (!capa) {
      capa = document.createElement("div"); capa.id = "mant"; capa.setAttribute("role", "alert");
      capa.innerHTML = `<div class="caja"><img src="${raiz}fotos/logo.png" alt="Jireh Sushi">
        <h1>Estamos mejorando nuestra página 🛠️</h1>
        <p>Volvemos en un rato con todo listo para ti. Si quieres hacer un pedido ahora, escríbenos por WhatsApp.</p>
        <div class="botones"><a class="wa" href="https://api.whatsapp.com/send?phone=${whatsapp}&text=${encodeURIComponent("Hola, quiero hacer un pedido")}" target="_blank" rel="noopener">Escribir por WhatsApp</a>
        <a class="ig" href="https://www.instagram.com/jirehsushird" target="_blank" rel="noopener">Ver Instagram</a></div>
        <small>Jireh Sushi · Frescura Sagrada</small></div>`;
      document.body.append(capa);
    }
    document.documentElement.style.overflow = "hidden";
  };
})();
