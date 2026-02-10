import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Wallet, CreditCard, Landmark, Coins } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export default function AccountsSummary() {
    const [accounts, setAccounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const { formatCurrency, convertAmount, currency } = useCurrency();

    useEffect(() => {
        const fetchAccounts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('transacciones')
                // Fetch 'moneda_original'
                .select('cantidad, cuenta, pilar, moneda_original')
                .eq('user_id', user.id);

            if (data) {
                const accs: Record<string, number> = {};
                data.forEach((t: any) => {
                    if (!accs[t.cuenta]) accs[t.cuenta] = 0;

                    // Convert amount
                    const amount = convertAmount(t.cantidad, t.moneda_original || 'COP');

                    // Logic: Ganar adds to account, Others subtract?
                    if (t.pilar === 'Ganar') {
                        accs[t.cuenta] += amount;
                    } else {
                        accs[t.cuenta] -= amount;
                    }
                });
                setAccounts(accs);
            }
            setLoading(false);
        };
        fetchAccounts();
    }, [currency, convertAmount]);

    const getIcon = (name: string) => {
        if (name.includes('Efectivo')) return <Coins className="text-emerald-500" />;
        if (name.includes('Tarjeta')) return <CreditCard className="text-purple-500" />;
        if (name.includes('Nequi') || name.includes('Davi')) return <Wallet className="text-blue-500" />;
        return <Landmark className="text-slate-500" />;
    };

    if (loading) return <div className="text-center p-10 text-slate-500">Cargando cuentas...</div>;

    if (Object.keys(accounts).length === 0) {
        return (
            <div className="col-span-full py-12 px-4 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                    <Wallet className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">Aun no hay datos disponibles para mostrar</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs text-center">
                    Registra tus primeros movimientos para ver el desglose de tus cuentas aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(accounts).map(([name, balance]) => (
                <div key={name} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full">
                            {getIcon(name)}
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Saldo en</p>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase">{name}</h3>
                        </div>
                    </div>
                    <span className={`text-xl font-bold ${balance >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                        {formatCurrency(balance)}
                    </span>
                </div>
            ))}
        </div>
    );
}
