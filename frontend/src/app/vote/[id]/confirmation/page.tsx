'use client';

// ============================================================
//  src/app/vote/[id]/confirmation/page.tsx
//  Post-vote confirmation with print support
// ============================================================

import { useSearchParams, useParams } from 'next/navigation';
import { motion }                     from 'framer-motion';
import Link                           from 'next/link';
import ThemeToggle                    from '@/components/ThemeToggle';

export default function ConfirmationPage() {
    const params       = useParams();
    const searchParams = useSearchParams();
    const electionId   = params.id as string;
    const code         = searchParams.get('code') || 'VOTE-XXXXXXXX';
    const now          = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

    const handlePrint = () => window.print();

    return (
        <>
            {/* ---- PRINT STYLES (only active when printing) ---- */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area {
                        position: fixed;
                        top: 0; left: 0;
                        width: 100%;
                        padding: 2rem;
                        background: white;
                        color: black;
                    }
                    .no-print { display: none !important; }
                    .print-logo { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
                    .print-title { font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem; }
                    .print-code {
                        font-family: monospace;
                        font-size: 1.4rem;
                        font-weight: bold;
                        border: 2px solid black;
                        padding: 0.5rem 1rem;
                        display: inline-block;
                        margin: 0.75rem 0;
                    }
                    .print-divider { border-top: 1px solid #ccc; margin: 1rem 0; }
                    .print-footer { font-size: 0.75rem; color: #666; margin-top: 1rem; }
                }
            `}</style>

            <div style={{
                minHeight: '100vh', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                position: 'relative', zIndex: 1, padding: '1.5rem',
            }}>
                {/* Glow */}
                <div style={{
                    position: 'fixed', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 65%)',
                    pointerEvents: 'none',
                }} />

                {/* Navbar */}
                <nav className="no-print" style={{
                    position: 'fixed', top: 0, left: 0, right: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    padding: '1rem 2rem', borderBottom: '1px solid var(--border)',
                    background: 'rgba(6,10,15,0.85)', backdropFilter: 'blur(16px)', zIndex: 100,
                }}>
                    <ThemeToggle />
                </nav>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="glass-card"
                    style={{ maxWidth: '460px', width: '100%', padding: '3rem 2.5rem', textAlign: 'center' }}
                >
                    {/* Success icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
                        style={{
                            width: '90px', height: '90px', borderRadius: '50%',
                            background: 'rgba(0,255,136,0.1)', border: '2px solid var(--green)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2rem', fontSize: '2.5rem',
                            boxShadow: '0 0 40px rgba(0,255,136,0.2)',
                        }}
                    >
                        ✅
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        style={{ fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--green)', marginBottom: '0.75rem' }}
                    >
                        Vote Recorded!
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}
                    >
                        Your ballot has been securely submitted and recorded.
                        Thank you for participating in this election.
                    </motion.p>

                    {/* Confirmation code */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        style={{
                            background: 'var(--cyan-glow)', border: '1px solid var(--border-hover)',
                            borderRadius: '10px', padding: '1rem', marginBottom: '2rem',
                        }}
                    >
                        <div style={{ fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            Confirmation Code
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700,
                            color: 'var(--cyan)', letterSpacing: '0.08em', marginBottom: '0.35rem',
                        }}>
                            {code}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{now}</div>
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
                    >
                        <Link href={`/results/${electionId}`} style={{
                            flex: 1, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center', gap: '0.4rem',
                            background: 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                            color: '#050a0e', fontWeight: 700, fontSize: '0.88rem',
                            padding: '0.85rem', borderRadius: '8px', textDecoration: 'none', minWidth: '120px',
                        }}>
                            📊 Results
                        </Link>

                        {/* Print button */}
                        <button
                            onClick={handlePrint}
                            className="no-print"
                            style={{
                                flex: 1, display: 'inline-flex', alignItems: 'center',
                                justifyContent: 'center', gap: '0.4rem',
                                background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)',
                                color: 'var(--green)', fontFamily: 'var(--font-space)',
                                fontWeight: 700, fontSize: '0.88rem',
                                padding: '0.85rem', borderRadius: '8px', cursor: 'pointer', minWidth: '120px',
                            }}
                        >
                            🖨️ Print
                        </button>

                        <Link href="/" style={{
                            flex: 1, display: 'inline-flex', alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent', border: '1px solid var(--border-hover)',
                            color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem',
                            padding: '0.85rem', borderRadius: '8px', textDecoration: 'none', minWidth: '100px',
                        }}>
                            ← Home
                        </Link>
                    </motion.div>
                </motion.div>

                {/* ---- PRINT AREA (hidden on screen, visible when printing) ---- */}
                <div id="print-area" style={{ display: 'none' }}>
                    <div className="print-logo">🗳️ D-Evotes — Official Vote Receipt</div>
                    <div className="print-divider" />
                    <div className="print-title">VOTE CONFIRMATION</div>
                    <p style={{ fontSize: '0.9rem', color: '#333' }}>
                        Your vote has been successfully recorded in the system.
                        This receipt serves as proof of your participation.
                    </p>
                    <div className="print-code">{code}</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', fontSize: '0.85rem' }}>
                        <tbody>
                            {[
                                ['Date & Time',  now],
                                ['Status',       'VOTE RECORDED ✓'],
                                ['Election ID',  electionId],
                            ].map(([label, value]) => (
                                <tr key={label} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '0.5rem 0', fontWeight: 'bold', width: '40%' }}>{label}</td>
                                    <td style={{ padding: '0.5rem 0' }}>{value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="print-divider" />
                    <div className="print-footer">
                        Generated by D-Evotes Electoral Platform · {now}
                        <br />
                        Keep this receipt for your records. Each voter ID can only vote once.
                    </div>
                </div>
            </div>
        </>
    );
}