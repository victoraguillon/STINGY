# Sistema de diseño — stingy

Este documento fija la dirección visual y las reglas que el producto ya cumple.
Si una pantalla nueva contradice algo de aquí, la pantalla está mal, no el
documento. La versión navegable de estas reglas vive en `/design`.

---

## 1. Tesis

**stingy** ayuda a una persona en Venezuela a entender su mes sin ruido: cuánto
entró, cuánto salió, en bolívares y en dólares, con la tasa que se guardó al
anotar. La interfaz no celebra el dinero ni lo convierte en un tablero de
videojuego. Ordena, compara y deja claro qué es un hecho y qué es una
estimación.

- Producto: finanzas personales, una cuenta por persona.
- Promesa: **Gasta con intención.**
- Campaña: **Sé tacaño. Vive mejor.**
- Idioma: español de Venezuela, seco y directo.

## 2. Dirección: «El recibo vivo»

La metáfora no es decorativa: el resumen mensual se lee como un comprobante que
puedes revisar. De ahí salen las decisiones.

- **Editorial sobrio**: tipografía grande, líneas de 1 px, mucho aire, jerarquía
  por escala y no por cajas.
- **Recibo, no tarjeta**: borde perforado, folio, cliente, sello y cifras
  alineadas. El recibo aparece solo en el resumen y en el anotador rápido.
- **Un acento, con presupuesto**: la lima ocupa como máximo el 10 % de una
  pantalla. El resto es papel, tinta y una línea.
- **Datos reales o nada**: no hay métricas inventadas, testimonios, chats falsos
  ni estados de conexión que no existen.
- **Superficie plana**: sin grano, sin vidrio, sin sombras duras. Solo hojas y
  diálogos reciben elevación suave porque flotan sobre el contenido.

## 3. Contrato anti-plantilla

Prohibido:

- Degradados morado-azul, brillos violetas, glassmorphism.
- Emojis en títulos o botones.
- CTAs con cohetes, «Despega», «Supercarga» o signos de exclamación.
- Métricas, testimonios, logos de clientes o capturas de chat inventadas.
- Tres tarjetas genéricas de características como estructura de una landing.
- Precios de tres niveles forzados para un producto que aún no cobra.
- Revelaciones al hacer scroll en cada sección.
- «Card soup»: todo dentro de una tarjeta con sombra y radio grande.
- Fotos de stock, ilustraciones genéricas o iconos decorativos sin función.
- Estados de Telegram, Supabase o facturación que aparenten estar conectados.

Obligatorio:

- Una sola idea por pantalla y una jerarquía tipográfica clara.
- Etiquetas honestas: «No conectado», «Sin conexión», «Modo ejemplo».
- Bordes y hairlines antes que sombras; el color solo cuando significa algo.
- Gráficas acompañadas de una tabla equivalente.
- Estados vacíos que explican qué hacer, no que se disculpan.
- Cifras con dos decimales, alineadas y en mono.

## 4. Marca y voz

- Marca: moneda mordida, monocroma, sin degradado.
- Wordmark: `stingy` en minúsculas, Bricolage Grotesque.
- La lima aparece solo en: icono PWA, CTA primaria, navegación activa, ingresos y
  sello de guardado.
- Tono: breve, con humor seco, nunca sarcástico con el usuario.
- Sin emojis. Sin mayúsculas gritadas. Sin «¡Felicidades!».
- Se dice «Anotado», no «Transacción creada con éxito».
- Se dice «Sin señal. Tus datos siguen aquí», no «Error de red».

Ejemplos de voz:

- «Anotado. Ese real no se escapa.»
- «Todavía no hay gastos. El primero es el que cuenta.»
- «Cada monto usa la tasa que se guardó al anotarlo.»

## 5. Color

### Tokens

| Token | Claro | Oscuro | Uso |
| --- | --- | --- | --- |
| `paper` | `#F3F1EA` | `#10120E` | Fondo general |
| `paper-2` | `#EAE7DC` | `#171A14` | Relleno tranquilo, chips |
| `surface` | `#FBF9F3` | `#171A14` | Recibos, hojas, tarjetas |
| `surface-2` | `#F5F2E8` | `#1D2119` | Superficie secundaria |
| `ink` | `#15160F` | `#F2F0E6` | Texto principal |
| `ink-2` | `#3A3B32` | `#D8D5C8` | Texto de apoyo |
| `muted` | `#6A6B61` | `#9A9C8F` | Texto secundario |
| `rule` | `#D8D4C6` | `#2C3026` | Líneas de 1 px |
| `lime` | `#CBE84F` | `#CBE84F` | Acción primaria, ingreso, sello |
| `tomato` | `#D9502F` | `#FF6B47` | Gasto, error |
| `tomato-text` | `#BB3E20` | `#FF8A6D` | Texto de gasto sobre papel |
| `cobalt` | `#2547D8` | `#8FA0FF` | Dato, variación, foco |
| `focus` | `#2547D8` | `#8FA0FF` | Anillo de foco |

Mapa de calor: claro `#E7E3D6 → #F3C9BA → #E99A80 → #D96A49 → #B0381B`;
oscuro `#1C2018 → #47251A → #763522 → #AC4A2D → #E0633D`.

### Reglas

- El color no es decoración: lima = acción/ingreso, tomate = gasto/error,
  cobalto = dato o foco. Nada más.
- El estado nunca se comunica solo por color: «Al día» / «En rojo» llevan texto.
- La lima siempre usa tinta `#15160F` encima; nunca texto blanco.
- Las superficies no llevan sombra. Solo hojas y diálogos flotan.

## 6. Tipografía

| Rol | Fuente | Uso |
| --- | --- | --- |
| Display | Bricolage Grotesque Variable | Títulos, cifras de marca, cabeceras |
| UI | Instrument Sans Variable | Cuerpo, botones, formularios |
| Números | Spline Sans Mono | Dinero, tasas, fechas, folios |

- Títulos: peso 600, leading `0.92–1.05`, tracking `-0.025em` a `-0.055em`.
- Cuerpo: 12–15 px, leading relajado, máximo 52–68 caracteres por línea.
- Etiquetas: mono 8–10 px, mayúsculas, tracking `0.06–0.16em`.
- Dinero: siempre `tabular-nums`, dos decimales, prefijo de moneda más pequeño y
  con menor contraste que la cifra.
- Formato: `Bs 134.342,92` · `$151,59` · tasas `886,2271`.
- No se usa una segunda familia decorativa. No hay cursivas decorativas.

## 7. Forma y layout

- Radios: ticket `2px`, botón `12px`, tarjeta `18px`, hoja `22px`.
- Bordes de 1 px (`rule`) o 1,5 px (`ink/25`) en el recibo.
- Ancho de contenido: `max-w-[1180px]`, con rail fijo de 84 px en escritorio.
- Móvil: una columna, `px-5`, navegación inferior fija y FAB central.
- Escritorio: rail vertical, contenido centrado, reportes en 12 columnas.
- Sin scroll horizontal a 360, 390 y 1440 px.
- El espacio en blanco es parte de la jerarquía; no se rellena con tarjetas.

## 8. Anatomía del recibo

Orden exacto, de arriba a abajo:

1. **Cabecera**: «Resumen · OCTUBRE 2026» y sello de estado.
2. **Balance del mes**: cifra grande en moneda base.
3. **Equivalente**: otra moneda, etiquetado «a tasa BCV de hoy».
4. **Separador punteado**.
5. **Ingresos y gastos**: signo `+` / `−`, color y mono.
6. **Tasas**: BCV y paralelo con fecha, no solo valor.
7. **Pie**: «Cliente · Ana» y «Folio 2026-10».
8. **Borde perforado** inferior, hecho con un gradiente radial.

El recibo solo se usa en el resumen de Inicio y en el anotador rápido. En
Reportes el balance es editorial, sin repetir el objeto.

## 9. Anotador rápido

- Móvil: hoja inferior, máximo `92dvh`, con scroll interno y safe-area.
- Escritorio: diálogo centrado de 880 px.
- Orden: tipo → concepto → monto → moneda → tasa → categoría → fecha → guardar.
- El monto se escribe con teclado numérico propio; también acepta teclado físico:
  dígitos, coma/punto y retroceso.
- La hoja muestra la conversión antes de guardar y la tasa aplicada.
- Al guardar: sello «Anotado» durante 260 ms y cierre a los 280 ms. Con
  `prefers-reduced-motion` el sello aparece sin rebote y el cierre es inmediato.
- El botón de guardar deshabilitado es neutro, no una CTA lima apagada.
- Errores debajo del campo, en tomate, sin sacudir la hoja.

## 10. Movimiento

Solo cuatro momentos funcionales. Nada más se anima.

| Momento | Especificación | Qué comunica |
| --- | --- | --- |
| Abrir la hoja | 340 ms · `cubic-bezier(.16,1,.3,1)` | De dónde viene el panel |
| Guardar | 260 ms · rebote suave | Confirmación única |
| Cambiar de período | 180 ms · fundido | Las cifras son otras |
| Dibujar la gráfica | 420 ms · escala vertical, 8 ms por barra | El dato aparece |

- El fondo de la hoja se oscurece al 55 %.
- No hay animaciones de scroll, parallax ni hover elaborado.
- `prefers-reduced-motion: reduce` lleva todo a `0.01ms`; ninguna animación
  bloquea una acción.

## 11. Dinero y tasas

- Cada movimiento guarda: monto original, moneda, tipo de tasa, valor de la tasa
  y equivalente en USD.
- Los totales usan la tasa guardada en cada movimiento (`txValue`). Un recibo de
  septiembre no cambia cuando cambia el dólar.
- Los equivalentes y la nota «a tasa BCV de hoy» usan la tasa BCV actual.
- La brecha es `(paralelo − BCV) / BCV`, calculada, no inventada.
- No hay sparklines ni deltas falsos en la tira de tasas.
- Tasas de demostración: BCV `886,2271` (23-oct-2026) y paralelo `1003,61365`
  (26-oct-2026). En producción vendrán de una fuente con fecha y origen.

## 12. Modelo de datos

Dexie, base `stingy`, versión 2.

| Tabla | Campos principales | Índices |
| --- | --- | --- |
| `profiles` | `id`, `name`, `email`, `ledgerId`, `baseCurrency`, `defaultRateType`, `onboardingComplete`, `demo`, `createdAt` | `id` |
| `ledgers` | `id`, `name`, `kind` (`personal`/`shared`), `baseCurrency`, `createdAt` | `id`, `kind` |
| `ledgerMembers` | `id`, `ledgerId`, `userId`, `role` (`owner`/`member`), `joinedAt` | `id`, `ledgerId`, `userId` |
| `categories` | `id`, `ledgerId`, `name`, `icon`, `kind`, `order` | `id`, `ledgerId`, `kind`, `order` |
| `transactions` | `id`, `ledgerId`, `createdBy`, `kind`, `amount`, `currency`, `rateType`, `rate`, `amountUsd`, `categoryId`, `note`, `occurredOn`, `source`, `createdAt`, `updatedAt` | `id`, `ledgerId`, `occurredOn`, `categoryId`, `kind`, `createdAt` |

Decisiones:

- El modo ejemplo usa el perfil `demo` y el libro `ledger_demo`; las cuentas
  reales usan UUID de Supabase.
- `ledgers` y `ledgerMembers` existen desde el día uno aunque la UI de cuentas
  compartidas no se muestre. Así una cuenta compartida futura no exige migrar
  transacciones ni categorías.
- Categorías y movimientos ya están aislados por `ledgerId`; `createdBy` queda
  listo para saber quién anotó en un libro compartido.
- Los importes se guardan como número; la moneda y la tasa son parte del hecho.
- La sesión la maneja el cliente de Supabase; la app no guarda contraseñas. El
  modo ejemplo no toca Supabase.
- Cada fila escribe primero en Dexie y luego en la cola de salida. El empuje va
  por prioridad (perfiles, categorías, transacciones) y resuelve conflictos por
  `updatedAt`; el borrado es lógico.

## 13. Pantallas

| Ruta | Pantalla | Nota |
| --- | --- | --- |
| `/` | Inicio | Recibo, tasas, gráfica diaria, categorías, recientes |
| `/movimientos` | Movimientos | Búsqueda, filtros, edición y borrado |
| `/reportes` | Reportes | Semana/mes/año, Bs/USD, seis meses, categorías, mapa |
| `/ajustes` | Ajustes | Cuenta, tema, tasas, categorías, Telegram, datos, licencia |
| `/design` | Sistema de diseño | Documentación viva |
| `/onboarding` | Onboarding | Tres pasos, solo primera vez |
| `*` | 404 | «Esta página no está en tu libro.» |

El acceso (`/` sin perfil) usa Supabase Auth con correo y contraseña. **Probar el
ejemplo** entra al modo local sin tocar la red. La confirmación de correo está
desactivada y la recuperación de contraseña no está disponible hasta tener SMTP
propio; la interfaz lo dice.

## 14. Telegram

- `Mercado 12511 bolivares bcv` → gasto en Bs a tasa BCV.
- `+Freelance 110 dolares paralelo` → ingreso en USD a tasa paralelo.
- `+` indica ingreso; sin signo, gasto.
- `bcv` o `paralelo` eligen la tasa; si falta, se usa la preferida del perfil.
- «ayer» y «hoy» se resuelven en `America/Caracas`.
- La respuesta muestra el monto anotado y ambos equivalentes, sin emojis.
- El bot `@stingyve_bot` está activo. La vinculación se hace en Ajustes con un
  código de un solo uso de 10 minutos; un chat pertenece a una sola cuenta.
- La app solo muestra «Conectado» si existe una fila activa en `telegram_links`.
  Sin red, dice que no puede verificar.

## 15. Accesibilidad y QA

- Objetivos táctiles de 44 px en móvil; chips y navegación incluidos.
- Enlaces de texto pequeños usan `.tap-link`, que amplía el área a 44 px con un
  pseudo-elemento sin mover el layout.
- Contraste AA en tokens clave: mínimo 4,78:1 (`muted` sobre `paper`); tinta sobre
  lima 13,17:1; textos de gasto 4,86:1 en claro y 8,17:1 en oscuro.
- Foco visible de 2 px cobalto con offset de 2 px. Enlace «Saltar al contenido».
- Diálogos Radix con trampa de foco, cierre con Escape y retorno de foco.
- Gráficas con etiquetas accesibles y tabla equivalente desplegable.
- Sin scroll horizontal a 360, 390 y 1440 px en claro y oscuro.
- `prefers-reduced-motion` verificado: animaciones y transiciones a `0.01ms`.
- Estados vacíos, de carga y de error escritos; no se dejan cajas mudas.

## 16. Alcance diferido

No implementado a propósito:

- Recuperación de contraseña y verificación de correo (requieren dominio propio y
  SMTP).
- UI de cuentas compartidas, invitaciones y roles (el modelo ya los soporta).
- Licencia por usuario, pedidos de pago y facturación (`BILLING_ENABLED=false`).
- Analítica de producto y notificaciones.

Antes de agregar cualquiera de estas piezas: conservar las etiquetas honestas,
el presupuesto de lima y los cuatro momentos de movimiento.
