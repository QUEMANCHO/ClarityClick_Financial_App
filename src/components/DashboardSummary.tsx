import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, TrendingDown, PiggyBank, Briefcase } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface DashboardSummaryProps {
    refreshTrigger: number;
    onPillarClick?: (pillar: string) => void;
}

export default function DashboardSummary({ refreshTrigger, onPillarClick }: DashboardSummaryProps) {
    // Need to fetch original currency info to convert properly
    const [transactionsData, setTransactionsData] = useState<{ pilar: string; cantidad: number; moneda_original?: string; monto_original?: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency, convertAmount } = useCurrency();

    useEffect(() => {
        const fetchTotals = async () => {
            try {
                // setLoading(true); 

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Optimización: Solo traemos las columnas necesarias
                const { data, error } = await supabase
                    .from('transacciones')
                    // Include original currency fields
                    .select('cantidad, pilar, moneda_original, monto_original')
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

    // Memoización: Calculamos los totales solo cuando transactionsData cambia OR currency context changes (implicitly by re-render, 
    // but convertAmount uses current rates, so we might need to depend on rates/currency if we want to ensure reactivity)
    const totals = useMemo(() => {
        const newTotals = {
            Ganar: 0,
            Gastar: 0,
            Ahorrar: 0,
            Invertir: 0,
        };

        transactionsData.forEach((t) => {
            if (newTotals[t.pilar as keyof typeof newTotals] !== undefined) {
                // Convert each transaction amount to the CURRENT display currency
                const originalAmount = t.monto_original || t.cantidad;
                const originalCurrency = t.moneda_original || 'COP'; // Default if missing

                const convertedAmount = convertAmount(originalAmount, originalCurrency);

                newTotals[t.pilar as keyof typeof newTotals] += convertedAmount;
            }
        });

        return newTotals;
        // We need to re-calc when transactions change OR when the conversion function changes (which depends on selected currency/rates)
    }, [transactionsData, convertAmount]);

    const cards = [
        { id: 'Ganar', label: 'Ingresos', icon: <TrendingUp size={24} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', amount: totals.Ganar },
        { id: 'Gastar', label: 'Gastos', icon: <TrendingDown size={24} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', amount: totals.Gastar },
        { id: 'Ahorrar', label: 'Ahorros', icon: <PiggyBank size={24} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', amount: totals.Ahorrar },
        { id: 'Invertir', label: 'Inversiones', icon: <Briefcase size={24} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', amount: totals.Invertir },
    ];

    if (loading) {
        return (
            <div className="mb-0">
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
            </div>
        );
    }

    return (
        <div className="mb-0">
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
        </div>
    );
}
