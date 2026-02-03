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
    const { formatCurrency } = useCurrency();

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: transactions, error } = await supabase
                    .from('transacciones')
                    .select('cantidad, categoria, pilar')
                    .eq('user_id', user.id);

                if (error) throw error;

                // Process data: Group by Category for 'Gastar'
                const categoryData: { [key: string]: number } = {};

                transactions.forEach((t: any) => {
                    if (t.pilar === 'Gastar') {
                        const cat = t.categoria || 'Otros'; // Fallback if null
                        if (!categoryData[cat]) categoryData[cat] = 0;
                        categoryData[cat] += t.cantidad;
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
    }, [refreshTrigger]);

    if (loading) return null;
    if (data.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Análisis de Gastos</h3>
            <div className="h-64 w-full">
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
