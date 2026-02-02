import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfigurationProps {
    onTruncateComplete: () => void;
}

export default function Configuration({ onTruncateComplete }: ConfigurationProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

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
            if (!user) throw new Error("No authentitcated user");

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

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h2>

            <div className="bg-white rounded-xl shadow-lg border border-red-100 overflow-hidden">
                <div className="p-6 border-b border-red-50 bg-red-50/50">
                    <div className="flex items-center gap-3 text-red-600">
                        <AlertTriangle size={24} />
                        <h3 className="font-bold text-lg">Zona de Peligro</h3>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-slate-600 mb-6 max-w-2xl">
                        Aquí puedes reiniciar completamente la aplicación. Esta acción eliminará permanentemente todas las transacciones, restableciendo el saldo a cero. Úsalo solo si deseas comenzar desde cero.
                    </p>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all
                                ${loading ? 'bg-slate-400' : 'bg-red-600 hover:bg-red-700 hover:shadow-lg hover:ring-4 ring-red-100'}`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Trash2 size={20} />
                            )}
                            {loading ? 'Borrando...' : 'Reiniciar Aplicación'}
                        </button>

                        {status === 'success' && (
                            <div className="text-emerald-600 flex items-center gap-2 font-medium animate-fade-in">
                                <CheckCircle size={20} />
                                <span>¡Sistema reiniciado con éxito!</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Future settings placeholders could go here */}
            <div className="bg-white rounded-xl shadow border border-slate-100 p-6 opacity-50 pointer-events-none grayscale">
                <h3 className="font-bold text-slate-700 mb-2">Preferencias (Próximamente)</h3>
                <p className="text-sm text-slate-500">Opciones de moneda, temas y exportación de datos.</p>
            </div>
        </div>
    );
}
