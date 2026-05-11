'use client';

// ============================================================
//  src/app/election/[id]/page.tsx
//  Election detail page — shows info + OTP generation form
// ============================================================

import { useEffect, useState }  from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion }               from 'framer-motion';
import { ArrowLeft, Calendar, Building2, KeyRound, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { electionsAPI, votersAPI } from '@/lib/api';
import ThemeToggle               from '@/components/ThemeToggle';
import Link                      from 'next/link';
import toast                     from 'react-hot-toast';

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

interface Position {
    id:         string;
    title:      string;
    candidates: any[];
}

export default function ElectionPage() {
    const params                          = useParams();
    const router                          = useRouter();
    const electionId                      = params.id as string;

    const [election,   setElection]       = useState<Election | null>(null);
    const [positions,  setPositions]      = useState<Position[]>([]);
    const [loading,    setLoading]        = useState(true);

    // OTP form state
    const [voterId,    setVoterId]        = useState('');
    const [otpResult,  setOtpResult]      = useState<any>(null);
    const [showOtp,    setShowOtp]        = useState(false);
    const [otpLoading, setOtpLoading]     = useState(false);
    const [otpError,   setOtpError]       = useState('');

    useEffect(() => {
        fetchElection();
    }, [electionId]);

    const fetchElection = async () => {
        try {
            const res = await electionsAPI.getOne(electionId);
            setElection(res.data.data.election);
            setPositions(res.data.data.positions || []);
        } catch {
            toast.error('Election not found.');
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!voterId.trim()) return;

        setOtpLoading(true);
        setOtpError('');
        setOtpResult(null);

        try {
            const res = await votersAPI.generateOTP({
                election_id: electionId,
                voter_id:    voterId.trim().toUpperCase(),
            });
            setOtpResult(res.data.data);
            toast.success('OTP generated successfully!');
        } catch (err: any) {
            setOtpError(err.response?.data?.message || 'Failed to generate OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    if (loading) return (
        <div style={{
            minHeight:      '100vh',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            color:          'var(--text-muted)',
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                Loading election...
            </div>
        </div>
    );

    if (!election) return null;

    const isOpen = election.status === 'open';

    return (
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

            {/* NAVBAR */}
            <nav style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '1rem 2rem',
                borderBottom:   '1px solid var(--border)',
                background:     'rgba(6,10,15,0.85)',
                backdropFilter: 'blur(16px)',
                position:       'sticky',
                top:            0,
                zIndex:         100,
            }}>
                <Link href="/" style={{
                    display:        'flex',
                    alignItems:     'center',
                    gap:            '0.5rem',
                    color:          'var(--text-secondary)',
                    textDecoration: 'none',
                    fontSize:       '0.88rem',
                    transition:     'color 0.2s',
                }}>
                    <ArrowLeft size={16} />
                    All Elections
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ThemeToggle />
                </div>
            </nav>

            {/* BANNER */}
            <div style={{
                height:     '200px',
                background: election.banner_url
                    ? `url(${election.banner_url}) center/cover`
                    : 'linear-gradient(135deg, var(--bg-surface) 0%, var(--cyan-glow) 100%)',
                borderBottom: '1px solid var(--border)',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position:   'relative',
            }}>
                {!election.banner_url && (
                    <span style={{ fontSize: '4rem', opacity: 0.4 }}>🗳️</span>
                )}
                {/* Status badge */}
                <div style={{
                    position:    'absolute',
                    bottom:      '1rem',
                    left:        '2rem',
                    display:     'inline-flex',
                    alignItems:  'center',
                    gap:         '0.5rem',
                    background:  isOpen ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.1)',
                    border:      `1px solid ${isOpen ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
                    color:       isOpen ? 'var(--green)' : 'var(--text-secondary)',
                    fontSize:    '0.75rem',
                    fontWeight:  600,
                    padding:     '0.35rem 0.85rem',
                    borderRadius: '100px',
                    backdropFilter: 'blur(8px)',
                }}>
                    <span style={{
                        width: '6px', height: '6px',
                        borderRadius: '50%',
                        background: 'currentColor',
                        display: 'inline-block',
                        ...(isOpen && { animation: 'blink 1.5s ease-in-out infinite' }),
                    }} />
                    {isOpen ? 'Voting Open' : election.status === 'results_published' ? 'Results Published' : 'Closed'}
                </div>
            </div>

            {/* MAIN */}
            <main style={{
                maxWidth: '900px',
                margin:   '0 auto',
                padding:  '2.5rem 1.5rem 5rem',
                display:  'grid',
                gridTemplateColumns: '1fr 380px',
                gap:      '2rem',
                alignItems: 'start',
            }}>

                {/* LEFT — Election Info */}
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div style={{
                            display:     'flex',
                            alignItems:  'center',
                            gap:         '0.6rem',
                            color:       'var(--text-secondary)',
                            fontSize:    '0.85rem',
                            marginBottom: '0.75rem',
                        }}>
                            <Building2 size={14} />
                            {election.organization}
                        </div>

                        <h1 style={{
                            fontSize:      'clamp(1.5rem, 3vw, 2.2rem)',
                            fontWeight:    700,
                            letterSpacing: '-0.03em',
                            marginBottom:  '1rem',
                            color:         'var(--text-primary)',
                        }}>
                            {election.title}
                        </h1>

                        {election.description && (
                            <p style={{
                                color:        'var(--text-secondary)',
                                fontSize:     '0.92rem',
                                lineHeight:   1.7,
                                marginBottom: '2rem',
                            }}>
                                {election.description}
                            </p>
                        )}

                        {election.start_date && (
                            <div style={{
                                display:     'flex',
                                alignItems:  'center',
                                gap:         '0.5rem',
                                color:       'var(--text-muted)',
                                fontSize:    '0.82rem',
                                marginBottom: '2rem',
                            }}>
                                <Calendar size={14} />
                                Started: {new Date(election.start_date).toLocaleDateString('en-GB', {
                                    day: 'numeric', month: 'long', year: 'numeric'
                                })}
                                {election.end_date && (
                                    <> · Ends: {new Date(election.end_date).toLocaleDateString('en-GB', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}</>
                                )}
                            </div>
                        )}

                        {/* Positions preview */}
                        {positions.length > 0 && (
                            <div>
                                <div style={{
                                    fontSize:      '0.75rem',
                                    fontWeight:    600,
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color:         'var(--text-muted)',
                                    marginBottom:  '1rem',
                                }}>
                                    Positions ({positions.length})
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {positions.map((pos, i) => (
                                        <motion.div
                                            key={pos.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.06 }}
                                            className="glass-card"
                                            style={{ padding: '1rem 1.25rem' }}
                                        >
                                            <div style={{
                                                display:        'flex',
                                                alignItems:     'center',
                                                justifyContent: 'space-between',
                                            }}>
                                                <div>
                                                    <div style={{
                                                        fontWeight:   600,
                                                        fontSize:     '0.92rem',
                                                        color:        'var(--text-primary)',
                                                        marginBottom: '0.2rem',
                                                    }}>
                                                        {pos.title}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '0.78rem',
                                                        color:    'var(--text-muted)',
                                                    }}>
                                                        {pos.candidates?.length || 0} candidate{pos.candidates?.length !== 1 ? 's' : ''}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontFamily:    'var(--font-mono)',
                                                    fontSize:      '0.72rem',
                                                    color:         'var(--cyan)',
                                                    background:    'var(--cyan-glow)',
                                                    border:        '1px solid var(--border-hover)',
                                                    padding:       '0.2rem 0.6rem',
                                                    borderRadius:  '4px',
                                                }}>
                                                    {String(i + 1).padStart(2, '0')}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results link */}
                        {election.status === 'results_published' && (
                            <Link
                                href={`/results/${electionId}`}
                                style={{
                                    display:        'inline-flex',
                                    alignItems:     'center',
                                    gap:            '0.5rem',
                                    marginTop:      '1.5rem',
                                    background:     'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                    color:          '#050a0e',
                                    fontWeight:     700,
                                    fontSize:       '0.9rem',
                                    padding:        '0.85rem 1.5rem',
                                    borderRadius:   '10px',
                                    textDecoration: 'none',
                                }}
                            >
                                View Results <ChevronRight size={16} />
                            </Link>
                        )}
                    </motion.div>
                </div>

                {/* RIGHT — OTP Form */}
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-card"
                        style={{ padding: '2rem', position: 'sticky', top: '5rem' }}
                    >
                        <div style={{
                            width:         '44px',
                            height:        '44px',
                            borderRadius:  '12px',
                            background:    'var(--cyan-glow)',
                            border:        '1px solid var(--border-hover)',
                            display:       'flex',
                            alignItems:    'center',
                            justifyContent: 'center',
                            marginBottom:  '1.25rem',
                        }}>
                            <KeyRound size={20} style={{ color: 'var(--cyan)' }} />
                        </div>

                        <div style={{
                            fontSize:      '1.1rem',
                            fontWeight:    700,
                            letterSpacing: '-0.02em',
                            marginBottom:  '0.4rem',
                        }}>
                            Get Your OTP
                        </div>
                        <div style={{
                            fontSize:     '0.83rem',
                            color:        'var(--text-secondary)',
                            lineHeight:   1.5,
                            marginBottom: '1.5rem',
                        }}>
                            Enter your registered Voter ID to receive your one-time password.
                        </div>

                        {/* Error */}
                        {otpError && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
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
                                ⚠️ {otpError}
                            </motion.div>
                        )}

                        {/* OTP Result */}
                        {otpResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    background:   'rgba(0,255,136,0.06)',
                                    border:       '1px solid rgba(0,255,136,0.2)',
                                    borderRadius: '12px',
                                    padding:      '1.5rem',
                                    textAlign:    'center',
                                    marginBottom: '1.25rem',
                                }}
                            >
                                {otpResult.voter_name && (
                                    <div style={{
                                        fontSize:     '0.85rem',
                                        color:        'var(--text-secondary)',
                                        marginBottom: '0.75rem',
                                    }}>
                                        Welcome, <strong style={{ color: 'var(--text-primary)' }}>
                                            {otpResult.voter_name}
                                        </strong>
                                    </div>
                                )}
                                <div style={{
                                    fontSize:      '0.72rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color:         'var(--text-muted)',
                                    marginBottom:  '0.6rem',
                                }}>
                                    Your One-Time Password
                                </div>
                                <div style={{
                                    display:        'flex',
                                    alignItems:     'center',
                                    justifyContent: 'center',
                                    gap:            '0.75rem',
                                }}>
                                    <div style={{
                                        fontFamily:    'var(--font-mono)',
                                        fontSize:      '2rem',
                                        fontWeight:    700,
                                        letterSpacing: '0.15em',
                                        color:         'var(--cyan)',
                                        textShadow:    '0 0 20px var(--cyan)',
                                        filter:        showOtp ? 'none' : 'blur(6px)',
                                        transition:    'filter 0.2s',
                                        userSelect:    showOtp ? 'all' : 'none',
                                    }}>
                                        {otpResult.otp}
                                    </div>
                                    <button
                                        onClick={() => setShowOtp(!showOtp)}
                                        style={{
                                            background: 'none',
                                            border:     'none',
                                            cursor:     'pointer',
                                            color:      'var(--text-muted)',
                                            padding:    '0.25rem',
                                        }}
                                    >
                                        {showOtp ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div style={{
                                    fontSize:   '0.75rem',
                                    color:      'var(--amber)',
                                    marginTop:  '0.75rem',
                                }}>
                                    ⚠️ Write this down — it will not be shown again.
                                </div>

                                {/* Go to login */}
                                <Link
                                    href={`/vote/${electionId}/login`}
                                    style={{
                                        display:        'inline-flex',
                                        alignItems:     'center',
                                        gap:            '0.5rem',
                                        marginTop:      '1.25rem',
                                        background:     'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                        color:          '#050a0e',
                                        fontWeight:     700,
                                        fontSize:       '0.88rem',
                                        padding:        '0.75rem 1.5rem',
                                        borderRadius:   '8px',
                                        textDecoration: 'none',
                                        width:          '100%',
                                        justifyContent: 'center',
                                    }}
                                >
                                    Proceed to Login <ChevronRight size={14} />
                                </Link>
                            </motion.div>
                        )}

                        {/* Form */}
                        {!otpResult && (
                            <form onSubmit={handleGenerateOTP}>
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={{
                                        display:       'block',
                                        fontSize:      '0.75rem',
                                        fontWeight:    600,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase',
                                        color:         'var(--text-secondary)',
                                        marginBottom:  '0.5rem',
                                    }}>
                                        Voter ID
                                    </label>
                                    <input
                                        type="text"
                                        value={voterId}
                                        onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                                        placeholder="e.g. STU001"
                                        autoComplete="off"
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
                                            letterSpacing: '0.06em',
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={otpLoading}
                                    style={{
                                        width:          '100%',
                                        background:     'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                        color:          '#050a0e',
                                        fontFamily:     'var(--font-space)',
                                        fontSize:       '0.92rem',
                                        fontWeight:     800,
                                        padding:        '0.9rem',
                                        border:         'none',
                                        borderRadius:   '8px',
                                        cursor:         otpLoading ? 'not-allowed' : 'pointer',
                                        opacity:        otpLoading ? 0.7 : 1,
                                        transition:     'all 0.2s',
                                    }}
                                >
                                    {otpLoading ? '⏳ Generating...' : '⚡ Generate My OTP'}
                                </button>
                            </form>
                        )}

                        {/* How it works */}
                        <div style={{
                            marginTop:    '1.5rem',
                            paddingTop:   '1.25rem',
                            borderTop:    '1px solid var(--border)',
                        }}>
                            <div style={{
                                fontSize:      '0.7rem',
                                fontWeight:    600,
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                color:         'var(--text-muted)',
                                marginBottom:  '0.75rem',
                            }}>
                                How It Works
                            </div>
                            {[
                                ['1', 'Enter your registered Voter ID'],
                                ['2', 'Get your unique one-time password'],
                                ['3', 'Login and cast your vote'],
                            ].map(([num, text]) => (
                                <div key={num} style={{
                                    display:      'flex',
                                    gap:          '0.75rem',
                                    marginBottom: '0.6rem',
                                    alignItems:   'flex-start',
                                }}>
                                    <div style={{
                                        width:         '20px',
                                        height:        '20px',
                                        borderRadius:  '50%',
                                        background:    'var(--cyan-glow)',
                                        border:        '1px solid var(--border-hover)',
                                        color:         'var(--cyan)',
                                        fontSize:      '0.65rem',
                                        fontWeight:    700,
                                        display:       'flex',
                                        alignItems:    'center',
                                        justifyContent: 'center',
                                        flexShrink:    0,
                                        fontFamily:    'var(--font-mono)',
                                    }}>
                                        {num}
                                    </div>
                                    <span style={{
                                        fontSize:  '0.8rem',
                                        color:     'var(--text-secondary)',
                                        lineHeight: 1.4,
                                        paddingTop: '0.1rem',
                                    }}>
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}