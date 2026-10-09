# Guía de contribución

## Ramas (Gitflow)

| Rama | Origen | Se fusiona en | Uso |
| --- | --- | --- | --- |
| `main` | - | - | Código en producción. Cada versión lleva un tag `vX.Y.Z`. |
| `develop` | `main` | `release/*` | Integración de las funcionalidades terminadas. |
| `feature/<nombre>` | `develop` | `develop` | Una funcionalidad o sección nueva. |
| `release/<X.Y.Z>` | `develop` | `main` y `develop` | Preparación de una versión. |
| `hotfix/<nombre>` | `main` | `main` y `develop` | Corrección urgente en producción. |

Las fusiones se hacen con `--no-ff` para conservar el historial de cada rama.

## Commits (Conventional Commits)

Formato:

```
<tipo>(<alcance>): <descripción en minúsculas y en imperativo>
```

Tipos usados en el proyecto:

- `feat`: funcionalidad nueva.
- `fix`: corrección de errores.
- `copy`: cambios de texto y mensajes comerciales.
- `refactor`: cambios internos sin alterar el comportamiento.
- `style`: formato, sin cambios de lógica.
- `docs`: documentación.
- `chore`: configuración y mantenimiento.
- `ci`: integración y despliegue continuo.

Ejemplos:

```
feat(landing): add pricing section
fix(i18n): default landing language to english
docs(readme): document project structure
```

## Estilo de código

El formato lo definen `.editorconfig` y `.prettierrc`: UTF-8, indentación de 4 espacios,
comillas simples en JavaScript y 100 columnas como máximo.
