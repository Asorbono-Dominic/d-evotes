// ============================================================
//  src/lib/store.ts — Zustand Global State
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---- THEME STORE ------------------------------------------
interface ThemeStore {
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    setTheme: (theme: 'dark' | 'light') => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: 'dark',
            toggleTheme: () =>
                set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
            setTheme: (theme) => set({ theme }),
        }),
        { name: 'd-evotes-theme' }
    )
);

// ---- ADMIN AUTH STORE -------------------------------------
interface Admin {
    id:       string;
    username: string;
    email:    string;
    role:     'super_admin' | 'election_admin';
}

interface AdminStore {
    admin:    Admin | null;
    token:    string | null;
    setAdmin: (admin: Admin, token: string) => void;
    logout:   () => void;
    isSuper:  () => boolean;
}

export const useAdminStore = create<AdminStore>()(
    persist(
        (set, get) => ({
            admin:    null,
            token:    null,
            setAdmin: (admin, token) => {
                localStorage.setItem('admin_token', token);
                localStorage.setItem('admin_data', JSON.stringify(admin));
                set({ admin, token });
            },
            logout: () => {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_data');
                set({ admin: null, token: null });
            },
            isSuper: () => get().admin?.role === 'super_admin',
        }),
        { name: 'd-evotes-admin' }
    )
);

// ---- VOTER AUTH STORE -------------------------------------
interface Voter {
    voter_id:    string;
    full_name:   string | null;
    election_id: string;
}

interface VoterStore {
    voter:    Voter | null;
    token:    string | null;
    setVoter: (voter: Voter, token: string) => void;
    logout:   () => void;
}

export const useVoterStore = create<VoterStore>()(
    persist(
        (set) => ({
            voter:    null,
            token:    null,
            setVoter: (voter, token) => {
                localStorage.setItem('voter_token', token);
                set({ voter, token });
            },
            logout: () => {
                localStorage.removeItem('voter_token');
                set({ voter: null, token: null });
            },
        }),
        { name: 'd-evotes-voter' }
    )
);