import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function CompoundInterestCalculator() {
    const { currency, formatCurrency } = useCurrency();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    // Helper formatting logic (duplicated for speed/stability, or import if preferred)
    const getSeparators = (curr: string) => {
        if (['USD', 'MXN'].includes(curr)) return { group: ',', decimal: '.' };
        return { group: '.', decimal: ',' };
    };

    const formatNumber = (value: string, curr: string) => {
        if (!value) return '';
        const { group, decimal } = getSeparators(curr);
        let raw = value.split(group).join('');
        const parts = raw.split(decimal);
        let integerPart = parts[0].replace(/\D/g, '');
        let decimalPart = parts.length > 1 ? parts[1].replace(/\D/g, '') : null;
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
        if (decimalPart !== null) return `${formattedInteger}${decimal}${decimalPart}`;
        return formattedInteger;
    };

    const parseToNumber = (displayValue: string, curr: string): number => {
        if (!displayValue) return 0;
        const { group, decimal } = getSeparators(curr);
        let raw = displayValue.split(group).join('');
        raw = raw.replace(decimal, '.');
        return parseFloat(raw);
    };

    // State for inputs (Stored as string for display)
    const [initialAmountStr, setInitialAmountStr] = useState('');
    const [monthlyContributionStr, setMonthlyContributionStr] = useState('');
    const [interestRate, setInterestRate] = useState(10); // 10% E.A.
    const [years, setYears] = useState(10);

    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalInvested: 0, totalInterest: 0, finalBalance: 0 });

    // Initialize defaults on mount once
    useEffect(() => {
        setInitialAmountStr(formatNumber('1000000', currency));
        setMonthlyContributionStr(formatNumber('200000', currency));
    }, []); // Run once (or when currency changes? If currency changes, reformat?)

    // Re-format if currency changes (optional but good)
    useEffect(() => {
        // Automatically update strings if currency context changes
        setInitialAmountStr(formatNumber(initialAmountStr, currency));
        setMonthlyContributionStr(formatNumber(monthlyContributionStr, currency));
    }, [currency]);

    useEffect(() => {
        calculateCompoundInterest();
    }, [initialAmountStr, monthlyContributionStr, interestRate, years, currency]); // Recalculate when strings change

    const handleAmountChange = (val: string, setter: (v: string) => void) => {
        if (val === '') {
            setter('');
            return;
        }
        const { group, decimal } = getSeparators(currency);
        const lastChar = val.slice(-1);
        if (/[0-9]/.test(lastChar) || lastChar === decimal || lastChar === group) {
            setter(formatNumber(val, currency));
        }
    };

    const calculateCompoundInterest = () => {
        const initialAmount = parseToNumber(initialAmountStr, currency);
        const monthlyContribution = parseToNumber(monthlyContributionStr, currency);

        const resultData = [];
        let balance = initialAmount;
        let totalInvested = initialAmount;
        const monthlyRate = interestRate / 100 / 12;

        for (let i = 0; i <= years; i++) {
            resultData.push({
                year: `Año ${i}`,
                invested: Math.round(totalInvested),
                interest: Math.round(balance - totalInvested),
                balance: Math.round(balance)
            });

            if (i < years) {
                for (let m = 0; m < 12; m++) {
                    balance = (balance + monthlyContribution) * (1 + monthlyRate);
                    totalInvested += monthlyContribution;
                }
            }
        }

        setData(resultData);
        setSummary({
            totalInvested: Math.round(totalInvested),
            totalInterest: Math.round(balance - totalInvested),
            finalBalance: Math.round(balance)
        });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-emerald-500" /> Simulador de Interés Compuesto
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Inputs Panel */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 space-y-6 h-fit transition-colors">
                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Inversión Inicial</label>
                        <div className="relative">
                            <DollarSign size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                inputMode="decimal"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700 dark:text-white"
                                value={initialAmountStr}
                                onChange={(e) => handleAmountChange(e.target.value, setInitialAmountStr)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Aporte Mensual</label>
                        <div className="relative">
                            <PlusCircleIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                inputMode="decimal"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700 dark:text-white"
                                value={monthlyContributionStr}
                                onChange={(e) => handleAmountChange(e.target.value, setMonthlyContributionStr)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Tasa E.A (%)</label>
                            <div className="relative">
                                <Percent size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    className="w-full p-3 pl-9 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700 dark:text-white"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Años</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    className="w-full p-3 pl-9 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700 dark:text-white"
                                    value={years}
                                    onChange={(e) => setYears(Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart and Results Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Invertido</p>
                            <p className="text-lg font-bold text-slate-700 dark:text-white">{formatCurrency(summary.totalInvested)}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Intereses Ganados</p>
                            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(summary.totalInterest)}</p>
                        </div>
                        <div className="bg-slate-900 dark:bg-black p-4 rounded-xl text-white shadow-md">
                            <p className="text-xs text-slate-400 mb-1">Saldo Final</p>
                            <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                {formatCurrency(summary.finalBalance)}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 w-full">
                        {(!data || data.length === 0) ? null : (!isMounted ? <div className="h-[300px] w-full" /> : (
                            <div className="h-[350px] w-full" style={{ minWidth: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="year" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis
                                            tickFormatter={(val) => `$${val / 1000000}M`}
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            formatter={(value: any) => [`$${value?.toLocaleString() ?? '0'}`, '']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="balance"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorInterest)"
                                            name="Saldo Total"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="invested"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorInvested)"
                                            name="Capital Invertido"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon helper
const PlusCircleIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
);
