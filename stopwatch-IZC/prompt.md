---
# ChatBot
- Claude 4.7 Opus
---
Actúa como desarrollador frontend senior especializado en HTML, CSS y JavaScript vanilla.

Estoy trabajando en la creación de una web sencilla con dos herramientas:

1. Cronómetro.
2. Cuenta atrás / temporizador.

La funcionalidad debe basarse en esta referencia: https://www.online-stopwatch.com/

Importante: la referencia es SOLO funcional. No quiero copiar su diseño visual, estilos, colores, marca, estructura exacta ni assets. Quiero una interfaz mucho más moderna, limpia, agradable y profesional.

## Contexto técnico

- Stack: HTML, CSS y JavaScript vanilla.
- Sin frameworks.
- Sin librerías externas.
- Arquitectura:
  - Un único fichero `index.html`.
  - Un fichero `script.js` que se enlazará desde el HTML.
  - El CSS puede ir dentro del propio `index.html` en una etiqueta `<style>`, salvo que consideres mejor separarlo y me lo expliques.

## Objetivo

Crear una web responsive que permita al usuario usar un cronómetro y una cuenta atrás de forma clara, rápida y cómoda.

## Funcionalidad requerida

### Pantalla principal

Debe haber una pantalla inicial con dos opciones principales:

- Cronómetro.
- Cuenta atrás.

Cada opción debe verse como una tarjeta o botón grande, moderno y claramente clicable.

### Cronómetro

Debe incluir:

- Display grande con formato `HH:MM:SS.mmm` o similar.
- Botón para iniciar.
- Botón para pausar/reanudar.
- Botón para reiniciar.
- Botón para volver a la pantalla principal.
- El cronómetro debe ser preciso y evitar acumulación de errores usando `performance.now()` o una estrategia similar.

### Cuenta atrás

Debe incluir:

- Display grande con el tiempo configurado.
- Una forma cómoda de introducir el tiempo:
  - Puede ser mediante campos de horas, minutos y segundos.
  - O mediante teclado numérico visual, si lo consideras mejor.
- Botón para iniciar.
- Botón para pausar/reanudar.
- Botón para reiniciar/limpiar.
- Botón para volver a la pantalla principal.
- Cuando llegue a cero, debe detenerse correctamente y mostrar claramente que ha terminado.

## Diseño

No copies la estética de la web de referencia. Quiero que lo rediseñes con un estilo mucho más actual.

Requisitos de diseño:

- Interfaz moderna, limpia y minimalista.
- Buen uso de espacios, bordes redondeados, sombras suaves y jerarquía visual.
- Diseño responsive para escritorio y móvil.
- Botones grandes y fáciles de pulsar.
- Colores agradables, nada chillón ni anticuado.
- Evitar el aspecto de página antigua tipo `online-stopwatch.com`.
- No incluir marcas de agua, URLs falsas ni branding copiado.
- Buena accesibilidad:
  - Contraste correcto.
  - Estados visuales para botones.
  - Textos claros.
  - Navegación usable.
  - Soporte básico de teclado cuando tenga sentido.

## Rendimiento y calidad

- Evitar problemas de rendimiento.
- No usar `setInterval` de forma ingenua si puede generar drift.
- Usar `requestAnimationFrame` junto con `performance.now()` o una estrategia equivalente.
- Separar bien la lógica del cronómetro y la cuenta atrás.
- Código claro, mantenible y comentado solo donde tenga sentido.
- Evitar duplicación innecesaria.
- No usar código excesivamente complejo para una app pequeña.
- El código debe estar listo para copiar y ejecutar directamente.

## Quiero que me devuelvas

1. Un breve análisis de la mejor solución.
2. El código completo de `index.html`.
3. El código completo de `script.js`.
4. Una explicación breve de cómo funciona la lógica del tiempo.
5. Posibles riesgos o cosas a revisar.

## Importante

No asumas cosas raras.

Si falta algún dato importante antes de generar el código, pregúntame.

Si puedes resolverlo con una decisión razonable, toma la decisión y explícala brevemente.

Prioriza especialmente el diseño visual. Quiero que parezca una mini app moderna, no un ejercicio básico de clase.