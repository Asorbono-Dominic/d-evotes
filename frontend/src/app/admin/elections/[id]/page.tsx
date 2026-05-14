'use client';

// ============================================================
//  src/app/admin/elections/[id]/page.tsx
//  Manage a single election — candidates, voters, start/stop
// ============================================================

import { useEffect, useState }   from 'react';
import { useParams, useRouter }  from 'next/navigation';
import { motion }                from 'framer-motion';
import {
    ArrowLeft, Play, Square, Eye, Trash2,
    UserPlus, Upload, Plus, RefreshCw,
} from 'lucide-react';
import {
    electionsAPI, candidatesAPI,
    votersAPI,
} from '@/lib/api';
import { useAdminStore }         from '@/lib/store';
import Link                      from 'next/link';
import toast                     from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ElectionManagePage() {
    const params                          = useParams();
    const router                          = useRouter();
    const electionId                      = params.id as string;
    const { isSuper }                     = useAdminStore();

    const [election,   setElection]       = useState<any>(null);
    const [positions,  setPositions]      = useState<any[]>([]);
    const [voters,     setVoters]         = useState<any[]>([]);
    const [voterStats, setVoterStats]     = useState<any>(null);
    const [loading,    setLoading]        = useState(true);
    const [activeTab,  setActiveTab]      = useState<'overview' | 'candidates' | 'voters' | 'results'>('overview');

    // Forms
    const [newPosition,    setNewPosition]    = useState('');
    const [addingPosition, setAddingPosition] = useState(false);
    const [toggling,       setToggling]       = useState(false);
    const [voterSearch,    setVoterSearch]    = useState('');

    // Add single voter
    const [newVoterId,   setNewVoterId]   = useState('');
    const [newVoterName, setNewVoterName] = useState('');
    const [addingVoter,  setAddingVoter]  = useState(false);

    useEffect(() => {
        fetchAll();
    }, [electionId]);

    const fetchAll = async () => {
        try {
            const [elRes, voterRes] = await Promise.all([
                electionsAPI.getOne(electionId),
                votersAPI.getVoters(electionId, { limit: 100 }),
            ]);
            setElection(elRes.data.data.election);
            setPositions(elRes.data.data.positions || []);
            setVoters(voterRes.data.data.voters || []);
            setVoterStats(voterRes.data.data.stats);
        } catch {
            toast.error('Failed to load election.');
        } finally {
            setLoading(false);
        }
    };

    // ---- Toggle election status ----------------------------
    const handleToggleStatus = async () => {
        setToggling(true);
        try {
            const res = await electionsAPI.toggleStatus(electionId);
            setElection(res.data.data.election);
            toast.success(res.data.message);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update status.');
        } finally {
            setToggling(false);
        }
    };

    // ---- Add position --------------------------------------
    const handleAddPosition = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPosition.trim()) return;
        setAddingPosition(true);
        try {
            await candidatesAPI.createPosition({
                election_id:   electionId,
                title:         newPosition.trim(),
                display_order: positions.length + 1,
            });
            setNewPosition('');
            toast.success('Position added!');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add position.');
        } finally {
            setAddingPosition(false);
        }
    };

    // ---- Add single voter ----------------------------------
    const handleAddVoter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVoterId.trim()) return;
        setAddingVoter(true);
        try {
            await votersAPI.addSingle({
                election_id: electionId,
                voter_id:    newVoterId.trim().toUpperCase(),
                full_name:   newVoterName.trim() || undefined,
            });
            setNewVoterId('');
            setNewVoterName('');
            toast.success('Voter added!');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add voter.');
        } finally {
            setAddingVoter(false);
        }
    };

    // ---- Bulk Excel upload ---------------------------------
    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await votersAPI.bulkUpload(electionId, file);
            const { added, errors } = res.data.data;
            toast.success(`✅ ${added} voters imported!`);
            if (errors?.length > 0) {
                toast.error(`⚠️ ${errors.length} rows had errors.`);
            }
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed.');
        }
        e.target.value = '';
    };

    // ---- Delete position -----------------------------------
    const handleDeletePosition = async (posId: string, title: string) => {
        if (!confirm(`Delete position "${title}"?`)) return;
        try {
            await candidatesAPI.deletePosition(posId);
            toast.success('Position deleted.');
            fetchAll();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete.');
        }
    };

    // ---- Reset voter OTP -----------------------------------
    const handleResetOTP = async (voterId: string) => {
        try {
            await votersAPI.resetOTP(voterId);
            toast.success('OTP reset.');
            fetchAll();
        } catch {
            toast.error('Failed to reset OTP.');
        }
    };

    // ---- Download template ---------------------------------
    const handleDownloadTemplate = async () => {
        try {
            const res = await votersAPI.downloadTemplate(electionId);
            const url = URL.createObjectURL(new Blob([res.data]));
            const a   = document.createElement('a');
            a.href    = url;
            a.download = 'voters_template.xlsx';
            a.click();
        } catch {
            toast.error('Failed to download template.');
        }
    };

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            ⏳ Loading election...
        </div>
    );

    if (!election) return null;

    const statusConfig: Record<string, any> = {
        draft:              { color: 'var(--amber)', label: 'Draft',             next: 'Open Election',      icon: <Play size={14} />   },
        open:               { color: 'var(--green)', label: 'Open',              next: 'Close Election',     icon: <Square size={14} /> },
        closed:             { color: 'var(--red)',   label: 'Closed',            next: 'Publish Results',    icon: <Eye size={14} />    },
        results_published:  { color: 'var(--cyan)',  label: 'Results Published', next: 'Close Results',      icon: <Square size={14} /> },
    };
    const sc = statusConfig[election.status] || statusConfig.draft;

    const tabs = ['overview', 'candidates', 'voters', 'results'];

    const filteredVoters = voterSearch
        ? voters.filter(v =>
            v.voter_id.toLowerCase().includes(voterSearch.toLowerCase()) ||
            (v.full_name || '').toLowerCase().includes(voterSearch.toLowerCase())
          )
        : voters;

    return (
        <div>
            {/* Page header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/dashboard" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    color: 'var(--text-muted)', textDecoration: 'none',
                    fontSize: '0.83rem', marginBottom: '1rem',
                }}>
                    <ArrowLeft size={14} /> Dashboard
                </Link>

                <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
                }}>
                    <div>
                        {/* Status badge */}
                        <div style={{
                            display:       'inline-flex',
                            alignItems:    'center',
                            gap:           '0.4rem',
                            fontSize:      '0.7rem',
                            fontWeight:    600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color:         sc.color,
                            background:    `${sc.color}15`,
                            border:        `1px solid ${sc.color}40`,
                            padding:       '0.2rem 0.65rem',
                            borderRadius:  '100px',
                            marginBottom:  '0.75rem',
                        }}>
                            {sc.label}
                        </div>
                        <h1 style={{
                            fontSize:      '1.5rem',
                            fontWeight:    700,
                            letterSpacing: '-0.03em',
                            marginBottom:  '0.25rem',
                        }}>
                            {election.title}
                        </h1>
                        <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                            {election.organization}
                        </p>
                    </div>

                    {/* Toggle status button */}
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        style={{
                            display:      'inline-flex',
                            alignItems:   'center',
                            gap:          '0.5rem',
                            background:   election.status === 'open'
                                ? 'rgba(255,77,109,0.1)'
                                : 'linear-gradient(135deg, var(--amber), #e09000)',
                            color:        election.status === 'open' ? 'var(--red)' : '#1a0e00',
                            border:       election.status === 'open' ? '1px solid rgba(255,77,109,0.3)' : 'none',
                            fontFamily:   'var(--font-space)',
                            fontSize:     '0.85rem',
                            fontWeight:   700,
                            padding:      '0.65rem 1.25rem',
                            borderRadius: '8px',
                            cursor:       toggling ? 'not-allowed' : 'pointer',
                            opacity:      toggling ? 0.7 : 1,
                        }}
                    >
                        {toggling ? <RefreshCw size={14} className="animate-spin" /> : sc.icon}
                        {toggling ? 'Updating...' : sc.next}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display:      'flex',
                gap:          '0.25rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '2rem',
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            background:    'none',
                            border:        'none',
                            borderBottom:  activeTab === tab
                                ? '2px solid var(--amber)'
                                : '2px solid transparent',
                            color:         activeTab === tab
                                ? 'var(--text-primary)'
                                : 'var(--text-secondary)',
                            fontFamily:    'var(--font-space)',
                            fontSize:      '0.88rem',
                            fontWeight:    activeTab === tab ? 600 : 400,
                            padding:       '0.75rem 1.25rem',
                            cursor:        'pointer',
                            textTransform: 'capitalize',
                            transition:    'all 0.2s',
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ---- OVERVIEW TAB ---- */}
            {activeTab === 'overview' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{
                        display:             'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap:                 '1rem',
                        marginBottom:        '2rem',
                    }}>
                        {[
                            { label: 'Total Voters',  value: voterStats?.total || 0,         color: 'var(--cyan)'  },
                            { label: 'Voted',         value: voterStats?.voted || 0,          color: 'var(--green)' },
                            { label: 'OTP Generated', value: voterStats?.otp_generated || 0,  color: 'var(--amber)' },
                            { label: 'Not Started',   value: voterStats?.not_started || 0,    color: 'var(--text-muted)' },
                        ].map((s, i) => (
                            <div key={i} className="glass-card" style={{ padding: '1.25rem' }}>
                                <div style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize:   '2rem',
                                    fontWeight: 700,
                                    color:      s.color,
                                }}>
                                    {s.value}
                                </div>
                                <div style={{
                                    fontSize:      '0.72rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    color:         'var(--text-muted)',
                                    marginTop:     '0.25rem',
                                }}>
                                    {s.label}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Election details */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                            Election Details
                        </h3>
                        {[
                            { label: 'Title',          value: election.title },
                            { label: 'Organization',   value: election.organization },
                            { label: 'Status',         value: election.status },
                            { label: 'Voter ID Format', value: election.voter_id_format || 'ANY' },
                            { label: 'Results Public', value: election.results_public ? 'Yes' : 'No' },
                            { label: 'Start Date',     value: election.start_date ? new Date(election.start_date).toLocaleString() : 'Not set' },
                            { label: 'End Date',       value: election.end_date   ? new Date(election.end_date).toLocaleString()   : 'Not set' },
                        ].map((item) => (
                            <div key={item.label} style={{
                                display:       'flex',
                                justifyContent: 'space-between',
                                padding:       '0.6rem 0',
                                borderBottom:  '1px solid var(--border)',
                                fontSize:      '0.85rem',
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ---- CANDIDATES TAB ---- */}
            {activeTab === 'candidates' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    {/* Add position form */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                            Add Position
                        </h3>
                        <form onSubmit={handleAddPosition} style={{ display: 'flex', gap: '0.75rem' }}>
                            <input
                                type="text"
                                value={newPosition}
                                onChange={(e) => setNewPosition(e.target.value)}
                                placeholder="e.g. President, Secretary..."
                                style={{
                                    flex:         1,
                                    background:   'var(--bg-input)',
                                    border:       '1px solid var(--border)',
                                    borderRadius: '8px',
                                    color:        'var(--text-primary)',
                                    fontFamily:   'var(--font-space)',
                                    fontSize:     '0.9rem',
                                    padding:      '0.7rem 1rem',
                                    outline:      'none',
                                }}
                            />
                            <button
                                type="submit"
                                disabled={addingPosition}
                                style={{
                                    background:   'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                    color:        '#050a0e',
                                    fontFamily:   'var(--font-space)',
                                    fontWeight:   700,
                                    fontSize:     '0.85rem',
                                    padding:      '0.7rem 1.25rem',
                                    border:       'none',
                                    borderRadius: '8px',
                                    cursor:       addingPosition ? 'not-allowed' : 'pointer',
                                    display:      'flex',
                                    alignItems:   'center',
                                    gap:          '0.4rem',
                                }}
                            >
                                <Plus size={14} />
                                {addingPosition ? 'Adding...' : 'Add'}
                            </button>
                        </form>
                    </div>

                    {/* Positions + candidates list */}
                    {positions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No positions yet. Add your first position above.
                        </div>
                    ) : (
                        positions.map((pos, i) => (
                            <motion.div
                                key={pos.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card"
                                style={{ padding: '1.5rem', marginBottom: '1rem' }}
                            >
                                {/* Position header */}
                                <div style={{
                                    display:        'flex',
                                    alignItems:     'center',
                                    justifyContent: 'space-between',
                                    marginBottom:   '1.25rem',
                                }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                                        {pos.title}
                                        <span style={{
                                            marginLeft:   '0.6rem',
                                            fontSize:     '0.75rem',
                                            color:        'var(--text-muted)',
                                            fontWeight:   400,
                                        }}>
                                            {pos.candidates?.length || 0} candidate{pos.candidates?.length !== 1 ? 's' : ''}
                                        </span>
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link
                                            href={`/admin/elections/${electionId}/candidates/add?position=${pos.id}`}
                                            style={{
                                                display:        'inline-flex',
                                                alignItems:     'center',
                                                gap:            '0.3rem',
                                                background:     'var(--cyan-glow)',
                                                border:         '1px solid var(--border-hover)',
                                                color:          'var(--cyan)',
                                                fontSize:       '0.78rem',
                                                fontWeight:     600,
                                                padding:        '0.4rem 0.85rem',
                                                borderRadius:   '6px',
                                                textDecoration: 'none',
                                            }}
                                        >
                                            <Plus size={12} /> Add Candidate
                                        </Link>
                                        <button
                                            onClick={() => handleDeletePosition(pos.id, pos.title)}
                                            style={{
                                                background:   'rgba(255,77,109,0.08)',
                                                border:       '1px solid rgba(255,77,109,0.2)',
                                                color:        'var(--red)',
                                                fontSize:     '0.78rem',
                                                padding:      '0.4rem 0.7rem',
                                                borderRadius: '6px',
                                                cursor:       'pointer',
                                                display:      'flex',
                                                alignItems:   'center',
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Candidates */}
                                {pos.candidates?.length > 0 ? (
                                    <div style={{
                                        display:             'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                        gap:                 '0.75rem',
                                    }}>
                                        {pos.candidates.map((c: any) => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    background:   'var(--bg-input)',
                                                    border:       '1px solid var(--border)',
                                                    borderRadius: '10px',
                                                    padding:      '1rem',
                                                    textAlign:    'center',
                                                }}
                                            >
                                                <div style={{
                                                    width:        '52px',
                                                    height:       '52px',
                                                    borderRadius: '50%',
                                                    overflow:     'hidden',
                                                    margin:       '0 auto 0.6rem',
                                                    border:       '1px solid var(--border)',
                                                    background:   'var(--bg-surface)',
                                                }}>
                                                    <img
                                                        src={c.photo_url?.startsWith('/')
                                                            ? `${API_URL}${c.photo_url}`
                                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.full_name)}&background=0d1520&color=00e5ff&size=52`
                                                        }
                                                        alt={c.full_name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div style={{
                                                    fontSize:  '0.82rem',
                                                    fontWeight: 600,
                                                    color:     'var(--text-primary)',
                                                }}>
                                                    {c.full_name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        textAlign: 'center',
                                        padding:   '1.5rem',
                                        color:     'var(--text-muted)',
                                        fontSize:  '0.83rem',
                                        background: 'var(--bg-input)',
                                        borderRadius: '8px',
                                    }}>
                                        No candidates yet. Click "Add Candidate" above.
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}

            {/* ---- VOTERS TAB ---- */}
            {activeTab === 'voters' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                    {/* Add voter + bulk upload */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>

                        {/* Single voter */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                                <UserPlus size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />
                                Add Single Voter
                            </h3>
                            <form onSubmit={handleAddVoter}>
                                <input
                                    type="text"
                                    value={newVoterId}
                                    onChange={(e) => setNewVoterId(e.target.value.toUpperCase())}
                                    placeholder="Voter ID *"
                                    required
                                    style={{
                                        width:        '100%',
                                        background:   'var(--bg-input)',
                                        border:       '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color:        'var(--text-primary)',
                                        fontFamily:   'var(--font-mono)',
                                        fontSize:     '0.9rem',
                                        padding:      '0.7rem 1rem',
                                        outline:      'none',
                                        marginBottom: '0.75rem',
                                    }}
                                />
                                <input
                                    type="text"
                                    value={newVoterName}
                                    onChange={(e) => setNewVoterName(e.target.value)}
                                    placeholder="Full Name (optional)"
                                    style={{
                                        width:        '100%',
                                        background:   'var(--bg-input)',
                                        border:       '1px solid var(--border)',
                                        borderRadius: '8px',
                                        color:        'var(--text-primary)',
                                        fontFamily:   'var(--font-space)',
                                        fontSize:     '0.9rem',
                                        padding:      '0.7rem 1rem',
                                        outline:      'none',
                                        marginBottom: '0.75rem',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={addingVoter}
                                    style={{
                                        width:        '100%',
                                        background:   'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                        color:        '#050a0e',
                                        fontFamily:   'var(--font-space)',
                                        fontWeight:   700,
                                        fontSize:     '0.85rem',
                                        padding:      '0.7rem',
                                        border:       'none',
                                        borderRadius: '8px',
                                        cursor:       addingVoter ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    {addingVoter ? 'Adding...' : '+ Add Voter'}
                                </button>
                            </form>
                        </div>

                        {/* Bulk upload */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                                <Upload size={14} style={{ display: 'inline', marginRight: '0.4rem' }} />
                                Bulk Excel Upload
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
                                Upload an Excel file with columns: <code style={{ color: 'var(--cyan)' }}>voter_id</code> and <code style={{ color: 'var(--cyan)' }}>full_name</code>
                            </p>
                            <button
                                onClick={handleDownloadTemplate}
                                style={{
                                    width:        '100%',
                                    background:   'transparent',
                                    border:       '1px solid var(--border-hover)',
                                    color:        'var(--text-secondary)',
                                    fontFamily:   'var(--font-space)',
                                    fontSize:     '0.82rem',
                                    fontWeight:   600,
                                    padding:      '0.6rem',
                                    borderRadius: '8px',
                                    cursor:       'pointer',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                ⬇️ Download Template
                            </button>
                            <label style={{
                                display:      'block',
                                width:        '100%',
                                background:   'linear-gradient(135deg, var(--amber), #e09000)',
                                color:        '#1a0e00',
                                fontFamily:   'var(--font-space)',
                                fontWeight:   700,
                                fontSize:     '0.85rem',
                                padding:      '0.7rem',
                                borderRadius: '8px',
                                cursor:       'pointer',
                                textAlign:    'center',
                            }}>
                                📁 Upload Excel File
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleExcelUpload}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                    </div>

                    {/* Voters table */}
                    <div className="glass-card" style={{ overflow: 'hidden' }}>
                        <div style={{
                            display:        'flex',
                            alignItems:     'center',
                            justifyContent: 'space-between',
                            padding:        '1.25rem 1.5rem',
                            borderBottom:   '1px solid var(--border)',
                        }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                                Voters ({voterStats?.total || 0})
                            </span>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={voterSearch}
                                onChange={(e) => setVoterSearch(e.target.value)}
                                style={{
                                    background:   'var(--bg-input)',
                                    border:       '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color:        'var(--text-primary)',
                                    fontFamily:   'var(--font-mono)',
                                    fontSize:     '0.82rem',
                                    padding:      '0.45rem 0.85rem',
                                    outline:      'none',
                                    width:        '180px',
                                }}
                            />
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        {['Voter ID', 'Name', 'OTP Status', 'Vote Status', 'Actions'].map(h => (
                                            <th key={h} style={{
                                                padding:    '0.7rem 1.25rem',
                                                textAlign:  'left',
                                                fontSize:   '0.68rem',
                                                letterSpacing: '0.1em',
                                                textTransform: 'uppercase',
                                                color:      'var(--text-muted)',
                                                borderBottom: '1px solid var(--border)',
                                                fontWeight: 600,
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVoters.map((voter) => (
                                        <tr key={voter.id}>
                                            <td style={{
                                                padding:   '0.75rem 1.25rem',
                                                borderBottom: '1px solid var(--border)',
                                                fontFamily: 'var(--font-mono)',
                                                fontSize:  '0.85rem',
                                                color:     'var(--cyan)',
                                            }}>
                                                {voter.voter_id}
                                            </td>
                                            <td style={{
                                                padding:   '0.75rem 1.25rem',
                                                borderBottom: '1px solid var(--border)',
                                                fontSize:  '0.83rem',
                                                color:     'var(--text-secondary)',
                                            }}>
                                                {voter.full_name || '—'}
                                            </td>
                                            <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{
                                                    fontSize:     '0.72rem',
                                                    fontWeight:   600,
                                                    padding:      '0.2rem 0.6rem',
                                                    borderRadius: '4px',
                                                    background:   voter.otp_generated ? 'rgba(0,229,255,0.08)' : 'rgba(255,255,255,0.04)',
                                                    border:       voter.otp_generated ? '1px solid rgba(0,229,255,0.2)' : '1px solid var(--border)',
                                                    color:        voter.otp_generated ? 'var(--cyan)' : 'var(--text-muted)',
                                                }}>
                                                    {voter.otp_generated ? 'Generated' : 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                                <span style={{
                                                    fontSize:     '0.72rem',
                                                    fontWeight:   600,
                                                    padding:      '0.2rem 0.6rem',
                                                    borderRadius: '4px',
                                                    background:   voter.has_voted ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
                                                    border:       voter.has_voted ? '1px solid rgba(0,255,136,0.2)' : '1px solid var(--border)',
                                                    color:        voter.has_voted ? 'var(--green)' : 'var(--text-muted)',
                                                }}>
                                                    {voter.has_voted ? '✓ Voted' : 'Pending'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                                                {voter.otp_generated && !voter.has_voted && (
                                                    <button
                                                        onClick={() => handleResetOTP(voter.id)}
                                                        style={{
                                                            background:   'rgba(255,184,48,0.08)',
                                                            border:       '1px solid rgba(255,184,48,0.2)',
                                                            color:        'var(--amber)',
                                                            fontSize:     '0.75rem',
                                                            fontWeight:   600,
                                                            padding:      '0.25rem 0.6rem',
                                                            borderRadius: '4px',
                                                            cursor:       'pointer',
                                                        }}
                                                    >
                                                        Reset OTP
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredVoters.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    No voters found.
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ---- RESULTS TAB ---- */}
            {activeTab === 'results' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Link
                            href={`/results/${electionId}`}
                            target="_blank"
                            style={{
                                display:        'inline-flex',
                                alignItems:     'center',
                                gap:            '0.5rem',
                                background:     'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                color:          '#050a0e',
                                fontWeight:     700,
                                fontSize:       '0.92rem',
                                padding:        '0.85rem 1.75rem',
                                borderRadius:   '10px',
                                textDecoration: 'none',
                            }}
                        >
                            <Eye size={16} /> View Full Results Page
                        </Link>
                    </div>
                </motion.div>
            )}
        </div>
    );
}