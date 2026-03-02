-- Migration for Deudas (Debt Snowball Method)

-- Crear tabla de deudas
CREATE TABLE IF NOT EXISTS public.deudas (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nombre TEXT NOT NULL,
    saldo_actual NUMERIC NOT NULL CHECK (saldo_actual >= 0),
    cuota_minima NUMERIC NOT NULL CHECK (cuota_minima >= 0),
    tasa_interes NUMERIC DEFAULT 0,
    estado TEXT DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA', 'PAGADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.deudas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Crud solo para el dueño)
CREATE POLICY "Users can view their own debts" 
ON public.deudas FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debts" 
ON public.deudas FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debts" 
ON public.deudas FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debts" 
ON public.deudas FOR DELETE 
USING (auth.uid() = user_id);
