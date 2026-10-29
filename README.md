# STINGY

**Gasta con intenciÃ³n.**

AplicaciÃ³n de finanzas personales para Venezuela. Ingresos y gastos en bolÃ­vares y
dÃ³lares, con tasa BCV y paralelo, pensada para funcionar sin conexiÃ³n y para
anotar un movimiento en menos de diez segundos.

ProducciÃ³n: <https://stingyve.vercel.app>

---

## Estado actual

### Funciona

- AutenticaciÃ³n real con Supabase (correo y contraseÃ±a), onboarding de tres pasos
  y perfil base (bolÃ­vares o dÃ³lares, tasa preferida).
- SincronizaciÃ³n offline-first: cada fila se guarda primero en IndexedDB y se
  empuja a Supabase al recuperar conexiÃ³n. Las escrituras se resuelven por
  prioridad (perfiles, categorÃ­as, transacciones) y por `updatedAt` (last write
  wins), con borrado lÃ³gico.
- Inicio con recibo mensual, tasa BCV/paralelo en vivo, brecha cambiaria, grÃ¡fica
  diaria, reparto por categorÃ­a y Ãºltimos movimientos.
- Movimientos con bÃºsqueda, filtros por tipo/categorÃ­a y ediciÃ³n o borrado.
- Anotador rÃ¡pido con teclado numÃ©rico, atajos de teclado, monto en Bs o USD,
  tasa BCV/paralelo, categorÃ­a, fecha y sello de guardado.
- Reportes por semana, mes o aÃ±o, en bolÃ­vares o dÃ³lares: balance del perÃ­odo,
  Ãºltimos seis meses, reparto por categorÃ­a y mapa de calor diario. Cada grÃ¡fica
  tiene su tabla equivalente.
- Ajustes: nombre, moneda base, tema, tasas de referencia, categorÃ­as propias,
  exportaciÃ³n JSON/CSV, carga del ejemplo, cierre de sesiÃ³n y borrado de cuenta.
- Bot de Telegram `@stingyve_bot`: vinculaciÃ³n por cÃ³digo de un solo uso (10
  minutos), gramÃ¡tica de una lÃ­nea, tasas BCV/paralelo, zona horaria de Caracas,
  deduplicaciÃ³n de updates y comandos `/start`, `/ayuda`, `/estado`,
  `/desvincular`.
- Tema claro y oscuro, PWA instalable, aviso de conexiÃ³n honesto y deshacer al
  borrar.
- PÃ¡gina `/design` con tokens, tipografÃ­a, componentes, voz y reglas
  anti-plantilla.

### CÃ³mo se conecta

- **Supabase** (proyecto `stingy`, regiÃ³n `us-east-1`): autenticaciÃ³n, Postgres
  con RLS, Edge Function `rates-refresh` y Edge Function `telegram-webhook`.
- **Tasas**: la funciÃ³n `rates-refresh` consulta
  `https://ve.dolarapi.com/v1/dolares` y escribe BCV y paralelo en la tabla
  `rates`. Un cron de `pg_cron` + `pg_net` la ejecuta cada 6 horas; el secreto
  vive en Supabase Vault. La app tambiÃ©n puede pedir un refresco, limitado a uno
  cada 5 minutos.
- **Telegram**: webhook registrado con `secret_token`. El bot usa el libro y las
  categorÃ­as de la cuenta vinculada, y guarda `source = 'telegram'` y
  `telegram_update_id` para no duplicar mensajes.
- **Modo ejemplo**: sigue siendo local. Carga el perfil de Ana Torres con seis
  meses de movimientos y no toca Supabase ni Telegram.

### Limitaciones conocidas

- La confirmaciÃ³n de correo estÃ¡ desactivada y la recuperaciÃ³n de contraseÃ±a no
  estÃ¡ disponible hasta tener dominio propio y SMTP (Resend). La interfaz lo
  indica; no promete un correo que no se envÃ­a.
- Supabase free no incluye backups y pausa el proyecto tras una semana de
  inactividad.
- Cuentas compartidas, invitaciones, roles y facturaciÃ³n quedan fuera de esta
  versiÃ³n. El modelo ya incluye `ledgers` y `ledger_members` para no migrar
  despuÃ©s.
- El modo ejemplo no se conecta a Telegram: solo las cuentas reales pueden
  vincular el bot.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 con tokens CSS propios
- Dexie (IndexedDB) para persistencia local y cola de sincronizaciÃ³n
- Supabase (Auth, Postgres, Edge Functions, Vault, pg_cron)
- Radix Dialog para hojas y diÃ¡logos accesibles
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

| Comando | QuÃ© hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Type-check y build de producciÃ³n |
| `npm run preview` | Sirve el build de producciÃ³n |
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

El ejemplo crea a **Ana Torres** (`ana@stingy.local`), moneda base bolÃ­vares,
tasa BCV y movimientos del mes actual mÃ¡s los cinco anteriores. En el modo
ejemplo la contraseÃ±a solo se valida localmente. Los totales de octubre de 2026
quedan alrededor de:

- Balance: **Bs 134.342,92**
- Ingresos: **Bs 562.023,64**
- Gastos: **Bs 427.680,73**
- Equivalente: **â‰ˆ $151,59** a tasa BCV de hoy
- Brecha paralelo/BCV: **13,2 %**

Puedes volver a este estado desde **Ajustes â†’ Cargar ejemplo**. En una cuenta
real, **Borrar cuenta** elimina el usuario y sus datos en Supabase y limpia el
dispositivo.

## CÃ³mo se calcula el dinero

Cada movimiento guarda el monto original, su moneda y la tasa usada al anotarlo.
Los totales se calculan con esa tasa guardada, no con la tasa del dÃ­a; asÃ­ un
recibo antiguo no cambia cuando cambia el dÃ³lar.

Los equivalentes en la otra moneda y la cifra Â«a tasa BCV de hoyÂ» sÃ­ usan la tasa
BCV actual y estÃ¡n etiquetados como tales. El detalle estÃ¡ en
`src/lib/analytics.ts` (`txValue`, `totalsOf`, `toDisplay`).

## Estructura

```text
src/
  app/            providers de tema, toasts, anotador rÃ¡pido y sesiÃ³n
  components/     UI, grÃ¡ficas, recibo, fila de movimiento, layout
  db/             esquema Dexie, tipos, categorÃ­as por defecto, seed
  hooks/          tasas, Telegram, conexiÃ³n
  lib/            formato, fechas, tasas, analÃ­tica, exportaciÃ³n, sync
  screens/        Auth, Onboarding, Inicio, Movimientos, Reportes,
                  Ajustes, /design, 404
supabase/
  functions/      rates-refresh, telegram-webhook
  migrations/     esquema, RLS, triggers, Telegram
scripts/          generaciÃ³n de iconos PWA
public/           manifest, favicon e iconos
docs/design.md    sistema de diseÃ±o y decisiones de producto
```

## Accesibilidad y QA

- Objetivos tÃ¡ctiles de 44 px en mÃ³vil; enlaces de texto con Ã¡rea ampliada.
- Contraste AA verificado en tokens clave (mÃ­nimo 4,78:1 en texto secundario).
- NavegaciÃ³n por teclado, enlace Â«Saltar al contenidoÂ», foco visible y diÃ¡logos
  con manejo de foco de Radix.
- Sin scroll horizontal a 360, 390 y 1440 px, en claro y oscuro.
- `prefers-reduced-motion` reduce las animaciones a duraciÃ³n casi nula.
- GrÃ¡ficas con tabla alternativa y etiquetas accesibles.
- Estados de conexiÃ³n honestos: Telegram solo aparece conectado con una fila
  activa en `telegram_links`; sin red, la app dice que no puede verificar.

## DocumentaciÃ³n

- [`docs/design.md`](docs/design.md): direcciÃ³n visual, tokens, anatomÃ­a del
  recibo, movimiento, modelo de datos, accesibilidad y alcance diferido.

## Siguiente

1. Dominio propio, Resend y SMTP: confirmaciÃ³n de correo y recuperaciÃ³n de
   contraseÃ±a.
2. Cuentas compartidas sobre `ledgers` y `ledger_members`.
3. Licencia por usuario y pagos, solo cuando el producto salga de la beta.
