-- 1. Añadimos las columnas de periodicidad y monto base
ALTER TABLE metas 
ADD COLUMN IF NOT EXISTS aporte_ahorro_base numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_inversion_base numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS aporte_frecuencia text DEFAULT 'Mensual';

-- 2. Elimina la vista anterior si existe
DROP VIEW IF EXISTS v_estrategia_metas_detalle;

-- 3. Actualizamos la Vista Inteligente
CREATE OR REPLACE VIEW v_estrategia_metas_detalle AS
WITH 
  -- Estadísticas Globales por Usuario (Histórico)
  global_stats AS (
      SELECT 
          user_id,
          SUM(CASE WHEN pilar = 'Ganar' THEN cantidad ELSE 0 END) as total_ganado,
          SUM(CASE WHEN pilar = 'Gastar' THEN cantidad ELSE 0 END) as total_gastado,
          COUNT(DISTINCT date_trunc('month', fecha)) as meses_activos
      FROM transacciones
      GROUP BY user_id
  ),
  user_metrics AS (
      SELECT 
          user_id,
          CASE WHEN meses_activos > 0 THEN total_ganado / meses_activos ELSE 0 END as promedio_ingresos_mensual,
          CASE WHEN meses_activos > 0 THEN total_gastado / meses_activos ELSE 0 END as promedio_gastos_mensual,
          -- Capacidad Real Bruta (Promedio)
          CASE WHEN meses_activos > 0 THEN (total_ganado - total_gastado) / meses_activos ELSE 0 END as capacidad_ahorro_mensual
      FROM global_stats
  ),
  -- Normalización de aportes de cada meta a mensual
  metas_normalizadas AS (
      SELECT 
          id as meta_id,
          user_id,
          CASE 
              WHEN aporte_frecuencia = 'Diario' THEN COALESCE(aporte_ahorro_base, 0) * 30
              WHEN aporte_frecuencia = 'Semanal' THEN COALESCE(aporte_ahorro_base, 0) * 4
              WHEN aporte_frecuencia = 'Quincenal' THEN COALESCE(aporte_ahorro_base, 0) * 2
              WHEN aporte_frecuencia = 'Anual' THEN COALESCE(aporte_ahorro_base, 0) / 12
              ELSE COALESCE(aporte_ahorro_base, 0) 
          END as aporte_ahorro_mensual,
          CASE 
              WHEN aporte_frecuencia = 'Diario' THEN COALESCE(aporte_inversion_base, 0) * 30
              WHEN aporte_frecuencia = 'Semanal' THEN COALESCE(aporte_inversion_base, 0) * 4
              WHEN aporte_frecuencia = 'Quincenal' THEN COALESCE(aporte_inversion_base, 0) * 2
              WHEN aporte_frecuencia = 'Anual' THEN COALESCE(aporte_inversion_base, 0) / 12
              ELSE COALESCE(aporte_inversion_base, 0) 
          END as aporte_inversion_mensual
      FROM metas
  ),
  global_goals_plan AS (
      SELECT 
          user_id,
          SUM(COALESCE(aporte_ahorro_mensual, 0) + COALESCE(aporte_inversion_mensual, 0)) as total_aporte_planeado_global
      FROM metas_normalizadas
      GROUP BY user_id
  ),
  meta_advances AS (
      SELECT 
          meta_id,
          SUM(CASE WHEN pilar IN ('Ahorrar', 'Invertir') THEN cantidad ELSE 0 END) as monto_actual_calculado,
          SUM(CASE WHEN pilar = 'Ahorrar' THEN cantidad ELSE 0 END) as total_ahorro,
          SUM(CASE WHEN pilar = 'Invertir' THEN cantidad ELSE 0 END) as total_inversion
      FROM transacciones
      WHERE meta_id IS NOT NULL
      GROUP BY meta_id
  )
SELECT 
    m.id as meta_id,
    m.user_id,
    m.nombre as meta_nombre,
    m.monto_objetivo,
    COALESCE(ma.monto_actual_calculado, 0) as monto_actual,
    m.fecha_limite,
    m.color,
    m.moneda,
    m.pilar_principal,
    
    -- Planeación Específica (Normalizada a Mensual)
    COALESCE(mn.aporte_ahorro_mensual, 0) as aporte_planeado_ahorro,
    COALESCE(mn.aporte_inversion_mensual, 0) as aporte_planeado_inversion,
    (COALESCE(mn.aporte_ahorro_mensual, 0) + COALESCE(mn.aporte_inversion_mensual, 0)) as aporte_planeado_total,
    
    -- Campos Originales para la UI
    COALESCE(m.aporte_ahorro_base, 0) as aporte_ahorro_base,
    COALESCE(m.aporte_inversion_base, 0) as aporte_inversion_base,
    m.aporte_frecuencia,

    -- Métricas de Inteligencia Globales
    COALESCE(um.promedio_ingresos_mensual, 0) as promedio_ingresos_mensual,
    COALESCE(um.promedio_gastos_mensual, 0) as promedio_gastos_mensual,
    COALESCE(um.capacidad_ahorro_mensual, 0) as capacidad_ahorro_mensual,

    -- CAPACIDAD NETA DISPONIBLE
    -- Capacidad Bruta menos la suma de (aporte ahorro + inversion) de OTRAS metas
    (COALESCE(um.capacidad_ahorro_mensual, 0) - 
    COALESCE((SELECT SUM(COALESCE(n.aporte_ahorro_mensual, 0) + COALESCE(n.aporte_inversion_mensual, 0)) 
              FROM metas_normalizadas n 
              WHERE n.user_id = m.user_id AND n.meta_id != m.id), 0)) 
    AS capacidad_neta_disponible,

    -- Planeación Global
    COALESCE(gp.total_aporte_planeado_global, 0) as total_aporte_planeado_global,
    
    -- Componentes Reales
    COALESCE(ma.total_ahorro, 0) as componente_ahorro,
    COALESCE(ma.total_inversion, 0) as componente_inversion,
    
    -- Cálculos de Estado Antiguos
    CASE 
        WHEN COALESCE(ma.monto_actual_calculado, 0) >= m.monto_objetivo THEN 'COMPLETED'
        ELSE 'ON_TRACK' 
    END as estado_calculado,
    
    -- Porcentaje
    ROUND((COALESCE(ma.monto_actual_calculado, 0) / NULLIF(m.monto_objetivo, 0)) * 100, 1) as porcentaje_progreso

FROM metas m
LEFT JOIN meta_advances ma ON m.id = ma.meta_id
LEFT JOIN user_metrics um ON m.user_id = um.user_id
LEFT JOIN metas_normalizadas mn ON m.id = mn.meta_id
LEFT JOIN global_goals_plan gp ON m.user_id = gp.user_id;
