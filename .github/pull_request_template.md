## 📝 Descripción
<!-- Describe brevemente el propósito de este PR. -->

## 🎫 Ticket / Especificación
- ID: [SPEC-ID]

## 🏗️ Tipo de Cambio
- [ ] ✨ Nueva funcionalidad (Feature)
- [ ] 🐛 Corrección de bug (Bugfix)
- [ ] ♻️ Refactorización (Clean Code / Arquitectura)
- [ ] 🧪 Pruebas (Testing unitario, E2E, Mutación)
- [ ] 📖 Documentación

## ⚖️ Checklist de Clean Code y SOLID
- [ ] La UI y la lógica de negocio están estrictamente separadas.
- [ ] Todo manejo de estado complejo reside en un Custom Hook (`use...`).
- [ ] Las validaciones de negocio residen en `domain/schemas` y no en la UI.

## 🎨 Checklist de Rendimiento y Design System
- [ ] **NO hay estilos inline** (`style={{...}}`).
- [ ] **Design system first**Se priorizó el uso de elementos del design system.
- [ ] **NO hay funciones inline** en el JSX (ej. `onClick={() => ...}`). Se usó `useCallback`.
- [ ] **NO hay objetos inline** pasados como props.

## 🧪 Checklist de Calidad
- [ ] El tipado TypeScript pasa sin errores (`pnpm type-check`).
- [ ] Se agregaron/actualizaron tests unitarios referenciando el ID del spec.

## 📸 Screenshots (Si aplica)
<!-- Adjunta imágenes si este PR modifica el Design System o vistas clave -->
