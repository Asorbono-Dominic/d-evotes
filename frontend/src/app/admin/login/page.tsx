'use client';

// ============================================================
//  src/app/admin/login/page.tsx — Admin Login
// ============================================================

import { useState }             from 'react';
import { useRouter }            from 'next/navigation';
import { motion }               from 'framer-motion';
import { ShieldCheck }          from 'lucide-react';
import { authAPI }              from '@/lib/api';
import { useAdminStore }        from '@/lib/store';
import ThemeToggle              from '@/components/ThemeToggle';
import Link                     from 'next/link';
import toast                    from 'react-hot-toast';

export default function AdminLoginPage() {
    const router                      = useRouter();
    const { setAdmin }                = useAdminStore();

    const [username,  setUsername]    = useState('');
    const [password,  setPassword]    = useState('');
    const [loading,   setLoading]     = useState(false);
    const [error,     setError]       = useState('');
    const [showPw,    setShowPw]      = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await authAPI.login({ username: username.trim(), password });
            const { token, admin } = res.data.data;
            setAdmin(admin, token);
            toast.success(`Welcome back, ${admin.username}!`);
            router.push('/admin/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight:      '100vh',
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            position:       'relative',
            zIndex:         1,
        }}>
            {/* Amber glow — visually distinct from voter pages */}
            <div style={{
                position:   'fixed',
                top:        '50%',
                left:       '50%',
                transform:  'translate(-50%, -50%)',
                width:      '500px',
                height:     '500px',
                background: 'radial-gradient(circle, rgba(255,184,48,0.06) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Navbar */}
            <nav style={{
                position:       'fixed',
                top:            0, left: 0, right: 0,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '1rem 2rem',
                borderBottom:   '1px solid var(--border)',
                background:     'rgba(6,10,15,0.85)',
                backdropFilter: 'blur(16px)',
                zIndex:         100,
            }}>
                <Link href="/" style={{
                    fontSize: '0.85rem', color: 'var(--text-muted)',
                    textDecoration: 'none',
                }}>
                    ← Public Site
                </Link>
                <ThemeToggle />
            </nav>

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                transition={{ duration: 0.4 }}
                className="glass-card"
                style={{
                    width:    '100%',
                    maxWidth: '420px',
                    padding:  '2.5rem',
                    margin:   '1.5rem',
                    border:   '1px solid rgba(255,184,48,0.15)',
                }}
            >
                {/* Icon */}
                <div style={{
                    width:          '52px',
                    height:         '52px',
                    borderRadius:   '14px',
                    background:     'rgba(255,184,48,0.1)',
                    border:         '1px solid rgba(255,184,48,0.25)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    marginBottom:   '1.5rem',
                }}>
                    <ShieldCheck size={22} style={{ color: 'var(--amber)' }} />
                </div>

                {/* Admin badge */}
                <div style={{
                    display:       'inline-block',
                    fontSize:      '0.65rem',
                    fontWeight:    700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color:         'var(--amber)',
                    background:    'rgba(255,184,48,0.1)',
                    border:        '1px solid rgba(255,184,48,0.2)',
                    padding:       '0.15rem 0.6rem',
                    borderRadius:  '4px',
                    marginBottom:  '0.75rem',
                }}>
                    Admin Access
                </div>

                <h1 style={{
                    fontSize:      '1.5rem',
                    fontWeight:    700,
                    letterSpacing: '-0.03em',
                    marginBottom:  '0.4rem',
                }}>
                    Control Panel
                </h1>
                <p style={{
                    fontSize:     '0.83rem',
                    color:        'var(--text-secondary)',
                    marginBottom: '2rem',
                    lineHeight:   1.5,
                }}>
                    Restricted to authorised Electoral Commission staff only.
                </p>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            background:   'rgba(255,77,109,0.1)',
                            border:       '1px solid rgba(255,77,109,0.3)',
                            borderRadius: '8px',
                            padding:      '0.85rem 1rem',
                            fontSize:     '0.85rem',
                            color:        '#ff8fa3',
                            marginBottom: '1.25rem',
                        }}
                    >
                        ⚠️ {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin}>
                    {/* Username */}
                    <div style={{ marginBottom: '1.1rem' }}>
                        <label style={{
                            display:       'block',
                            fontSize:      '0.75rem',
                            fontWeight:    600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color:         'var(--text-secondary)',
                            marginBottom:  '0.5rem',
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="superadmin"
                            autoComplete="username"
                            required
                            style={{
                                width:        '100%',
                                background:   'var(--bg-input)',
                                border:       '1px solid var(--border)',
                                borderRadius: '8px',
                                color:        'var(--text-primary)',
                                fontFamily:   'var(--font-mono)',
                                fontSize:     '0.95rem',
                                padding:      '0.8rem 1rem',
                                outline:      'none',
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{
                            display:       'block',
                            fontSize:      '0.75rem',
                            fontWeight:    600,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color:         'var(--text-secondary)',
                            marginBottom:  '0.5rem',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                style={{
                                    width:        '100%',
                                    background:   'var(--bg-input)',
                                    border:       '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color:        'var(--text-primary)',
                                    fontFamily:   'var(--font-mono)',
                                    fontSize:     '0.95rem',
                                    padding:      '0.8rem 2.75rem 0.8rem 1rem',
                                    outline:      'none',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                style={{
                                    position:   'absolute',
                                    right:      '0.85rem',
                                    top:        '50%',
                                    transform:  'translateY(-50%)',
                                    background: 'none',
                                    border:     'none',
                                    cursor:     'pointer',
                                    color:      'var(--text-muted)',
                                    padding:    '0.25rem',
                                }}
                            >
                                {showPw ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width:        '100%',
                            background:   'linear-gradient(135deg, var(--amber), #e09000)',
                            color:        '#1a0e00',
                            fontFamily:   'var(--font-space)',
                            fontSize:     '0.95rem',
                            fontWeight:   800,
                            padding:      '0.95rem',
                            border:       'none',
                            borderRadius: '8px',
                            cursor:       loading ? 'not-allowed' : 'pointer',
                            opacity:      loading ? 0.7 : 1,
                            transition:   'all 0.2s',
                        }}
                    >
                        {loading ? '⏳ Logging in...' : '→ Login to Admin Panel'}
                    </button>
                </form>

                <div style={{
                    textAlign:   'center',
                    marginTop:   '1.5rem',
                    fontSize:    '0.75rem',
                    color:       'var(--text-muted)',
                }}>
                    {new Date().getFullYear()} · D-Evotes Electoral Platform
                </div>
            </motion.div>
        </div>
    );
}