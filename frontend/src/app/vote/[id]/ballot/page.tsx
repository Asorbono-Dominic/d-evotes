'use client';

// ============================================================
//  src/app/vote/[id]/ballot/page.tsx — The Voting Ballot
// ============================================================

import { useEffect, useState }   from 'react';
import { useParams, useRouter }  from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoterStore }         from '@/lib/store';
import { electionsAPI, votesAPI } from '@/lib/api';
import ThemeToggle               from '@/components/ThemeToggle';
import toast                     from 'react-hot-toast';
import Image                     from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Candidate {
    id:        string;
    full_name: string;
    bio:       string;
    photo_url: string;
}

interface Position {
    id:         string;
    title:      string;
    candidates: Candidate[];
}

export default function BallotPage() {
    const params                          = useParams();
    const router                          = useRouter();
    const electionId                      = params.id as string;
    const { voter, token, logout }        = useVoterStore();

    const [positions,  setPositions]      = useState<Position[]>([]);
    const [election,   setElection]       = useState<any>(null);
    const [selections, setSelections]     = useState<Record<string, string>>({});
    const [loading,    setLoading]        = useState(true);
    const [submitting, setSubmitting]     = useState(false);
    const [showModal,  setShowModal]      = useState(false);

    useEffect(() => {
        if (!voter || !token) {
            router.push(`/vote/${electionId}/login`);
            return;
        }
        fetchBallot();
    }, [voter, token]);

    const fetchBallot = async () => {
        try {
            const res = await electionsAPI.getOne(electionId);
            setElection(res.data.data.election);
            setPositions(res.data.data.positions || []);
        } catch {
            toast.error('Failed to load ballot.');
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (positionId: string, candidateId: string) => {
        setSelections(prev => ({ ...prev, [positionId]: candidateId }));
    };

    const totalPositions  = positions.length;
    const totalSelected   = Object.keys(selections).length;
    const progressPct     = totalPositions > 0
        ? Math.round((totalSelected / totalPositions) * 100)
        : 0;
    const allSelected     = totalSelected === totalPositions && totalPositions > 0;

    const handleSubmit = async () => {
        if (!allSelected) return;

        setSubmitting(true);
        try {
            const votes = Object.entries(selections).map(([position_id, candidate_id]) => ({
                position_id,
                candidate_id,
            }));

            const res = await votesAPI.castVote({ election_id: electionId, votes });
            const { confirmation_code } = res.data.data;

            logout(); // Clear voter session after voting
            router.push(`/vote/${electionId}/confirmation?code=${confirmation_code}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to submit vote. Please try again.');
            setShowModal(false);
        } finally {
            setSubmitting(false);
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
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗳️</div>
                Loading your ballot...
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

            {/* NAVBAR */}
            <nav style={{
                position:       'sticky',
                top:            0,
                zIndex:         100,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                padding:        '1rem 2rem',
                borderBottom:   '1px solid var(--border)',
                background:     'rgba(6,10,15,0.9)',
                backdropFilter: 'blur(16px)',
            }}>
                <div style={{
                    fontSize:  '0.9rem',
                    fontWeight: 700,
                    color:     'var(--cyan)',
                }}>
                    🗳️ {election?.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Voter badge */}
                    <div style={{
                        fontFamily:   'var(--font-mono)',
                        fontSize:     '0.75rem',
                        color:        'var(--cyan)',
                        background:   'var(--cyan-glow)',
                        border:       '1px solid var(--border-hover)',
                        padding:      '0.25rem 0.75rem',
                        borderRadius: '6px',
                    }}>
                        {voter?.voter_id}
                    </div>
                    <ThemeToggle />
                </div>
            </nav>

            {/* PAGE HEADER */}
            <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 1.5rem' }}>
                <h1 style={{
                    fontSize:      'clamp(1.5rem, 3vw, 2rem)',
                    fontWeight:    700,
                    letterSpacing: '-0.03em',
                    background:    'linear-gradient(135deg, var(--text-primary) 0%, var(--cyan) 70%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom:  '0.5rem',
                }}>
                    Official Ballot
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                    Select one candidate per position. Review carefully — votes are final.
                </p>

                {/* Progress bar */}
                <div style={{ maxWidth: '480px', margin: '1.5rem auto 0' }}>
                    <div style={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        fontSize:       '0.75rem',
                        color:          'var(--text-muted)',
                        marginBottom:   '0.4rem',
                    }}>
                        <span>{totalSelected} of {totalPositions} positions selected</span>
                        <span>{progressPct}%</span>
                    </div>
                    <div style={{
                        height:       '4px',
                        background:   'var(--border)',
                        borderRadius: '2px',
                        overflow:     'hidden',
                    }}>
                        <motion.div
                            style={{
                                height:       '100%',
                                borderRadius: '2px',
                                background:   'linear-gradient(90deg, var(--cyan), var(--green))',
                            }}
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                </div>
            </div>

            {/* BALLOT */}
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem 8rem' }}>
                {positions.map((position, posIdx) => (
                    <motion.div
                        key={position.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: posIdx * 0.08 }}
                        style={{ marginBottom: '3rem' }}
                    >
                        {/* Position header */}
                        <div style={{
                            display:     'flex',
                            alignItems:  'center',
                            gap:         '1rem',
                            marginBottom: '1.25rem',
                        }}>
                            <span style={{
                                fontFamily:    'var(--font-mono)',
                                fontSize:      '0.7rem',
                                fontWeight:    700,
                                color:         'var(--cyan)',
                                background:    'var(--cyan-glow)',
                                border:        '1px solid var(--border-hover)',
                                padding:       '0.2rem 0.6rem',
                                borderRadius:  '4px',
                            }}>
                                {String(posIdx + 1).padStart(2, '0')}
                            </span>
                            <h2 style={{
                                fontSize:      '1.1rem',
                                fontWeight:    700,
                                letterSpacing: '-0.02em',
                                color:         'var(--text-primary)',
                                flex:          1,
                            }}>
                                {position.title}
                            </h2>
                            {selections[position.id] && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{
                                        fontSize:   '0.72rem',
                                        fontWeight: 600,
                                        color:      'var(--green)',
                                    }}
                                >
                                    ✓ Selected
                                </motion.span>
                            )}
                        </div>

                        <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.25rem' }} />

                        {/* Candidates grid */}
                        <div style={{
                            display:             'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap:                 '1rem',
                        }}>
                            {position.candidates.map((candidate) => {
                                const isSelected = selections[position.id] === candidate.id;
                                return (
                                    <motion.div
                                        key={candidate.id}
                                        onClick={() => handleSelect(position.id, candidate.id)}
                                        whileHover={{ y: -3 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            position:     'relative',
                                            background:   isSelected
                                                ? 'rgba(0,229,255,0.06)'
                                                : 'var(--bg-card)',
                                            border:       isSelected
                                                ? '1px solid var(--cyan)'
                                                : '1px solid var(--border)',
                                            borderRadius: '14px',
                                            padding:      '1.5rem 1.25rem 1.25rem',
                                            cursor:       'pointer',
                                            textAlign:    'center',
                                            backdropFilter: 'blur(12px)',
                                            boxShadow:    isSelected
                                                ? '0 0 0 1px var(--cyan), 0 0 30px var(--cyan-glow)'
                                                : 'none',
                                            transition:   'all 0.2s',
                                        }}
                                    >
                                        {/* Checkmark */}
                                        <AnimatePresence>
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    style={{
                                                        position:       'absolute',
                                                        top:            '0.75rem',
                                                        right:          '0.75rem',
                                                        width:          '22px',
                                                        height:         '22px',
                                                        borderRadius:   '50%',
                                                        background:     'var(--cyan)',
                                                        color:          '#050a0e',
                                                        fontSize:       '0.65rem',
                                                        fontWeight:     900,
                                                        display:        'flex',
                                                        alignItems:     'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    ✓
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Photo */}
                                        <div style={{
                                            width:        '80px',
                                            height:       '80px',
                                            borderRadius: '50%',
                                            overflow:     'hidden',
                                            margin:       '0 auto 1rem',
                                            border:       isSelected
                                                ? '2px solid var(--cyan)'
                                                : '2px solid var(--border)',
                                            boxShadow:    isSelected
                                                ? '0 0 15px var(--cyan-glow)'
                                                : 'none',
                                            transition:   'all 0.2s',
                                            background:   'var(--bg-surface)',
                                        }}>
                                            <img
                                                src={candidate.photo_url?.startsWith('/')
                                                    ? `${API_URL}${candidate.photo_url}`
                                                    : candidate.photo_url || '/default-avatar.png'
                                                }
                                                alt={candidate.full_name}
                                                style={{
                                                    width:     '100%',
                                                    height:    '100%',
                                                    objectFit: 'cover',
                                                }}
                                                onError={(e: any) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=0d1520&color=00e5ff&size=80`;
                                                }}
                                            />
                                        </div>

                                        <div style={{
                                            fontWeight:   700,
                                            fontSize:     '0.92rem',
                                            color:        'var(--text-primary)',
                                            marginBottom: '0.35rem',
                                            letterSpacing: '-0.01em',
                                        }}>
                                            {candidate.full_name}
                                        </div>

                                        {candidate.bio && (
                                            <div style={{
                                                fontSize:  '0.76rem',
                                                color:     'var(--text-secondary)',
                                                lineHeight: 1.4,
                                            }}>
                                                {candidate.bio.substring(0, 80)}
                                                {candidate.bio.length > 80 ? '...' : ''}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* STICKY SUBMIT FOOTER */}
            <div style={{
                position:   'fixed',
                bottom:     0,
                left:       0,
                right:      0,
                background: 'linear-gradient(to top, var(--bg-base) 60%, transparent)',
                padding:    '2rem 1.5rem 1.5rem',
                zIndex:     50,
            }}>
                <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{
                        fontSize:     '0.82rem',
                        color:        allSelected ? 'var(--green)' : 'var(--text-muted)',
                        marginBottom: '0.85rem',
                        transition:   'color 0.2s',
                    }}>
                        {allSelected
                            ? '✅ All selections complete — ready to submit!'
                            : `${totalPositions - totalSelected} position${totalPositions - totalSelected !== 1 ? 's' : ''} still need${totalPositions - totalSelected === 1 ? 's' : ''} a selection`
                        }
                    </div>
                    <motion.button
                        onClick={() => allSelected && setShowModal(true)}
                        disabled={!allSelected}
                        whileHover={allSelected ? { y: -2 } : {}}
                        whileTap={allSelected ? { scale: 0.98 } : {}}
                        style={{
                            width:        '100%',
                            background:   allSelected
                                ? 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))'
                                : 'var(--border)',
                            color:        allSelected ? '#050a0e' : 'var(--text-muted)',
                            fontFamily:   'var(--font-space)',
                            fontSize:     '1rem',
                            fontWeight:   800,
                            padding:      '1.1rem',
                            border:       'none',
                            borderRadius: '12px',
                            cursor:       allSelected ? 'pointer' : 'not-allowed',
                            transition:   'all 0.2s',
                            boxShadow:    allSelected ? '0 8px 30px var(--cyan-glow)' : 'none',
                        }}
                    >
                        🗳️ &nbsp; Submit My Vote
                    </motion.button>
                </div>
            </div>

            {/* CONFIRM MODAL */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !submitting && setShowModal(false)}
                        style={{
                            position:       'fixed',
                            inset:          0,
                            background:     'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(8px)',
                            zIndex:         200,
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'center',
                            padding:        '1.5rem',
                        }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background:   'var(--bg-surface)',
                                border:       '1px solid var(--border-hover)',
                                borderRadius: '20px',
                                padding:      '2.5rem',
                                maxWidth:     '400px',
                                width:        '100%',
                                textAlign:    'center',
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                            <h3 style={{
                                fontSize:      '1.2rem',
                                fontWeight:    700,
                                marginBottom:  '0.6rem',
                                letterSpacing: '-0.02em',
                            }}>
                                Confirm Your Vote
                            </h3>
                            <p style={{
                                fontSize:     '0.87rem',
                                color:        'var(--text-secondary)',
                                lineHeight:   1.6,
                                marginBottom: '2rem',
                            }}>
                                You are about to submit your ballot. This action is
                                <strong style={{ color: 'var(--text-primary)' }}> permanent </strong>
                                and cannot be undone. Are you sure?
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={submitting}
                                    style={{
                                        background:   'transparent',
                                        border:       '1px solid var(--border-hover)',
                                        color:        'var(--text-secondary)',
                                        fontFamily:   'var(--font-space)',
                                        fontSize:     '0.88rem',
                                        fontWeight:   600,
                                        padding:      '0.85rem',
                                        borderRadius: '8px',
                                        cursor:       'pointer',
                                    }}
                                >
                                    ← Review Again
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    style={{
                                        background:   'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                        color:        '#050a0e',
                                        fontFamily:   'var(--font-space)',
                                        fontSize:     '0.88rem',
                                        fontWeight:   800,
                                        padding:      '0.85rem',
                                        border:       'none',
                                        borderRadius: '8px',
                                        cursor:       submitting ? 'not-allowed' : 'pointer',
                                        opacity:      submitting ? 0.7 : 1,
                                    }}
                                >
                                    {submitting ? '⏳ Submitting...' : 'Submit Ballot ✓'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}