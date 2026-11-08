# ENT Senses Hearing — Guía práctica y plantilla de análisis

Guía en lenguaje llano para entender la calibración, poner en marcha el audiómetro y registrar las
pruebas de Hearing de forma ordenada. Las tablas del apartado 5 sirven de **plantilla**: cópielas
(a una hoja de cálculo o a un documento) y rellénelas a medida que pruebe.

---

## 1. La idea en una frase

El ordenador sabe cuánta «fuerza digital» manda al auricular, pero no cuántos decibelios llegan al
oído. **Calibrar es construir la tabla que traduce una cosa en la otra**, frecuencia por
frecuencia y oído por oído, para esos auriculares y ese volumen concretos.

## 2. Glosario mínimo

| Término | Qué es | Analogía |
|---|---|---|
| **dB HL** | La escala del audiograma. 0 dB HL = el sonido más débil que oye una persona joven con audición normal. | El «idioma clínico». |
| **dBFS** | La fuerza digital que manda el ordenador. 0 dBFS es el máximo; todo lo demás es negativo (−20, −60, −100…). | El acelerador del coche. |
| **dB SPL** | La presión sonora real que mide un sonómetro. | El velocímetro. |
| **RETSPL** | Para cada modelo de auricular homologado, cuántos dB SPL equivalen a 0 dB HL en cada frecuencia (tabla de la norma ISO 389-1). | El «diccionario» de ese auricular. |
| **Nivel de referencia** | La fuerza digital fija (−20 dBFS por defecto) a la que la app emite el tono para que el técnico lo mida. | Pisar el acelerador siempre igual para medir. |
| **Máximo digital** | Techo de seguridad (−3 dBFS por defecto) para que el sonido nunca se distorsione ni sea excesivo. | El limitador de velocidad. |
| **0 dB HL (dBFS)** | El resultado de la calibración: la fuerza digital que produce 0 dB HL en ese oído y frecuencia. Por ejemplo, −95 dBFS. | La tabla de traducción. |

**Nunca tiene que inventar estos números**: salen de la medición (técnico) o de la prueba con
personas (calibración biológica). El nivel de referencia y el máximo digital se dejan como están.

## 3. Tres formas de calibrar en la app

| Método | Quién lo hace | Necesita | Precisión | Para qué |
|---|---|---|---|---|
| **Biológico** | Usted, con 3 o más personas jóvenes (18–30 años) sin problemas de oído | Auriculares, sala silenciosa, volumen fijo | Aproximada (±5–10 dB) | Aprender, probar la app, orientar |
| **Objetivo** | Un técnico de calibración de audiómetros | Oído artificial (IEC 60318-3) + sonómetro + auriculares homologados (DD45) | Alta (±1–2 dB) | Informes clínicos |
| **Manual** | Usted, copiando valores | Los valores «0 dB HL (dBFS)» de un certificado | La del origen | Restaurar una calibración conocida |

## 4. Empezar ya, sin técnico (calibración biológica)

1. **Auriculares**: unos cerrados de calidad y con cable bastan para aprender (por ejemplo, tipo
   Sennheiser HD 280 Pro). Los DD45 serán necesarios para la calibración objetiva.
2. **Volumen fijo**: macOS al 100 % (o al valor que elija) y, si usa interfaz, su mando en una
   posición marcada con cinta. Anótelo en el perfil. **Si lo cambia, hay que recalibrar.**
3. **Sala**: lo más silenciosa posible (sin aire acondicionado, puerta cerrada).
4. En **Hearing → Calibración → Nuevo perfil**, deje el método **Biológico**, ponga nombre y
   modelo de auriculares.
5. **Añadir oyente**: iniciales y «audición supuesta» = 0 dB HL (persona joven sin problemas de
   oído). Pulse **Empezar**: la persona pulsa «Lo oigo» o la barra espaciadora cada vez que oye un
   pitido. Unos 10 minutos.
6. Repita con **2 o más personas** más y pulse **Guardar perfil**. La app usa la mediana.
7. En **Hearing → Audiómetro**: haga la **comprobación diaria** y ya puede probar el modo manual y
   el automático.

> El audiograma obtenido con calibración biológica es **orientativo**: sirve para familiarizarse y
> comparar, no para informes clínicos.

## 5. Plantillas de registro

### 5.1 Equipo y calibración

| Fecha | Perfil | Auriculares (modelo / nº serie) | Interfaz y volumen fijado | Método | Oyentes / técnico | Válido hasta | Notas |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

### 5.2 Comprobación diaria

| Fecha | Perfil | ¿Suena solo en el oído correcto? | ¿Sin ruidos ni cortes? | Resultado | Notas |
|---|---|---|---|---|---|
| | | | | | |

### 5.3 Pruebas de funcionamiento de la app

| Fecha | Qué se probó | Pasos | Resultado esperado | Resultado obtenido | ¿OK? | Notas / captura |
|---|---|---|---|---|---|---|
| | Audiómetro manual: marcar umbrales | | Aparecen en el audiograma | | | |
| | Audiómetro automático: prueba completa | | Termina sin errores, avisos coherentes | | | |
| | Silencios de control | Pulsar sin oír tono | La app cuenta respuestas en silencio | | | |
| | Aviso de enmascaramiento | Diferencia ≥ 40 dB entre oídos | Aparece el aviso | | | |
| | Guardar y abrir informe | | Informe con aviso «sin marcado CE» | | | |

### 5.4 Repetibilidad (misma persona, mismo día)

| Persona (iniciales) | Oído | 250 | 500 | 1000 | 2000 | 4000 | 8000 | Prueba |
|---|---|---|---|---|---|---|---|---|
| | OD | | | | | | | Manual 1 |
| | OD | | | | | | | Manual 2 |
| | OD | | | | | | | Automática |

Objetivo orientativo: diferencias de **≤ 5 dB** en la mayoría de las frecuencias.

### 5.5 Comparación con un audiómetro certificado (validación — fase 7)

| Paciente (etiqueta) | Oído | Frecuencia (Hz) | ENT Senses (dB HL) | Audiómetro certificado (dB HL) | Diferencia | Modo (manual / automático) |
|---|---|---|---|---|---|---|
| | | | | | | |

Objetivo del plan: **diferencia media ≤ 5 dB** y **≥ 90 % de los umbrales dentro de ±10 dB**, en
30–50 pacientes (60–100 oídos).

## 6. Prueba informativa del paciente (QR)

El paciente abre el QR de Hearing en su móvil y, sin dar su nombre: responde 7 preguntas y los
signos de alarma, elige sus auriculares, **ajusta el volumen** con un tono de referencia hasta que
le resulte cómodo «como una conversación», comprueba izquierda/derecha y hace la búsqueda
automática en 1000, 2000, 4000 y 500 Hz de cada oído pulsando «Lo oigo» (unos 4–5 minutos).

- **Qué ve el paciente**: por oído, «probablemente buena audición / posible pérdida / probable
  pérdida importante», y un mensaje: «no se observan alteraciones llamativas», «recomendable
  revisión», «resultado poco fiable» o, si marcó signos de alarma, «consulte con un médico pronto».
  Nunca ve números.
- **Qué ve usted en la bandeja**: niveles **estimados** (±15–20 dB, nunca como vía aérea
  calibrada), PTA estimado, asimetría, cuestionario (0–20), signos de alarma, auriculares y
  respuestas sin tono.
- **Lo más fiable**: la diferencia entre oídos y la forma de la curva. **No descarta una pérdida
  simétrica**, porque el paciente ajusta el volumen a su propia audición.

| Criterio | Regla actual |
|---|---|
| Buena / posible / probable pérdida | PTA estimado (500–4000 Hz) ≤ 30 / ≤ 50 / > 50 dB |
| Asimetría | Diferencia de PTA ≥ 15 dB o ≥ 25 dB en una frecuencia |
| Quejas en el cuestionario | Puntuación ≥ 8 de 20 |
| Poco fiable | > 30 % de pulsaciones sin tono o frecuencias sin resultado claro |

Para analizarla, compare en la plantilla 5.5 la prueba del paciente con su audiometría en consulta
(columna «Modo»: «paciente»); con 30–50 casos se podrán ajustar estos umbrales.

## 7. Preguntas frecuentes

- **¿Puedo usar cualquier auricular?** Para aprender, sí, con calibración biológica. Para informes
  clínicos, auriculares audiométricos homologados (DD45) con calibración objetiva.
- **¿Y si cambio el volumen del Mac?** La calibración deja de valer: vuelva a ponerlo donde estaba
  o recalibre.
- **¿Inalámbricos?** No: el Bluetooth y sus ajustes automáticos alteran el nivel. Siempre con cable.
- **¿Cada cuánto calibrar?** Objetiva: una vez al año (y si se cae o cambia algo). Biológica:
  cuando cambie de auriculares, de ordenador o de volumen.
