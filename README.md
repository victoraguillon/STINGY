# stingy

**Gasta con intención.**

Aplicación de finanzas personales para Venezuela. Ingresos y gastos en bolívares y
dólares, con tasa BCV y paralelo, pensada para funcionar sin conexión y para
anotar un movimiento en menos de diez segundos.

Producción: <https://stingyve.vercel.app>

---

## Estado actual

### Funciona

- Autenticación real con Supabase (correo y contraseña), onboarding de tres pasos
  y perfil base (bolívares o dólares, tasa preferida).
- Sincronización offline-first: cada fila se guarda primero en IndexedDB y se
  empuja a Supabase al recuperar conexión. Las escrituras se resuelven por
  prioridad (perfiles, categorías, transacciones) y por `updatedAt` (last write
  wins), con borrado lógico.
- Inicio con recibo mensual, tasa BCV/paralelo en vivo, brecha cambiaria, gráfica
  diaria, reparto por categoría y últimos movimientos.
- Movimientos con búsqueda, filtros por tipo/categoría y edición o borrado.
- Anotador rápido con teclado numérico, atajos de teclado, monto en Bs o USD,
  tasa BCV/paralelo, categoría, fecha y sello de guardado.
- Reportes por semana, mes o año, en bolívares o dólares: balance del período,
  últimos seis meses, reparto por categoría y mapa de calor diario. Cada gráfica
  tiene su tabla equivalente.
- Ajustes: nombre, moneda base, tema, tasas de referencia, categorías propias,
  exportación JSON/CSV, carga del ejemplo, cierre de sesión y borrado de cuenta.
- Bot de Telegram `@stingyve_bot`: vinculación por código de un solo uso (10
  minutos), gramática de una línea, tasas BCV/paralelo, zona horaria de Caracas,
  deduplicación de updates y comandos `/start`, `/ayuda`, `/estado`,
  `/desvincular`.
- Tema claro y oscuro, PWA instalable, aviso de conexión honesto y deshacer al
  borrar.
- Página `/design` con tokens, tipografía, componentes, voz y reglas
  anti-plantilla.

### Cómo se conecta

- **Supabase** (proyecto `stingy`, región `us-east-1`): autenticación, Postgres
  con RLS, Edge Function `rates-refresh` y Edge Function `telegram-webhook`.
- **Tasas**: la función `rates-refresh` consulta
  `https://ve.dolarapi.com/v1/dolares` y escribe BCV y paralelo en la tabla
  `rates`. Un cron de `pg_cron` + `pg_net` la ejecuta cada 6 horas; el secreto
  vive en Supabase Vault. La app también puede pedir un refresco, limitado a uno
  cada 5 minutos.
- **Telegram**: webhook registrado con `secret_token`. El bot usa el libro y las
  categorías de la cuenta vinculada, y guarda `source = 'telegram'` y
  `telegram_update_id` para no duplicar mensajes.
- **Modo ejemplo**: sigue siendo local. Carga el perfil de Ana Torres con seis
  meses de movimientos y no toca Supabase ni Telegram.

### Limitaciones conocidas

- La confirmación de correo está desactivada y la recuperación de contraseña no
  está disponible hasta tener dominio propio y SMTP (Resend). La interfaz lo
  indica; no promete un correo que no se envía.
- Supabase free no incluye backups y pausa el proyecto tras una semana de
  inactividad.
- Cuentas compartidas, invitaciones, roles y facturación quedan fuera de esta
  versión. El modelo ya incluye `ledgers` y `ledger_members` para no migrar
  después.
- El modo ejemplo no se conecta a Telegram: solo las cuentas reales pueden
  vincular el bot.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 con tokens CSS propios
- Dexie (IndexedDB) para persistencia local y cola de sincronización
- Supabase (Auth, Postgres, Edge Functions, Vault, pg_cron)
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
ejemplo** para cargar el perfil de Ana Torres, o crear una cuenta real desde
cero.

Variables de entorno (`.env.local`, nunca en git):

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check y build de producción |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | Oxlint |
| `node scripts/generate-icons.mjs` | Regenera los iconos PWA en `public/icons` |

### Base de datos

Las migraciones viven en `supabase/migrations`. Para aplicarlas:

```bash
supabase link --project-ref <ref>
supabase db push
supabase functions deploy rates-refresh
supabase functions deploy telegram-webhook
```

Secretos de las funciones: `RATES_REFRESH_SECRET`, `TELEGRAM_BOT_TOKEN` y
`TELEGRAM_WEBHOOK_SECRET`. El token del bot nunca se versiona ni se pega en el
chat; se configura con `supabase secrets set`.

### Datos de ejemplo

El ejemplo crea a **Ana Torres** (`ana@stingy.local`), moneda base bolívares,
tasa BCV y movimientos del mes actual más los cinco anteriores. En el modo
ejemplo la contraseña solo se valida localmente. Los totales de octubre de 2026
quedan alrededor de:

- Balance: **Bs 134.342,92**
- Ingresos: **Bs 562.023,64**
- Gastos: **Bs 427.680,73**
- Equivalente: **≈ $151,59** a tasa BCV de hoy
- Brecha paralelo/BCV: **13,2 %**

Puedes volver a este estado desde **Ajustes → Cargar ejemplo**. En una cuenta
real, **Borrar cuenta** elimina el usuario y sus datos en Supabase y limpia el
dispositivo.

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
  app/            providers de tema, toasts, anotador rápido y sesión
  components/     UI, gráficas, recibo, fila de movimiento, layout
  db/             esquema Dexie, tipos, categorías por defecto, seed
  hooks/          tasas, Telegram, conexión
  lib/            formato, fechas, tasas, analítica, exportación, sync
  screens/        Auth, Onboarding, Inicio, Movimientos, Reportes,
                  Ajustes, /design, 404
supabase/
  functions/      rates-refresh, telegram-webhook
  migrations/     esquema, RLS, triggers, Telegram
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
- Estados de conexión honestos: Telegram solo aparece conectado con una fila
  activa en `telegram_links`; sin red, la app dice que no puede verificar.

## Documentación

- [`docs/design.md`](docs/design.md): dirección visual, tokens, anatomía del
  recibo, movimiento, modelo de datos, accesibilidad y alcance diferido.

## Siguiente

1. Dominio propio, Resend y SMTP: confirmación de correo y recuperación de
   contraseña.
2. Cuentas compartidas sobre `ledgers` y `ledger_members`.
3. Licencia por usuario y pagos, solo cuando el producto salga de la beta.
