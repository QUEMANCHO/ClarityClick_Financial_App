export interface Debt {
    id: string;
    user_id: string;
    nombre: string;
    saldo_actual: number;
    cuota_minima: number;
    tasa_interes: number;
    estado: 'ACTIVA' | 'PAGADA';
    created_at: string;
}

export interface SnowballProjectionData {
    meses_totales: number;
    interes_total_estimado: number;
    ahorro_tiempo_meses: number;
    fecha_libertad: Date;
    schedule: { mes: number; pago_total: number; saldo_restante: number }[];
}
