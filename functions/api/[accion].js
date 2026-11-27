/* =====================================================================
   @@AVISOS-PUSH — Notificaciones con la app cerrada (Cloudflare Pages Functions)
   Cloudflare publica este archivo solo, igual que la página. Responde en:
     POST /api/suscribir  → un celular del equipo se apunta para recibir avisos
     POST /api/aviso      → manda el aviso (pedido nuevo, mensaje del cliente, pedido listo)

   Necesita en Cloudflare (Pages → jireh-sushi → Settings):
     - Bindings → KV namespace:  variable SUBS
     - Variables and Secrets:    VAPID_PRIVATE (secreto)
   ===================================================================== */

const VAPID_PUBLIC = "BPeIc7uAhOtQ2tdILSZYmcZM5CX6jQYzrov1ictk9NOZiXcqrohCmPJd3V-wldcm1WYrhd95TkV-CwN3ceDLngw";
const VAPID_CONTACTO = "https://jireh-sushi.pages.dev";
const FIREBASE = { apiKey: "AIzaSyByDTI1tL_1cIDsZ2aQ4PQpwVF5AwZNIww", proyecto: "jireh-sushi" };
const DOMINIO_EQUIPO = "@jirehsushi.com";
const DELIVERYS = ["delivery@jirehsushi.com"];

export async function onRequestPost({ request, env, params }) {
  try {
    if (!env.SUBS || !env.VAPID_PRIVATE) return json({ ok: false, error: "Falta configurar SUBS o VAPID_PRIVATE en Cloudflare" }, 500);
    const datos = await request.json().catch(() => ({}));
    if (params.accion === "suscribir") return await suscribir(datos, env);
    if (params.accion === "aviso") return await aviso(datos, env);
    return json({ ok: false, error: "No existe" }, 404);
  } catch (e) {
    return json({ ok: false, error: String(e && e.message || e) }, 500);
  }
}
export async function onRequestGet({ env }) {   // para revisar que está bien configurado: abre /api/estado
  let n = 0; if (env.SUBS) { const l = await env.SUBS.list({ prefix: "sub:" }); n = l.keys.length; }
  return json({ ok: !!(env.SUBS && env.VAPID_PRIVATE), kv: !!env.SUBS, clave: !!env.VAPID_PRIVATE, celulares: n });
}

/* ---------- un celular del equipo se apunta ---------- */
async function suscribir({ token, sub }, env) {
  const correo = await correoDelEquipo(token);
  if (!correo) return json({ ok: false, error: "Sesión no válida" }, 401);
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return json({ ok: false, error: "Suscripción incompleta" }, 400);
  const rol = DELIVERYS.includes(correo) ? "delivery" : "cocina";
  await env.SUBS.put("sub:" + await huella(sub.endpoint), JSON.stringify({ sub, correo, rol, desde: Date.now() }), { metadata: { rol } });
  return json({ ok: true, rol });
}

/* ---------- mandar un aviso ---------- */
async function aviso({ id, tipo, token }, env) {
  if (!id || !/^[\w-]{6,40}$/.test(id)) return json({ ok: false, error: "Pedido no válido" }, 400);
  const seg = await leerSeguimiento(id);
  if (!seg) return json({ ok: false, error: "Ese pedido no existe" }, 404);
  const quien = (seg.nombre || "Cliente").split(/\s+/)[0], codigo = seg.codigo ? "#" + seg.codigo : "";
  let para, titulo, texto, clave, ttl;

  if (tipo === "nuevo") {             // lo llama la página del cliente al confirmar el pedido
    if (seg.estado !== "nuevo" || Date.now() - seg.creado > 15 * 60000) return json({ ok: false, error: "No es un pedido nuevo" }, 409);
    para = "cocina"; titulo = `🍣 Pedido nuevo ${codigo}`; texto = `${quien} · ${seg.modo === "delivery" ? "Delivery" : "Para llevar"}${seg.pago ? " · " + seg.pago : ""}. Toca para verlo.`;
    clave = "ya:nuevo:" + id; ttl = 86400;
  } else if (tipo === "chat") {        // lo llama la página del cliente al escribir en el chat
    if (["entregado", "rechazado"].includes(seg.estado)) return json({ ok: false, error: "Pedido cerrado" }, 409);
    para = "cocina"; titulo = `💬 ${codigo} · ${quien}`; texto = "Te escribió en el chat del pedido."; clave = "ya:chat:" + id; ttl = 60;   // máximo 1 aviso por minuto
  } else if (tipo === "listo") {       // lo llama el panel de la cocina al tocar "Listo para salir"
    if (!(await correoDelEquipo(token))) return json({ ok: false, error: "Sesión no válida" }, 401);
    para = "delivery"; titulo = `🛵 Listo para salir ${codigo}`; texto = `El pedido de ${quien} está listo. Toca para verlo.`; clave = "ya:listo:" + id; ttl = 86400;
  } else return json({ ok: false, error: "Tipo no válido" }, 400);

  if (await env.SUBS.get(clave)) return json({ ok: true, repetido: true });
  await env.SUBS.put(clave, "1", { expirationTtl: ttl });

  const lista = await env.SUBS.list({ prefix: "sub:" });
  const destinos = lista.keys.filter(k => !k.metadata || k.metadata.rol === para);
  const carga = JSON.stringify({ titulo, texto, etiqueta: tipo + "-" + id, url: "./panel.html" });
  let enviados = 0, borrados = 0;
  await Promise.all(destinos.map(async k => {
    const v = await env.SUBS.get(k.name); if (!v) return;
    const { sub, rol } = JSON.parse(v); if (rol !== para) return;
    const r = await enviarPush(sub, carga, env.VAPID_PRIVATE);
    if (r.status === 404 || r.status === 410) { await env.SUBS.delete(k.name); borrados++; }   // ese celular ya no existe
    else if (r.ok) enviados++;
  }));
  return json({ ok: true, enviados, borrados });
}

/* ---------- Firebase: ¿es alguien del equipo? (revisa la sesión del panel) ---------- */
async function correoDelEquipo(token) {
  if (!token) return null;
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE.apiKey}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken: token }) });
  if (!r.ok) return null;
  const u = ((await r.json()).users || [])[0];
  const correo = u && u.email ? u.email.toLowerCase() : "";
  return correo.endsWith(DOMINIO_EQUIPO) ? correo : null;
}
/* ---------- Firebase: lee el seguimiento público del pedido (para no avisar de pedidos inventados) ---------- */
async function leerSeguimiento(id) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE.proyecto}/databases/(default)/documents/seguimiento/${id}`);
  if (!r.ok) return null;
  const f = (await r.json()).fields || {};
  const s = k => f[k] && (f[k].stringValue ?? f[k].integerValue ?? null);
  return { estado: s("estado"), codigo: s("codigo"), nombre: s("nombre"), modo: s("modo"), pago: s("pago"),
           creado: f.creado && f.creado.timestampValue ? Date.parse(f.creado.timestampValue) : 0 };
}

/* =====================================================================
   Web Push (RFC 8291 + VAPID RFC 8292) con WebCrypto. No tocar.
   ===================================================================== */
const te = new TextEncoder();
const b64u = {
  enc: buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: s => { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
};
const unir = (...partes) => { const t = partes.reduce((a, p) => a + p.length, 0), r = new Uint8Array(t); let o = 0; for (const p of partes) { r.set(p, o); o += p.length; } return r; };
async function hmac(clave, datos) {
  const k = await crypto.subtle.importKey("raw", clave, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, datos));
}
async function huella(texto) { return b64u.enc(await crypto.subtle.digest("SHA-256", te.encode(texto))).slice(0, 32); }

export async function cifrar(sub, texto) {
  const uaPublic = b64u.dec(sub.keys.p256dh), authSecret = b64u.dec(sub.keys.auth);
  const local = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, local.privateKey, 256));
  const prkKey = await hmac(authSecret, ecdh);
  const ikm = await hmac(prkKey, unir(te.encode("WebPush: info\0"), uaPublic, asPublic, new Uint8Array([1])));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, unir(te.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, unir(te.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const clave = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, clave, unir(te.encode(texto), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]);   // 4096
  return unir(salt, rs, new Uint8Array([asPublic.length]), asPublic, cifrado);
}
export async function firmaVapid(audiencia, privada) {
  const pub = b64u.dec(VAPID_PUBLIC);
  const jwk = { kty: "EC", crv: "P-256", d: privada, x: b64u.enc(pub.slice(1, 33)), y: b64u.enc(pub.slice(33, 65)), ext: true };
  const k = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const cab = b64u.enc(te.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const cuerpo = b64u.enc(te.encode(JSON.stringify({ aud: audiencia, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: VAPID_CONTACTO })));
  const firma = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, te.encode(cab + "." + cuerpo));
  return `vapid t=${cab}.${cuerpo}.${b64u.enc(firma)}, k=${VAPID_PUBLIC}`;
}
async function enviarPush(sub, texto, privada) {
  const cuerpo = await cifrar(sub, texto);
  return fetch(sub.endpoint, {
    method: "POST",
    headers: { "Authorization": await firmaVapid(new URL(sub.endpoint).origin, privada), "Content-Encoding": "aes128gcm",
               "Content-Type": "application/octet-stream", "TTL": "3600", "Urgency": "high" },
    body: cuerpo
  });
}
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
