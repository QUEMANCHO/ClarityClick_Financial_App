export type CurrencyCode = 'COP' | 'USD' | 'EUR' | 'MXN';
export type PillarType = 'Ganar' | 'Gastar' | 'Ahorrar' | 'Invertir';

export interface GoalDetail {
    meta_id: number;
    meta_nombre: string;
    monto_objetivo: number;
    monto_actual: number;
    moneda: CurrencyCode;
    pilar_principal: PillarType;
    fecha_limite: string;
    user_id: string;
    estrategia_id: string;
    estrategia_nombre: string;
    porcentaje_progreso: number;
    dias_restantes: number;
    promedio_ingresos_mensual: number; // Income average (last 6 months)
    promedio_gastos_mensual: number;   // Expense average (last 6 months)
    capacidad_ahorro_mensual: number;  // Net Flow (Income - Expense)
    // Original UI Fields
    aporte_ahorro_base: number;
    aporte_inversion_base: number;
    aporte_frecuencia: 'Diario' | 'Semanal' | 'Quincenal' | 'Mensual' | 'Anual';

    // Normalized Monthly Fields
    aporte_planeado_ahorro: number;
    aporte_planeado_inversion: number;
    aporte_planeado_total: number;
    total_aporte_planeado_global: number;

    // Net Capacity
    capacidad_neta_disponible: number;
}

export type StrategyStatus = 'CRITICAL' | 'AT_RISK' | 'AGGRESSIVE_PLAN' | 'ON_TRACK' | 'OPTIMIZED';

export interface IntelligenceMatrix {
    combustible: number; // 0-100 Score: How much income power supports this goal?
    friccion: number;    // 0-100 Score: How much drag do expenses cause? (Higher is bad)
    acelerador: {
        proyeccion_actual_meses: number;
        proyeccion_optimizada_meses: number; // If we invest savings
        ahorro_tiempo_meses: number;
    };
    estado: StrategyStatus;
    recomendacion_clave: string;
    dataQualityWarning?: string; // Optional warning if data is insufficient (e.g. 0 expenses)
}

export interface ExpenseSummary {
    categoria: string;
    porcentaje_del_gasto_total: number;
}

export interface GoalContext {
    meta: {
        nombre: string;
        monto: number;
        progreso: number;
        moneda: string;
    };
    inteligencia: {
        estado: StrategyStatus;
        capacidad_neta: number;
        aporte_planeado: number;
        meses_ganados: number; // Potential
        friccion_score: number;
    };
    contexto_gastos: ExpenseSummary[];
}

export interface AdviceStep {
    orden: number;
    accion: string;
    descripcion: string;
    tipo: 'CORRECCION' | 'TACTICA' | 'ESTRATEGIA' | 'DIAGNOSTICO';
}

export interface AdviceResponse {
    titulo_estrategia: string;
    diagnostico: string;
    pasos: AdviceStep[];
    disclaimer: string;
}

export interface GoalWithIntelligence extends GoalDetail {
    intelligence: IntelligenceMatrix;
}
