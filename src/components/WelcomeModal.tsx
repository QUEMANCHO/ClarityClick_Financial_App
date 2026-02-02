import { useState } from 'react';
import { ArrowRight, TrendingUp, TrendingDown, PiggyBank, Briefcase, Zap, CheckCircle } from 'lucide-react';

interface WelcomeModalProps {
    onComplete: (name: string) => void;
}

export default function WelcomeModal({ onComplete }: WelcomeModalProps) {
    const [slide, setSlide] = useState(0);
    const [name, setName] = useState('');

    const nextSlide = () => setSlide(prev => prev + 1);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative min-h-[500px] flex flex-col">

                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${((slide + 1) / 4) * 100}%` }}
                    />
                </div>

                <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center transition-all duration-500">

                    {/* SLIDE 1: VISION */}
                    {slide === 0 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 rotate-3">
                                <span className="text-4xl">🚀</span>
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                Bienvenido a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">ClarityClick</span>
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                                Tu centro de comando financiero estratégico. Diseñado para darte claridad total sobre tu dinero y tu futuro.
                            </p>
                            <button onClick={nextSlide} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold hover:scale-105 transition-transform">
                                Comenzar Tour
                            </button>
                        </div>
                    )}

                    {/* SLIDE 2: PILLARS */}
                    {slide === 1 && (
                        <div className="space-y-8 animate-fade-in w-full">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Los 4 Pilares de la Riqueza</h3>
                                <p className="text-slate-500 dark:text-slate-400">Una metodología simple para el éxito financiero.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600"><TrendingUp size={20} /></div>
                                    <div><span className="font-bold text-slate-800 dark:text-green-100 block">Ganar</span><span className="text-xs text-slate-500 dark:text-green-200/60">Maximiza tus ingresos</span></div>
                                </div>
                                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex items-center gap-3">
                                    <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg text-red-600"><TrendingDown size={20} /></div>
                                    <div><span className="font-bold text-slate-800 dark:text-red-100 block">Gastar</span><span className="text-xs text-slate-500 dark:text-red-200/60">Optimiza tu estilo de vida</span></div>
                                </div>
                                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600"><PiggyBank size={20} /></div>
                                    <div><span className="font-bold text-slate-800 dark:text-blue-100 block">Ahorrar</span><span className="text-xs text-slate-500 dark:text-blue-200/60">Construye tu colchón</span></div>
                                </div>
                                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30 flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg text-purple-600"><Briefcase size={20} /></div>
                                    <div><span className="font-bold text-slate-800 dark:text-purple-100 block">Invertir</span><span className="text-xs text-slate-500 dark:text-purple-200/60">Haz crecer tu patrimonio</span></div>
                                </div>
                            </div>

                            <button onClick={nextSlide} className="mt-4 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                                Siguiente <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* SLIDE 3: VITAL ENERGY */}
                    {slide === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50 dark:ring-amber-900/10">
                                <Zap size={40} className="text-amber-500 animate-pulse" />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Energía Vital</h3>
                            <div className="inline-block px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
                                Próximamente
                            </div>
                            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                                El dinero es energía almacenada. Pronto podrás gestionar el capital biológico invertido en tus metas, no solo el monetario.
                            </p>
                            <button onClick={nextSlide} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
                                Continuar <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* SLIDE 4: SETUP */}
                    {slide === 3 && (
                        <div className="space-y-8 animate-fade-in w-full max-w-sm mx-auto">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} className="text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">¡Estás listo!</h3>
                                <p className="text-slate-500 dark:text-slate-400">Solo una cosa más antes de empezar.</p>
                            </div>

                            <div className="text-left">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">¿Cómo te gustaría que te llamemos?</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Tu Nombre"
                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500 text-lg font-bold text-center dark:text-white"
                                    autoFocus
                                />
                            </div>

                            <button
                                onClick={() => onComplete(name)}
                                disabled={!name.trim()}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1"
                            >
                                Empezar Ahora
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
