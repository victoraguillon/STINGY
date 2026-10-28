# stingy

**Gasta con intención.**

Aplicación de finanzas personales para Venezuela. Ingresos y gastos en bolívares y
dólares, con tasa BCV y paralelo, pensada para funcionar sin conexión y para
anotar un movimiento en menos de diez segundos.

Este repositorio contiene el **prototipo local navegable**: la interfaz completa,
la persistencia en el dispositivo y los datos de ejemplo. La autenticación real,
la sincronización y el bot de Telegram todavía no están conectados.

---

## Estado del prototipo

### Funciona

- Alta local con correo y contraseña, onboarding de tres pasos y perfil base
  (bolívares o dólares, tasa preferida).
- Inicio con recibo mensual, tasa BCV/paralelo, brecha cambiaria, gráfica diaria,
  reparto por categoría y últimos movimientos.
- Movimientos con búsqueda, filtros por tipo/categoría y edición o borrado.
- Anotador rápido con teclado numérico, atajos de teclado, monto en Bs o USD,
  tasa BCV/paralelo, categoría, fecha y sello de guardado.
- Reportes por semana, mes o año, en bolívares o dólares: balance del período,
  últimos seis meses, reparto por categoría y mapa de calor diario. Cada gráfica
  tiene su tabla equivalente.
- Ajustes: nombre, moneda base, tema, tasas de referencia, categorías propias,
  gramática de Telegram (solo vista previa), exportación JSON/CSV, carga del
  ejemplo y borrado total.
- Tema claro y oscuro, PWA instalable, aviso de conexión y deshacer al borrar.
- Página `/design` con tokens, tipografía, componentes, voz y reglas
  anti-plantilla.

### Es deliberadamente local

- No hay Supabase, correo real, recuperación de contraseña ni sincronización.
  La pantalla de acceso lo dice: los datos viven en este navegador.
- Telegram está **no conectado**. La interfaz muestra la gramática futura y una
  vista previa, nunca un estado falso de conexión.
- Las tasas son constantes de demostración: BCV `886,2271` (23-oct-2026) y
  paralelo `1003,61365` (26-oct-2026).
- La facturación por licencia existe solo como nota de producto
  (`BILLING_ENABLED = false`). No hay planes ni pagos.
- El modelo de datos ya incluye `ledgers` y `ledger_members`, pero la interfaz de
  cuentas compartidas queda fuera de esta versión.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 con tokens CSS propios
- Dexie (IndexedDB) para persistencia local
- Radix Dialog para hojas y diálogos accesibles
- Motion para las cuatro transiciones del producto
- Phosphor Icons, Bricolage Grotesque, Instrument Sans y Spline Sans Mono
  (todo autoalojado, sin hotlinks)

## Empezar

Requiere Node 24 o superior.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. En la pantalla de acceso puedes usar **Probar el
ejemplo** para cargar el perfil de Ana Torres con seis meses de movimientos, o
crear una cuenta local desde cero.

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check y build de producción |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | Oxlint |
| `node scripts/generate-icons.mjs` | Regenera los iconos PWA en `public/icons` |

### Datos de ejemplo

El ejemplo crea a **Ana Torres** (`ana@stingy.local`), moneda base bolívares,
tasa BCV y movimientos del mes actual más los cinco anteriores. En este
prototipo el acceso local valida el correo y exige una contraseña de seis
caracteres o más, pero **no verifica la contraseña**: no es autenticación real.
Los totales de octubre de 2026 quedan alrededor de:

- Balance: **Bs 134.342,92**
- Ingresos: **Bs 562.023,64**
- Gastos: **Bs 427.680,73**
- Equivalente: **≈ $151,59** a tasa BCV de hoy
- Brecha paralelo/BCV: **13,2 %**

Puedes volver a este estado desde **Ajustes → Cargar ejemplo**. **Borrar todo**
elimina el perfil y el libro de este dispositivo.

## Cómo se calcula el dinero

Cada movimiento guarda el monto original, su moneda y la tasa usada al anotarlo.
Los totales se calculan con esa tasa guardada, no con la tasa del día; así un
recibo antiguo no cambia cuando cambia el dólar.

Los equivalentes en la otra moneda y la cifra «a tasa BCV de hoy» sí usan la tasa
BCV actual y están etiquetados como tales. El detalle está en
`src/lib/analytics.ts` (`txValue`, `totalsOf`, `toDisplay`).

## Estructura

```text
src/
  app/            providers de tema, toasts y anotador rápido
  components/     UI, gráficas, recibo, fila de movimiento, layout
  db/             esquema Dexie, tipos, categorías por defecto, seed
  lib/            formato, fechas, tasas, analítica, exportación
  screens/        Auth, Onboarding, Inicio, Movimientos, Reportes,
                  Ajustes, /design, 404
scripts/          generación de iconos PWA
public/           manifest, favicon e iconos
docs/design.md    sistema de diseño y decisiones de producto
```

## Accesibilidad y QA

- Objetivos táctiles de 44 px en móvil; enlaces de texto con área ampliada.
- Contraste AA verificado en tokens clave (mínimo 4,78:1 en texto secundario).
- Navegación por teclado, enlace «Saltar al contenido», foco visible y diálogos
  con manejo de foco de Radix.
- Sin scroll horizontal a 360, 390 y 1440 px, en claro y oscuro.
- `prefers-reduced-motion` reduce las animaciones a duración casi nula.
- Gráficas con tabla alternativa y etiquetas accesibles.

## Documentación

- [`docs/design.md`](docs/design.md): dirección visual, tokens, anatomía del
  recibo, movimiento, modelo de datos, accesibilidad y alcance diferido.

## Siguiente

1. Autenticación real con Supabase y sincronización opt-in.
2. Actualización diaria de tasas con fuente y fecha visibles.
3. Bot de Telegram con la gramática ya definida.
4. Cuentas compartidas sobre `ledgers` y `ledger_members`.
5. Licencia por usuario y pagos, solo cuando el producto salga del prototipo.
