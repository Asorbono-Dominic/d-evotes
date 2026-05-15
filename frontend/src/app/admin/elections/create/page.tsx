'use client';

// ============================================================
//  src/app/admin/elections/create/page.tsx — Create Election
// ============================================================

import { useState }    from 'react';
import { useRouter }   from 'next/navigation';
import { motion }      from 'framer-motion';
import { ArrowLeft }   from 'lucide-react';
import { electionsAPI } from '@/lib/api';
import Link            from 'next/link';
import toast           from 'react-hot-toast';

export default function CreateElectionPage() {
    const router = useRouter();

    const [form, setForm] = useState({
        title:           '',
        description:     '',
        organization:    '',
        voter_id_format: 'ANY',
        start_date:      '',
        end_date:        '',
        results_public:  false,
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.organization.trim()) {
            toast.error('Title and organization are required.');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...form,
                start_date: form.start_date || null,
                end_date:   form.end_date   || null,
            };
            const res = await electionsAPI.create(payload);
            const electionId = res.data.data.election.id;
            toast.success('Election created successfully!');
            router.push(`/admin/elections/${electionId}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to create election.');
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
        fontFamily:   'var(--font-space)',
        fontSize:     '0.9rem',
        padding:      '0.8rem 1rem',
        outline:      'none',
    };

    const labelStyle = {
        display:       'block',
        fontSize:      '0.75rem',
        fontWeight:    600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color:         'var(--text-secondary)',
        marginBottom:  '0.5rem',
    };

    return (
        <div style={{ maxWidth: '640px' }}>
            <Link href="/admin/elections" style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '0.4rem',
                color:          'var(--text-muted)',
                textDecoration: 'none',
                fontSize:       '0.83rem',
                marginBottom:   '1.5rem',
            }}>
                <ArrowLeft size={14} /> Elections
            </Link>

            <h1 style={{
                fontSize:      '1.5rem',
                fontWeight:    700,
                letterSpacing: '-0.03em',
                marginBottom:  '0.25rem',
            }}>
                Create Election
            </h1>
            <p style={{
                fontSize:     '0.83rem',
                color:        'var(--text-secondary)',
                marginBottom: '2rem',
            }}>
                Set up a new election. You can add candidates and voters after creation.
            </p>

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="glass-card"
                style={{ padding: '2rem' }}
            >
                {/* Title */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Election Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="e.g. IT Department General Elections 2025"
                        required
                        style={inputStyle}
                    />
                </div>

                {/* Organization */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Organization / Institution *</label>
                    <input
                        type="text"
                        name="organization"
                        value={form.organization}
                        onChange={handleChange}
                        placeholder="e.g. Dept of IT, UTAS Navrongo"
                        required
                        style={inputStyle}
                    />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Description (optional)</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Brief description of the election..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                </div>

                {/* Voter ID Format */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Voter ID Format</label>
                    <input
                        type="text"
                        name="voter_id_format"
                        value={form.voter_id_format}
                        onChange={handleChange}
                        placeholder="ANY or e.g. STD000 or GH00000000"
                        style={inputStyle}
                    />
                    <p style={{
                        fontSize:  '0.75rem',
                        color:     'var(--text-muted)',
                        marginTop: '0.4rem',
                        lineHeight: 1.4,
                    }}>
                        Use <code style={{ color: 'var(--cyan)' }}>ANY</code> to accept all formats.
                        Use letters for letter positions and digits for digit positions.
                        e.g. <code style={{ color: 'var(--cyan)' }}>STD000</code> accepts STD001,
                        <code style={{ color: 'var(--cyan)' }}>GH00000000</code> accepts GH27554657
                    </p>
                </div>

                {/* Dates */}
                <div style={{
                    display:             'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap:                 '1rem',
                    marginBottom:        '1.25rem',
                }}>
                    <div>
                        <label style={labelStyle}>Start Date (optional)</label>
                        <input
                            type="datetime-local"
                            name="start_date"
                            value={form.start_date}
                            onChange={handleChange}
                            style={{ ...inputStyle, colorScheme: 'dark' }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>End Date (optional)</label>
                        <input
                            type="datetime-local"
                            name="end_date"
                            value={form.end_date}
                            onChange={handleChange}
                            style={{ ...inputStyle, colorScheme: 'dark' }}
                        />
                    </div>
                </div>

                {/* Results public toggle */}
                <div style={{
                    display:     'flex',
                    alignItems:  'center',
                    gap:         '0.75rem',
                    marginBottom: '2rem',
                    padding:     '1rem',
                    background:  'var(--bg-input)',
                    borderRadius: '8px',
                    border:      '1px solid var(--border)',
                }}>
                    <input
                        type="checkbox"
                        id="results_public"
                        name="results_public"
                        checked={form.results_public}
                        onChange={handleChange}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="results_public" style={{
                        fontSize: '0.88rem',
                        color:    'var(--text-primary)',
                        cursor:   'pointer',
                    }}>
                        Make results publicly visible
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Anyone with the link can view results without logging in
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width:        '100%',
                        background:   'linear-gradient(135deg, var(--amber), #e09000)',
                        color:        '#1a0e00',
                        fontFamily:   'var(--font-space)',
                        fontSize:     '0.95rem',
                        fontWeight:   800,
                        padding:      '0.95rem',
                        border:       'none',
                        borderRadius: '8px',
                        cursor:       loading ? 'not-allowed' : 'pointer',
                        opacity:      loading ? 0.7 : 1,
                    }}
                >
                    {loading ? '⏳ Creating...' : '✅ Create Election'}
                </button>
            </motion.form>
        </div>
    );
}