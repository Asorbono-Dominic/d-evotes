'use client';

// ============================================================
//  src/app/election/[id]/candidate/[cid]/page.tsx
//  Public candidate profile page
// ============================================================

import { useEffect, useState }  from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion }               from 'framer-motion';
import { ArrowLeft, Award, User } from 'lucide-react';
import { candidatesAPI, electionsAPI } from '@/lib/api';
import ThemeToggle              from '@/components/ThemeToggle';
import Link                     from 'next/link';
import toast                    from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function CandidateProfilePage() {
    const params                      = useParams();
    const router                      = useRouter();
    const electionId                  = params.id  as string;
    const candidateId                 = params.cid as string;

    const [candidate,  setCandidate]  = useState<any>(null);
    const [election,   setElection]   = useState<any>(null);
    const [position,   setPosition]   = useState<any>(null);
    const [others,     setOthers]     = useState<any[]>([]);
    const [loading,    setLoading]    = useState(true);

    useEffect(() => { fetchData(); }, [electionId, candidateId]);

    const fetchData = async () => {
        try {
            const [elRes, candRes] = await Promise.all([
                electionsAPI.getOne(electionId),
                candidatesAPI.getCandidates(electionId),
            ]);

            const el         = elRes.data.data.election;
            const positions  = elRes.data.data.positions || [];
            const candidates = candRes.data.data.candidates || [];

            const found = candidates.find((c: any) => c.id === candidateId);
            if (!found) { toast.error('Candidate not found.'); router.push(`/election/${electionId}`); return; }

            const pos = positions.find((p: any) => p.id === found.position_id);
            const same = candidates.filter((c: any) => c.position_id === found.position_id && c.id !== candidateId);

            setElection(el);
            setCandidate(found);
            setPosition(pos);
            setOthers(same);
        } catch {
            toast.error('Failed to load candidate.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👤</div>
                Loading profile...
            </div>
        </div>
    );

    if (!candidate) return null;

    const photoSrc = candidate.photo_url?.startsWith('/')
        ? `${API_URL}${candidate.photo_url}`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=0d1520&color=00e5ff&size=200`;

    return (
        <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

            {/* NAVBAR */}
            <nav style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem 2rem', borderBottom: '1px solid var(--border)',
                background: 'rgba(6,10,15,0.85)', backdropFilter: 'blur(16px)',
                position: 'sticky', top: 0, zIndex: 100,
            }}>
                <Link href={`/election/${electionId}`} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.88rem',
                }}>
                    <ArrowLeft size={16} /> Back to Election
                </Link>
                <ThemeToggle />
            </nav>

            <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

                {/* Profile card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '2.5rem', marginBottom: '2rem', display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}
                >
                    {/* Photo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ flexShrink: 0 }}
                    >
                        <div style={{
                            width: '160px', height: '160px', borderRadius: '50%',
                            overflow: 'hidden', border: '3px solid var(--cyan)',
                            boxShadow: '0 0 30px var(--cyan-glow)',
                            background: 'var(--bg-surface)',
                        }}>
                            <img
                                src={photoSrc}
                                alt={candidate.full_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e: any) => {
                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.full_name)}&background=0d1520&color=00e5ff&size=200`;
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        style={{ flex: 1, minWidth: '200px' }}
                    >
                        {/* Position badge */}
                        {position && (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                background: 'var(--cyan-glow)', border: '1px solid var(--border-hover)',
                                color: 'var(--cyan)', fontSize: '0.75rem', fontWeight: 600,
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                padding: '0.3rem 0.85rem', borderRadius: '100px', marginBottom: '1rem',
                            }}>
                                <Award size={12} />
                                Running for {position.title}
                            </div>
                        )}

                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 700,
                            letterSpacing: '-0.03em', marginBottom: '0.5rem',
                            color: 'var(--text-primary)',
                        }}>
                            {candidate.full_name}
                        </h1>

                        <p style={{
                            fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem',
                        }}>
                            {election?.organization} · {election?.title}
                        </p>

                        {/* Bio */}
                        {candidate.bio ? (
                            <div>
                                <div style={{
                                    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em',
                                    textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem',
                                }}>
                                    About / Manifesto
                                </div>
                                <p style={{
                                    fontSize: '0.95rem', color: 'var(--text-secondary)',
                                    lineHeight: 1.8, whiteSpace: 'pre-wrap',
                                }}>
                                    {candidate.bio}
                                </p>
                            </div>
                        ) : (
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No biography provided.
                            </p>
                        )}

                        {/* Vote CTA */}
                        {election?.status === 'open' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{ marginTop: '1.75rem' }}
                            >
                                <Link
                                    href={`/election/${electionId}`}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                        background: 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                        color: '#050a0e', fontWeight: 800, fontSize: '0.92rem',
                                        padding: '0.85rem 1.75rem', borderRadius: '10px',
                                        textDecoration: 'none',
                                    }}
                                >
                                    🗳️ Vote in This Election
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>

                {/* Other candidates for same position */}
                {others.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <h2 style={{
                            fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em',
                            marginBottom: '1rem', color: 'var(--text-secondary)',
                        }}>
                            Other candidates for {position?.title}
                        </h2>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '1rem',
                        }}>
                            {others.map((c, i) => (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.06 }}
                                    whileHover={{ y: -3 }}
                                >
                                    <Link
                                        href={`/election/${electionId}/candidate/${c.id}`}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center', cursor: 'pointer' }}>
                                            <div style={{
                                                width: '64px', height: '64px', borderRadius: '50%',
                                                overflow: 'hidden', margin: '0 auto 0.75rem',
                                                border: '2px solid var(--border)',
                                                background: 'var(--bg-surface)',
                                            }}>
                                                <img
                                                    src={c.photo_url?.startsWith('/') ? `${API_URL}${c.photo_url}`
                                                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=0d1520&color=00e5ff&size=64`
                                                    }
                                                    alt={c.full_name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {c.full_name}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', marginTop: '0.3rem' }}>
                                                View Profile →
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}