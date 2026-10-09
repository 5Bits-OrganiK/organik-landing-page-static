# Changelog

Todos los cambios relevantes de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[Versionado Semántico](https://semver.org/lang/es/).

## [2.2.1] - 2026-10-08

### Removed

- El formulario de contacto del final de la página: la llamada final al login ya cumple la función de llamada a la acción.

## [2.2.0] - 2026-10-07

### Added

- Planes por segmento: selector **Minimarkets / Proveedores** en la sección de planes; cada botón `Elegir plan` abre el registro de la aplicación con el rol y el plan elegidos (`?role=...&plan=...`).
- Sección **Contacto** con formulario (nombre, correo y mensaje) con validación en español e inglés, confirmación y mensaje de error. El envío es una demostración: el mensaje se envía por POST a la API simulada de Beeceptor (`/api/v1/contact`) y puede verse en su panel; no se envía ningún correo.

### Notes

- Los planes de proveedores (Catálogo y Aliado) no tienen precio definido y se muestran como "A medida" hasta que el equipo los confirme.

## [2.1.0] - 2026-10-07

### Added

- Sección **Testimonios** (textos de ejemplo, reemplazar por reales antes de publicar).
- Llamada final con un botón que lleva al login de la aplicación.
- Configuración de Firebase Hosting (`firebase.json`, `.firebaserc`) con redirecciones de `/login` y `/register` a la aplicación.
- Enlace "Iniciar sesión" hacia la aplicación y botones "Empezar" / "Elegir plan" hacia el registro.

### Changed

- Nuevo orden de la landing: todo sobre el producto (funciones, proveedores, video, testimonios y planes), todo sobre el equipo (video y integrantes) y la llamada final a la acción. El menú sigue ese orden.
- El idioma por defecto del sitio es inglés (se puede cambiar a español con el selector ES / EN).
- La sección **Equipo** muestra a los 5 integrantes con foto, nombre completo, código de alumno y una frase (ES / EN).
- Sección **Para proveedores** con su propio botón de registro como proveedor.
- Los enlaces del HTML apuntan a la aplicación publicada; en desarrollo `main.js` los cambia a `localhost:4200`. Firebase redirige `/login` y `/register` a la aplicación.
- Cifras reales en el hero (módulos, roles e idiomas) en lugar de métricas de relleno; los contadores conservan su valor final en el HTML.
- Los roles del producto son administrador y proveedor (se quitan Cajero y Compras).
- El nombre de la marca se escribe OrganiK en todo el sitio.
- Selector de idioma con dos botones (ES / EN), icono y estado accesible; también traduce el título y la descripción de la página.
- La sección de videos se separa en **Video del equipo** y **Video del producto**, cada una con su placeholder de video.

### Removed

- El botón "Solicitar demo" y la mención a pruebas gratuitas: el producto no se ofrece como demo.
- La sección de suscripción con su formulario.

## [2.0.1] - 2026-10-02

### Changed

- `script.js` pasa a llamarse `main.js`.
- Las traducciones se mueven a `public/i18n/translations.js`.
- El favicon pasa a ser un archivo en `public/favicon.svg`.

## [2.0.0] - 2026-10-02

### Added

- Rediseño completo de la landing con HTML, CSS y JavaScript nativo.
- Secciones de hero, funciones, videos, planes y contacto con animaciones al hacer scroll.
- Páginas de términos y condiciones, política de privacidad y 404.
- Cambio de idioma ES / EN persistente con traducciones en `i18n.js`.
- Formulario de suscripción con validación en línea.
- Archivos de configuración del proyecto: `.gitignore`, `.editorconfig` y `.prettierrc`.
- Documentación: `README.md`, `CONTRIBUTING.md` y `CHANGELOG.md`.

[2.1.0]: https://github.com/5Bits-OrganiK/organik-frontend-v2/releases/tag/v2.1.0
[2.0.1]: https://github.com/5Bits-OrganiK/organik-frontend-v2/releases/tag/v2.0.1
[2.0.0]: https://github.com/5Bits-OrganiK/organik-frontend-v2/releases/tag/v2.0.0
