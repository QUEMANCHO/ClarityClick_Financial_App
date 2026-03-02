import { useMemo } from 'react';
import { Debt } from '../types';
import { useCurrency } from '../../../../context/CurrencyContext';

interface DebtTableReportProps {
    debts: Debt[];
}

export default function DebtTableReport({ debts }: DebtTableReportProps) {
    const { formatCurrency } = useCurrency();

    /**
     * Calcula los meses faltantes para pagar una deuda asumiendo SOLO su pago fijo.
     * Fórmula de anualidad / amortización.
     */
    const calcularMesesFaltantes = (saldo: number, cuota: number, tasaEM: number) => {
        if (saldo <= 0) return 0;
        if (cuota <= 0) return Infinity; // Peligro matemático

        const interes = tasaEM / 100;

        // Si no hay interés, es una simple división
        if (interes === 0) {
            return Math.ceil(saldo / cuota);
        }

        // Si la cuota no alcanza ni para el interés mensual, la deuda es infinita
        if (cuota <= saldo * interes) {
            return Infinity;
        }

        // Fórmula Despejada de Nper (Número de periodos de la cuota fija)
        // N = -log(1 - (i * VA) / Pago) / log(1 + i)
        const pagos = -Math.log(1 - (interes * saldo) / cuota) / Math.log(1 + interes);

        return Math.ceil(pagos);
    };

    const tableData = useMemo(() => {
        return debts.map(debt => {
            const meses = calcularMesesFaltantes(debt.saldo_actual, debt.cuota_minima, debt.tasa_interes);
            let tiempoTexto = '';

            if (meses === Infinity) {
                tiempoTexto = '⚠️ Cuota Inválida'; // Alerta de usura
            } else if (meses === 0) {
                tiempoTexto = 'Pagado';
            } else {
                tiempoTexto = `${meses} meses`;
            }

            return {
                ...debt,
                tiempoFaltante: tiempoTexto,
                mesesNumerico: meses
            };
        });
    }, [debts]);

    if (debts.length === 0) return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl w-full mt-10 animate-slide-up">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    📋 Reporte Dinámico de Estado
                </h3>
                <span className="text-xs text-slate-400">
                    Calculando vida útil individual antes de aplicar Bola de Nieve.
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/80 text-slate-300 text-xs uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-r border-slate-700 w-1/4">Nombre de la deuda</th>
                            <th className="p-4 font-bold border-b border-r border-slate-700 w-1/4 text-right">Valor Total</th>
                            <th className="p-4 font-bold border-b border-r border-slate-700 w-1/4 text-right">Pago Mensual</th>
                            <th className="p-4 font-bold border-b border-slate-700 w-1/4 text-center">Cuotas Faltantes (Tiempo)</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {tableData.map((row, idx) => (
                            <tr
                                key={row.id}
                                className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors"
                            >
                                <td className="p-4 border-r border-slate-800/50 text-slate-100 font-medium">
                                    <span className="text-slate-500 mr-2">{idx + 1}.</span>
                                    {row.nombre}
                                </td>
                                <td className="p-4 border-r border-slate-800/50 text-slate-200 font-mono text-right">
                                    {formatCurrency(row.saldo_actual)}
                                </td>
                                <td className="p-4 border-r border-slate-800/50 text-slate-200 font-mono text-right">
                                    {formatCurrency(row.cuota_minima)}
                                </td>
                                <td className={`p-4 text-center font-bold ${row.mesesNumerico === Infinity ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {row.tiempoFaltante}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
