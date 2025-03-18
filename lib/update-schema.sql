-- Actualizar la tabla presupuestos para agregar las columnas faltantes
ALTER TABLE presupuestos 
ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL AFTER cliente_id,
ADD COLUMN iva_monto DECIMAL(10, 2) DEFAULT 0 AFTER subtotal,
ADD COLUMN iva_porcentaje VARCHAR(10) NOT NULL AFTER total;

-- Actualizar los registros existentes
UPDATE presupuestos SET 
subtotal = total,
iva_porcentaje = '0%'
WHERE subtotal IS NULL OR iva_porcentaje IS NULL;

