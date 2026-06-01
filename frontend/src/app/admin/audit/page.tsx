'use client';

// ============================================================
//  src/app/admin/audit/page.tsx — Audit Log Viewer
// ============================================================

import { useEffect, useState }  from 'react';
import { motion }               from 'framer-motion';
import { votesAPI, electionsAPI } from '@/lib/api';
import { useAdminStore }        from '@/lib/store';
import toast                    from 'react-hot-toast';

export default function AuditPage() {
    const { isSuper }                     = useAdminStore();
    const [logs,      setLogs]            = useState<any[]>([]);
    const [elections, setElections]       = useState<any[]>([]);
    const [loading,   setLoading]         = useState(true);
    const [selected,  setSelected]        = useState('all');
    const [page,      setPage]            = useState(1);
    const [total,     setTotal]           = useState(0);
    const limit = 20;

    useEffect(() => { fetchElections(); }, []);
    useEffect(() => { fetchLogs(); }, [selected, page]);

    const fetchElections = async () => {
        try {
            const res = await electionsAPI.getAll();
            setElections(res.data.data.elections || []);
        } catch {}
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let res;
            if (selected === 'all' && isSuper()) {
                res = await votesAPI.getAllLogs({ page, limit });
            } else if (selected !== 'all') {
                res = await votesAPI.getAuditLog(selected, { page, limit });
            } else {
                if (elections.length > 0) {
                    res = await votesAPI.getAuditLog(elections[0].id, { page, limit });
                }
            }
            if (res) {
                setLogs(res.data.data.logs || []);
                setTotal(res.data.data.pagination?.total || 0);
            }
        } catch { toast.error('Failed to load audit logs.'); }
        finally  { setLoading(false); }
    };

    const actionColor = (action: string) => {
        if (action.includes('created'))  return 'var(--green)';
        if (action.includes('deleted'))  return 'var(--red)';
        if (action.includes('opened') || action.includes('open')) return 'var(--green)';
        if (action.includes('closed'))   return 'var(--red)';
        if (action.includes('login'))    return 'var(--cyan)';
        if (action.includes('reset'))    return 'var(--amber)';
        if (action.includes('vote'))     return '#b06afa';
        return 'var(--text-secondary)';
    };

    const actionIcon = (action: string) => {
        if (action.includes('created'))  return '✨';
        if (action.includes('deleted'))  return '🗑️';
        if (action.includes('opened') || action.includes('open')) return '🟢';
        if (action.includes('closed'))   return '🔴';
        if (action.includes('login'))    return '🔐';
        if (action.includes('reset'))    return '🔄';
        if (action.includes('vote'))     return '🗳️';
        if (action.includes('upload'))   return '📁';
        if (action.includes('password')) return '🔑';
        return '📋';
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                    Audit Log
                </h1>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    Complete record of all admin actions on the platform
                </p>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {isSuper() && (
                    <button
                        onClick={() => { setSelected('all'); setPage(1); }}
                        style={{
                            background:   selected === 'all' ? 'linear-gradient(135deg, var(--amber), #e09000)' : 'var(--bg-card)',
                            border:       selected === 'all' ? 'none' : '1px solid var(--border)',
                            color:        selected === 'all' ? '#1a0e00' : 'var(--text-secondary)',
                            fontFamily:   'var(--font-space)',
                            fontSize:     '0.82rem',
                            fontWeight:   600,
                            padding:      '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor:       'pointer',
                        }}
                    >
                        All Elections
                    </button>
                )}
                {elections.map(el => (
                    <button
                        key={el.id}
                        onClick={() => { setSelected(el.id); setPage(1); }}
                        style={{
                            background:   selected === el.id ? 'linear-gradient(135deg, var(--cyan), var(--cyan-dim))' : 'var(--bg-card)',
                            border:       selected === el.id ? 'none' : '1px solid var(--border)',
                            color:        selected === el.id ? '#050a0e' : 'var(--text-secondary)',
                            fontFamily:   'var(--font-space)',
                            fontSize:     '0.82rem',
                            fontWeight:   600,
                            padding:      '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor:       'pointer',
                            maxWidth:     '200px',
                            overflow:     'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace:   'nowrap',
                        }}
                    >
                        {el.title}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div style={{
                display: 'flex', gap: '1rem', marginBottom: '1.5rem',
                fontSize: '0.82rem', color: 'var(--text-muted)',
            }}>
                <span>Total entries: <strong style={{ color: 'var(--cyan)' }}>{total}</strong></span>
                <span>Page {page} of {totalPages || 1}</span>
            </div>

            {/* Log table */}
            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            ⏳ Loading audit logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            No audit logs found.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Time', 'Admin', 'Action', 'Details', 'IP'].map(h => (
                                        <th key={h} style={{
                                            padding: '0.75rem 1.25rem', textAlign: 'left',
                                            fontSize: '0.68rem', letterSpacing: '0.1em',
                                            textTransform: 'uppercase', color: 'var(--text-muted)',
                                            borderBottom: '1px solid var(--border)', fontWeight: 600,
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, i) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                    >
                                        <td style={{
                                            padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
                                            fontSize: '0.75rem', color: 'var(--text-muted)',
                                            fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                                        }}>
                                            {new Date(log.created_at).toLocaleString('en-GB', {
                                                day: '2-digit', month: 'short',
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </td>
                                        <td style={{
                                            padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
                                            fontSize: '0.82rem', color: 'var(--cyan)',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {log.admin_name || '—'}
                                        </td>
                                        <td style={{
                                            padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
                                        }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                fontSize: '0.78rem', fontWeight: 600,
                                                color: actionColor(log.action),
                                            }}>
                                                {actionIcon(log.action)}
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td style={{
                                            padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
                                            fontSize: '0.75rem', color: 'var(--text-secondary)',
                                            maxWidth: '250px',
                                        }}>
                                            {log.details
                                                ? Object.entries(log.details)
                                                    .map(([k, v]) => `${k}: ${v}`)
                                                    .join(' · ')
                                                : '—'
                                            }
                                        </td>
                                        <td style={{
                                            padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)',
                                            fontSize: '0.72rem', color: 'var(--text-muted)',
                                            fontFamily: 'var(--font-mono)',
                                        }}>
                                            {log.ip_address || '—'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '0.5rem', marginTop: '1.5rem',
                }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            color: page === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                            padding: '0.5rem 1rem', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-space)', fontSize: '0.82rem',
                        }}
                    >
                        ← Prev
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            style={{
                                background:   page === p ? 'var(--cyan)' : 'var(--bg-card)',
                                border:       '1px solid var(--border)',
                                color:        page === p ? '#050a0e' : 'var(--text-secondary)',
                                fontFamily:   'var(--font-space)',
                                fontSize:     '0.82rem', fontWeight: page === p ? 700 : 400,
                                padding:      '0.5rem 0.85rem', borderRadius: '6px', cursor: 'pointer',
                            }}
                        >
                            {p}
                        </button>
                    ))}
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            color: page === totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                            padding: '0.5rem 1rem', borderRadius: '6px',
                            cursor: page === totalPages ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--font-space)', fontSize: '0.82rem',
                        }}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}