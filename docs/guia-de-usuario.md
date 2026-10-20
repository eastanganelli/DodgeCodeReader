# Guía de usuario

*[Read in English](user-guide.md)*

El Lector de Códigos Dodge lee los códigos de falla guardados en la computadora del motor
de tu Dodge, Chrysler, Jeep o Plymouth **mirando cómo parpadea la luz de check-engine en
un video**. No hace falta escáner, cables ni herramientas: solo un celular o una computadora.

Funciona en la mayoría de los vehículos del grupo Chrysler de los años 90 que muestran
los códigos con parpadeos de la luz de check-engine (por ejemplo, una Dodge Dakota 1994).

---

## 1. Abrir la app

Entrá a **https://eastanganelli.github.io/DodgeCodeReader/** desde Chrome, Edge, Safari o Firefox.

**Instalala (opcional, recomendado).** Una vez instalada se abre como cualquier app y
funciona sin internet.

| Dispositivo | Cómo instalar |
|---|---|
| Android (Chrome) | Menú **⋮ → Instalar app** (o *Agregar a pantalla principal*) |
| iPhone / iPad (Safari) | Botón **Compartir → Agregar a inicio** |
| Windows / Mac / Linux (Chrome, Edge) | Ícono de instalar en la barra de direcciones, o menú **→ Instalar Dodge Code Reader** |

## 2. Ajustar la pantalla a tu gusto

Arriba, en todas las pantallas:

- **A A A**: tres tamaños de letra. Elegí el que te resulte cómodo.
- **ES / EN**: español o inglés.
- **☀ / ☾**: colores claros u oscuros. Claro es mejor de día, oscuro de noche.

La app recuerda lo que elegiste.

## 3. Preparar la camioneta

1. Sentate en el asiento del conductor. **Motor APAGADO.**
2. Girá la llave **ON – OFF – ON – OFF – ON** en unos 5 segundos.
   Dejala en **ON**. **No arranques el motor.**
3. Mirá la luz de check-engine. Empieza a parpadear en grupos: esa es la lista de códigos.
   Termina con **5 parpadeos, pausa, 5 parpadeos** (código 55).

> **Consejo:** si te perdiste el comienzo, poné la llave en OFF y repetí la secuencia.

## 4. Filmar la luz

Tocá **Grabar video** (abre la cámara) o **Elegir un video** (uno que ya tengas).

Para una buena lectura:

- Empezá a filmar **antes** del último giro a ON, así se graba el primer parpadeo.
- Seguí filmando hasta que la luz deje de parpadear (alrededor de 1 minuto). Asegurate
  de que se vea el **55** al final.
- Sostené el celular **firme**. Apoyalo en el volante o usá un soporte.
- Acercate: la luz tiene que verse bien, no como un puntito.
- Evitá el sol directo sobre el tablero y los reflejos en el vidrio. La sombra ayuda.
- Sirve cualquier video común (MP4, MOV, WebM). Lo ideal es 30 cuadros por segundo o más.

## 5. Encontrar la luz (paso 1 de 3)

La app revisa el video y pone un **recuadro amarillo** sobre la luz que parpadea.

- Si el recuadro está sobre la luz de check-engine → tocá **Sí, leer los códigos**.
- Si está sobre otra cosa → **tocá la luz de check-engine** en el video para mover el
  recuadro, o **arrastrá** para dibujar uno nuevo.
- Si dice que no encontró una luz parpadeando → tocá la luz vos.

**Buscar de nuevo** repite la búsqueda automática. **Usar otro video** vuelve atrás.

### Ajustes avanzados (opcional)

Casi nunca hacen falta. Abrí **Ajustes avanzados** si la lectura sale mal:

| Ajuste | Cuándo cambiarlo |
|---|---|
| **Empezar en / Terminar en** | El video tiene mucho tiempo antes o después de los parpadeos. Recortalo. |
| **Sensibilidad automática** | Dejala activada. Desactivala solo si la luz es muy tenue y mové el **Umbral de sensibilidad** hasta que funcione. |
| **Pausa máx. dentro de un dígito** | Dos dígitos se juntan en uno (por ejemplo 4 y 3 se leen como 7). Bajalo. |
| **Pausa mín. entre códigos** | Dos códigos se juntan o uno se parte. Ajustalo de a poco. |

## 6. Leyendo (paso 2 de 3)

Dejá la pantalla abierta mientras trabaja. Vas a ver:

- Una barra de progreso.
- **Parpadeos**: cuántos destellos contó.
- **Contando**: el dígito que está contando en este momento.
- Los códigos aparecen abajo a medida que los encuentra.
- El recuadro amarillo brilla cada vez que la luz está encendida.

**Cancelar** detiene la lectura y vuelve al paso anterior.

## 7. Tus resultados (paso 3 de 3)

Cada código activo aparece como una tarjeta, los más importantes primero:

| Color y etiqueta | Qué significa |
|---|---|
| 🔴 **Luz ENCENDIDA – revisar pronto** | La computadora prende la luz de check-engine por este problema. Hacelo revisar. |
| 🟠 **La luz puede no quedar encendida** | Es una falla real, pero la luz puede no quedar prendida todo el tiempo. |
| ⚪ **Sin luz** / **Información – normal** | Menor o informativo. El código **12** solo indica que se desconectó la batería hace poco: es normal. |
| 🔵 **Código desconocido** | No está en la lista. Seguramente se leyó mal: probá con otro video. |

Cada tarjeta muestra:

- **El número de código** y un título corto en palabras simples.
- **Visto N veces**: cuántas veces parpadeó ese código en tu video. La computadora suele
  repetir la lista, así que 2 o más es normal.
- **Detalle técnico**: tocá para ver la descripción completa.

Mensajes especiales:

- **Buenas noticias: no hay fallas**: solo parpadeó el código 55 (fin de la lista).
- **No se vio el código 55**: el video seguramente se cortó antes. Pueden faltar códigos.
  Filmá de nuevo hasta el final.
- **No se pudo leer ningún código**: el parpadeo no se vio claro. Mirá *Problemas* más abajo.

Botones:

- **Compartir**: enviá el reporte por WhatsApp, correo, etc. (en computadora lo copia).
- **Copiar**: copia el reporte como texto.
- **Imprimir**: imprimilo o guardalo como PDF.
- **Leer otro video**: empezar de nuevo.

Abajo de todo, **Códigos en el orden en que parpadearon** muestra la secuencia tal cual, y
**Señal de la luz (para expertos)** muestra un gráfico de brillo.

## 8. Lecturas anteriores

La pantalla de inicio muestra tus últimas 10 lecturas con la fecha y los códigos. Tocá una
para volver a ver los resultados. **Borrar** las elimina. Se guardan solo en tu dispositivo.

## Problemas

| Problema | Qué probar |
|---|---|
| El recuadro no está sobre la luz | Tocá la luz. O arrastrá un recuadro alrededor. |
| "No se pudo leer ningún código" | Filmá más cerca, más firme, sin sol directo. Revisá que el recuadro esté en la luz correcta. |
| Números equivocados (por ej. 7 en vez de 43) | Ajustes avanzados → bajá un poco la **Pausa máx. dentro de un dígito**. |
| Falta el código 55 | Filmá hasta que la luz deje de parpadear. |
| Códigos raros (azul, "desconocido") | Leé otro video y compará los dos resultados. |
| No se abre la cámara | Permití el acceso a la cámara para el sitio en la configuración del navegador. O usá **Elegir un video**. |
| Lento en celulares viejos | Recortá el video con **Empezar en / Terminar en**. |

## Privacidad

Todo se procesa en tu dispositivo. **Tu video nunca se sube a internet.** El historial y
los ajustes quedan guardados solo en tu navegador.

## Importante

Esta app te ayuda a entender lo que informa la computadora del motor. No es un diagnóstico
completo. Un código indica qué circuito o sensor reportó un problema, no siempre qué pieza
está fallando. **Consultá a un mecánico antes de cambiar piezas.**

Lista completa en la [referencia de códigos](fault-codes.md).
