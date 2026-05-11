'use client';

// ============================================================
//  src/components/ThemeToggle.tsx — Dark/Light Toggle Button
// ============================================================

import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/lib/store';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200"
            style={{
                background:   'var(--bg-card)',
                border:       '1px solid var(--border)',
                color:        'var(--text-secondary)',
                cursor:       'pointer',
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                transition={{ duration: 0.2 }}
            >
                {theme === 'dark' ? (
                    <Sun size={16} style={{ color: 'var(--amber)' }} />
                ) : (
                    <Moon size={16} style={{ color: 'var(--cyan)' }} />
                )}
            </motion.div>
            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
        </motion.button>
    );
}