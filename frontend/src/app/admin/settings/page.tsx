'use client';

// ============================================================
//  src/app/admin/settings/page.tsx — Admin Settings
// ============================================================

import { useState }    from 'react';
import { motion }      from 'framer-motion';
import { authAPI }     from '@/lib/api';
import { useAdminStore } from '@/lib/store';
import toast           from 'react-hot-toast';

export default function SettingsPage() {
    const { admin } = useAdminStore();

    const [form, setForm] = useState({
        current_password: '',
        new_password:     '',
        confirm_password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.new_password.length < 8) {
            toast.error('New password must be at least 8 characters.');
            return;
        }

        if (form.new_password !== form.confirm_password) {
            toast.error('New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                current_password: form.current_password,
                new_password:     form.new_password,
            });
            toast.success('Password changed successfully!');
            setForm({ current_password: '', new_password: '', confirm_password: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width:        '100%',
        background:   'var(--bg-input)',
        border:       '1px solid var(--border)',
        borderRadius: '8px',
        color:        'var(--text-primary)',
        fontFamily:   'var(--font-mono)',
        fontSize:     '0.9rem',
        padding:      '0.8rem 1rem',
        outline:      'none',
    };

    const labelStyle = {
        display:       'block',
        fontSize:      '0.75rem',
        fontWeight:    600 as const,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color:         'var(--text-secondary)',
        marginBottom:  '0.5rem',
    };

    return (
        <div style={{ maxWidth: '560px' }}>
            <h1 style={{
                fontSize:      '1.5rem',
                fontWeight:    700,
                letterSpacing: '-0.03em',
                marginBottom:  '0.25rem',
            }}>
                Settings
            </h1>
            <p style={{
                fontSize:     '0.83rem',
                color:        'var(--text-secondary)',
                marginBottom: '2rem',
            }}>
                Manage your admin account settings.
            </p>

            {/* Account info */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{ padding: '1.5rem', marginBottom: '1.5rem' }}
            >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Account Info
                </h3>
                {[
                    { label: 'Username', value: admin?.username },
                    { label: 'Email',    value: admin?.email    },
                    { label: 'Role',     value: admin?.role?.replace('_', ' ') },
                ].map((item) => (
                    <div key={item.label} style={{
                        display:        'flex',
                        justifyContent: 'space-between',
                        padding:        '0.6rem 0',
                        borderBottom:   '1px solid var(--border)',
                        fontSize:       '0.85rem',
                    }}>
                        <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                        <span style={{
                            color:      'var(--text-primary)',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 500,
                        }}>
                            {item.value}
                        </span>
                    </div>
                ))}
            </motion.div>

            {/* Change password */}
            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className="glass-card"
                style={{ padding: '1.5rem' }}
            >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    Change Password
                </h3>
                <p style={{
                    fontSize:     '0.8rem',
                    color:        'var(--text-muted)',
                    marginBottom: '1.5rem',
                }}>
                    Use a strong password with at least 8 characters.
                </p>

                <div style={{ marginBottom: '1.1rem' }}>
                    <label style={labelStyle}>Current Password</label>
                    <input
                        type="password"
                        name="current_password"
                        value={form.current_password}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '1.1rem' }}>
                    <label style={labelStyle}>New Password</label>
                    <input
                        type="password"
                        name="new_password"
                        value={form.new_password}
                        onChange={handleChange}
                        minLength={8}
                        required
                        style={inputStyle}
                    />
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input
                        type="password"
                        name="confirm_password"
                        value={form.confirm_password}
                        onChange={handleChange}
                        minLength={8}
                        required
                        style={inputStyle}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width:        '100%',
                        background:   'linear-gradient(135deg, var(--amber), #e09000)',
                        color:        '#1a0e00',
                        fontFamily:   'var(--font-space)',
                        fontSize:     '0.92rem',
                        fontWeight:   800,
                        padding:      '0.9rem',
                        border:       'none',
                        borderRadius: '8px',
                        cursor:       loading ? 'not-allowed' : 'pointer',
                        opacity:      loading ? 0.7 : 1,
                    }}
                >
                    {loading ? '⏳ Updating...' : '🔑 Update Password'}
                </button>
            </motion.form>
        </div>
    );
}