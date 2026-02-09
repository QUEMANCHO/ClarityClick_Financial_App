-- Add multi-currency columns to transacciones table
ALTER TABLE transacciones 
ADD COLUMN moneda_original text DEFAULT 'COP',
ADD COLUMN monto_original numeric,
ADD COLUMN tasa_cambio numeric DEFAULT 1;
