/* =========================================================
   CONEXIÓN CON FIREBASE · Jireh Sushi · Kenmake Soluciones
   ---------------------------------------------------------
   Este archivo lo usan las 3 páginas:
     - menu/index.html   → guarda el pedido del cliente
     - menu/panel.html   → el negocio ve los pedidos en vivo
     - menu/pedido.html  → el cliente sigue su pedido en vivo

   Colecciones en Firestore:
     pedidos/{id}      Pedido completo (solo lo ve el equipo con contraseña)
     seguimiento/{id}  Estado público del pedido (lo ve el cliente con su enlace)
     contadores/{dia}  Número del último pedido del día (para SAGRADO-1, SAGRADO-2…)
     config/menu       Lista de productos agotados y break (se marca desde el panel)
     seguimiento/{id}/mensajes  Chat del pedido entre el cliente y el negocio (texto y foto del comprobante)
   El {id} es el mismo en las dos y es largo y aleatorio: nadie lo puede adivinar.

   Para cambiar algo, busca con Ctrl+F:
   @@CONFIG      Datos del proyecto de Firebase (de la consola)
   @@VERSION     Versión de Firebase que se descarga
   ========================================================= */

/* @@VERSION */
const V = "10.12.2";
const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
const {
  getFirestore, collection, doc, writeBatch, updateDoc, setDoc, addDoc, runTransaction, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, getDocs, arrayUnion, arrayRemove, FieldPath, deleteField
} = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
const {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`);

/* @@CONFIG — sale de la consola de Firebase (Configuración del proyecto → Tus apps).
   Estos datos son públicos por diseño: la seguridad la ponen las reglas (firestore.rules). */
const firebaseConfig = {
  apiKey: "AIzaSyByDTI1tL_1cIDsZ2aQ4PQpwVF5AwZNIww",
  authDomain: "jireh-sushi.firebaseapp.com",
  projectId: "jireh-sushi",
  storageBucket: "jireh-sushi.firebasestorage.app",
  messagingSenderId: "881404297974",
  appId: "1:881404297974:web:db291d577b4cc6938ee2d7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* Día de hoy en hora de República Dominicana, ej. "2026-11-21" (sirve para buscar los pedidos del día) */
export const diaDeHoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Santo_Domingo" });

/* ---------- CLIENTE: guardar un pedido nuevo ----------
   Saca el siguiente número del día (SAGRADO-1, SAGRADO-2… vuelve a 1 cada día) y guarda
   el pedido completo y su seguimiento público a la vez (si algo falla, no se guarda nada). */
export async function crearPedido(pedido, publico, prefijo = "SAGRADO"){
  const ref = doc(collection(db, "pedidos"));
  const dia = diaDeHoy();
  const contador = doc(db, "contadores", dia);
  const codigo = await runTransaction(db, async tx => {
    const c = await tx.get(contador);
    const n = (c.exists() ? c.data().n || 0 : 0) + 1;
    const codigo = `${prefijo}-${n}`;
    tx.set(contador, { n });
    tx.set(ref, { ...pedido, codigo, dia, estado: "nuevo", creado: serverTimestamp() });
    tx.set(doc(db, "seguimiento", ref.id), { ...publico, codigo, estado: "nuevo", creado: serverTimestamp() });
    return codigo;
  });
  return { id: ref.id, codigo };
}

/* ---------- TODOS: productos agotados (en vivo) ----------
   Claves: id del producto ("eby-banana"), "prot:Salmón" (cambio de proteína) o "salsa:Salsa anguila". */
export function escucharDisponibilidad(alCambiar){
  return onSnapshot(doc(db, "config", "menu"),
    s => alCambiar(s.exists() ? (s.data().agotados || []) : [], s.exists() ? s.data() : {}),   // 2do dato: todo config/menu (break)
    () => alCambiar([], {}));
}
/* ---------- EQUIPO: guardar la lista de agotados (merge: no borra el break) ---------- */
/* @@AGOTADOS-SEGUROS: marca o desmarca UN producto sin tocar los demás.
   Antes se guardaba la lista completa: si otro celular tenía la lista vieja, borraba los agotados que puso el otro. */
export const marcarAgotado = (k, agotado) => setDoc(doc(db, "config", "menu"),
  { agotados: agotado ? arrayUnion(k) : arrayRemove(k), actualizado: serverTimestamp() }, { merge: true });
export const guardarAgotados = lista => setDoc(doc(db, "config", "menu"), { agotados: lista, actualizado: serverTimestamp() }, { merge: true });
/* ---------- EQUIPO: @@CERRAR-HOY — cerrar el negocio antes de tiempo. hasta = fecha en ms (fin del día), o null para volver a abrir ---------- */
export const guardarCierre = (hasta) => setDoc(doc(db, "config", "menu"),
  { cerradoHoy: hasta ? { hasta } : null, actualizado: serverTimestamp() }, { merge: true });

/* ---------- EQUIPO: @@MANTENIMIENTO — pantalla "Estamos mejorando". hasta = fecha en ms, o null para quitarla ---------- */
export const guardarMantenimiento = (hasta) => setDoc(doc(db, "config", "menu"),
  { mantenimiento: hasta ? { hasta } : null, actualizado: serverTimestamp() }, { merge: true });

/* ---------- EQUIPO: @@HORARIO-HOY — abrir o cerrar a otra hora SOLO hoy. datos = {dia, abre, cierra} o null ---------- */
export const guardarHorarioHoy = (datos) => setDoc(doc(db, "config", "menu"), { horarioHoy: datos || null, actualizado: serverTimestamp() }, { merge: true });

/* ---------- EQUIPO: @@ADMIN — lo que el dueño cambia desde "⚙️ Administrar" (precios, textos, ocultos, promoción)
   ruta = ["precios", "hot-pollo"] · valor = lo nuevo, o null para volver a lo normal ---------- */
export const guardarAdmin = (ruta, valor) => updateDoc(doc(db, "config", "menu"),
  new FieldPath("admin", ...ruta), valor === null ? deleteField() : valor, "actualizado", serverTimestamp());
export const ocultarProducto = (id, oculto) => updateDoc(doc(db, "config", "menu"),
  new FieldPath("admin", "ocultos"), oculto ? arrayUnion(id) : arrayRemove(id), "actualizado", serverTimestamp());

/* ---------- EQUIPO: break (pausa) — hasta = fecha en ms, o null para terminarlo ---------- */
export const guardarBreak = (hasta, mensaje) => setDoc(doc(db, "config", "menu"),
  { pausa: hasta ? { hasta, mensaje: mensaje || "" } : null, actualizado: serverTimestamp() }, { merge: true });

/* ---------- CLIENTE: escuchar el estado de su pedido (en vivo) ---------- */
export function escucharSeguimiento(id, alCambiar, alFallar){
  return onSnapshot(doc(db, "seguimiento", id),
    s => alCambiar(s.exists() ? { id: s.id, ...s.data() } : null),
    e => alFallar && alFallar(e));
}

/* ---------- EQUIPO: sesión ---------- */
export const entrar = (correo, clave) => signInWithEmailAndPassword(auth, correo, clave);
export const salir = () => signOut(auth);
export const alCambiarSesion = cb => onAuthStateChanged(auth, cb);

/* ---------- EQUIPO: pedidos de hoy en vivo ---------- */
export function escucharPedidosDeHoy(alCambiar, alFallar){
  const q = query(collection(db, "pedidos"), where("dia", "==", diaDeHoy()));
  return onSnapshot(q, s => {
    const lista = s.docs.map(d => ({ id: d.id, ...d.data() }));
    const nuevos = s.docChanges().filter(c => c.type === "added" && !s.metadata.hasPendingWrites).map(c => c.doc.id);
    alCambiar(lista, nuevos);
  }, e => alFallar && alFallar(e));
}

/* ---------- CLIENTE: @@CANCELAR — el cliente cancela su pedido mientras está "nuevo" (antes de que lo acepten).
   Se borra todo de la base de datos: mensajes del chat, el pedido y su seguimiento. ---------- */
export async function cancelarPedido(id){
  const m = await getDocs(collection(db, "seguimiento", id, "mensajes"));
  const b1 = writeBatch(db); m.docs.forEach(d => b1.delete(d.ref)); if (m.docs.length) await b1.commit();
  const b2 = writeBatch(db); b2.delete(doc(db, "pedidos", id)); b2.delete(doc(db, "seguimiento", id)); await b2.commit();
}

export const borrarPedido = cancelarPedido;
/* Si pagó por transferencia, NO se borra: queda como rechazado "Cancelado por el cliente" para que el dueño le devuelva el dinero */
export async function cancelarConDevolucion(id){
  const motivo = "Cancelado por el cliente";
  const b = writeBatch(db);
  b.update(doc(db, "pedidos", id), { estado: "rechazado", motivo, canceladoCliente: true, porDevolver: true });
  b.update(doc(db, "seguimiento", id), { estado: "rechazado", motivo, canceladoCliente: true });
  await b.commit();
}   // el equipo (Kengis) borra de verdad un pedido de prueba

/* ---------- EQUIPO: token de la sesión (para que Cloudflare sepa que es alguien del equipo) ---------- */
export const tokenSesion = () => auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null);

/* ---------- EQUIPO: @@REGISTRO — pedidos entre dos días (formato "2026-11-27"), para ver las ventas de la semana o el mes ---------- */
export async function buscarPedidos(desde, hasta){
  const s = await getDocs(query(collection(db, "pedidos"), where("dia", ">=", desde), where("dia", "<=", hasta)));
  return s.docs.map(d => ({ id: d.id, ...d.data() }));
}

/* ---------- EQUIPO: cambiar un pedido ----------
   cambios      → se guardan en el pedido completo
   cambiosCli   → se guardan en el seguimiento que ve el cliente (estado, minutos, hora de listo, motivo) */
export async function actualizarPedido(id, cambios, cambiosCli){
  const lote = writeBatch(db);
  lote.update(doc(db, "pedidos", id), { ...cambios, actualizado: serverTimestamp() });
  if (cambiosCli) lote.update(doc(db, "seguimiento", id), cambiosCli);
  await lote.commit();
}

/* Hora (como Timestamp de Firebase) dentro de X minutos */
export const enMinutos = m => Timestamp.fromMillis(Date.now() + m * 60000);

/* ---------- CHAT DEL PEDIDO (cliente ↔ negocio) ----------
   de: "cliente" o "negocio". foto: imagen ya reducida (data:image/jpeg;base64…), opcional. */
export function escucharChat(id, alCambiar){
  return onSnapshot(query(collection(db, "seguimiento", id, "mensajes"), orderBy("creado")),
    s => alCambiar(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => { console.warn("chat", e); alCambiar(null); });
}
export function enviarMensaje(id, de, texto, foto){
  const m = { de, texto: texto || "", creado: serverTimestamp() };
  if (foto) m.foto = foto;
  return addDoc(collection(db, "seguimiento", id, "mensajes"), m);
}
