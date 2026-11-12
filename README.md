# 🍣 Jireh Sushi · Página web y menú con pedidos

Página web oficial de **Jireh Sushi** (Santo Domingo Este), con menú digital y pedidos por WhatsApp.
*Frescura Sagrada.*

> **Estado:** 🟡 En pruebas. Faltan los precios reales y la ubicación exacta del local.

---

## ✨ Qué hace

**Página principal (`index.html`)**
- Pasarela de fotos en la portada (cambia sola, con flechas y deslizando con el dedo)
- Aviso de **Abierto / Cerrado** según la hora
- Horario de la semana con el **día de hoy resaltado**
- Categorías, promoción, "cómo pedir", nosotros y contacto
- Botones de WhatsApp y "Cómo llegar"

**Menú (`menu/index.html`)**
- Productos con foto, descripción y precio, organizados por categoría
- Buscador y carrito de compras
- Para llevar o **delivery**
- **Delivery calculado por kilómetro** con la ubicación del cliente (RD$ 30/km)
- Pago en **efectivo** (con "¿con cuánto pagas?") o **transferencia** (cuentas con botón *Copiar*)
- El pedido llega **completo por WhatsApp**: productos, total, dirección, enlace de Google Maps y forma de pago
- Cada pedido lleva un número (ej. `#RO85`)

**Panel del pedido (`menu/aviso.html`)**
- Se abre desde el enlace que llega al final de cada pedido
- Botones para avisar al cliente con un toque: *Recibido, En preparación, En camino / Listo, Pago recibido, Gracias*
- Botón para mandar el pedido al **grupo de delivery** con dirección, mapa y monto a cobrar
- No necesita base de datos: los datos viajan dentro del enlace

---

## 📁 Estructura

```
jireh-sushi/
├── index.html          ← Página principal
├── README.md
└── menu/
    ├── index.html      ← Menú con carrito y pedidos
    ├── aviso.html      ← Panel del pedido (para el negocio)
    └── fotos/
        ├── logo.png
        ├── *.jpg       ← Fotos de los productos
        └── pasarela/   ← Fotos completas para la pasarela de la portada
```

---

## ✏️ Cómo hacer cambios

Cada archivo tiene un **índice al inicio**. Para encontrar algo, busca con **Ctrl + F** el código que empieza con `@@`.

| Quiero cambiar… | Archivo | Busca |
|---|---|---|
| Número de WhatsApp | `menu/index.html` e `index.html` | `@@WHATSAPP` / `whatsapp:` |
| Horario | `menu/index.html` e `index.html` | `@@HORARIO` |
| Productos y precios | `menu/index.html` | `@@MENU` |
| Producto destacado | `menu/index.html` | `@@DESTACADO` |
| Cuentas de banco | `menu/index.html` | `@@BANCOS` |
| Precio del delivery por km | `menu/index.html` | `@@DELIVERY-KM` |
| Ubicación del local | `menu/index.html` | `@@UBICACION-LOCAL` |
| Fotos de la pasarela | `index.html` | `@@PASARELA` |
| Mensajes de aviso al cliente | `menu/aviso.html` | `@@AVISOS` |
| Mensaje para el delivery | `menu/aviso.html` | `@@DELIVERY-MSG` |
| Leer el pedido pegado de WhatsApp | `menu/aviso.html` | `@@PEGAR-PEDIDO` |
| Enlace del panel en el mensaje (apagado) | `menu/index.html` | `@@PANEL-AVISOS` |
| Ícono de la pestaña | los 3 archivos `.html` | `@@ICONO` (imágenes en `menu/fotos/favicon.png` e `icono-180.png`) |

**Agregar un producto** (en `@@MENU`):

```js
{ id:"nombre-sin-espacios", nombre:"Nombre visible", precio:495,
  desc:"Lo que lleva", img:"fotos/nombre.jpg", tag:"NUEVO" }
```

- `id`: único, en minúscula y sin espacios
- `precio`: solo el número, sin comas ni RD$
- `tag`: opcional ("NUEVO", "FAVORITO"…)
- `precioAntes`: opcional; si se pone, el precio viejo sale tachado

**Reglas para las fotos:** nombres en **minúscula**, **sin espacios** (usar guiones) y guardadas en `menu/fotos/`.

---

## 🚀 Antes de publicar oficialmente

- [ ] Poner los precios reales
- [x] Confirmar el banco de la primera cuenta
- [ ] Poner la ubicación exacta del local
- [ ] Cambiar el WhatsApp de pruebas por el del negocio (`18493604892`) en los dos `index.html`
- [ ] Borrar la línea `@@AVISO-PRUEBAS` en los dos `index.html`
- [ ] Borrar `<meta name="robots" content="noindex">` en `index.html` (para que Google la muestre)
- [ ] Conectar el dominio

---

## 🛣️ Próxima etapa

- Pantalla de cocina con pedidos en tiempo real
- Pantalla para los deliverys ("Lo tomo", mapa, llamar)
- Seguimiento del pedido para el cliente

---

## 🛠️ Tecnología

HTML, CSS y JavaScript, sin librerías ni servidor. Funciona en cualquier hosting estático (GitHub Pages, Cloudflare Pages, Netlify).

> La ubicación del cliente solo funciona con `https://`, o sea, con la página publicada. No funciona abriendo el archivo con doble clic.

---

**Diseño y desarrollo:** [Kenmake Soluciones](https://github.com/Kengiskang0117) · Menús digitales · Páginas web · Edición de video
© 2026 Jireh Sushi. Todos los derechos reservados.
