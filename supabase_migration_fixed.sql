-- Add multi-currency columns safely (will not fail if they already exist)
ALTER TABLE transacciones
ADD COLUMN IF NOT EXISTS moneda_original text DEFAULT 'COP',
ADD COLUMN IF NOT EXISTS monto_original numeric,
ADD COLUMN IF NOT EXISTS tasa_cambio numeric DEFAULT 1;
