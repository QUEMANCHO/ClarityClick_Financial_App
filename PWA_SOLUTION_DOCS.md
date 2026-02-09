# Documentación de Solución Definitiva: Instalación PWA Móvil

## 📄 Contexto del Problema
A pesar de tener una configuración PWA básica, la aplicación **ClarityClick** no mostraba el botón o banner de instalación ("Add to Home Screen") en dispositivos móviles (Chrome Android / iOS), aunque sí era instalable en escritorio.

## 🔍 Diagnóstico
1.  **Criterios de "Rich Install UI"**: Chrome en Android requiere explícitamente que las capturas de pantalla (screenshots) en el `manifest` tengan la propiedad `form_factor: 'narrow'` para móviles y `form_factor: 'wide'` para escritorio. Sin esto, la experiencia de instalación enriquecida falla silenciosamente.
2.  **Evento `beforeinstallprompt`**: Los navegadores modernos bloquean los prompts de instalación automáticos para evitar spam. Se requiere capturar este evento y disparar la instalación **solo tras una interacción del usuario** (click en un botón).
3.  **Conflicto de Service Worker**: La configuración `injectRegister: 'inline'` o `'auto'` del plugin de Vite podía entrar en conflicto con el registro manual controlado en `src/main.tsx`.

## 🛠️ Solución Implementada

### 1. Configuración del Manifiesto (`vite.config.mjs`)
Se ajustó la configuración del plugin `VitePWA` para cumplir estrictamente con los estándares de Google:
-   **Desactivación de Inyección Automática**: `injectRegister: null`. Delegamos el control total al código de la app.
-   **Screenshots con `form_factor`**: Se definieron capturas específicas para móvil (`narrow`) y escritorio (`wide`).

```javascript
// vite.config.mjs
manifest: {
  // ...
  screenshots: [
    {
      src: "...",
      sizes: "1080x1920",
      type: "image/png",
      form_factor: "narrow", // CRÍTICO para móviles
      label: "Dashboard Principal"
    },
    {
       src: "...",
       sizes: "1920x1080",
       type: "image/png",
       form_factor: "wide", // Requerido para evitar warnings en Desktop
       label: "Vista de Escritorio"
    }
  ]
}
```

### 2. Componente de UI Personalizada (`src/components/InstallPrompt.tsx`)
Se creó un componente dedicado para gestionar la experiencia de instalación:
-   **Escucha**: Se suscribe al evento `beforeinstallprompt` del navegador.
-   **Previene**: Evita que el navegador muestre (o bloquee) su propio mini-infobar (`e.preventDefault()`).
-   **Muestra**: Renderiza un banner visualmente atractivo en la parte inferior de la pantalla.
-   **Acciona**: Al hacer click en "Instalar", invoca `deferredPrompt.prompt()`.

### 3. Integración Global (`src/App.tsx`)
El componente `<InstallPrompt />` se añadió al layout principal de la aplicación, asegurando que esté disponible en cualquier vista, pero solo visible cuando el navegador habilita la instalación.

## ✅ Resultado
-   **Control Total**: La app ahora decide cuándo y cómo invitar al usuario a instalar.
-   **Compatibilidad**: Cumple con los criterios de "Rich Install UI" de Chrome y los estándares de PWA modernos.
-   **Experiencia de Usuario**: Feedback visual claro en lugar de depender de comportamientos ocultos del navegador.
