'use client';

// ============================================================
//  src/app/admin/admins/page.tsx — Manage Admins
//  Super admin only — create and manage election admins
// ============================================================

import { useEffect, useState }  from 'react';
import { motion }               from 'framer-motion';
import { UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import { authAPI }              from '@/lib/api';
import { useAdminStore }        from '@/lib/store';
import { useRouter }            from 'next/navigation';
import toast                    from 'react-hot-toast';

export default function AdminsPage() {
    const { isSuper, admin: currentAdmin } = useAdminStore();
    const router                           = useRouter();

    const [admins,  setAdmins]   = useState<any[]>([]);
    const [loading, setLoading]  = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        username: '',
        email:    '',
        password: '',
        role:     'election_admin',
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!isSuper()) {
            router.push('/admin/dashboard');
            return;
        }
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await authAPI.getAllAdmins();
            setAdmins(res.data.data.admins || []);
        } catch {
            toast.error('Failed to load admins.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.username || !form.email || !form.password) {
            toast.error('All fields are required.');
            return;
        }
        setCreating(true);
        try {
            await authAPI.createAdmin(form);
            toast.success('Admin created successfully!');
            setForm({ username: '', email: '', password: '', role: 'election_admin' });
            setShowForm(false);
            fetchAdmins();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create admin.');
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id: string, username: string) => {
        if (id === currentAdmin?.id) {
            toast.error('You cannot deactivate your own account.');
            return;
        }
        try {
            const res = await authAPI.toggleAdmin(id);
            toast.success(res.data.message);
            fetchAdmins();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update admin.');
        }
    };

    const inputStyle = {
        width:        '100%',
        background:   'var(--bg-input)',
        border:       '1px solid var(--border)',
        borderRadius: '8px',
        color:        'var(--text-primary)',
        fontFamily:   'var(--font-space)',
        fontSize:     '0.9rem',
        padding:      '0.75rem 1rem',
        outline:      'none',
    };

    const labelStyle = {
        display:       'block',
        fontSize:      '0.72rem',
        fontWeight:    600 as const,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color:         'var(--text-secondary)',
        marginBottom:  '0.4rem',
    };

    return (
        <div>
            {/* Header */}
            <div style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                marginBottom:   '2rem',
            }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>
                        Admin Accounts
                    </h1>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Manage who has access to the admin panel
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display:      'inline-flex',
                        alignItems:   'center',
                        gap:          '0.4rem',
                        background:   'linear-gradient(135deg, var(--amber), #e09000)',
                        color:        '#1a0e00',
                        fontFamily:   'var(--font-space)',
                        fontSize:     '0.85rem',
                        fontWeight:   700,
                        padding:      '0.65rem 1.25rem',
                        borderRadius: '8px',
                        border:       'none',
                        cursor:       'pointer',
                    }}
                >
                    <UserPlus size={14} />
                    {showForm ? 'Cancel' : 'New Admin'}
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{ padding: '1.75rem', marginBottom: '1.5rem' }}
                >
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                        Create New Admin
                    </h3>
                    <form onSubmit={handleCreate}>
                        <div style={{
                            display:             'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap:                 '1rem',
                            marginBottom:        '1rem',
                        }}>
                            <div>
                                <label style={labelStyle}>Username *</label>
                                <input
                                    type="text"
                                    value={form.username}
                                    onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                                    placeholder="e.g. john_doe"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email *</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                                    placeholder="e.g. john@example.com"
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Password *</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                                    placeholder="Min 8 characters"
                                    minLength={8}
                                    required
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Role *</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="election_admin">Election Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            style={{
                                background:   'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                                color:        '#050a0e',
                                fontFamily:   'var(--font-space)',
                                fontWeight:   700,
                                fontSize:     '0.88rem',
                                padding:      '0.75rem 1.75rem',
                                border:       'none',
                                borderRadius: '8px',
                                cursor:       creating ? 'not-allowed' : 'pointer',
                                opacity:      creating ? 0.7 : 1,
                            }}
                        >
                            {creating ? '⏳ Creating...' : '✅ Create Admin'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* Admins table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    ⏳ Loading admins...
                </div>
            ) : (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{
                        padding:      '1.25rem 1.5rem',
                        borderBottom: '1px solid var(--border)',
                        fontSize:     '0.88rem',
                        fontWeight:   700,
                    }}>
                        All Admins ({admins.length})
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Username', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                                        <th key={h} style={{
                                            padding:       '0.7rem 1.25rem',
                                            textAlign:     'left',
                                            fontSize:      '0.68rem',
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color:         'var(--text-muted)',
                                            borderBottom:  '1px solid var(--border)',
                                            fontWeight:    600,
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {admins.map((admin, i) => (
                                    <motion.tr
                                        key={admin.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        <td style={{
                                            padding:      '0.85rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                            fontFamily:   'var(--font-mono)',
                                            fontSize:     '0.85rem',
                                            color:        'var(--cyan)',
                                            fontWeight:   600,
                                        }}>
                                            {admin.username}
                                            {admin.id === currentAdmin?.id && (
                                                <span style={{
                                                    marginLeft:   '0.5rem',
                                                    fontSize:     '0.65rem',
                                                    color:        'var(--amber)',
                                                    background:   'rgba(255,184,48,0.1)',
                                                    border:       '1px solid rgba(255,184,48,0.2)',
                                                    padding:      '0.1rem 0.4rem',
                                                    borderRadius: '3px',
                                                }}>
                                                    You
                                                </span>
                                            )}
                                        </td>
                                        <td style={{
                                            padding:      '0.85rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                            fontSize:     '0.83rem',
                                            color:        'var(--text-secondary)',
                                        }}>
                                            {admin.email}
                                        </td>
                                        <td style={{
                                            padding:      '0.85rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                        }}>
                                            <span style={{
                                                fontSize:      '0.72rem',
                                                fontWeight:    600,
                                                padding:       '0.2rem 0.65rem',
                                                borderRadius:  '4px',
                                                background:    admin.role === 'super_admin'
                                                    ? 'rgba(255,184,48,0.1)'
                                                    : 'var(--cyan-glow)',
                                                border:        admin.role === 'super_admin'
                                                    ? '1px solid rgba(255,184,48,0.25)'
                                                    : '1px solid var(--border-hover)',
                                                color:         admin.role === 'super_admin'
                                                    ? 'var(--amber)'
                                                    : 'var(--cyan)',
                                                textTransform: 'capitalize' as const,
                                            }}>
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td style={{
                                            padding:      '0.85rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                        }}>
                                            <span style={{
                                                fontSize:     '0.72rem',
                                                fontWeight:   600,
                                                padding:      '0.2rem 0.65rem',
                                                borderRadius: '4px',
                                                background:   admin.is_active
                                                    ? 'rgba(0,255,136,0.08)'
                                                    : 'rgba(255,77,109,0.08)',
                                                border:       admin.is_active
                                                    ? '1px solid rgba(0,255,136,0.2)'
                                                    : '1px solid rgba(255,77,109,0.2)',
                                                color:        admin.is_active
                                                    ? 'var(--green)'
                                                    : 'var(--red)',
                                            }}>
                                                {admin.is_active ? '● Active' : '● Inactive'}
                                            </span>
                                        </td>
                                        <td style={{
                                            padding:      '0.85rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                            fontSize:     '0.78rem',
                                            color:        'var(--text-muted)',
                                        }}>
                                            {new Date(admin.created_at).toLocaleDateString()}
                                        </td>
                                        <td style={{
                                            padding:      '0.85rem 1.25rem',
                                            borderBottom: '1px solid var(--border)',
                                        }}>
                                            {admin.id !== currentAdmin?.id && (
                                                <button
                                                    onClick={() => handleToggle(admin.id, admin.username)}
                                                    style={{
                                                        display:      'inline-flex',
                                                        alignItems:   'center',
                                                        gap:          '0.35rem',
                                                        background:   admin.is_active
                                                            ? 'rgba(255,77,109,0.08)'
                                                            : 'rgba(0,255,136,0.08)',
                                                        border:       admin.is_active
                                                            ? '1px solid rgba(255,77,109,0.2)'
                                                            : '1px solid rgba(0,255,136,0.2)',
                                                        color:        admin.is_active
                                                            ? 'var(--red)'
                                                            : 'var(--green)',
                                                        fontSize:     '0.75rem',
                                                        fontWeight:   600,
                                                        padding:      '0.3rem 0.75rem',
                                                        borderRadius: '5px',
                                                        cursor:       'pointer',
                                                    }}
                                                >
                                                    {admin.is_active
                                                        ? <><ToggleLeft size={12} /> Deactivate</>
                                                        : <><ToggleRight size={12} /> Activate</>
                                                    }
                                                </button>
                                            )}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}