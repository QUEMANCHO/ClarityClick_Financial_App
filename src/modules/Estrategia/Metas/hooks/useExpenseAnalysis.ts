import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';

export interface ExpenseCategory {
    categoria: string;
    total: number;
    porcentaje: number;
}

export const useExpenseAnalysis = () => {
    const [topExpenses, setTopExpenses] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch expenses (Gastar) from last 6 months
                const { data, error } = await supabase
                    .from('transacciones')
                    .select('cantidad, categoria, tasa_cambio, monto_original, moneda_original')
                    .eq('user_id', user.id)
                    .eq('pilar', 'Gastar')
                    .gte('fecha', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString());

                if (error) throw error;

                if (!data || data.length === 0) {
                    setTopExpenses([]);
                    return;
                }

                // Process Data: Agnostic Currency Normalization could be complex. 
                // For simplicity in this advice context, we sum raw amounts if same currency, 
                // or assume visual significance is enough.
                // BETTER: Group by Category and Sum normalized amount (COP equivalent is safest for sorting).

                const categoryMap: Record<string, number> = {};
                let totalExpenses = 0;

                data.forEach((tx: any) => {
                    // Use 'cantidad' which is supposedly the COP equivalent or base currency value stored
                    const amount = tx.cantidad || 0;
                    const cat = tx.categoria || 'Sin Categoría';

                    categoryMap[cat] = (categoryMap[cat] || 0) + amount;
                    totalExpenses += amount;
                });

                // Convert to array and sort
                const sortedCategories = Object.entries(categoryMap)
                    .map(([cat, amount]) => ({
                        categoria: cat,
                        total: amount,
                        porcentaje: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
                    }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 3); // Top 3 only

                setTopExpenses(sortedCategories);

            } catch (err) {
                console.error("Error analyzing expenses:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, []);

    return { topExpenses, loading };
};
