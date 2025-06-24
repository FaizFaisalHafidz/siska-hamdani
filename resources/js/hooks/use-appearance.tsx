import { useCallback, useEffect, useState } from 'react';

export type Appearance = 'light'; // Hanya light mode saja

const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const applyTheme = (appearance: Appearance) => {
    // Selalu force light mode
    document.documentElement.classList.remove('dark');
    
    // Tambahan: pastikan tidak ada dark class yang tersisa
    if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
    }
};

export function initializeTheme() {
    // Selalu gunakan light mode
    const savedAppearance: Appearance = 'light';
    
    applyTheme(savedAppearance);
    
    // Hapus semua event listener untuk system theme changes
    // karena kita tidak menggunakan system detection
}

export function useAppearance() {
    const [appearance, setAppearance] = useState<Appearance>('light');

    const updateAppearance = useCallback((mode: Appearance) => {
        // Hanya terima 'light' mode
        const lightMode: Appearance = 'light';
        
        setAppearance(lightMode);

        // Store in localStorage sebagai light
        localStorage.setItem('appearance', lightMode);

        // Store in cookie sebagai light
        setCookie('appearance', lightMode);

        applyTheme(lightMode);
    }, []);

    useEffect(() => {
        // Selalu gunakan light mode, abaikan localStorage
        const lightMode: Appearance = 'light';
        
        // Clear any existing dark mode settings
        localStorage.setItem('appearance', lightMode);
        setCookie('appearance', lightMode);
        
        updateAppearance(lightMode);
        
        // Tidak perlu cleanup karena tidak ada event listener
    }, [updateAppearance]);

    return { appearance, updateAppearance } as const;
}
