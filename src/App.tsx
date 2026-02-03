import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import { Sidebar } from './components/Sidebar';
import DashboardSummary from './components/DashboardSummary';
import DashboardHeader from './components/DashboardHeader';
import CashFlowChart from './components/CashFlowChart';
import ExpensesPieChart from './components/ExpensesPieChart';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import AccountsSummary from './components/AccountsSummary';
import FinancialHealth from './components/FinancialHealth';
import Configuration from './components/Configuration';
import StrategyView from './components/StrategyView';
import WelcomeModal from './components/WelcomeModal';
import './index.css';
import { Transaction } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [session, setSession] = useState<Session | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [initialPillar, setInitialPillar] = useState<string | undefined>(undefined);

  // Ref to prevent double checking or loops
  const profileCheckedRef = useRef<string | null>(null);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Isolated effect for profile check - Strictly guarded
  useEffect(() => {
    if (!session?.user?.id) {
      profileCheckedRef.current = null;
      return;
    }

    // Double check to prevent loops
    if (session.user.id === profileCheckedRef.current) return;

    profileCheckedRef.current = session.user.id;
    checkProfile(session.user.id);
  }, [session?.user?.id]);

  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('onboarding_completed, full_name')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist
        setShowOnboarding(true);
      } else if (data) {
        if (!data.onboarding_completed) {
          setShowOnboarding(true);
        }
        if (data.full_name) {
          setUserName(data.full_name);
        }
      }
    } catch (err) {
      console.error("Profile check failed silently", err);
    }
  };

  const handleOnboardingComplete = async (name: string) => {
    if (!session) return;
    setUserName(name);

    try {
      const { error } = await supabase
        .from('perfiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: name,
          onboarding_completed: true
        })
        .select();

      if (error) throw error;
      setShowOnboarding(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Error al guardar perfil: ${error.message}`);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleTransactionSuccess = () => {
    setLastUpdated(Date.now());
    setEditingTransaction(null);
    setInitialPillar(undefined);
  };

  const handlePillarNavigation = (pillar: string) => {
    setInitialPillar(pillar);
    setActiveTab('transactions');
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleTabChange = (tab: string) => {
    window.scrollTo(0, 0);
    setActiveTab(tab);
    closeMobileMenu();
    setTimeout(() => window.scrollTo(0, 0), 10);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
            <DashboardHeader userName={userName} />

            {/* Restored Layout Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DashboardSummary
                  refreshTrigger={lastUpdated}
                  onPillarClick={handlePillarNavigation}
                />
              </div>
              <div className="lg:col-span-1">
                <FinancialHealth refreshTrigger={lastUpdated} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CashFlowChart refreshTrigger={lastUpdated} />
              <ExpensesPieChart refreshTrigger={lastUpdated} />
            </div>
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Registro de Movimientos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="w-full">
                <TransactionForm
                  onSuccess={handleTransactionSuccess}
                  transactionToEdit={editingTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                  initialPillar={initialPillar}
                />
              </div>
              <TransactionList
                onEdit={(t) => setEditingTransaction(t)}
                refreshTrigger={lastUpdated}
                onDataChange={handleTransactionSuccess}
              />
            </div>
          </div>
        );
      case 'accounts':
        return (
          <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Estado de Cuentas</h2>
            <AccountsSummary />
          </div>
        );
      case 'settings':
        return (
          <Configuration
            onTruncateComplete={handleTransactionSuccess}
            toggleTheme={toggleTheme}
            currentTheme={theme}
          />
        );
      case 'strategy':
        return <StrategyView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex transition-colors duration-300">

      {!session ? (
        <Auth />
      ) : (
        <>
          {showOnboarding && <WelcomeModal onComplete={handleOnboardingComplete} />}

          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            toggleTheme={toggleTheme}
            currentTheme={theme}
            userEmail={session.user.email}
            userName={userName}
            // @ts-ignore
            isOpen={isMobileMenuOpen}
            // @ts-ignore
            onClose={closeMobileMenu}
          />

          {/* Main Content Area - Enforced Layout */}
          {/* Main Content Area - Enforced Layout */}
          <main className="flex-1 w-full ml-0 lg:ml-64 p-4 md:p-8 pb-8 md:pb-8 transition-all duration-300 overflow-x-hidden">
            <header className="flex justify-between items-center mb-6 md:hidden">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Menu size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">ClarityClick</h1>
              </div>
            </header>

            {renderContent()}
          </main>
        </>
      )}
    </div >
  );
};

export default App;
