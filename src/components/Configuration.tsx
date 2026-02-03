import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, AlertTriangle, CheckCircle, Moon, Sun, LogOut, DollarSign } from 'lucide-react';
import { useCurrency, AVAILABLE_CURRENCIES } from '../context/CurrencyContext';

interface ConfigurationProps {
    onTruncateComplete: () => void;
    toggleTheme: () => void;
    currentTheme: 'light' | 'dark';
}

export default function Configuration({ onTruncateComplete, toggleTheme, currentTheme }: ConfigurationProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const { currency, setCurrency } = useCurrency();

    const handleReset = async () => {
        if (!window.confirm("¡ADVERTENCIA CRÍTICA!\n\n¿Estás seguro de que deseas ELIMINAR TODOS los registros?\n\nEsta acción no se puede deshacer. Se borrarán todos los ingresos, gastos y movimientos.")) {
            return;
        }

        if (!window.confirm("Por favor confirma una segunda vez.\n\n¿Realmente quieres borrar TODO?")) {
            return;
        }

        setLoading(true);
        setStatus('idle');

        try {
            // First, fetch all IDs to allow for a safe delete (avoiding 'delete all' restriction)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No authenticated user");

            const { data: records, error: fetchError } = await supabase
                .from('transacciones')
                .select('id')
                .eq('user_id', user.id);

            if (fetchError) throw fetchError;

            if (!records || records.length === 0) {
                setStatus('success');
                setTimeout(() => setStatus('idle'), 2000);
                return;
            }

            const idsToDelete = records.map(r => r.id);

            // Delete by ID list
            const { error: deleteError } = await supabase
                .from('transacciones')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) throw deleteError;

            setStatus('success');
            onTruncateComplete();

            // Auto hide success message after 3 seconds
            setTimeout(() => setStatus('idle'), 3000);

        } catch (error) {
            console.error('Error resetting app:', error);
            setStatus('error');
            alert("Error al reiniciar la aplicación. Por favor verifica tu conexión o permisos.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (window.confirm('¿Seguro que quieres cerrar sesión?')) {
            await supabase.auth.signOut();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Configuración del Sistema</h2>

            {/* General Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">General</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Currency Selector */}
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                                <DollarSign size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-700 dark:text-slate-200">Moneda</span>
                                <span className="text-xs text-slate-500">Divisa principal</span>
                            </div>
                        </div>
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {AVAILABLE_CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.code} - {c.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={toggleTheme}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                                {currentTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-700 dark:text-slate-200">Tema</span>
                                <span className="text-xs text-slate-500">
                                    {currentTheme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
                                </span>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group col-span-1 md:col-span-2"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 group-hover:bg-red-50 group-hover:text-red-500 dark:group-hover:bg-red-900/20 dark:group-hover:text-red-400 transition-colors">
                                <LogOut size={20} />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Cerrar Sesión</span>
                                <span className="text-xs text-slate-500">Salir de la aplicación</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-red-100 dark:border-red-900/30 overflow-hidden">
                <div className="p-6 border-b border-red-50 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <AlertTriangle size={24} />
                        <h3 className="font-bold text-lg">Zona de Peligro</h3>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl">
                        Aquí puedes reiniciar completamente la aplicación. Esta acción eliminará permanentemente todas las transacciones, restableciendo el saldo a cero. Úsalo solo si deseas comenzar desde cero.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all
                                ${loading ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:ring-4 ring-red-100 dark:ring-red-900/30'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Trash2 size={20} />
                            )}
                            {loading ? 'Borrando...' : 'Reiniciar Aplicación'}
                        </button>

                        {status === 'success' && (
                            <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2 font-medium animate-fade-in">
                                <CheckCircle size={20} />
                                <span>¡Sistema reiniciado con éxito!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
