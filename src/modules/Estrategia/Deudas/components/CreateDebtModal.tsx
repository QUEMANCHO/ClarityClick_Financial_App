import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { Coins, X, Save, AlertTriangle } from 'lucide-react';
import { Debt } from '../types';

interface CreateDebtModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    debtToEdit?: Debt | null;
}

export default function CreateDebtModal({ isOpen, onClose, onSuccess, debtToEdit }: CreateDebtModalProps) {
    const [nombre, setNombre] = useState(debtToEdit?.nombre || '');
    const [saldoActual, setSaldoActual] = useState(debtToEdit?.saldo_actual.toString() || '');
    const [cuotaMinima, setCuotaMinima] = useState(debtToEdit?.cuota_minima.toString() || '');
    const [tasaInteres, setTasaInteres] = useState(debtToEdit?.tasa_interes.toString() || '');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Pre-fill fields when modal opens for editing
    useEffect(() => {
        if (debtToEdit && isOpen) {
            setNombre(debtToEdit.nombre);
            setSaldoActual(debtToEdit.saldo_actual.toString());
            setCuotaMinima(debtToEdit.cuota_minima.toString());
            setTasaInteres(debtToEdit.tasa_interes.toString());
            setErrorMsg('');
        } else if (!debtToEdit && isOpen) {
            // Reset Form if it's new
            setNombre('');
            setSaldoActual('');
            setCuotaMinima('');
            setTasaInteres('');
            setErrorMsg('');
        }
    }, [debtToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No usuario autenticado');

            const parseNum = (val: string) => parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
            const saldo = parseNum(saldoActual);
            const minima = parseNum(cuotaMinima);

            if (saldo <= 0 || minima <= 0) {
                throw new Error('El saldo y la cuota mínima deben ser mayores a cero.');
            }

            const debtData = {
                user_id: user.id,
                nombre: nombre.trim(),
                saldo_actual: saldo,
                cuota_minima: minima,
                tasa_interes: parseNum(tasaInteres)
            };

            if (debtToEdit) {
                // Modo Edición
                const { error } = await supabase.from('deudas').update(debtData).eq('id', debtToEdit.id);
                if (error) throw error;
            } else {
                // Modo Creación
                const { error } = await supabase.from('deudas').insert([debtData]);
                if (error) throw error;
            }

            onSuccess();
            onClose();

        } catch (error: any) {
            console.error('Error saving debt:', error);
            setErrorMsg(error.message || 'Error al guardar la deuda');
        } finally {
            setLoading(false);
        }
    };

    // Mask formatter
    const formatDisplay = (val: string) => {
        const num = parseFloat(val.replace(/\D/g, ''));
        return isNaN(num) ? '' : new Intl.NumberFormat('es-CO').format(num);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Coins className="text-rose-500" /> {debtToEdit ? 'Editar Deuda' : 'Nueva Deuda'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Box */}
                    {errorMsg && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-900/30 p-3 rounded-xl text-sm flex items-center gap-2">
                            <AlertTriangle size={16} /> {errorMsg}
                        </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre de Entidad/Obligación</label>
                            <input
                                required
                                type="text"
                                placeholder="Ej: Tarjeta Crédito Visa"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Saldo Adeudado ($)</label>
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formatDisplay(saldoActual)}
                                    onChange={(e) => setSaldoActual(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 outline-none font-mono text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2" title="El pago mínimo mensual requerido sin intereses de mora">C. Obligatoria ($)</label>
                                <input
                                    required
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0"
                                    value={formatDisplay(cuotaMinima)}
                                    onChange={(e) => setCuotaMinima(e.target.value.replace(/\D/g, ''))}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 outline-none font-mono text-slate-900 dark:text-white text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tasa E.M. (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ej: 2.5"
                                    value={tasaInteres}
                                    onChange={(e) => setTasaInteres(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-rose-500 outline-none font-mono text-slate-900 dark:text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        💡 En el **Método Bola de Nieve** el orden de cancelación se decide basándose matemáticamente en el *Saldo Adeudado*. Mantén tus saldos actualizados para una proyección correcta.
                    </p>

                    {/* Actions */}
                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${loading ? 'bg-rose-400 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 hover:shadow-rose-500/25 active:scale-[0.98]'}`}
                        >
                            <Save size={20} />
                            {loading ? 'Guardando...' : (debtToEdit ? 'Actualizar Deuda' : 'Añadir al Plan de Eliminación')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
