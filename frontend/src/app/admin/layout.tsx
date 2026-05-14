'use client';

// ============================================================
//  src/app/admin/layout.tsx — Admin Layout with Sidebar
// ============================================================

import { useEffect }            from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion }               from 'framer-motion';
import {
    LayoutDashboard, Vote, Users, Settings,
    LogOut, ExternalLink, ShieldCheck, ChevronRight,
} from 'lucide-react';
import { useAdminStore }        from '@/lib/store';
import ThemeToggle              from '@/components/ThemeToggle';
import Link                     from 'next/link';

const navItems = [
    { href: '/admin/dashboard',  icon: <LayoutDashboard size={16} />, label: 'Dashboard'  },
    { href: '/admin/elections',  icon: <Vote size={16} />,            label: 'Elections'  },
    { href: '/admin/admins',     icon: <Users size={16} />,           label: 'Admins',    superOnly: true },
    { href: '/admin/settings',   icon: <Settings size={16} />,        label: 'Settings'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router                   = useRouter();
    const pathname                 = usePathname();
    const { admin, token, logout, isSuper } = useAdminStore();

    // Allow login page without auth
    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (!isLoginPage && (!admin || !token)) {
            router.push('/admin/login');
        }
    }, [admin, token, isLoginPage]);

    if (isLoginPage) return <>{children}</>;
    if (!admin)      return null;

    const handleLogout = () => {
        logout();
        router.push('/admin/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* SIDEBAR */}
            <aside style={{
                position:     'fixed',
                top:          0,
                left:         0,
                width:        '240px',
                height:       '100vh',
                background:   'rgba(8,14,22,0.97)',
                borderRight:  '1px solid var(--border)',
                display:      'flex',
                flexDirection: 'column',
                zIndex:       100,
                backdropFilter: 'blur(16px)',
            }}>
                {/* Logo */}
                <div style={{
                    padding:      '1.75rem 1.5rem 1.5rem',
                    borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{
                        fontSize:  '0.88rem',
                        fontWeight: 700,
                        color:     'var(--amber)',
                        display:   'flex',
                        alignItems: 'center',
                        gap:       '0.6rem',
                    }}>
                        <ShieldCheck size={18} />
                        Electoral Admin
                    </div>
                    <div style={{
                        fontSize:  '0.72rem',
                        color:     'var(--text-muted)',
                        marginTop: '0.3rem',
                    }}>
                        D-Evotes Platform
                    </div>
                    <div style={{
                        display:       'inline-block',
                        fontSize:      '0.6rem',
                        fontWeight:    700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:         'var(--amber)',
                        background:    'rgba(255,184,48,0.1)',
                        border:        '1px solid rgba(255,184,48,0.2)',
                        padding:       '0.15rem 0.5rem',
                        borderRadius:  '4px',
                        marginTop:     '0.6rem',
                    }}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Election Admin'}
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ padding: '1.25rem 0', flex: 1, overflowY: 'auto' }}>
                    <div style={{
                        fontSize:      '0.62rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:         'var(--text-muted)',
                        padding:       '0 1.5rem',
                        marginBottom:  '0.6rem',
                    }}>
                        Overview
                    </div>

                    {navItems.map((item) => {
                        if (item.superOnly && !isSuper()) return null;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display:      'flex',
                                    alignItems:   'center',
                                    gap:          '0.75rem',
                                    padding:      '0.7rem 1.5rem',
                                    color:        isActive ? 'var(--amber)' : 'var(--text-secondary)',
                                    fontSize:     '0.875rem',
                                    fontWeight:   500,
                                    textDecoration: 'none',
                                    borderLeft:   `2px solid ${isActive ? 'var(--amber)' : 'transparent'}`,
                                    background:   isActive ? 'rgba(255,184,48,0.06)' : 'transparent',
                                    transition:   'all 0.2s',
                                }}
                            >
                                {item.icon}
                                {item.label}
                                {isActive && (
                                    <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                                )}
                            </Link>
                        );
                    })}

                    <div style={{
                        fontSize:      '0.62rem',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color:         'var(--text-muted)',
                        padding:       '0 1.5rem',
                        marginTop:     '1.25rem',
                        marginBottom:  '0.6rem',
                    }}>
                        External
                    </div>

                    <Link
                        href="/"
                        target="_blank"
                        style={{
                            display:     'flex',
                            alignItems:  'center',
                            gap:         '0.75rem',
                            padding:     '0.7rem 1.5rem',
                            color:       'var(--text-secondary)',
                            fontSize:    '0.875rem',
                            fontWeight:  500,
                            textDecoration: 'none',
                            borderLeft:  '2px solid transparent',
                            transition:  'color 0.2s',
                        }}
                    >
                        <ExternalLink size={16} />
                        Public Site
                    </Link>
                </nav>

                {/* Footer */}
                <div style={{
                    padding:    '1.25rem 1.5rem',
                    borderTop:  '1px solid var(--border)',
                }}>
                    <div style={{
                        fontSize:     '0.78rem',
                        color:        'var(--text-muted)',
                        marginBottom: '0.75rem',
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                    }}>
                        👤 {admin.username}
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display:     'flex',
                            alignItems:  'center',
                            gap:         '0.6rem',
                            color:       'var(--text-muted)',
                            fontSize:    '0.83rem',
                            background:  'none',
                            border:      'none',
                            cursor:      'pointer',
                            padding:     0,
                            transition:  'color 0.2s',
                            fontFamily:  'var(--font-space)',
                        }}
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Topbar */}
                <div style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'flex-end',
                    padding:        '1rem 2rem',
                    borderBottom:   '1px solid var(--border)',
                    background:     'rgba(6,10,15,0.7)',
                    backdropFilter: 'blur(12px)',
                    position:       'sticky',
                    top:            0,
                    zIndex:         50,
                    gap:            '1rem',
                }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date().toLocaleDateString('en-GB', {
                            weekday: 'short', day: 'numeric',
                            month: 'short', year: 'numeric',
                        })}
                    </span>
                    <ThemeToggle />
                </div>

                {/* Page content */}
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flex: 1, padding: '2rem' }}
                >
                    {children}
                </motion.div>
            </div>
        </div>
    );
}