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
     config/menu       Lista de productos agotados (se marca desde el panel)
   El {id} es el mismo en las dos y es largo y aleatorio: nadie lo puede adivinar.

   Para cambiar algo, busca con Ctrl+F:
   @@CONFIG      Datos del proyecto de Firebase (de la consola)
   @@VERSION     Versión de Firebase que se descarga
   ========================================================= */

/* @@VERSION */
const V = "10.12.2";
const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
const {
  getFirestore, collection, doc, writeBatch, updateDoc, setDoc, runTransaction, onSnapshot, query, where, serverTimestamp, Timestamp
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
    s => alCambiar(s.exists() ? (s.data().agotados || []) : []),
    () => alCambiar([]));
}
/* ---------- EQUIPO: guardar la lista de agotados ---------- */
export const guardarAgotados = lista => setDoc(doc(db, "config", "menu"), { agotados: lista, actualizado: serverTimestamp() });

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
