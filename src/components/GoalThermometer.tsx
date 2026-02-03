import React, { useEffect, useState } from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface GoalThermometerProps {
    current: number;
    target: number;
    label?: string;
}

export const GoalThermometer: React.FC<GoalThermometerProps> = ({ current, target, label = 'Progreso' }) => {
    const { formatCurrency } = useCurrency();
    const [animatedPercent, setAnimatedPercent] = useState(0);

    const safeTarget = target > 0 ? target : 1;
    const rawPercent = (current / safeTarget) * 100;
    const percent = Math.min(100, Math.max(0, rawPercent));

    useEffect(() => {
        // Trigger animation after mount
        const timer = setTimeout(() => {
            setAnimatedPercent(percent);
        }, 100);
        return () => clearTimeout(timer);
    }, [percent]);

    // Color logic
    let progressColor = 'bg-red-500';
    if (percent > 30) progressColor = 'bg-yellow-500';
    if (percent > 70) progressColor = 'bg-emerald-500';

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Target size={16} className="text-blue-500" />
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                            {label}
                        </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">
                            {formatCurrency(current)}
                        </span>
                        <span className="text-sm text-slate-400">
                            / {formatCurrency(target)}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                        {percent.toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Bar Track */}
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative">
                {/* Animated Fill */}
                <div
                    className={`h-full ${progressColor} transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)] relative`}
                    style={{ width: `${animatedPercent}%` }}
                >
                    {/* Shine/Gloss effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                </div>
            </div>

            {percent >= 100 && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg animate-fade-in">
                    <CheckCircle2 size={18} />
                    ¡Meta Completada!
                </div>
            )}
        </div>
    );
};
