import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, TrendingDown, PiggyBank, Briefcase, Activity, Info } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface DashboardSummaryProps {
    refreshTrigger: number;
    onPillarClick?: (pillar: string) => void;
}

export default function DashboardSummary({ refreshTrigger, onPillarClick }: DashboardSummaryProps) {
    // Need to fetch original currency info to convert properly + dates + ia exclusion flag
    const [transactionsData, setTransactionsData] = useState<{ pilar: string; cantidad: number; fecha?: string; excluir_de_ia?: boolean; moneda_original?: string; monto_original?: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency, convertAmount } = useCurrency();

    useEffect(() => {
        const fetchTotals = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Optimización: Solo traemos las columnas necesarias
                const { data, error } = await supabase
                    .from('transacciones')
                    // Include original currency fields + intel metrics fields
                    .select('cantidad, pilar, moneda_original, monto_original, fecha, excluir_de_ia')
                    .eq('user_id', user.id);

                if (error) throw error;
                if (data) setTransactionsData(data);

            } catch (error) {
                console.error('Error fetching totals:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTotals();
    }, [refreshTrigger]);

    // Memoización: Calculamos los totales solo cuando transactionsData cambia OR currency context changes
    const totals = useMemo(() => {
        const newTotals = {
            Ganar: 0,
            Gastar: 0,
            Ahorrar: 0,
            Invertir: 0,
        };

        let effectiveGanar = 0;
        let effectiveGastar = 0;
        const activeMonths = new Set<string>();

        transactionsData.forEach((t) => {
            const amountInCOP = t.cantidad;
            const convertedAmount = convertAmount(amountInCOP, 'COP');

            // 1. Gross Historical Totals
            if (newTotals[t.pilar as keyof typeof newTotals] !== undefined) {
                newTotals[t.pilar as keyof typeof newTotals] += convertedAmount;
            }

            // 2. Smart Average Capacity
            if (t.fecha) activeMonths.add(t.fecha.substring(0, 7)); // Count unique YYYY-MM
            if (t.pilar === 'Ganar' && !t.excluir_de_ia) {
                effectiveGanar += convertedAmount;
            }
            if (t.pilar === 'Gastar') {
                effectiveGastar += convertedAmount;
            }
        });

        const monthsCount = Math.max(activeMonths.size, 1);
        const avgNetCapacity = (effectiveGanar - effectiveGastar) / monthsCount;

        return { ...newTotals, monthsCount, avgNetCapacity };
    }, [transactionsData, convertAmount]);

    const cards = [
        { id: 'Ganar', label: 'Ingresos Históricos', icon: <TrendingUp size={24} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', amount: totals.Ganar },
        { id: 'Gastar', label: 'Gastos Históricos', icon: <TrendingDown size={24} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', amount: totals.Gastar },
        { id: 'Ahorrar', label: 'Ahorros', icon: <PiggyBank size={24} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', amount: totals.Ahorrar },
        { id: 'Invertir', label: 'Inversiones', icon: <Briefcase size={24} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', amount: totals.Invertir },
    ];

    if (loading) {
        return (
            <div className="mb-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            </div>
                            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                            <div className="h-3 w-16 mt-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
                <div className="w-full h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="mb-0 space-y-4">
            {/* Pilares Clásicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        onClick={() => onPillarClick?.(card.id)}
                        className={`p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group bg-white
                            ${card.id === 'Invertir' ? 'col-span-full sm:col-span-1 border-emerald-100 dark:border-emerald-900/30' : ''}`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color} transition-transform group-hover:scale-110`}>
                                {card.icon}
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {card.label}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className={`text-2xl font-bold ${card.color}`}>
                                {formatCurrency(card.amount)}
                            </span>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                                Ver detalles
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Smart Banner: Net Average Capacity */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-100/50 dark:border-indigo-500/20 rounded-2xl p-5 md:p-6 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute -right-6 -bottom-10 md:-right-10 md:-top-10 text-indigo-500/5 dark:text-indigo-500/10 transform rotate-12 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
                    <Activity size={180} strokeWidth={1} />
                </div>

                <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
                    {/* Left: Metric Data */}
                    <div className="flex items-start md:items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl hidden sm:block shrink-0">
                            <Activity size={28} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                Capacidad Neta Libre
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                <span className={`text-3xl font-black tracking-tight ${totals.avgNetCapacity >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                    {formatCurrency(totals.avgNetCapacity)}
                                </span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 sm:mt-0">promedio mensual</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Explanatory Box (Mini-Advisor) */}
                    <div className="bg-white/80 dark:bg-slate-900/60 border border-indigo-500/10 dark:border-slate-700/50 backdrop-blur-sm rounded-xl p-4 xl:max-w-xl w-full flex items-start sm:items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="mt-0.5 sm:mt-0 shrink-0">
                            <Info className="text-indigo-500 dark:text-indigo-400" size={20} />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed md:leading-normal">
                            Basado en <strong>{totals.monthsCount} mes{totals.monthsCount !== 1 ? 'es' : ''}</strong> constantes. Este es tu sobrante (o déficit) mensual libre. Es la métrica clave para saber cuánto puedes asignar a nuevas <strong className="font-semibold text-slate-800 dark:text-slate-200">metas o deudas</strong> a largo plazo sin asfixiar tu bienestar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
