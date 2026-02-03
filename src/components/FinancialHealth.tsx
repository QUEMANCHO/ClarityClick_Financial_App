import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Heart, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface FinancialHealthProps {
    refreshTrigger: number;
}

export default function FinancialHealth({ refreshTrigger }: FinancialHealthProps) {
    const [score, setScore] = useState(0); // 0 to 100 representing savings rate
    const [loading, setLoading] = useState(true);
    const [totals, setTotals] = useState({ ganar: 0, ahorrar: 0, invertir: 0 });
    const { formatCurrency } = useCurrency();

    // Ref to track if component is mounted
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        const calculateHealth = async () => {
            // Only proceed if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                if (isMounted.current) setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('transacciones')
                .select('cantidad, pilar')
                .eq('user_id', user.id);

            if (error) {
                console.error('FinancialHealth: Error fetching data', error);
                if (isMounted.current) setLoading(false);
                return;
            }

            if (data && isMounted.current) {
                let ingresos = 0, gastos = 0, ahorro = 0, inversion = 0;

                data.forEach((t: any) => {
                    // Safe parsing just in case, though TS ensures types usually
                    const val = Number(t.cantidad) || 0;
                    if (t.pilar === 'Ganar') ingresos += val;
                    if (t.pilar === 'Gastar') gastos += val;
                    if (t.pilar === 'Ahorrar') ahorro += val;
                    if (t.pilar === 'Invertir') inversion += val;
                });

                setTotals({ ganar: ingresos, ahorrar: ahorro, invertir: inversion });

                if (ingresos > 0) {
                    // Formula: (Ahorro + Inversión) / (Ingresos) * 100
                    const savingsRate = ((ahorro + inversion) / ingresos) * 100;
                    // Ensure not NaN and finite
                    if (Number.isFinite(savingsRate)) {
                        setScore(Math.min(savingsRate, 100));
                    } else {
                        setScore(0);
                    }
                } else {
                    // Avoid division by zero
                    setScore(0);
                }
            }

            if (isMounted.current) setLoading(false);
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
                    <span className="text-slate-300 font-medium">{formatCurrency(totals.ganar)}</span>
                </div>
                <div>
                    <span className="text-slate-500 block">Ahorro + Inv.</span>
                    <span className="text-emerald-400 font-medium">+{formatCurrency(totals.ahorrar + totals.invertir)}</span>
                </div>
            </div>
        </div>
    );
}
