-- =========================================================================================
-- MIGRACIÓN FASE 1: Preparación de Datos (Exclusión de IA)
-- 
-- Objetivo: Añadir una bandera lógica a las transacciones para que ingresos extraordinarios
-- (como el "Nuevo Combustible" descartado) puedan ser ignorados por el modelo de 
-- Inteligencia Artificial al calcular capacidades promedio.
-- =========================================================================================

-- 1. Añadir el campo booleano a la tabla base
ALTER TABLE transacciones
ADD COLUMN IF NOT EXISTS excluir_de_ia boolean DEFAULT false;

-- NOTA: La actualización de la vista `v_estrategia_metas_detalle` se hará en la Fase 3,
-- por ahora esta columna se llenará por defecto a `false` o `true` cuando se descarte
-- combustible desde la UI.
