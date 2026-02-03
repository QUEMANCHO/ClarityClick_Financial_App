import React from 'react';
import { supabase } from '../lib/supabaseClient';
import { LayoutDashboard, FileText, Wallet, Settings, TrendingUp, Sun, Moon, LogOut, User, X } from 'lucide-react';

interface SidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    toggleTheme: () => void;
    currentTheme: 'light' | 'dark';
    userEmail?: string;
    userName?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    setActiveTab,
    toggleTheme,
    currentTheme,
    userEmail,
    userName,
    isOpen = false,
    onClose
}) => {
    const handleLogout = async () => {
        if (window.confirm('¿Cerrar sesión?')) {
            await supabase.auth.signOut();
        }
    };

    const menuItems = [
        { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
        { id: 'transactions', label: 'Registros', icon: FileText },
        { id: 'accounts', label: 'Cuentas', icon: Wallet },
        { id: 'strategy', label: 'Estrategia', icon: TrendingUp },
        { id: 'settings', label: 'Ajustes', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay (Backdrop) */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in backdrop-blur-sm"
                />
            )}

            {/* Sidebar (Desktop: Static/Sticky, Mobile: Fixed Drawer) */}
            <aside
                className={`flex flex-col w-64 bg-slate-900 text-white h-screen fixed md:sticky top-0 left-0 border-r border-slate-800 shadow-xl overflow-y-auto z-50 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                            ClarityClick
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">Asesor Financiero</p>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
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
            {/* Removed Mobile Bottom Navigation as it is replaced by the Drawer */}
        </>
    );
};
