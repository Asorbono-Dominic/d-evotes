'use client';

// ============================================================
//  src/app/page.tsx — Landing Page
//  Shows all ongoing elections. Voter selects one to proceed.
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { motion }              from 'framer-motion';
import { Search, Calendar, Users, ChevronRight, Vote } from 'lucide-react';
import { electionsAPI }        from '@/lib/api';
import ThemeToggle             from '@/components/ThemeToggle';
import Link                    from 'next/link';

interface Election {
    id:           string;
    title:        string;
    description:  string;
    organization: string;
    logo_url:     string | null;
    banner_url:   string | null;
    status:       string;
    start_date:   string;
    end_date:     string | null;
}

export default function LandingPage() {
    const router                          = useRouter();
    const [elections, setElections]       = useState<Election[]>([]);
    const [filtered,  setFiltered]        = useState<Election[]>([]);
    const [loading,   setLoading]         = useState(true);
    const [search,    setSearch]          = useState('');
    const [error,     setError]           = useState('');

    useEffect(() => {
        fetchElections();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(elections);
        } else {
            setFiltered(elections.filter(e =>
                e.title.toLowerCase().includes(search.toLowerCase()) ||
                e.organization.toLowerCase().includes(search.toLowerCase())
            ));
        }
    }, [search, elections]);

    const fetchElections = async () => {
        try {
            const res = await electionsAPI.getPublic();
            setElections(res.data.data.elections);
            setFiltered(res.data.data.elections);
        } catch {
            setError('Failed to load elections. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = (status: string) => {
        if (status === 'open')               return 'var(--green)';
        if (status === 'results_published')  return 'var(--cyan)';
        return 'var(--text-muted)';
    };

    const statusLabel = (status: string) => {
        if (status === 'open')               return '🟢 Voting Open';
        if (status === 'results_published')  return '📊 Results Published';
        return status;
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

            {/* ---- NAVBAR ---- */}
            <nav style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '1rem 2rem',
                borderBottom:   '1px solid var(--border)',
                background:     'rgba(6, 10, 15, 0.85)',
                backdropFilter: 'blur(16px)',
                position:       'sticky',
                top:            0,
                zIndex:         100,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🗳️</span>
                    <span style={{
                        fontWeight:    700,
                        fontSize:      '1.1rem',
                        letterSpacing: '-0.02em',
                        color:         'var(--cyan)',
                    }}>
                        D-Evotes
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ThemeToggle />
                    <Link
                        href="/admin/login"
                        style={{
                            fontSize:      '0.85rem',
                            color:         'var(--text-secondary)',
                            textDecoration: 'none',
                            padding:       '0.5rem 1rem',
                            borderRadius:  '8px',
                            border:        '1px solid var(--border)',
                            transition:    'all 0.2s',
                        }}
                    >
                        Admin
                    </Link>
                </div>
            </nav>

            {/* ---- HERO ---- */}
            <section style={{ textAlign: 'center', padding: '5rem 1.5rem 3rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div style={{
                        display:        'inline-flex',
                        alignItems:     'center',
                        gap:            '0.5rem',
                        background:     'var(--cyan-glow)',
                        border:         '1px solid var(--border-hover)',
                        color:          'var(--cyan)',
                        fontSize:       '0.75rem',
                        fontWeight:     600,
                        letterSpacing:  '0.1em',
                        textTransform:  'uppercase',
                        padding:        '0.4rem 1rem',
                        borderRadius:   '100px',
                        marginBottom:   '1.5rem',
                    }}
                    className="animate-pulse-glow"
                    >
                        <span className="animate-blink" style={{
                            display:      'inline-block',
                            width:        '6px',
                            height:       '6px',
                            borderRadius: '50%',
                            background:   'var(--cyan)',
                        }} />
                        Secure Digital Voting Platform
                    </div>

                    <h1 style={{
                        fontSize:      'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight:    700,
                        letterSpacing: '-0.04em',
                        lineHeight:    1.1,
                        marginBottom:  '1rem',
                        background:    'linear-gradient(135deg, var(--text-primary) 0%, var(--cyan) 70%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor:  'transparent',
                        backgroundClip:       'text',
                    }}>
                        Cast Your Vote.<br />Shape Your Future.
                    </h1>

                    <p style={{
                        color:       'var(--text-secondary)',
                        fontSize:    '1.05rem',
                        maxWidth:    '500px',
                        margin:      '0 auto 2.5rem',
                        lineHeight:  1.6,
                    }}>
                        Select an election below to participate. Each vote is secured,
                        anonymous, and counted in real-time.
                    </p>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        maxWidth:    '480px',
                        margin:      '0 auto',
                        position:    'relative',
                    }}
                >
                    <Search
                        size={16}
                        style={{
                            position:  'absolute',
                            left:      '1rem',
                            top:       '50%',
                            transform: 'translateY(-50%)',
                            color:     'var(--text-muted)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search elections or organizations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width:        '100%',
                            background:   'var(--bg-card)',
                            border:       '1px solid var(--border)',
                            borderRadius: '12px',
                            color:        'var(--text-primary)',
                            fontFamily:   'var(--font-space)',
                            fontSize:     '0.92rem',
                            padding:      '0.85rem 1rem 0.85rem 2.75rem',
                            outline:      'none',
                            backdropFilter: 'blur(12px)',
                        }}
                    />
                </motion.div>
            </section>

            {/* ---- ELECTIONS GRID ---- */}
            <main style={{
                maxWidth: '1100px',
                margin:   '0 auto',
                padding:  '0 1.5rem 5rem',
            }}>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        Loading elections...
                    </div>
                )}

                {error && (
                    <div style={{
                        textAlign:    'center',
                        padding:      '2rem',
                        color:        'var(--red)',
                        background:   'rgba(255,77,109,0.08)',
                        border:       '1px solid rgba(255,77,109,0.2)',
                        borderRadius: '12px',
                    }}>
                        {error}
                    </div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}
                    >
                        <Vote size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p>No elections available at the moment.</p>
                    </motion.div>
                )}

                <div style={{
                    display:             'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap:                 '1.25rem',
                    marginTop:           '1rem',
                }}>
                    {filtered.map((election, i) => (
                        <motion.div
                            key={election.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="glass-card"
                            style={{ overflow: 'hidden', cursor: 'pointer' }}
                            onClick={() => router.push(`/election/${election.id}`)}
                            whileHover={{ y: -4 }}
                        >
                            {/* Banner */}
                            <div style={{
                                height:     '120px',
                                background: election.banner_url
                                    ? `url(${election.banner_url}) center/cover`
                                    : 'linear-gradient(135deg, var(--bg-surface) 0%, var(--cyan-glow) 100%)',
                                borderBottom: '1px solid var(--border)',
                                display:    'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize:   '3rem',
                            }}>
                                {!election.banner_url && '🗳️'}
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                {/* Status */}
                                <div style={{
                                    display:       'inline-flex',
                                    alignItems:    'center',
                                    gap:           '0.4rem',
                                    fontSize:      '0.72rem',
                                    fontWeight:    600,
                                    letterSpacing: '0.06em',
                                    color:         statusColor(election.status),
                                    marginBottom:  '0.75rem',
                                }}>
                                    {statusLabel(election.status)}
                                </div>

                                <h3 style={{
                                    fontSize:      '1.05rem',
                                    fontWeight:    700,
                                    letterSpacing: '-0.02em',
                                    marginBottom:  '0.4rem',
                                    color:         'var(--text-primary)',
                                }}>
                                    {election.title}
                                </h3>

                                <p style={{
                                    fontSize:     '0.82rem',
                                    color:        'var(--text-secondary)',
                                    marginBottom: '1.25rem',
                                    lineHeight:   1.5,
                                }}>
                                    {election.organization}
                                </p>

                                {election.description && (
                                    <p style={{
                                        fontSize:     '0.8rem',
                                        color:        'var(--text-muted)',
                                        marginBottom: '1.25rem',
                                        lineHeight:   1.4,
                                    }}>
                                        {election.description.substring(0, 100)}
                                        {election.description.length > 100 ? '...' : ''}
                                    </p>
                                )}

                                {/* Footer */}
                                <div style={{
                                    display:        'flex',
                                    alignItems:     'center',
                                    justifyContent: 'space-between',
                                    paddingTop:     '1rem',
                                    borderTop:      '1px solid var(--border)',
                                }}>
                                    <div style={{
                                        display:  'flex',
                                        gap:      '0.75rem',
                                        fontSize: '0.75rem',
                                        color:    'var(--text-muted)',
                                    }}>
                                        {election.start_date && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Calendar size={12} />
                                                {new Date(election.start_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{
                                        display:     'flex',
                                        alignItems:  'center',
                                        gap:         '0.4rem',
                                        color:       'var(--cyan)',
                                        fontSize:    '0.82rem',
                                        fontWeight:  600,
                                    }}>
                                        {election.status === 'open' ? 'Vote Now' : 'View Results'}
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* ---- FOOTER ---- */}
            <footer style={{
                textAlign:    'center',
                padding:      '1.5rem',
                borderTop:    '1px solid var(--border)',
                color:        'var(--text-muted)',
                fontSize:     '0.8rem',
                position:     'relative',
                zIndex:       1,
            }}>
                {/* ⚠️ Replace with your institution name */}
                &copy; {new Date().getFullYear()} D-Evotes — Secure Digital Voting Platform
                &nbsp;·&nbsp;
                <Link href="/admin/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                    Admin
                </Link>
            </footer>
        </div>
    );
}