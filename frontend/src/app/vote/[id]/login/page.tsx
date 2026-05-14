'use client';

// ============================================================
//  src/app/vote/[id]/login/page.tsx — Voter Login
// ============================================================

import { useState }              from 'react';
import { useParams, useRouter }  from 'next/navigation';
import { motion }                from 'framer-motion';
import { ArrowLeft, LogIn }      from 'lucide-react';
import { votersAPI }             from '@/lib/api';
import { useVoterStore }         from '@/lib/store';
import ThemeToggle               from '@/components/ThemeToggle';
import Link                      from 'next/link';
import toast                     from 'react-hot-toast';

export default function VoterLoginPage() {
    const params                      = useParams();
    const router                      = useRouter();
    const electionId                  = params.id as string;
    const { setVoter }                = useVoterStore();

    const [voterId,   setVoterId]     = useState('');
    const [otp,       setOtp]         = useState('');
    const [loading,   setLoading]     = useState(false);
    const [error,     setError]       = useState('');
    const [showOtp,   setShowOtp]     = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voterId.trim() || !otp.trim()) return;

        setLoading(true);
        setError('');

        try {
            const res = await votersAPI.login({
                election_id: electionId,
                voter_id:    voterId.trim().toUpperCase(),
                otp:         otp.trim().toUpperCase(),
            });

            const { token, voter } = res.data.data;
            setVoter(voter, token);
            toast.success('Login successful! Redirecting to ballot...');
            router.push(`/vote/${electionId}/ballot`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
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
            {/* Glow */}
            <div style={{
                position:   'fixed',
                top:        '50%',
                left:       '50%',
                transform:  'translate(-50%, -50%)',
                width:      '500px',
                height:     '500px',
                background: 'radial-gradient(circle, var(--cyan-glow) 0%, transparent 65%)',
                pointerEvents: 'none',
            }} />

            {/* Navbar */}
            <nav style={{
                position:       'fixed',
                top:            0,
                left:           0,
                right:          0,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '1rem 2rem',
                borderBottom:   '1px solid var(--border)',
                background:     'rgba(6,10,15,0.85)',
                backdropFilter: 'blur(16px)',
                zIndex:         100,
            }}>
                <Link href={`/election/${electionId}`} style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            '0.5rem',
                    color:          'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize:       '0.88rem',
                }}>
                    <ArrowLeft size={16} /> Back
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
                    width:   '100%',
                    maxWidth: '420px',
                    padding: '2.5rem',
                    margin:  '1.5rem',
                }}
            >
                {/* Icon */}
                <div style={{
                    width:          '52px',
                    height:         '52px',
                    borderRadius:   '14px',
                    background:     'var(--cyan-glow)',
                    border:         '1px solid var(--border-hover)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    marginBottom:   '1.5rem',
                    boxShadow:      '0 0 20px var(--cyan-glow)',
                }}>
                    <LogIn size={22} style={{ color: 'var(--cyan)' }} />
                </div>

                <h1 style={{
                    fontSize:      '1.5rem',
                    fontWeight:    700,
                    letterSpacing: '-0.03em',
                    marginBottom:  '0.4rem',
                }}>
                    Voter Login
                </h1>
                <p style={{
                    fontSize:     '0.85rem',
                    color:        'var(--text-secondary)',
                    marginBottom: '2rem',
                    lineHeight:   1.5,
                }}>
                    Enter your Voter ID and the OTP you generated to access the ballot.
                </p>

                {/* Error */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0  }}
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
                    {/* Voter ID */}
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
                            Voter ID (Username)
                        </label>
                        <input
                            type="text"
                            value={voterId}
                            onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                            placeholder="e.g. STU001"
                            autoComplete="off"
                            required
                            style={{
                                width:         '100%',
                                background:    'var(--bg-input)',
                                border:        '1px solid var(--border)',
                                borderRadius:  '8px',
                                color:         'var(--text-primary)',
                                fontFamily:    'var(--font-mono)',
                                fontSize:      '0.95rem',
                                padding:       '0.8rem 1rem',
                                outline:       'none',
                                letterSpacing: '0.06em',
                            }}
                        />
                    </div>

                    {/* OTP */}
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
                            OTP (Password)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showOtp ? 'text' : 'password'}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                                placeholder="e.g. ABCD2026"
                                autoComplete="off"
                                required
                                style={{
                                    width:         '100%',
                                    background:    'var(--bg-input)',
                                    border:        '1px solid var(--border)',
                                    borderRadius:  '8px',
                                    color:         'var(--text-primary)',
                                    fontFamily:    'var(--font-mono)',
                                    fontSize:      '0.95rem',
                                    padding:       '0.8rem 2.75rem 0.8rem 1rem',
                                    outline:       'none',
                                    letterSpacing: '0.06em',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowOtp(!showOtp)}
                                style={{
                                    position:   'absolute',
                                    right:      '0.85rem',
                                    top:        '50%',
                                    transform:  'translateY(-50%)',
                                    background: 'none',
                                    border:     'none',
                                    cursor:     'pointer',
                                    color:      'var(--text-muted)',
                                    fontSize:   '0.85rem',
                                    padding:    '0.25rem',
                                }}
                            >
                                {showOtp ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width:        '100%',
                            background:   'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                            color:        '#050a0e',
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
                        {loading ? '⏳ Logging in...' : '→ Login & Access Ballot'}
                    </button>
                </form>

                {/* Footer */}
                <div style={{
                    textAlign:   'center',
                    marginTop:   '1.5rem',
                    fontSize:    '0.83rem',
                    color:       'var(--text-muted)',
                }}>
                    Don't have an OTP?{' '}
                    <Link href={`/election/${electionId}`} style={{
                        color:          'var(--cyan)',
                        textDecoration: 'none',
                        fontWeight:     600,
                    }}>
                        Generate one here
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}