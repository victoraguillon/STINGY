<div align="center">
  <img src="public/brand/icon.svg" width="104" alt="Logo de STINGY">
  <h1>STINGY</h1>
  <p><strong>Gasta con intención. Cada bolívar, en su sitio.</strong></p>
  <p>Finanzas personales para Venezuela: rápidas para el día a día,<br>claras con tu dinero y listas para funcionar sin conexión.</p>
  <p>
    <a href="https://stingyve.vercel.app"><strong>Abrir STINGY ↗</strong></a>
  </p>
  <p>
    <img alt="React 19" src="https://img.shields.io/badge/React-19-202b24?logo=react&logoColor=9fe870">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-7-202b24?logo=typescript&logoColor=9fe870">
    <img alt="Vite" src="https://img.shields.io/badge/Vite-8-202b24?logo=vite&logoColor=9fe870">
    <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-202b24?logo=supabase&logoColor=9fe870">
  </p>
</div>

---

<div align="center">
  <sub>ANOTA · ENTIENDE · DECIDE</sub>
</div>

## Tu dinero, sin rodeos

| ⚡ Anota | 📊 Entiende | 🔄 Continúa |
| --- | --- | --- |
| Registra ingresos y gastos en segundos, en Bs o USD. | Consulta tu balance, tasas, categorías y reportes. | Sigue trabajando sin conexión; sincroniza al volver. |

### Hecho para el uso diario

- **Registro rápido:** teclado numérico, atajos, categorías, fecha y tasa usada.
- **Resumen mensual:** recibo, tasas BCV y paralelo, brecha cambiaria y últimos movimientos.
- **Reportes claros:** vistas semanales, mensuales y anuales, con alternativas en tabla.
- **Telegram:** registra movimientos con [`@stingyve_bot`](https://t.me/stingyve_bot).
- **Tus reglas:** categorías propias, temas claro y oscuro, exportación JSON/CSV.
- **Instalable:** PWA adaptable, estados de conexión honestos y opción para deshacer un borrado.

## En marcha en un minuto

Necesitas **Node.js 24 o superior**.

```bash
npm install
npm run dev
```

Abre [localhost:5173](http://localhost:5173) y crea una cuenta para sincronizar
tus datos.

Para conectar tu proyecto de Supabase, crea `.env.local` en la raíz:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

No agregues `.env.local` al control de versiones ni compartas sus valores.

### Comandos

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Chequeo de tipos y build de producción. |
| `npm run preview` | Vista local del build de producción. |
| `npm run lint` | Análisis estático con Oxlint. |
| `node scripts/generate-icons.mjs` | Regenera los iconos de la PWA. |

## La tecnología detrás

| Capa | Tecnología |
| --- | --- |
| Interfaz | React 19, TypeScript y Vite |
| Estilos | Tailwind CSS v4 y tokens CSS propios |
| Datos locales | Dexie e IndexedDB |
| Backend y sincronización | Supabase Auth, Postgres y Edge Functions |
| Interfaz accesible | Radix Dialog |
| Detalles visuales | Phosphor Icons, Motion y tipografías autoalojadas |

## Conectar Supabase

Las migraciones viven en `supabase/migrations`. Vincula el proyecto y aplícalas
con la CLI de Supabase:

```bash
supabase link --project-ref <ref>
supabase db push
supabase functions deploy rates-refresh
supabase functions deploy telegram-webhook
```

Configura `RATES_REFRESH_SECRET`, `TELEGRAM_BOT_TOKEN` y
`TELEGRAM_WEBHOOK_SECRET` con `supabase secrets set`. No guardes estos valores en
el repositorio.

La función `rates-refresh` consulta
[dolarapi.com](https://ve.dolarapi.com/v1/dolares) y actualiza las tasas BCV y
paralelo. Un cron la ejecuta cada seis horas; la app también puede solicitar una
actualización, con un límite de una cada cinco minutos.

El webhook de Telegram valida su secreto. El bot usa el libro y las categorías
de la cuenta vinculada, y evita registrar dos veces el mismo mensaje.

## Dinero que conserva su contexto

Cada movimiento guarda su monto original, moneda y tasa del momento. Así, los
totales históricos no cambian cuando varía el dólar. Los equivalentes en otra
moneda y los valores **a tasa BCV de hoy** sí usan la tasa actual.

La lógica está en `src/lib/analytics.ts`: `txValue`, `totalsOf` y `toDisplay`.

## Accesibilidad con intención

- Objetivos táctiles de al menos 44 px y áreas ampliadas para enlaces.
- Contraste AA en los tokens principales; mínimo de 4,78:1 para texto secundario.
- Navegación por teclado, foco visible y diálogos con manejo de foco.
- Diseño comprobado a 360, 390 y 1440 px, en temas claro y oscuro.
- Respeto a `prefers-reduced-motion`.
- Gráficos con tablas alternativas y etiquetas accesibles.

## Mapa del proyecto

```text
src/
  app/            Tema, notificaciones, anotador y sesión
  components/     Interfaz, gráficos, recibo y movimientos
  db/             Dexie, tipos y categorías predeterminadas
  hooks/          Tasas, Telegram y conexión
  lib/            Formato, fechas, analítica y utilidades
  screens/        Acceso, inicio, movimientos, reportes y ajustes
  sync/           Motor de sincronización y mapeadores
supabase/
  functions/      rates-refresh y telegram-webhook
  migrations/     Esquema, RLS, triggers e integración con Telegram
scripts/          Generación de iconos PWA
public/           Iconos y recursos públicos
docs/design.md    Sistema de diseño y decisiones de producto
```

## Notas del producto

- La confirmación de correo y la recuperación de contraseña requieren configurar
  dominio y SMTP.
- El plan gratuito de Supabase no incluye copias de seguridad y puede pausar el
  proyecto tras una semana de inactividad.
- Las cuentas compartidas, invitaciones, roles y pagos quedan fuera del alcance
  actual. El modelo ya contempla `ledgers` y `ledger_members`.

Para conocer la dirección visual y las decisiones de producto, visita
[`docs/design.md`](docs/design.md).

<div align="center">
  <sub>Menos fricción al anotar. Más claridad para decidir.</sub>
</div>
