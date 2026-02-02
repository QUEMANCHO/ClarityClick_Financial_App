import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { TrendingUp, TrendingDown, PiggyBank, Briefcase } from 'lucide-react';

interface DashboardSummaryProps {
    refreshTrigger: number;
    userName?: string;
}

const MOTIVATIONAL_QUOTES = [
    "Hoy es un buen día para invertir",
    "El control financiero es el camino a la libertad",
    "Cada pequeño ahorro cuenta para tu futuro",
    "Gestiona tu energía vital con sabiduría",
    "El dinero es una herramienta, no el objetivo",
    "Invierte en ti mismo, es la mejor inversión",
    "La paciencia es clave en el crecimiento financiero"
];

export default function DashboardSummary({ refreshTrigger, userName }: DashboardSummaryProps) {
    const [totals, setTotals] = useState({
        Ganar: 0,
        Gastar: 0,
        Ahorrar: 0,
        Invertir: 0,
    });
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState('');

    useEffect(() => {
        // Set random quote only on mount to avoid unnecessary re-renders or changes
        setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    }, []);

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
        <div className="mb-8">
            <div className="mb-6 animate-fade-in">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    Hola, <span className="text-blue-600 dark:text-blue-400">{userName || 'Usuario'}</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 italic text-sm">
                    "{quote}"
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        </div>
    );
}
