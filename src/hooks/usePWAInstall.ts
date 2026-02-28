import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
            // console.log('👋 PWA Install Prompt captured!');
        };

        const handleAppInstalled = () => {
            setIsAppInstalled(true);
            setIsInstallable(false);
            setDeferredPrompt(null);
            // console.log('✅ PWA Installed successfully');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Check if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            // eslint-disable-next-line
            setIsAppInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const install = async () => {
        if (!deferredPrompt) {
            console.warn('❌ No install prompt available');
            return;
        }

        // console.log('🚀 Triggering install prompt...');
        deferredPrompt.prompt();

        await deferredPrompt.userChoice;
        // console.log(`User response to install prompt: ${outcome}`);

        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, isAppInstalled, install };
}
