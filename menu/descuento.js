/* =========================================================
   @@DESCUENTO — Descuento general por fechas (Black Friday, aniversario, etc.)
   ESTE ES EL ÚNICO LUGAR QUE HAY QUE TOCAR. Lo usan la portada y el menú.

   - activo:  true = funciona en las fechas de abajo · false = apagado aunque sea la fecha
   - desde / hasta: días en que aplica (año-mes-día, ambos incluidos). Se prende y se apaga SOLO.
       Solo el viernes 27:  desde: "2026-11-27", hasta: "2026-11-27"
       Viernes y sábado:    desde: "2026-11-27", hasta: "2026-11-28"
   - porcentaje: cuánto se descuenta (15 = 15 %)
   - excluir: secciones SIN descuento (ids: "bebidas", "para-picar", "cajas" = combos…)
   - imagen: foto que sale primero en el carrusel de la portada mientras dure

   Para verlo ANTES de la fecha (solo tú): abre la página con  ?descuento=ver  al final
     ej.: jireh-sushi.pages.dev/menu/?descuento=ver
   ========================================================= */
const DESCUENTO = {
  activo: true,
  desde: "2026-11-27",
  hasta: "2026-11-28",
  porcentaje: 15,
  titulo: "BLACK FRIDAY",
  texto: "15% de descuento en toda la carta · Viernes y sábado",
  excluir: ["bebidas"],
  imagen: "menu/fotos/pasarela/black-friday.jpg"
};

/* --- no tocar de aquí para abajo --- */
const DESCUENTO_HOY = (function(){
  if (/[?&]descuento=ver\b/.test(location.search)) return true;
  if (!DESCUENTO.activo) return false;
  const d = new Date(), hoy = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  return hoy >= DESCUENTO.desde && hoy <= DESCUENTO.hasta;
})();
