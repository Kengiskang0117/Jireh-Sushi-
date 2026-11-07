# 🍣 Jireh Sushi · Página web y menú con pedidos

Página web oficial de Jireh Sushi (Santo Domingo Este), con menú digital y pedidos por WhatsApp. Frescura Sagrada.

Estado: 🟡 En pruebas. Faltan los precios reales, el banco por confirmar y la ubicación exacta del local.

✨ Qué hace

Página principal (index.html)

Pasarela de fotos en la portada (cambia sola, con flechas y deslizando con el dedo)
Aviso de Abierto / Cerrado según la hora
Horario de la semana con el día de hoy resaltado
Categorías, promoción, "cómo pedir", nosotros y contacto
Botones de WhatsApp y "Cómo llegar"

Menú (menu/index.html)

Productos con foto, descripción y precio, organizados por categoría
Buscador y carrito de compras
Para llevar o delivery
Delivery calculado por kilómetro con la ubicación del cliente (RD$ 30/km)
Pago en efectivo (con "¿con cuánto pagas?") o transferencia (cuentas con botón Copiar)
El pedido llega completo por WhatsApp: productos, total, dirección, enlace de Google Maps y forma de pago
Cada pedido lleva un número (ej. #RO85)

Panel del pedido (menu/aviso.html)

Se abre desde el enlace que llega al final de cada pedido
Botones para avisar al cliente con un toque: Recibido, En preparación, En camino / Listo, Pago recibido, Gracias
Botón para mandar el pedido al grupo de delivery con dirección, mapa y monto a cobrar
No necesita base de datos: los datos viajan dentro del enlace


📁 Estructura
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
