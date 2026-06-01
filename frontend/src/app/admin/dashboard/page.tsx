'use client';
import { useEffect, useState }  from 'react';
import { motion }               from 'framer-motion';
import { Vote, Users, TrendingUp, Plus, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { electionsAPI }         from '@/lib/api';
import { useAdminStore }        from '@/lib/store';
import Link                     from 'next/link';
import toast                    from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-hover)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.4rem' }}>{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const { admin, isSuper }        = useAdminStore();
    const [elections, setElections] = useState<any[]>([]);
    const [loading,   setLoading]   = useState(true);

    useEffect(() => {
        fetchElections();
        const interval = setInterval(fetchElections, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchElections = async () => {
        try {
            const res = await electionsAPI.getAll();
            setElections(res.data.data.elections || []);
        } catch { toast.error('Failed to load elections.'); }
        finally  { setLoading(false); }
    };

    const totalElections = elections.length;
    const openElections  = elections.filter(e => e.status === 'open').length;
    const totalVoters    = elections.reduce((s, e) => s + (e.voter_count || 0), 0);
    const totalVoted     = elections.reduce((s, e) => s + (e.voted_count || 0), 0);

    const chartData = elections.map(e => ({
        name:       e.title.length > 16 ? e.title.substring(0, 16) + '…' : e.title,
        Registered: e.voter_count  || 0,
        Voted:      e.voted_count  || 0,
    }));

    const statusStyle = (status: string) => {
        const s: Record<string, any> = {
            open:              { color: 'var(--green)',  bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.2)'  },
            closed:            { color: 'var(--red)',    bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.2)' },
            draft:             { color: 'var(--amber)',  bg: 'rgba(255,184,48,0.08)', border: 'rgba(255,184,48,0.2)' },
            results_published: { color: 'var(--cyan)',   bg: 'var(--cyan-glow)',       border: 'var(--border-hover)'  },
        };
        return s[status] || s.draft;
    };

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Dashboard</h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Welcome back, <strong style={{ color: 'var(--text-primary)' }}>{admin?.username}</strong>. Here's your election overview.
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { icon: <Vote size={20} />,       value: totalElections, label: 'Total Elections', color: 'var(--cyan)'  },
                    { icon: <TrendingUp size={20} />, value: openElections,  label: 'Open Now',        color: 'var(--green)' },
                    { icon: <Users size={20} />,      value: totalVoters,    label: 'Total Voters',    color: 'var(--amber)' },
                    { icon: <Vote size={20} />,       value: totalVoted,     label: 'Votes Cast',      color: '#b06afa'      },
                ].map((stat, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ color: stat.color, marginBottom: '0.75rem' }}>{stat.icon}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                            {stat.value.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            {stat.label}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Turnout Chart */}
            {elections.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Voter Turnout Overview</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Registered voters vs votes cast</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.06)" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingTop: '1rem' }} />
                            <Bar dataKey="Registered" fill="rgba(0,229,255,0.25)" radius={[4,4,0,0]} />
                            <Bar dataKey="Voted"      fill="#00e5ff"              radius={[4,4,0,0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                        {elections.map(el => (
                            <div key={el.id} style={{ textAlign: 'center', flex: 1, minWidth: '80px' }}>
                                <div style={{
                                    fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700,
                                    color: el.turnout_pct >= 75 ? 'var(--green)' : el.turnout_pct >= 40 ? 'var(--amber)' : 'var(--red)',
                                }}>
                                    {el.turnout_pct}%
                                </div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>
                                    {el.title.substring(0, 14)}{el.title.length > 14 ? '…' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Elections list */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {isSuper() ? 'All Elections' : 'Your Elections'}
                </h2>
                <Link href="/admin/elections/create" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    background: 'linear-gradient(135deg, var(--amber), #e09000)', color: '#1a0e00',
                    fontFamily: 'var(--font-space)', fontSize: '0.82rem', fontWeight: 700,
                    padding: '0.55rem 1.1rem', borderRadius: '8px', textDecoration: 'none',
                }}>
                    <Plus size={14} /> New Election
                </Link>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>⏳ Loading...</div>
            ) : elections.length === 0 ? (
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗳️</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No elections yet.</p>
                    <Link href="/admin/elections/create" style={{ background: 'linear-gradient(135deg, var(--amber), #e09000)', color: '#1a0e00', fontWeight: 700, fontSize: '0.88rem', padding: '0.75rem 1.5rem', borderRadius: '8px', textDecoration: 'none' }}>
                        Create First Election
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {elections.map((election, i) => {
                        const s = statusStyle(election.status);
                        return (
                            <motion.div key={election.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="glass-card" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                            fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                                            color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                                            padding: '0.2rem 0.65rem', borderRadius: '100px', marginBottom: '0.75rem',
                                        }}>
                                            {election.status === 'open' && <span className="animate-blink" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
                                            {election.status.replace('_', ' ')}
                                        </div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>{election.title}</h3>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{election.organization}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Voters',     value: election.voter_count     },
                                            { label: 'Voted',      value: election.voted_count     },
                                            { label: 'Turnout',    value: `${election.turnout_pct}%` },
                                            { label: 'Candidates', value: election.candidate_count },
                                        ].map(s => (
                                            <div key={s.label} style={{ textAlign: 'center' }}>
                                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.value}</div>
                                                <div style={{ fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <Link href={`/admin/elections/${election.id}`} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                        background: 'var(--cyan-glow)', border: '1px solid var(--border-hover)',
                                        color: 'var(--cyan)', fontSize: '0.8rem', fontWeight: 600,
                                        padding: '0.5rem 1rem', borderRadius: '7px', textDecoration: 'none', flexShrink: 0,
                                    }}>
                                        Manage <ChevronRight size={12} />
                                    </Link>
                                </div>
                                {election.voter_count > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${election.turnout_pct}%` }} transition={{ duration: 1, delay: i * 0.05 }}
                                                style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}