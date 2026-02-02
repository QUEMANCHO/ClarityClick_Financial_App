import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Wallet, CreditCard, Landmark, Coins } from 'lucide-react';

export default function AccountsSummary() {
    const [accounts, setAccounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('transacciones')
                .select('cantidad, cuenta, pilar')
                .eq('user_id', user.id);

            if (data) {
                const accs: Record<string, number> = {};
                data.forEach((t: any) => {
                    if (!accs[t.cuenta]) accs[t.cuenta] = 0;
                    // Logic: Ganar adds to account, Gastar subtracts?, Ahorrar?, Invertir?
                    // For now, let's assume simple inflow/outflow logic or just sum by account if they are buckets.
                    // Usually: Ganar = Inflow (+), Gastar = Outflow (-). 
                    // Ahorrar/Invertir might be transfers or outflows depending on the model.
                    // Given the simplicity, let's assume 'Ganar' adds, others subtract from the account balance?
                    // Or maybe the user just wants to see activity totals?
                    // "Muestra el desglose por 'Efectivo', 'Bancolombia', etc."
                    // I will assume simple summation for now but usually expense subtracts.
                    // However, to keep it simple and safe (avoiding negative numbers if not tracked correctly), 
                    // I will calculate NET balance: (Ganar) - (Gastar + Ahorrar + Invertir).
                    // Wait, Ahorrar/Invertir are usually assets moving to another place, but here 'Cuenta' is likely the Payment Method / Source.
                    // So: Ganar (Into Account) - Gastar (From Account) - Ahorrar (From Account) - Invertir (From Account).

                    if (t.pilar === 'Ganar') {
                        accs[t.cuenta] += t.cantidad;
                    } else {
                        accs[t.cuenta] -= t.cantidad;
                    }
                });
                setAccounts(accs);
            }
            setLoading(false);
        };
        fetchAccounts();
    }, []);

    const getIcon = (name: string) => {
        if (name.includes('Efectivo')) return <Coins className="text-emerald-500" />;
        if (name.includes('Tarjeta')) return <CreditCard className="text-purple-500" />;
        if (name.includes('Nequi') || name.includes('Davi')) return <Wallet className="text-blue-500" />;
        return <Landmark className="text-slate-500" />;
    };

    if (loading) return <div className="text-center p-10 text-slate-500">Cargando cuentas...</div>;

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
                        ${balance.toLocaleString('es-CO')}
                    </span>
                </div>
            ))}
        </div>
    );
}
