export interface Transaction {
    id: number;
    fecha: string;
    descripcion: string;
    cantidad: number;
    pilar: 'Ganar' | 'Gastar' | 'Ahorrar' | 'Invertir' | string;
    cuenta: string;
    categoria: string;
    tag?: string;
    moneda_original?: string;
    monto_original?: number;
    tasa_cambio?: number;
    user_id?: string;
}

export interface USER_PROFILE {
    id: string;
    email: string;
    full_name?: string;
    onboarding_completed: boolean;
    currency?: string;
}
