import { useState, useMemo } from 'react';
import { Debt } from '../types';
import { useCurrency } from '../../../../context/CurrencyContext';
import { Zap, Activity } from 'lucide-react';

interface SnowballProjectionProps {
    debts: Debt[];
    totalMinimo: number;
}

export default function SnowballProjection({ debts, totalMinimo }: SnowballProjectionProps) {
    const { formatCurrency } = useCurrency();
    const [extraPaymentInput, setExtraPaymentInput] = useState<string>('0');

    // Parse the input handling formatted string
    const extraPayment = parseFloat(extraPaymentInput.replace(/\D/g, '')) || 0;
    const isAccelerated = extraPayment > 0;

    const calculaSnowball = (listaDeudas: Debt[], aporteAdicionalGlobal: number) => {
        // Deep copy to mutate during simulation
        const amortizacionList = listaDeudas.map(d => ({ ...d }));
        let meses = 0;
        let saldoGlobal = amortizacionList.reduce((acc, curr) => acc + curr.saldo_actual, 0);
        let rolloverExtra = 0; // Dinero liberado de cuotas mínimas pagadas sumado al extra global

        while (saldoGlobal > 0 && meses < 360) { // Safety cap de 30 años
            meses++;
            let pagoRealizadoEnEsteMes_ParaAdicional = aporteAdicionalGlobal + rolloverExtra;

            for (let i = 0; i < amortizacionList.length; i++) {
                const deuda = amortizacionList[i];
                if (deuda.saldo_actual <= 0) continue; // Ya se pagó

                // 1. Cargo de intereses (Tasa Efectiva Mensual directa)
                const interesMensual = deuda.tasa_interes / 100;
                const cargoInteres = deuda.saldo_actual * interesMensual;
                deuda.saldo_actual += cargoInteres;

                // 2. Aplicar cuota mínima
                const pago = Math.min(deuda.cuota_minima, deuda.saldo_actual);
                deuda.saldo_actual -= pago;

                // 3. Aplicar pago acelerado si es la deuda actual en la "Bola de Nieve"
                // El dinero fluye de la deuda 0 (hasta que muera) hacia la deuda 1, 2...
                if (pagoRealizadoEnEsteMes_ParaAdicional > 0 && deuda.saldo_actual > 0) {
                    const extraApp = Math.min(pagoRealizadoEnEsteMes_ParaAdicional, deuda.saldo_actual);
                    deuda.saldo_actual -= extraApp;
                    pagoRealizadoEnEsteMes_ParaAdicional -= extraApp;
                }

                // 4. ¿Murió la deuda este mes? Recolecta su cuota mínima permanente para el rollover a futuro
                if (deuda.saldo_actual <= 0) {
                    // La cuota mínima de esta deuda ahora es "dinero libre" que se suma a la bola de nieve
                    rolloverExtra += deuda.cuota_minima;
                }
            }

            // Recalcular saldo global de paridad
            saldoGlobal = amortizacionList.reduce((acc, curr) => acc + curr.saldo_actual, 0);
        }

        return meses;
    };

    // Calculate Traditional Time (Only paying minimums)
    const mesesTradicionales = useMemo(() => calculaSnowball(debts, 0), [debts]);
    // Calculate Snowball Time (Minimums + Extra Input + Rollovers)
    const mesesAcelerados = useMemo(() => calculaSnowball(debts, extraPayment), [debts, extraPayment]);

    const mesesAhorrados = mesesTradicionales - mesesAcelerados;
    const currentDate = new Date();

    const freedomDate = new Date(currentDate.setMonth(currentDate.getMonth() + mesesAcelerados));
    const isFinished = debts.length === 0;

    const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setExtraPaymentInput(e.target.value.replace(/\D/g, ''));
    };

    const formatDisplay = (val: string) => {
        const num = parseFloat(val.replace(/\D/g, ''));
        return isNaN(num) ? '' : new Intl.NumberFormat('es-CO').format(num);
    };

    if (isFinished) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6">
                <Activity className="text-blue-500" /> Simulador Bola de Nieve Predictivo
            </h3>

            {/* Injection Zone (Combustible Extra) */}
            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 mb-8 max-w-sm">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Comodín: Aporte Mensual Extra ($)</label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={formatDisplay(extraPaymentInput)}
                        onChange={handleExtraChange}
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-900 dark:text-white transition-all shadow-inner"
                        placeholder="Ej: 250000"
                    />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    Este dinero se atacará directo al balance de tu deuda más pequeña. Cuando esa muera, este extra + la cuota de la deuda muerta atacarán a la siguiente.
                </p>
            </div>

            {/* Results Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Tradicional Metric */}
                <div className="bg-white dark:bg-slate-900 p-5 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ruta Lenta (Solo Mínimo)</span>
                    <span className="text-3xl font-black text-slate-700 dark:text-slate-300">
                        {mesesTradicionales} <span className="text-base font-medium text-slate-400">Meses</span>
                    </span>
                    <span className="text-[10px] text-slate-500 mt-2">Pagando {formatCurrency(totalMinimo)} fijo.</span>
                </div>

                {/* Snowball Metric */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 border border-blue-200 dark:border-blue-800/50 rounded-2xl flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Ruta Acelerada (Enfoque)</span>
                    <span className="text-4xl font-black text-slate-900 dark:text-white">
                        {mesesAcelerados} <span className="text-base font-medium text-blue-500">Meses</span>
                    </span>
                    <span className="text-[10px] text-blue-800/60 dark:text-blue-300/60 font-bold mt-2">
                        {isAccelerated
                            ? `Atacando con ${formatCurrency(totalMinimo + extraPayment)}/m`
                            : 'Asignando tu sobrante a una única deuda'}
                    </span>
                </div>

                {/* Impact Metric */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-400 p-5 border border-transparent rounded-2xl flex flex-col justify-center text-white shadow-lg shadow-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Zap size={14} className="fill-emerald-200" /> Tiempo Ahorrado
                    </span>
                    <span className="text-4xl font-black">
                        {mesesAhorrados} <span className="text-base font-medium opacity-80">Meses</span>
                    </span>
                    <span className="text-sm font-bold opacity-90 mt-2 border-t border-emerald-400/50 pt-2 shrink-0">
                        Libertad: {freedomDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })} 🎉
                    </span>
                </div>

            </div>

        </div>
    );
}
