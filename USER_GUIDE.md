# Manual de Operación - ClarityClick

Este documento sirve como guía oficial para la operación, configuración y uso diario de **ClarityClick**.

---

## 1. Configuración Inicial

### Despliegue y Primer Ingreso
Al iniciar la aplicación por primera vez, serás recibido por la pantalla de Autenticación.
1.  **Registro**: Ingresa tu correo electrónico para recibir un "Magic Link" de acceso.
2.  **Onboarding**: Completarás un breve tour introductorio donde se explicarán los 4 Pilares y se te solicitará tu nombre para personalizar la interfaz.

### Verificación de Conexión
Para asegurar que tu instancia está conectada correctamente a la base de datos (Supabase):
-   Observa el **Dashboard**. Si los contadores aparecen en cero (y no como errores de carga), la conexión es exitosa.
-   En la barra lateral, tu estado debe aparecer como "Sesión activa".

---

## 2. Flujo de Ingreso Real (Go Live)

Antes de comenzar a registrar tus finanzas reales, es crucial limpiar cualquier dato de prueba que se haya generado durante la exploración inicial.

### Procedimiento de "Reset Total"
La función de reinicio permite eliminar todos los registros transaccionales sin afectar tu cuenta de usuario ni tu configuración de perfil.

1.  Navega al módulo **Ajustes** (icono de engranaje en la barra lateral).
2.  Desplázate hasta la "Zona de Peligro" al final de la pantalla (borde rojo).
3.  Localiza la opción **"Borrar Todas las Transacciones"**.
4.  Haz clic en el botón y confirma la acción en la ventana emergente.
    > ⚠️ **Advertencia**: Esta acción es irreversible. Asegúrate de querer comenzar desde cero.

Una vez realizado, el Dashboard mostrará todos los saldos en $0, indicando que estás listo para el ingreso de datos reales.

---

## 3. Gestión de Datos

### Registro de Transacciones
Para mantener la integridad de la información, registra cada movimiento en el momento que ocurre o al final del día.
1.  Ve a **Registros** en el menú.
2.  Completa el formulario superior ("Nueva Transacción"):
    -   **Pilar**: Clasifica fundamentalmente el movimiento (Ganar, Gastar, Ahorrar, Invertir).
    -   **Monto y Descripción**: Sé preciso.
3.  Haz clic en **"Registrar Movimiento"**.

### Edición y Eliminación
Si cometes un error, no es necesario hacer contra-asientos manuales. Puedes corregir el registro original:
1.  En la misma pantalla de **Registros**, busca la tabla "Historial Reciente" debajo del formulario.
2.  **Editar**: Haz clic en el icono de lápiz ✏️. El formulario se rellenará con los datos existentes. Modifica lo necesario y guarda.
3.  **Eliminar**: Haz clic en el icono de basura 🗑️. El registro desaparecerá permanentemente y los saldos se recalcularán automáticamente.

---

## 4. Interpretación de Análisis

### Gráfico de Pastel (Distribución de Gastos)
Ubicado en el **Dashboard**, este gráfico es tu herramienta principal para la optimización del pilar "Gastar".
-   **Propósito**: Identificar visualmente qué categorías consumen la mayor parte de tu presupuesto.
-   **Acción**: Si una rebanada del pastel (ej. "Entretenimiento") es desproporcionadamente grande, es una señal clara para aplicar recortes tácticos en esa área específica.

### Flujo de Caja (Ingresos vs Gastos)
El gráfico de barras muestra la relación entre lo que entra (Verde) y lo que sale (Rojo).
-   **Meta**: Las barras verdes siempre deben superar a las rojas. La diferencia visual representa tu capacidad de Ahorro e Inversión.
