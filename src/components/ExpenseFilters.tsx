import { useState } from 'react';
import { Filter, Search, Calendar } from 'lucide-react';
import { CATEGORIAS } from '../constants';

export interface FilterState {
    category: string;
    tag: string;
    startDate: string;
    endDate: string;
}

interface ExpenseFiltersProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    onClear: () => void;
}

export default function ExpenseFilters({ filters, onFilterChange, onClear }: ExpenseFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleChange = (key: keyof FilterState, value: string) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className="mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                    ${isOpen || activeFilterCount > 0
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
            >
                <Filter size={16} />
                Filtros
                {activeFilterCount > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in grid gap-4 md:grid-cols-4">

                    {/* Category Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categoría</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        >
                            <option value="">Todas</option>
                            {CATEGORIAS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tag Filter */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Etiqueta</label>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar etiqueta..."
                                value={filters.tag}
                                onChange={(e) => handleChange('tag', e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Date Range - Start */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Desde</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Date Range - End */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hasta</label>
                        <div className="relative">
                            <Calendar size={14} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-4 flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <button
                            onClick={onClear}
                            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-4 py-2"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
