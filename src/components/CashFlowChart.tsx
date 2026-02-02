import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CashFlowChartProps {
    refreshTrigger: number;
}

export default function CashFlowChart({ refreshTrigger }: CashFlowChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: transactions, error } = await supabase
                    .from('transacciones')
                    .select('cantidad, pilar, fecha')
                    .eq('user_id', user.id)
                    .order('fecha', { ascending: true });

                if (error) throw error;

                // Process data: Group by Month
                const monthlyData: { [key: string]: { name: string, Ganar: number, Gastar: number } } = {};

                transactions.forEach((t: any) => {
                    if (t.pilar === 'Ganar' || t.pilar === 'Gastar') {
                        const date = new Date(t.fecha);
                        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                        const monthName = date.toLocaleString('es-CO', { month: 'short' });

                        if (!monthlyData[monthKey]) {
                            monthlyData[monthKey] = { name: monthName, Ganar: 0, Gastar: 0 };
                        }

                        monthlyData[monthKey][t.pilar as 'Ganar' | 'Gastar'] += t.cantidad;
                    }
                });

                // Convert object to array
                const chartData = Object.values(monthlyData);
                setData(chartData);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [refreshTrigger]);

    if (loading) return <div className="text-center p-4 text-slate-400">Cargando gráfico...</div>;
    if (data.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Flujo de Caja - Mensual</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                            formatter={(value?: number) => [`$${value?.toLocaleString() ?? '0'}`, '']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend />
                        <Bar dataKey="Ganar" name="Ingresos" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Gastar" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
