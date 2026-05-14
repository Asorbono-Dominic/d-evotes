'use client';

// ============================================================
//  src/app/results/[id]/page.tsx — Election Results Page
// ============================================================

import { useEffect, useState }  from 'react';
import { useParams }            from 'next/navigation';
import { motion }               from 'framer-motion';
import { ArrowLeft, Trophy, Users, TrendingUp, Clock } from 'lucide-react';
import { electionsAPI }         from '@/lib/api';
import ThemeToggle              from '@/components/ThemeToggle';
import Link                     from 'next/link';
import toast                    from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Candidate {
    id:         string;
    full_name:  string;
    photo_url:  string;
    vote_count: number;
}

interface PositionResult {
    id:          string;
    title:       string;
    candidates:  Candidate[];
    total_votes: number;
}

interface Stats {
    total_voters: number;
    total_voted:  number;
    turnout_pct:  number;
}

export default function ResultsPage() {
    const params                      = useParams();
    const electionId                  = params.id as string;

    const [election,  setElection]    = useState<any>(null);
    const [results,   setResults]     = useState<PositionResult[]>([]);
    const [stats,     setStats]       = useState<Stats | null>(null);
    const [loading,   setLoading]     = useState(true);
    const [error,     setError]       = useState('');

    useEffect(() => {
        fetchResults();
        // Auto-refresh every 30s if voting is open
        const interval = setInterval(fetchResults, 30000);
        return () => clearInterval(interval);
    }, [electionId]);

    const fetchResults = async () => {
        try {
            const res = await electionsAPI.getResults(electionId);
            setElection(res.data.data.election);
            setResults(res.data.data.results || []);
            setStats(res.data.data.stats);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load results.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                Loading results...
            </div>
        </div>
    );

    if (error) return (
        <div style={{
            minHeight: '100vh', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
        }}>
            <div style={{
                textAlign: 'center', maxWidth: '400px',
                background: 'rgba(255,77,109,0.08)',
                border: '1px solid rgba(255,77,109,0.2)',
                borderRadius: '16px', padding: '2rem',
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ marginBottom: '0.5rem' }}>Results Not Available</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{error}</p>
                <Link href="/" style={{
                    display: 'inline-block', marginTop: '1.5rem',
                    color: 'var(--cyan)', textDecoration: 'none',
                }}>← Back to Home</Link>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

            {/* NAVBAR */}
            <nav style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2rem',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(6,10,15,0.85)',
                backdropFilter: 'blur(16px)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <Link href="/" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
                }}>
                    <ArrowLeft size={16} /> All Elections
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {election?.status === 'open' && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            fontSize: '0.72rem', fontWeight: 600,
                            color: 'var(--green)',
                            background: 'rgba(0,255,136,0.08)',
                            border: '1px solid rgba(0,255,136,0.2)',
                            padding: '0.3rem 0.75rem', borderRadius: '100px',
                        }}>
                            <span className="animate-blink" style={{
                                display: 'inline-block', width: '6px', height: '6px',
                                borderRadius: '50%', background: 'currentColor',
                            }} />
                            Live
                        </div>
                    )}
                    <ThemeToggle />
                </div>
            </nav>

            {/* HEADER */}
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem 2rem' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                        fontWeight: 700, letterSpacing: '-0.04em',
                        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--cyan) 70%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                    }}
                >
                    Election Results
                </motion.h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {election?.title} · {election?.organization}
                </p>
            </div>

            {/* STATS ROW */}
            {stats && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        display: 'flex', gap: '1rem', flexWrap: 'wrap',
                        justifyContent: 'center', padding: '0 1.5rem 2.5rem',
                    }}
                >
                    {[
                        { icon: <Trophy size={18} />, value: stats.total_voted, label: 'Votes Cast', color: 'var(--cyan)' },
                        { icon: <Users size={18} />, value: stats.total_voters, label: 'Registered Voters', color: 'var(--text-primary)' },
                        { icon: <TrendingUp size={18} />, value: `${stats.turnout_pct}%`, label: 'Voter Turnout', color: 'var(--green)' },
                        { icon: <Clock size={18} />, value: results.length, label: 'Positions', color: 'var(--amber)' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.05 }}
                            className="glass-card"
                            style={{ padding: '1.25rem 1.75rem', textAlign: 'center', minWidth: '140px' }}
                        >
                            <div style={{ color: stat.color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                                {stat.icon}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)', fontSize: '1.8rem',
                                fontWeight: 700, color: stat.color,
                                textShadow: `0 0 20px ${stat.color}40`,
                            }}>
                                {stat.value.toLocaleString()}
                            </div>
                            <div style={{
                                fontSize: '0.72rem', letterSpacing: '0.06em',
                                textTransform: 'uppercase', color: 'var(--text-muted)',
                                marginTop: '0.25rem',
                            }}>
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* RESULTS */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 5rem' }}>
                {results.map((position, posIdx) => (
                    <motion.div
                        key={position.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: posIdx * 0.08 }}
                        style={{ marginBottom: '3rem' }}
                    >
                        {/* Position header */}
                        <div style={{
                            display: 'flex', alignItems: 'center',
                            gap: '1rem', marginBottom: '1.25rem',
                        }}>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
                                color: 'var(--cyan)', background: 'var(--cyan-glow)',
                                border: '1px solid var(--border-hover)',
                                padding: '0.2rem 0.6rem', borderRadius: '4px',
                            }}>
                                {String(posIdx + 1).padStart(2, '0')}
                            </span>
                            <h2 style={{
                                fontSize: '1.1rem', fontWeight: 700,
                                letterSpacing: '-0.02em', color: 'var(--text-primary)',
                            }}>
                                {position.title}
                            </h2>
                            <span style={{
                                marginLeft: 'auto', fontSize: '0.78rem',
                                color: 'var(--text-muted)',
                            }}>
                                {position.total_votes} vote{position.total_votes !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.25rem' }} />

                        {/* Candidates */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {position.candidates.map((candidate, cIdx) => {
                                const isWinner  = cIdx === 0 && candidate.vote_count > 0;
                                const pct       = position.total_votes > 0
                                    ? Math.round((candidate.vote_count / position.total_votes) * 100)
                                    : 0;

                                return (
                                    <motion.div
                                        key={candidate.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: posIdx * 0.08 + cIdx * 0.05 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            background: isWinner ? 'rgba(0,255,136,0.04)' : 'var(--bg-card)',
                                            border: `1px solid ${isWinner ? 'rgba(0,255,136,0.25)' : 'var(--border)'}`,
                                            borderRadius: '14px', padding: '1rem 1.25rem',
                                            backdropFilter: 'blur(8px)',
                                        }}
                                    >
                                        {/* Photo */}
                                        <div style={{
                                            width: '48px', height: '48px',
                                            borderRadius: '50%', overflow: 'hidden',
                                            border: isWinner ? '2px solid var(--green)' : '2px solid var(--border)',
                                            flexShrink: 0, background: 'var(--bg-surface)',
                                        }}>
                                            <img
                                                src={candidate.photo_url?.startsWith('/')
                                                    ? `${API_URL}${candidate.photo_url}`
                                                    : candidate.photo_url || '/default-avatar.png'
                                                }
                                                alt={candidate.full_name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e: any) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=0d1520&color=00e5ff&size=48`;
                                                }}
                                            />
                                        </div>

                                        {/* Info + bar */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center',
                                                gap: '0.5rem', marginBottom: '0.4rem',
                                            }}>
                                                <span style={{
                                                    fontSize: '0.92rem', fontWeight: 700,
                                                    color: 'var(--text-primary)', letterSpacing: '-0.01em',
                                                }}>
                                                    {candidate.full_name}
                                                </span>
                                                {isWinner && (
                                                    <span style={{ fontSize: '0.85rem' }}>🏆</span>
                                                )}
                                            </div>
                                            {/* Bar */}
                                            <div style={{
                                                height: '6px', borderRadius: '3px',
                                                background: 'rgba(255,255,255,0.06)',
                                                overflow: 'hidden',
                                            }}>
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 1.2, ease: 'easeOut', delay: posIdx * 0.08 + cIdx * 0.05 }}
                                                    style={{
                                                        height: '100%', borderRadius: '3px',
                                                        background: isWinner
                                                            ? 'linear-gradient(90deg, var(--green), #00cc6a)'
                                                            : 'linear-gradient(90deg, var(--cyan-dim), #005f8a)',
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {/* Count */}
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '1.1rem', fontWeight: 700,
                                                color: 'var(--text-primary)',
                                            }}>
                                                {candidate.vote_count.toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                {pct}%
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}

                {results.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        No results available yet.
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer style={{
                textAlign: 'center', padding: '1.5rem',
                borderTop: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: '0.8rem',
                position: 'relative', zIndex: 1,
            }}>
                {election?.status === 'open'
                    ? '🔄 Results update automatically every 30 seconds'
                    : '✅ Final Results'}
            </footer>
        </div>
    );
}