import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Heart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface FinancialHealthProps {
    refreshTrigger: number;
}

export default function FinancialHealth({ refreshTrigger }: FinancialHealthProps) {
    const [score, setScore] = useState(0); // 0 to 100 representing savings rate
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ ganar: 0, ahorrar: 0, invertir: 0 });

    useEffect(() => {
        const calculateHealth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('transacciones')
                .select('cantidad, pilar')
                .eq('user_id', user.id);

            if (data) {
                let g = 0, a = 0, i = 0;
                data.forEach((t: any) => {
                    if (t.pilar === 'Ganar') g += t.cantidad;
                    if (t.pilar === 'Ahorrar') a += t.cantidad;
                    if (t.pilar === 'Invertir') i += t.cantidad;
                });

                setTotals({ ganar: g, ahorrar: a, invertir: i });

                if (g > 0) {
                    const savingsRate = ((a + i) / g) * 100;
                    setScore(Math.min(savingsRate, 100)); // Cap at 100 for display logic
                } else {
                    setScore(0);
                }
            }
            setLoading(false);
        };
        calculateHealth();
    }, [refreshTrigger]);

    const getHealthStatus = (s: number) => {
        if (s >= 30) return { label: 'Excelente', color: 'text-emerald-500', bg: 'bg-emerald-100', icon: <CheckCircle size={24} />, message: '¡Estás construyendo riqueza!' };
        if (s >= 10) return { label: 'Estable', color: 'text-yellow-500', bg: 'bg-yellow-100', icon: <TrendingUp size={24} />, message: 'Vas por buen camino.' };
        return { label: 'Crítico', color: 'text-red-500', bg: 'bg-red-100', icon: <AlertTriangle size={24} />, message: 'Necesitas ahorrar más.' };
    };

    const status = getHealthStatus(score);

    if (loading) return <div className="text-center p-4">Calculando salud...</div>;

    return (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            {/* Decorative background blur */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${score >= 30 ? 'bg-emerald-500' : score >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`} />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-slate-200 dark:text-white">Salud Financiera</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-300">Tasa de Ahorro + Inversión</p>
                </div>
                <div className={`p-2 rounded-full ${status.bg} bg-opacity-20`}>
                    <Heart className={`${status.color}`} size={24} fill={score >= 30 ? "currentColor" : "none"} />
                </div>
            </div>

            <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-bold">{score.toFixed(1)}%</span>
                <span className={`text-sm font-medium mb-1 ${status.color}`}>{status.label}</span>
            </div>

            <div className="mt-4">
                <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${score >= 30 ? 'bg-emerald-500' : score >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                    />
                </div>
                <p className="text-xs text-slate-400 mt-2">{status.message}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
                <div>
                    <span className="text-slate-500 block">Ingresos Globales</span>
                    <span className="text-slate-300 font-medium">${totals.ganar.toLocaleString('es-CO')}</span>
                </div>
                <div>
                    <span className="text-slate-500 block">Ahorro + Inv.</span>
                    <span className="text-emerald-400 font-medium">+${(totals.ahorrar + totals.invertir).toLocaleString('es-CO')}</span>
                </div>
            </div>
        </div>
    );
}
