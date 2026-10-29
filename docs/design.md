# Sistema de diseÃ±o â€” stingy

Este documento fija la direcciÃ³n visual y las reglas que el producto ya cumple.
Si una pantalla nueva contradice algo de aquÃ­, la pantalla estÃ¡ mal, no el
documento. La versiÃ³n navegable de estas reglas vive en `/design`.

---

## 1. Tesis

**stingy** ayuda a una persona en Venezuela a entender su mes sin ruido: cuÃ¡nto
entrÃ³, cuÃ¡nto saliÃ³, en bolÃ­vares y en dÃ³lares, con la tasa que se guardÃ³ al
anotar. La interfaz no celebra el dinero ni lo convierte en un tablero de
videojuego. Ordena, compara y deja claro quÃ© es un hecho y quÃ© es una
estimaciÃ³n.

- Producto: finanzas personales, una cuenta por persona.
- Promesa: **Gasta con intenciÃ³n.**
- CampaÃ±a: **SÃ© tacaÃ±o. Vive mejor.**
- Idioma: espaÃ±ol de Venezuela, seco y directo.

## 2. DirecciÃ³n: Â«El recibo vivoÂ»

La metÃ¡fora no es decorativa: el resumen mensual se lee como un comprobante que
puedes revisar. De ahÃ­ salen las decisiones.

- **Editorial sobrio**: tipografÃ­a grande, lÃ­neas de 1 px, mucho aire, jerarquÃ­a
  por escala y no por cajas.
- **Recibo, no tarjeta**: borde perforado, folio, cliente, sello y cifras
  alineadas. El recibo aparece solo en el resumen y en el anotador rÃ¡pido.
- **Un acento, con presupuesto**: la lima ocupa como mÃ¡ximo el 10 % de una
  pantalla. El resto es papel, tinta y una lÃ­nea.
- **Datos reales o nada**: no hay mÃ©tricas inventadas, testimonios, chats falsos
  ni estados de conexiÃ³n que no existen.
- **Superficie plana**: sin grano, sin vidrio, sin sombras duras. Solo hojas y
  diÃ¡logos reciben elevaciÃ³n suave porque flotan sobre el contenido.

## 3. Contrato anti-plantilla

Prohibido:

- Degradados morado-azul, brillos violetas, glassmorphism.
- Emojis en tÃ­tulos o botones.
- CTAs con cohetes, Â«DespegaÂ», Â«SupercargaÂ» o signos de exclamaciÃ³n.
- MÃ©tricas, testimonios, logos de clientes o capturas de chat inventadas.
- Tres tarjetas genÃ©ricas de caracterÃ­sticas como estructura de una landing.
- Precios de tres niveles forzados para un producto que aÃºn no cobra.
- Revelaciones al hacer scroll en cada secciÃ³n.
- Â«Card soupÂ»: todo dentro de una tarjeta con sombra y radio grande.
- Fotos de stock, ilustraciones genÃ©ricas o iconos decorativos sin funciÃ³n.
- Estados de Telegram, Supabase o facturaciÃ³n que aparenten estar conectados.

Obligatorio:

- Una sola idea por pantalla y una jerarquÃ­a tipogrÃ¡fica clara.
- Etiquetas honestas: Â«No conectadoÂ», Â«Sin conexiÃ³nÂ», Â«Modo ejemploÂ».
- Bordes y hairlines antes que sombras; el color solo cuando significa algo.
- GrÃ¡ficas acompaÃ±adas de una tabla equivalente.
- Estados vacÃ­os que explican quÃ© hacer, no que se disculpan.
- Cifras con dos decimales, alineadas y en mono.

## 4. Marca y voz

- Marca: moneda mordida, monocroma, sin degradado.
- Wordmark: `stingy` en minÃºsculas, Bricolage Grotesque.
- La lima aparece solo en: icono PWA, CTA primaria, navegaciÃ³n activa, ingresos y
  sello de guardado.
- Tono: breve, con humor seco, nunca sarcÃ¡stico con el usuario.
- Sin emojis. Sin mayÃºsculas gritadas. Sin Â«Â¡Felicidades!Â».
- Se dice Â«AnotadoÂ», no Â«TransacciÃ³n creada con Ã©xitoÂ».
- Se dice Â«Sin seÃ±al. Tus datos siguen aquÃ­Â», no Â«Error de redÂ».

Ejemplos de voz:

- Â«Anotado. Ese real no se escapa.Â»
- Â«TodavÃ­a no hay gastos. El primero es el que cuenta.Â»
- Â«Cada monto usa la tasa que se guardÃ³ al anotarlo.Â»

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
| `rule` | `#D8D4C6` | `#2C3026` | LÃ­neas de 1 px |
| `lime` | `#CBE84F` | `#CBE84F` | AcciÃ³n primaria, ingreso, sello |
| `tomato` | `#D9502F` | `#FF6B47` | Gasto, error |
| `tomato-text` | `#BB3E20` | `#FF8A6D` | Texto de gasto sobre papel |
| `cobalt` | `#2547D8` | `#8FA0FF` | Dato, variaciÃ³n, foco |
| `focus` | `#2547D8` | `#8FA0FF` | Anillo de foco |

Mapa de calor: claro `#E7E3D6 â†’ #F3C9BA â†’ #E99A80 â†’ #D96A49 â†’ #B0381B`;
oscuro `#1C2018 â†’ #47251A â†’ #763522 â†’ #AC4A2D â†’ #E0633D`.

### Reglas

- El color no es decoraciÃ³n: lima = acciÃ³n/ingreso, tomate = gasto/error,
  cobalto = dato o foco. Nada mÃ¡s.
- El estado nunca se comunica solo por color: Â«Al dÃ­aÂ» / Â«En rojoÂ» llevan texto.
- La lima siempre usa tinta `#15160F` encima; nunca texto blanco.
- Las superficies no llevan sombra. Solo hojas y diÃ¡logos flotan.

## 6. TipografÃ­a

| Rol | Fuente | Uso |
| --- | --- | --- |
| Display | Bricolage Grotesque Variable | TÃ­tulos, cifras de marca, cabeceras |
| UI | Instrument Sans Variable | Cuerpo, botones, formularios |
| NÃºmeros | Spline Sans Mono | Dinero, tasas, fechas, folios |

- TÃ­tulos: peso 600, leading `0.92â€“1.05`, tracking `-0.025em` a `-0.055em`.
- Cuerpo: 12â€“15 px, leading relajado, mÃ¡ximo 52â€“68 caracteres por lÃ­nea.
- Etiquetas: mono 8â€“10 px, mayÃºsculas, tracking `0.06â€“0.16em`.
- Dinero: siempre `tabular-nums`, dos decimales, prefijo de moneda mÃ¡s pequeÃ±o y
  con menor contraste que la cifra.
- Formato: `Bs 134.342,92` Â· `$151,59` Â· tasas `886,2271`.
- No se usa una segunda familia decorativa. No hay cursivas decorativas.

## 7. Forma y layout

- Radios: ticket `2px`, botÃ³n `12px`, tarjeta `18px`, hoja `22px`.
- Bordes de 1 px (`rule`) o 1,5 px (`ink/25`) en el recibo.
- Ancho de contenido: `max-w-[1180px]`, con rail fijo de 84 px en escritorio.
- MÃ³vil: una columna, `px-5`, navegaciÃ³n inferior fija y FAB central.
- Escritorio: rail vertical, contenido centrado, reportes en 12 columnas.
- Sin scroll horizontal a 360, 390 y 1440 px.
- El espacio en blanco es parte de la jerarquÃ­a; no se rellena con tarjetas.

## 8. AnatomÃ­a del recibo

Orden exacto, de arriba a abajo:

1. **Cabecera**: Â«Resumen Â· OCTUBRE 2026Â» y sello de estado.
2. **Balance del mes**: cifra grande en moneda base.
3. **Equivalente**: otra moneda, etiquetado Â«a tasa BCV de hoyÂ».
4. **Separador punteado**.
5. **Ingresos y gastos**: signo `+` / `âˆ’`, color y mono.
6. **Tasas**: BCV y paralelo con fecha, no solo valor.
7. **Pie**: Â«Cliente Â· AnaÂ» y Â«Folio 2026-10Â».
8. **Borde perforado** inferior, hecho con un gradiente radial.

El recibo solo se usa en el resumen de Inicio y en el anotador rÃ¡pido. En
Reportes el balance es editorial, sin repetir el objeto.

## 9. Anotador rÃ¡pido

- MÃ³vil: hoja inferior, mÃ¡ximo `92dvh`, con scroll interno y safe-area.
- Escritorio: diÃ¡logo centrado de 880 px.
- Orden: tipo â†’ concepto â†’ monto â†’ moneda â†’ tasa â†’ categorÃ­a â†’ fecha â†’ guardar.
- El monto se escribe con teclado numÃ©rico propio; tambiÃ©n acepta teclado fÃ­sico:
  dÃ­gitos, coma/punto y retroceso.
- La hoja muestra la conversiÃ³n antes de guardar y la tasa aplicada.
- Al guardar: sello Â«AnotadoÂ» durante 260 ms y cierre a los 280 ms. Con
  `prefers-reduced-motion` el sello aparece sin rebote y el cierre es inmediato.
- El botÃ³n de guardar deshabilitado es neutro, no una CTA lima apagada.
- Errores debajo del campo, en tomate, sin sacudir la hoja.

## 10. Movimiento

Solo cuatro momentos funcionales. Nada mÃ¡s se anima.

| Momento | EspecificaciÃ³n | QuÃ© comunica |
| --- | --- | --- |
| Abrir la hoja | 340 ms Â· `cubic-bezier(.16,1,.3,1)` | De dÃ³nde viene el panel |
| Guardar | 260 ms Â· rebote suave | ConfirmaciÃ³n Ãºnica |
| Cambiar de perÃ­odo | 180 ms Â· fundido | Las cifras son otras |
| Dibujar la grÃ¡fica | 420 ms Â· escala vertical, 8 ms por barra | El dato aparece |

- El fondo de la hoja se oscurece al 55 %.
- No hay animaciones de scroll, parallax ni hover elaborado.
- `prefers-reduced-motion: reduce` lleva todo a `0.01ms`; ninguna animaciÃ³n
  bloquea una acciÃ³n.

## 11. Dinero y tasas

- Cada movimiento guarda: monto original, moneda, tipo de tasa, valor de la tasa
  y equivalente en USD.
- Los totales usan la tasa guardada en cada movimiento (`txValue`). Un recibo de
  septiembre no cambia cuando cambia el dÃ³lar.
- Los equivalentes y la nota Â«a tasa BCV de hoyÂ» usan la tasa BCV actual.
- La brecha es `(paralelo âˆ’ BCV) / BCV`, calculada, no inventada.
- No hay sparklines ni deltas falsos en la tira de tasas.
- Tasas de demostraciÃ³n: BCV `886,2271` (23-oct-2026) y paralelo `1003,61365`
  (26-oct-2026). En producciÃ³n vendrÃ¡n de una fuente con fecha y origen.

## 12. Modelo de datos

Dexie, base `stingy`, versiÃ³n 2.

| Tabla | Campos principales | Ãndices |
| --- | --- | --- |
| `profiles` | `id`, `name`, `email`, `ledgerId`, `baseCurrency`, `defaultRateType`, `onboardingComplete`, `demo`, `createdAt` | `id` |
| `ledgers` | `id`, `name`, `kind` (`personal`/`shared`), `baseCurrency`, `createdAt` | `id`, `kind` |
| `ledgerMembers` | `id`, `ledgerId`, `userId`, `role` (`owner`/`member`), `joinedAt` | `id`, `ledgerId`, `userId` |
| `categories` | `id`, `ledgerId`, `name`, `icon`, `kind`, `order` | `id`, `ledgerId`, `kind`, `order` |
| `transactions` | `id`, `ledgerId`, `createdBy`, `kind`, `amount`, `currency`, `rateType`, `rate`, `amountUsd`, `categoryId`, `note`, `occurredOn`, `source`, `createdAt`, `updatedAt` | `id`, `ledgerId`, `occurredOn`, `categoryId`, `kind`, `createdAt` |

Decisiones:

- El modo ejemplo usa el perfil `demo` y el libro `ledger_demo`; las cuentas
  reales usan UUID de Supabase.
- `ledgers` y `ledgerMembers` existen desde el dÃ­a uno aunque la UI de cuentas
  compartidas no se muestre. AsÃ­ una cuenta compartida futura no exige migrar
  transacciones ni categorÃ­as.
- CategorÃ­as y movimientos ya estÃ¡n aislados por `ledgerId`; `createdBy` queda
  listo para saber quiÃ©n anotÃ³ en un libro compartido.
- Los importes se guardan como nÃºmero; la moneda y la tasa son parte del hecho.
- La sesiÃ³n la maneja el cliente de Supabase; la app no guarda contraseÃ±as. El
  modo ejemplo no toca Supabase.
- Cada fila escribe primero en Dexie y luego en la cola de salida. El empuje va
  por prioridad (perfiles, categorÃ­as, transacciones) y resuelve conflictos por
  `updatedAt`; el borrado es lÃ³gico.

## 13. Pantallas

| Ruta | Pantalla | Nota |
| --- | --- | --- |
| `/` | Inicio | Recibo, tasas, grÃ¡fica diaria, categorÃ­as, recientes |
| `/movimientos` | Movimientos | BÃºsqueda, filtros, ediciÃ³n y borrado |
| `/reportes` | Reportes | Semana/mes/aÃ±o, Bs/USD, seis meses, categorÃ­as, mapa |
| `/ajustes` | Ajustes | Cuenta, tema, tasas, categorÃ­as, Telegram, datos, licencia |
| `/design` | Sistema de diseÃ±o | DocumentaciÃ³n viva |
| `/onboarding` | Onboarding | Tres pasos, solo primera vez |
| `*` | 404 | Â«Esta pÃ¡gina no estÃ¡ en tu libro.Â» |

El acceso (`/` sin perfil) usa Supabase Auth con correo y contraseÃ±a. **Probar el
ejemplo** entra al modo local sin tocar la red. La confirmaciÃ³n de correo estÃ¡
desactivada y la recuperaciÃ³n de contraseÃ±a no estÃ¡ disponible hasta tener SMTP
propio; la interfaz lo dice.

## 14. Telegram

- `Mercado 12511 bolivares bcv` â†’ gasto en Bs a tasa BCV.
- `+Freelance 110 dolares paralelo` â†’ ingreso en USD a tasa paralelo.
- `+` indica ingreso; sin signo, gasto.
- `bcv` o `paralelo` eligen la tasa; si falta, se usa la preferida del perfil.
- Â«ayerÂ» y Â«hoyÂ» se resuelven en `America/Caracas`.
- La respuesta muestra el monto anotado y ambos equivalentes, sin emojis.
- El bot `@stingyve_bot` estÃ¡ activo. La vinculaciÃ³n se hace en Ajustes con un
  cÃ³digo de un solo uso de 10 minutos; un chat pertenece a una sola cuenta.
- La app solo muestra Â«ConectadoÂ» si existe una fila activa en `telegram_links`.
  Sin red, dice que no puede verificar.

## 15. Accesibilidad y QA

- Objetivos tÃ¡ctiles de 44 px en mÃ³vil; chips y navegaciÃ³n incluidos.
- Enlaces de texto pequeÃ±os usan `.tap-link`, que amplÃ­a el Ã¡rea a 44 px con un
  pseudo-elemento sin mover el layout.
- Contraste AA en tokens clave: mÃ­nimo 4,78:1 (`muted` sobre `paper`); tinta sobre
  lima 13,17:1; textos de gasto 4,86:1 en claro y 8,17:1 en oscuro.
- Foco visible de 2 px cobalto con offset de 2 px. Enlace Â«Saltar al contenidoÂ».
- DiÃ¡logos Radix con trampa de foco, cierre con Escape y retorno de foco.
- GrÃ¡ficas con etiquetas accesibles y tabla equivalente desplegable.
- Sin scroll horizontal a 360, 390 y 1440 px en claro y oscuro.
- `prefers-reduced-motion` verificado: animaciones y transiciones a `0.01ms`.
- Estados vacÃ­os, de carga y de error escritos; no se dejan cajas mudas.

## 16. Alcance diferido

No implementado a propÃ³sito:

- RecuperaciÃ³n de contraseÃ±a y verificaciÃ³n de correo (requieren dominio propio y
  SMTP).
- UI de cuentas compartidas, invitaciones y roles (el modelo ya los soporta).
- Licencia por usuario, pedidos de pago y facturaciÃ³n (`BILLING_ENABLED=false`).
- AnalÃ­tica de producto y notificaciones.

Antes de agregar cualquiera de estas piezas: conservar las etiquetas honestas,
el presupuesto de lima y los cuatro momentos de movimiento.

