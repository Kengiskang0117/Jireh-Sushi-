/* =========================================================
   @@DESCUENTO — Descuento general por fechas (Black Friday, aniversario, etc.)
   ESTE ES EL ÚNICO LUGAR QUE HAY QUE TOCAR. Lo usan la portada y el menú.

   - activo:  true = funciona en las fechas de abajo · false = apagado aunque sea la fecha
   - desde / hasta: días en que aplica (año-mes-día, ambos incluidos). Se prende y se apaga SOLO.
       Solo el viernes 27:  desde: "2026-11-27", hasta: "2026-11-27"
       Viernes y sábado:    desde: "2026-11-27", hasta: "2026-11-28"
   - porcentaje: cuánto se descuenta (15 = 15 %)
   - excluir: secciones SIN descuento (ids: "bebidas", "para-picar", "cajas" = combos…)
   - solo: si tiene algo, el descuento es SOLO para esas secciones (ej.: ["empanizados"] = Colección HOT). Vacío [] = toda la carta
   - imagen: foto que sale primero en el carrusel de la portada mientras dure

   Para verlo ANTES de la fecha (solo tú): abre la página con  ?descuento=ver  al final
     ej.: jireh-sushi.pages.dev/menu/?descuento=ver
   ========================================================= */
const DESCUENTO = {
  activo: true,
  desde: "2026-11-27",
  hasta: "2026-11-27",
  horaFin: "20:00",          // el último día se quita a esta hora (24 h). Vacío "" = todo el día
  porcentaje: 15,
  titulo: "BLACK FRIDAY",
  texto: "15% de descuento en la Colección HOT (empanizados) · Solo hoy hasta las 8:00 PM",
  excluir: ["bebidas"],
  solo: ["empanizados"],     // 27 nov tarde: el dueño lo deja solo en los empanizados
  imagen: "menu/fotos/pasarela/black-friday.jpg"
};

/* @@AVISO-ANTES — foto de cuenta regresiva ("Falta 1 día") que sale primero en el carrusel SOLO esos días.
   Se quita sola. Para no usarla: activo: false */
const AVISO_ANTES = {
  activo: true,
  desde: "2026-11-26",
  hasta: "2026-11-26",
  imagen: "menu/fotos/pasarela/falta-1-dia.jpg"
};

/* --- no tocar de aquí para abajo --- */
const DESCUENTO_HOY = (function(){
  if (/[?&]descuento=ver\b/.test(location.search)) return true;
  if (!DESCUENTO.activo) return false;
  const d = new Date(), hoy = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (hoy === DESCUENTO.hasta && DESCUENTO.horaFin) {   // último día: se quita a la hora indicada
    const [hh, mm] = DESCUENTO.horaFin.split(":").map(Number);
    if (d.getHours() * 60 + d.getMinutes() >= hh * 60 + mm) return false;
  }
  return hoy >= DESCUENTO.desde && hoy <= DESCUENTO.hasta;
})();

const AVISO_HOY = (function(){
  if (!AVISO_ANTES.activo || DESCUENTO_HOY) return false;
  const d = new Date(), hoy = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  return hoy >= AVISO_ANTES.desde && hoy <= AVISO_ANTES.hasta;
})();

/* Si la página está abierta cuando llega la hora de fin, se recarga sola para quitar el descuento (el carrito se guarda). */
(function(){
  if (!DESCUENTO_HOY || !DESCUENTO.horaFin || /[?&]descuento=ver\b/.test(location.search)) return;
  const d = new Date(), hoy = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  if (hoy !== DESCUENTO.hasta) return;
  const [hh, mm] = DESCUENTO.horaFin.split(":").map(Number), fin = new Date(d); fin.setHours(hh, mm, 0, 0);
  const falta = fin - d; if (falta > 0 && falta < 86400000) setTimeout(() => location.reload(), falta + 1000);
})();
