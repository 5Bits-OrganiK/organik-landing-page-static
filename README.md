# OrganiK Frontend v2

Landing page estática de OrganiK, el sistema de control de inventario para minimarkets.
Está construida con HTML, CSS y JavaScript nativo: sin frameworks, sin librerías y sin paso de build.

## Estructura

- `index.html`: landing principal (hero, funciones, video del equipo, video del producto, equipo, testimonios, planes por segmento y llamada final al login).
- `plans.js`: selector de planes por segmento (minimarkets / proveedores).
- `terminos.html` y `privacidad.html`: páginas legales.
- `404.html`: página de error con la identidad de la marca.
- `styles.css`: sistema de diseño, estilos, animaciones y responsive.
- `main.js`: animaciones, interacciones y cambio de idioma.
- `public/`: favicon y recursos estáticos.
- `public/team/`: fotos del equipo (ver `public/team/LEEME.md` para reemplazar los placeholders).
- `public/i18n/translations.js`: traducciones ES / EN de todo el sitio.

## Ejecutar localmente

Abre `index.html` directamente en el navegador.

Si prefieres servirla por HTTP, usa cualquier servidor estático apuntando a la raíz del proyecto.

## Características

- Diseño oscuro con acento lima, tipografía Fraunces + Geist.
- Animaciones con CSS, Web Animations API y `IntersectionObserver`.
- Respeta `prefers-reduced-motion`.
- Idioma ES / EN persistente entre páginas.
- Formulario con validación en línea.

## Flujo de trabajo

El repositorio sigue **Gitflow** y **Conventional Commits**. Revisa [CONTRIBUTING.md](CONTRIBUTING.md)
antes de abrir una rama o un pull request, y el historial de cambios en [CHANGELOG.md](CHANGELOG.md).
