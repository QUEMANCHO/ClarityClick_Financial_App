import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react';

export default function CompoundInterestCalculator() {
    // State for inputs
    const [initialAmount, setInitialAmount] = useState(1000000); // 1M COP default
    const [monthlyContribution, setMonthlyContribution] = useState(200000);
    const [interestRate, setInterestRate] = useState(10); // 10% E.A.
    const [years, setYears] = useState(10);

    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalInvested: 0, totalInterest: 0, finalBalance: 0 });

    useEffect(() => {
        calculateCompoundInterest();
    }, [initialAmount, monthlyContribution, interestRate, years]);

    const calculateCompoundInterest = () => {
        const resultData = [];
        let balance = initialAmount;
        let totalInvested = initialAmount;
        const monthlyRate = interestRate / 100 / 12;

        for (let i = 0; i <= years; i++) {
            // Push yearly snapshot
            resultData.push({
                year: `Año ${i}`,
                invested: Math.round(totalInvested),
                interest: Math.round(balance - totalInvested),
                balance: Math.round(balance)
            });

            // Calculate next year's growth (12 months)
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
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
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
                                type="number"
                                className="w-full p-3 pl-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700 dark:text-white"
                                value={initialAmount}
                                onChange={(e) => setInitialAmount(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-500 mb-2">Aporte Mensual</label>
                        <div className="relative">
                            <PlusCircleIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
                            <input
                                type="number"
                                className="w-full p-3 pl-10 bg-slate-50 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-2">Tasa E.A (%)</label>
                            <div className="relative">
                                <Percent size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    className="w-full p-3 pl-9 bg-slate-50 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700"
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-2">Años</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-3.5 text-slate-400" />
                                <input
                                    type="number"
                                    className="w-full p-3 pl-9 bg-slate-50 rounded-xl border border-transparent focus:border-emerald-500 outline-none font-bold text-slate-700"
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
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">Total Invertido</p>
                            <p className="text-lg font-bold text-slate-700">${summary.totalInvested.toLocaleString()}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-xs text-emerald-600 mb-1">Intereses Ganados</p>
                            <p className="text-lg font-bold text-emerald-600">+${summary.totalInterest.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-xl text-white shadow-md">
                            <p className="text-xs text-slate-400 mb-1">Saldo Final</p>
                            <p className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                ${summary.finalBalance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-80">
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
                </div>
            </div>
        </div>
    );
}

// Icon helper
const PlusCircleIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>
);
