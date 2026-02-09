import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Transaction } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface FilterSummaryProps {
    transactions: Transaction[];
}

export default function FilterSummary({ transactions }: FilterSummaryProps) {
    const { formatCurrency } = useCurrency();

    const summary = useMemo(() => {
        let income = 0;
        let expenses = 0;

        transactions.forEach(t => {
            if (t.pilar === 'Ganar') {
                income += t.cantidad;
            } else if (t.pilar === 'Gastar') {
                expenses += t.cantidad;
            }
            // Note: 'Ahorrar' and 'Invertir' are excluded from this specific 'Income vs Expense' view 
            // as requested for the "Balance Neto" context in this specific component.
        });

        return {
            income,
            expenses,
            balance: income - expenses
        };
    }, [transactions]);

    // If no transactions, show 0 (or could handle 'loading' state if passed, but transactions[] usually starts empty or has data)
    // Actually, if simply 0, it renders 0.

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-fade-in">
            {/* Income */}
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">Ingresos</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(summary.income)}</p>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-full text-green-600 dark:text-green-400">
                    <TrendingUp size={20} />
                </div>
            </div>

            {/* Expenses */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Gastos</p>
                    <p className="text-xl font-bold text-red-700 dark:text-red-300">{formatCurrency(summary.expenses)}</p>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-full text-red-600 dark:text-red-400">
                    <TrendingDown size={20} />
                </div>
            </div>

            {/* Net Balance */}
            <div className={`bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl flex items-center justify-between`}>
                <div>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Balance Neto</p>
                    <p className={`text-xl font-bold ${summary.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(summary.balance)}
                    </p>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full text-blue-600 dark:text-blue-400">
                    <Scale size={20} />
                </div>
            </div>
        </div>
    );
}
