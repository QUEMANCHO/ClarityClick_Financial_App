import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useCurrency } from '../context/CurrencyContext';

interface ExpensesPieChartProps {
    refreshTrigger: number;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'];

export default function ExpensesPieChart({ refreshTrigger }: ExpensesPieChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false); // Add mounted state
    const { formatCurrency, convertAmount, currency } = useCurrency();

    // Set mounted on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: transactions, error } = await supabase
                    .from('transacciones')
                    // Fetch 'moneda_original' so we can convert properly
                    .select('cantidad, categoria, pilar, moneda_original')
                    .eq('user_id', user.id);

                if (error) throw error;

                // Process data: Group by Category for 'Gastar'
                const categoryData: { [key: string]: number } = {};

                transactions.forEach((t: any) => {
                    if (t.pilar === 'Gastar') {
                        const cat = t.categoria || 'Otros'; // Fallback if null
                        if (!categoryData[cat]) categoryData[cat] = 0;

                        // Convert amount to current selected currency
                        // If t.moneda_original is missing, fallback to 'COP'
                        const amount = convertAmount(t.cantidad, t.moneda_original || 'COP');
                        categoryData[cat] += amount;
                    }
                });

                // Convert to array
                const chartData = Object.keys(categoryData).map((cat) => ({
                    name: cat,
                    value: categoryData[cat]
                }));

                setData(chartData);
            } catch (error) {
                console.error('Error fetching expense data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, [refreshTrigger, currency, convertAmount]);

    if (loading) return <div className="h-[350px] w-full flex items-center justify-center text-slate-400">Cargando gráfico...</div>;

    // Safety check - strictly requested
    if (!data || data.length === 0) return null;

    if (!isMounted) return <div className="h-[300px] w-full" />;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-6 flex flex-col w-full">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Análisis de Gastos</h3>
            <div className="h-[350px] w-full" style={{ minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number | undefined) => [value !== undefined ? formatCurrency(value) : '$0', '']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
