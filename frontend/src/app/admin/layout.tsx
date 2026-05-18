'use client';

import { useEffect, useState }      from 'react';
import { useRouter, usePathname }   from 'next/navigation';
import { motion, AnimatePresence }  from 'framer-motion';
import {
    LayoutDashboard, Vote, Users, Settings,
    LogOut, ExternalLink, ShieldCheck,
    ChevronRight, ChevronLeft, Sun, Moon,
} from 'lucide-react';
import { useAdminStore, useThemeStore } from '@/lib/store';
import Link                         from 'next/link';

const navItems = [
    { href: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard'  },
    { href: '/admin/elections', icon: <Vote size={18} />,            label: 'Elections'  },
    { href: '/admin/admins',    icon: <Users size={18} />,           label: 'Admins',    superOnly: true },
    { href: '/admin/settings',  icon: <Settings size={18} />,        label: 'Settings'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router                            = useRouter();
    const pathname                          = usePathname();
    const { admin, token, logout, isSuper } = useAdminStore();
    const { theme, toggleTheme }            = useThemeStore();
    const [collapsed, setCollapsed]         = useState(false);

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

    const sw = collapsed ? '72px' : '240px';

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* SIDEBAR */}
            <motion.aside
                animate={{ width: sw }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{
                    position:       'fixed',
                    top:            0, left: 0,
                    height:         '100vh',
                    background:     'rgba(8,14,22,0.97)',
                    borderRight:    '1px solid var(--border)',
                    display:        'flex',
                    flexDirection:  'column',
                    zIndex:         100,
                    overflow:       'hidden',
                    backdropFilter: 'blur(16px)',
                }}
            >
                {/* Logo + Collapse */}
                <div style={{
                    padding:        '1.25rem 1rem',
                    borderBottom:   '1px solid var(--border)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'space-between',
                    gap:            '0.5rem',
                    minHeight:      '72px',
                }}>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--amber)' }}>
                                    <ShieldCheck size={16} /> Electoral Admin
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                    D-Evotes Platform
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            background:     'rgba(255,184,48,0.08)',
                            border:         '1px solid rgba(255,184,48,0.2)',
                            borderRadius:   '8px',
                            color:          'var(--amber)',
                            width:          '32px', height: '32px',
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            cursor:         'pointer',
                            flexShrink:     0,
                        }}
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Role badge */}
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}
                        >
                            <div style={{
                                display: 'inline-block', fontSize: '0.6rem', fontWeight: 700,
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                                color: 'var(--amber)', background: 'rgba(255,184,48,0.1)',
                                border: '1px solid rgba(255,184,48,0.2)',
                                padding: '0.2rem 0.65rem', borderRadius: '4px',
                            }}>
                                {admin.role === 'super_admin' ? '⚡ Super Admin' : '🔑 Election Admin'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Nav */}
                <nav style={{ padding: '0.75rem 0', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    {!collapsed && (
                        <div style={{ fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '0.5rem 1.25rem', marginBottom: '0.25rem' }}>
                            Menu
                        </div>
                    )}

                    {navItems.map((item) => {
                        if (item.superOnly && !isSuper()) return null;
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                                style={{
                                    display:        'flex', alignItems: 'center', gap: '0.75rem',
                                    padding:        collapsed ? '0.85rem' : '0.75rem 1.25rem',
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    color:          isActive ? 'var(--amber)' : 'var(--text-secondary)',
                                    fontSize:       '0.875rem', fontWeight: isActive ? 600 : 400,
                                    textDecoration: 'none',
                                    borderLeft:     collapsed ? 'none' : `2px solid ${isActive ? 'var(--amber)' : 'transparent'}`,
                                    borderRadius:   collapsed ? '8px' : '0',
                                    background:     isActive ? (collapsed ? 'rgba(255,184,48,0.1)' : 'rgba(255,184,48,0.06)') : 'transparent',
                                    margin:         collapsed ? '0.15rem 0.5rem' : '0',
                                    transition:     'all 0.2s', whiteSpace: 'nowrap', overflow: 'hidden',
                                }}
                            >
                                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && !collapsed && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                            </Link>
                        );
                    })}

                    <Link href="/" target="_blank" title={collapsed ? 'Public Site' : undefined}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            padding: collapsed ? '0.85rem' : '0.75rem 1.25rem',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            color: 'var(--text-muted)', fontSize: '0.875rem',
                            textDecoration: 'none',
                            margin: collapsed ? '0.15rem 0.5rem' : '0',
                            borderLeft: collapsed ? 'none' : '2px solid transparent',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                        }}
                    >
                        <ExternalLink size={18} style={{ flexShrink: 0 }} />
                        <AnimatePresence>
                            {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Public Site</motion.span>}
                        </AnimatePresence>
                    </Link>
                </nav>

                {/* Bottom: date, theme, logout */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '0.75rem' }}>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.6rem', paddingLeft: '0.5rem' }}
                            >
                                {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            width: '100%', justifyContent: collapsed ? 'center' : 'flex-start',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                            borderRadius: '8px', color: 'var(--text-secondary)',
                            fontSize: '0.8rem', fontWeight: 500,
                            padding: '0.55rem 0.75rem', cursor: 'pointer',
                            marginBottom: '0.5rem', fontFamily: 'var(--font-space)',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                        }}
                    >
                        {theme === 'dark'
                            ? <Sun  size={15} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                            : <Moon size={15} style={{ color: 'var(--cyan)',  flexShrink: 0 }} />
                        }
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: collapsed ? 'center' : 'space-between', padding: '0.4rem 0.25rem 0' }}>
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
                                >
                                    👤 {admin.username}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <button onClick={handleLogout} title="Logout"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                color: 'var(--text-muted)', fontSize: '0.78rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: '0.3rem', borderRadius: '6px',
                                fontFamily: 'var(--font-space)', flexShrink: 0,
                            }}
                        >
                            <LogOut size={15} />
                            <AnimatePresence>
                                {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Logout</motion.span>}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </motion.aside>

            {/* MAIN */}
            <motion.div
                animate={{ marginLeft: sw }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
            >
                <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ flex: 1, padding: '2rem' }}
                >
                    {children}
                </motion.div>
            </motion.div>
        </div>
    );
}