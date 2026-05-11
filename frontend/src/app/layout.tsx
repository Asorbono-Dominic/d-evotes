// ============================================================
//  src/app/layout.tsx — Root Layout
// ============================================================

import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '@/components/ThemeProvider';

const spaceGrotesk = Space_Grotesk({
    subsets:  ['latin'],
    variable: '--font-space',
    display:  'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets:  ['latin'],
    variable: '--font-mono',
    display:  'swap',
});

export const metadata: Metadata = {
    title:       'D-Evotes — Secure Digital Voting Platform',
    description: 'A secure, modern multi-election digital voting platform',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-space antialiased`}>
                <ThemeProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background:  'var(--toast-bg)',
                                color:       'var(--toast-color)',
                                border:      '1px solid var(--toast-border)',
                                borderRadius: '10px',
                                fontFamily:  'var(--font-space)',
                                fontSize:    '0.875rem',
                            },
                        }}
                    />
                </ThemeProvider>
            </body>
        </html>
    );
}