import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCcw, X } from 'lucide-react';

export default function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-[9999] animate-slide-up">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-blue-500/30 p-5 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
                            ¡Nueva versión disponible! ✨
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {offlineReady
                                ? 'La aplicación ya está lista para funcionar sin conexión.'
                                : 'Hemos mejorado la plataforma. Recarga para aplicar los últimos cambios y optimizaciones.'}
                        </p>
                    </div>
                    <button
                        onClick={() => close()}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg shrink-0 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {needRefresh && (
                    <button
                        onClick={() => updateServiceWorker(true)}
                        className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                    >
                        <RefreshCcw size={18} /> Actualizar Ahora
                    </button>
                )}
            </div>
        </div>
    );
}
