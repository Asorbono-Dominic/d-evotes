'use client';

// ============================================================
//  src/app/admin/elections/[id]/candidates/add/page.tsx
//  Add a new candidate to a position
// ============================================================

import { useEffect, useState }            from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion }                         from 'framer-motion';
import { ArrowLeft, Upload }              from 'lucide-react';
import { candidatesAPI }                  from '@/lib/api';
import Link                               from 'next/link';
import toast                              from 'react-hot-toast';

export default function AddCandidatePage() {
    const params                          = useParams();
    const searchParams                    = useSearchParams();
    const router                          = useRouter();
    const electionId                      = params.id as string;
    const preselectedPosition             = searchParams.get('position') || '';

    const [positions,  setPositions]      = useState<any[]>([]);
    const [preview,    setPreview]        = useState<string | null>(null);
    const [loading,    setLoading]        = useState(false);

    const [form, setForm] = useState({
        full_name:    '',
        bio:          '',
        position_id:  preselectedPosition,
        display_order: '0',
    });
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    useEffect(() => {
        fetchPositions();
    }, [electionId]);

    const fetchPositions = async () => {
        try {
            const res = await candidatesAPI.getPositions(electionId);
            setPositions(res.data.data.positions || []);
        } catch {
            toast.error('Failed to load positions.');
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.full_name.trim() || !form.position_id) {
            toast.error('Name and position are required.');
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('election_id',   electionId);
            formData.append('position_id',   form.position_id);
            formData.append('full_name',     form.full_name.trim());
            formData.append('bio',           form.bio.trim());
            formData.append('display_order', form.display_order);
            if (photoFile) formData.append('photo', photoFile);

            await candidatesAPI.createCandidate(formData);
            toast.success('Candidate added successfully!');
            router.push(`/admin/elections/${electionId}?tab=candidates`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add candidate.');
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
        <div style={{ maxWidth: '560px' }}>
            <Link href={`/admin/elections/${electionId}`} style={{
                display:        'inline-flex',
                alignItems:     'center',
                gap:            '0.4rem',
                color:          'var(--text-muted)',
                textDecoration: 'none',
                fontSize:       '0.83rem',
                marginBottom:   '1.5rem',
            }}>
                <ArrowLeft size={14} /> Back to Election
            </Link>

            <h1 style={{
                fontSize:      '1.4rem',
                fontWeight:    700,
                letterSpacing: '-0.03em',
                marginBottom:  '0.25rem',
            }}>
                Add Candidate
            </h1>
            <p style={{
                fontSize:     '0.83rem',
                color:        'var(--text-secondary)',
                marginBottom: '2rem',
            }}>
                Fill in the candidate's details and upload their photo.
            </p>

            <motion.form
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="glass-card"
                style={{ padding: '2rem' }}
            >
                {/* Photo upload */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <label style={labelStyle}>Candidate Photo</label>
                    <label style={{
                        display:        'flex',
                        flexDirection:  'column',
                        alignItems:     'center',
                        justifyContent: 'center',
                        gap:            '0.75rem',
                        border:         '2px dashed var(--border)',
                        borderRadius:   '12px',
                        padding:        '1.5rem',
                        cursor:         'pointer',
                        transition:     'border-color 0.2s',
                    }}>
                        {preview ? (
                            <img
                                src={preview}
                                alt="Preview"
                                style={{
                                    width:        '90px',
                                    height:       '90px',
                                    borderRadius: '50%',
                                    objectFit:    'cover',
                                    border:       '2px solid var(--amber)',
                                }}
                            />
                        ) : (
                            <div style={{
                                width:          '80px',
                                height:         '80px',
                                borderRadius:   '50%',
                                background:     'var(--bg-input)',
                                display:        'flex',
                                alignItems:     'center',
                                justifyContent: 'center',
                                color:          'var(--text-muted)',
                            }}>
                                <Upload size={24} />
                            </div>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {preview ? 'Click to change photo' : 'Click to upload photo'}
                            <br />
                            <span style={{ fontSize: '0.72rem' }}>JPG, PNG, WEBP · Max 3MB</span>
                        </span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                {/* Full name */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Full Name *</label>
                    <input
                        type="text"
                        value={form.full_name}
                        onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
                        placeholder="e.g. Kwame Asante"
                        required
                        style={inputStyle}
                    />
                </div>

                {/* Position */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Running For (Position) *</label>
                    <select
                        value={form.position_id}
                        onChange={(e) => setForm(p => ({ ...p, position_id: e.target.value }))}
                        required
                        style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                        <option value="">— Select Position —</option>
                        {positions.map((pos) => (
                            <option key={pos.id} value={pos.id}>
                                {pos.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Bio */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label style={labelStyle}>Bio / Manifesto (optional)</label>
                    <textarea
                        value={form.bio}
                        onChange={(e) => setForm(p => ({ ...p, bio: e.target.value }))}
                        placeholder="A brief statement from the candidate..."
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' }}
                    />
                </div>

                {/* Display order */}
                <div style={{ marginBottom: '1.75rem' }}>
                    <label style={labelStyle}>Display Order</label>
                    <input
                        type="number"
                        value={form.display_order}
                        onChange={(e) => setForm(p => ({ ...p, display_order: e.target.value }))}
                        min="0"
                        style={{ ...inputStyle, width: '120px' }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width:        '100%',
                        background:   'linear-gradient(135deg, var(--cyan), var(--cyan-dim))',
                        color:        '#050a0e',
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
                    {loading ? '⏳ Adding...' : '✅ Add Candidate'}
                </button>
            </motion.form>
        </div>
    );
}