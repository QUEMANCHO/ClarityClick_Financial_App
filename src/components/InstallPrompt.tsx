import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Hide the app provided install promotion
        setIsVisible(false);

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Download size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Instalar ClarityClick</h3>
                        <p className="text-xs text-slate-300">Acceso rápido y sin conexión</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors shadow-lg"
                    >
                        Instalar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
