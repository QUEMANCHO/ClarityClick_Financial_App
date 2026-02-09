# ClarityClick

**Sistema de Gestión Financiera Estratégica**

---

## 1. Visión General
**ClarityClick** es una solución de software de grado de ingeniería diseñada para transformar la gestión de las finanzas personales. Más que un simple rastreador de gastos, es un centro de comando estratégico que permite a los usuarios visualizar, controlar y optimizar sus flujos de efectivo basándose en una metodología probada de **4 Pilares Financieros**:

1.  **Ganar**: Maximización de ingresos.
2.  **Gastar**: Optimización del estilo de vida.
3.  **Ahorrar**: Construcción de resguardo financiero.
4.  **Invertir**: Crecimiento patrimonial.

Nuestra misión es proporcionar claridad absoluta sobre el presente financiero para potenciar las decisiones del futuro.

---

## 2. Stack Tecnológico
Construido sobre una arquitectura moderna, robusta y escalable:

-   **Frontend Core**: [React](https://react.dev/) (v19) - Biblioteca líder para interfaces de usuario dinámicas.
-   **Estilizado**: [Tailwind CSS](https://tailwindcss.com/) (v4) - Sistema de diseño utility-first para una UI premium y responsiva.
-   **Backend & Persistencia**: [Supabase](https://supabase.com/) - Postgres Database, Autenticación y Real-time subscriptions.
-   **Visualización de Datos**: [Recharts](https://recharts.org/) - Gráficos composables y altamente personalizables.
-   **Iconografía**: [Lucide React](https://lucide.dev/) - Iconos vectoriales consistentes y ligeros.
-   **Build Tool**: [Vite](https://vitejs.dev/) - Entorno de desarrollo de última generación.

---

## 3. Arquitectura Modular
La aplicación está estructurada en módulos independientes pero interconectados para facilitar la navegación y el mantenimiento:

-   **Dashboard**: Tablero de control principal con métricas clave (Patrimonio Neto, Ahorro Mensual) y accesos rápidos.
-   **Registros (TransactionList/Form)**: Interfaz optimizada para la captura veloz de movimientos financieros, categorizados por pilar.
-   **Cuentas (AccountsSummary)**: Vista consolidada de saldos por cuenta (Bancos, Efectivo, Inversiones).
-   **Análisis (Charts)**: Módulo de inteligencia financiera con desglose visual de gastos y tendencias de flujo de caja.
-   **Configuración**: Panel de administración para gestión de datos (Reset Total), preferencias de usuario y cierre de sesión.

---

## 4. Características Principales

### 💾 Persistencia Reactiva
Integración profunda con **Supabase** para asegurar que cada transacción se guarde, sincronice y recupere en tiempo real. Los datos persisten a través de dispositivos y sesiones.

### 🎨 UI/UX Premium & Mobile-First
Diseño meticuloso centrado en la experiencia de usuario:
-   **Modo Oscuro Nativo**: Soporte total para temas claro/oscuro con detección automática y toggle manual.
-   **Responsividad**: Interfaz fluida que se adapta desde dispositivos móviles hasta escritorios de alta resolución.
-   **Micro-interacciones**: Feedback visual inmediato y transiciones suaves para una experiencia de uso "app-like".

### 📊 Gráficos Dinámicos
-   **Flujo de Caja**: Visualización de ingresos vs. egresos en el tiempo.
-   **Distribución de Gastos**: Gráfico de pastel interactivo para identificar fugas de capital por categoría.
-   **Sistema Multidivisa**: Conversión automática de gastos en monedas extranjeras (ej. USD) a la moneda base (COP) utilizando tasas de cambio en tiempo real.
-   **Filtros Avanzados**: Potente motor de búsqueda por categoría, etiquetas personalizadas y rangos de fecha específicos.
-   **Etiquetado Inteligente**: Posibilidad de añadir etiquetas (tags) opcionales a los gastos para un rastreo más granular.

### 📱 Progressive Web App (PWA)
-   **Instalable**: Funciona como una aplicación nativa en iOS y Android.
-   **Offline-Ready**: Capacidad de funcionamiento básico sin conexión a internet.
-   **Actualizaciones Automáticas**: El Service Worker asegura que siempre tengas la última versión disponible.

---

## 5. Roadmap
El desarrollo de ClarityClick es continuo. La próxima fase mayor incluirá:

-   **⚡ Módulo de Energía Vital**:
    Una innovadora funcionalidad para la gestión del **capital biológico**. Permitirá rastrear no solo el dinero, sino la energía vital invertida en su obtención, alineando salud financiera con bienestar personal.

---

> *ClarityClick: Claridad para tu dinero, estrategia para tu vida.*

---

## 6. Despliegue en Vercel

### Pasos para Producción
1.  **Conectar Repositorio**: Importar este proyecto desde GitHub/GitLab a Vercel.
2.  **Configuración del Build**:
    -   *Framework Preset*: **Vite**
    -   *Root Directory*: `./` (predeterminado)
    -   *Build Command*: `npm run build` o `tsc -b && vite build`
    -   *Output Directory*: `dist`
3.  **Variables de Entorno**:
    Copiar las claves detalladas en `.env.example` y configurarlas en el panel de Vercel (Settings > Environment Variables).
    -   `VITE_SUPABASE_URL`
    -   `VITE_SUPABASE_ANON_KEY`
4.  **Deploy**: Hacer clic en **Deploy** y verificar que la aplicación cargue correctamente.

> **Nota**: El archivo `vercel.json` incluido ya maneja las reescrituras necesarias para que la SPA funcione sin errores 404.
