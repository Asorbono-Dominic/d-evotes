'use client';

// ============================================================
//  src/app/admin/elections/page.tsx — Elections List
// ============================================================

import { useEffect, useState }  from 'react';
import { motion }               from 'framer-motion';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { electionsAPI }         from '@/lib/api';
import { useAdminStore }        from '@/lib/store';
import Link                     from 'next/link';
import toast                    from 'react-hot-toast';

export default function ElectionsPage() {
    const { isSuper }                   = useAdminStore();
    const [elections, setElections]     = useState<any[]>([]);
    const [loading,   setLoading]       = useState(true);

    useEffect(() => { fetchElections(); }, []);

    const fetchElections = async () => {
        try {
            const res = await electionsAPI.getAll();
            setElections(res.data.data.elections || []);
        } catch {
            toast.error('Failed to load elections.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete election "${title}"? This cannot be undone.`)) return;
        try {
            await electionsAPI.delete(id);
            toast.success('Election deleted.');
            fetchElections();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete.');
        }
    };

    const statusColor: Record<string, string> = {
        draft:             'var(--amber)',
        open:              'var(--green)',
        closed:            'var(--red)',
        results_published: 'var(--cyan)',
    };

    return (
        <div>
            <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                marginBottom:   '2rem',
            }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                        Elections
                    </h1>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Manage all elections on the platform
                    </p>
                </div>
                <Link
                    href="/admin/elections/create"
                    style={{
                        display:        'inline-flex',
                        alignItems:     'center',
                        gap:            '0.4rem',
                        background:     'linear-gradient(135deg, var(--amber), #e09000)',
                        color:          '#1a0e00',
                        fontFamily:     'var(--font-space)',
                        fontSize:       '0.85rem',
                        fontWeight:     700,
                        padding:        '0.65rem 1.25rem',
                        borderRadius:   '8px',
                        textDecoration: 'none',
                    }}
                >
                    <Plus size={14} /> New Election
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    ⏳ Loading...
                </div>
            ) : elections.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        No elections yet.
                    </p>
                    <Link href="/admin/elections/create" style={{
                        background: 'linear-gradient(135deg, var(--amber), #e09000)',
                        color: '#1a0e00', fontWeight: 700, fontSize: '0.88rem',
                        padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none',
                    }}>
                        Create First Election
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {elections.map((el, i) => (
                        <motion.div
                            key={el.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="glass-card"
                            style={{ padding: '1.5rem' }}
                        >
                            <div style={{
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'space-between',
                                gap:            '1rem',
                                flexWrap:       'wrap',
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display:      'inline-block',
                                        fontSize:     '0.68rem',
                                        fontWeight:   600,
                                        color:        statusColor[el.status] || 'var(--text-muted)',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.06em',
                                    }}>
                                        {el.status.replace('_', ' ')}
                                    </div>
                                    <h3 style={{
                                        fontSize:  '0.98rem',
                                        fontWeight: 700,
                                        letterSpacing: '-0.01em',
                                        marginBottom: '0.2rem',
                                    }}>
                                        {el.title}
                                    </h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {el.organization}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    <div style={{
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem',
                                        color: 'var(--text-secondary)',
                                    }}>
                                        {el.voter_count || 0} voters · {el.voted_count || 0} voted
                                    </div>
                                    <Link
                                        href={`/admin/elections/${el.id}`}
                                        style={{
                                            display:        'inline-flex',
                                            alignItems:     'center',
                                            gap:            '0.3rem',
                                            background:     'var(--cyan-glow)',
                                            border:         '1px solid var(--border-hover)',
                                            color:          'var(--cyan)',
                                            fontSize:       '0.8rem',
                                            fontWeight:     600,
                                            padding:        '0.45rem 0.85rem',
                                            borderRadius:   '6px',
                                            textDecoration: 'none',
                                        }}
                                    >
                                        Manage <ChevronRight size={12} />
                                    </Link>
                                    {isSuper() && (
                                        <button
                                            onClick={() => handleDelete(el.id, el.title)}
                                            style={{
                                                background:   'rgba(255,77,109,0.08)',
                                                border:       '1px solid rgba(255,77,109,0.2)',
                                                color:        'var(--red)',
                                                padding:      '0.45rem 0.7rem',
                                                borderRadius: '6px',
                                                cursor:       'pointer',
                                                display:      'flex',
                                                alignItems:   'center',
                                            }}
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}