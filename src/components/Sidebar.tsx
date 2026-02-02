import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { LayoutDashboard, FileText, Wallet, Settings, TrendingUp, Sun, Moon, LogOut, User } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    toggleTheme: () => void;
    currentTheme: 'light' | 'dark';
    userEmail?: string;
    userName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, toggleTheme, currentTheme, userEmail, userName }) => {
    const handleLogout = async () => {
        if (window.confirm('¿Cerrar sesión?')) {
            await supabase.auth.signOut();
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard }, // Shortened label for mobile
        { id: 'transactions', label: 'Registros', icon: FileText },
        { id: 'accounts', label: 'Cuentas', icon: Wallet },
        { id: 'settings', label: 'Ajustes', icon: Settings },
        { id: 'strategy', label: 'Estrategia', icon: TrendingUp }, // Shortened label for mobile
    ];

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 border-r border-slate-800 shadow-xl overflow-y-auto z-50">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        ClarityClick
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Asesor Financiero</p>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium
                  ${isActive
                                        ? 'bg-blue-600 shadow-lg text-white translate-x-1'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                                    }`}
                            >
                                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white transition-colors'} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-4">
                    {/* User Profile */}
                    {userEmail && (
                        <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <User size={16} className="text-white" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-slate-400">Sesión activa</p>
                                <p className="text-xs font-bold text-white truncate" title={userEmail}>
                                    {userName || userEmail.split('@')[0]}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50 group"
                            title="Cambiar tema"
                        >
                            {currentTheme === 'dark' ? (
                                <Moon size={18} className="text-blue-200" />
                            ) : (
                                <Sun size={18} className="text-yellow-400" />
                            )}
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-red-900/20 hover:bg-red-900/40 transition-colors border border-red-900/30 group text-red-400"
                            title="Cerrar Sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl z-50 border border-slate-700/50 flex justify-between items-center p-2 mb-safe">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-200
                                ${isActive ? 'bg-white/10 text-white transform scale-105' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </button>
                    )
                })}
            </nav>
        </>
    );
};
