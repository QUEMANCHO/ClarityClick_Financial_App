import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, TrendingDown, PiggyBank, Briefcase } from 'lucide-react';

interface DashboardSummaryProps {
    refreshTrigger: number;
}

export default function DashboardSummary({ refreshTrigger }: DashboardSummaryProps) {
    const [totals, setTotals] = useState({
        Ganar: 0,
        Gastar: 0,
        Ahorrar: 0,
        Invertir: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTotals = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('transacciones')
                    .select('cantidad, pilar')
                    .eq('user_id', user.id);

                if (error) throw error;

                const newTotals = {
                    Ganar: 0,
                    Gastar: 0,
                    Ahorrar: 0,
                    Invertir: 0,
                };

                data.forEach((t: any) => {
                    if (newTotals[t.pilar as keyof typeof newTotals] !== undefined) {
                        newTotals[t.pilar as keyof typeof newTotals] += t.cantidad;
                    }
                });

                setTotals(newTotals);
            } catch (error) {
                console.error('Error fetching totals:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTotals();
    }, [refreshTrigger]);

    const cards = [
        { id: 'Ganar', label: 'Ingresos', icon: <TrendingUp size={24} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', amount: totals.Ganar },
        { id: 'Gastar', label: 'Gastos', icon: <TrendingDown size={24} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', amount: totals.Gastar },
        { id: 'Ahorrar', label: 'Ahorros', icon: <PiggyBank size={24} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', amount: totals.Ahorrar },
        { id: 'Invertir', label: 'Inversiones', icon: <Briefcase size={24} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', amount: totals.Invertir },
    ];

    if (loading) {
        return <div className="text-center p-4 text-slate-500">Cargando resumen...</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card) => (
                <div
                    key={card.id}
                    className={`p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 dark:bg-slate-900 transition-all duration-300 hover:shadow-md
                        ${card.id === 'Invertir' ? 'col-span-full md:col-span-1 border-emerald-100 dark:border-emerald-900/30' : ''}`}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                            {card.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {card.label}
                        </span>
                    </div>
                    <div className="mt-2">
                        <span className={`text-2xl font-bold ${card.color}`}>
                            ${card.amount.toLocaleString('es-CO')}
                        </span>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            +0% este mes
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
