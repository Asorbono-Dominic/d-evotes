// ============================================================
//  src/controllers/electionController.js — Elections CRUD
//  Create, read, update, delete, start, stop elections
// ============================================================

const { supabaseAdmin }                                          = require('../db/supabase');
const { sendSuccess, sendError, createAuditLog }                 = require('../utils/helpers');

// ---- GET /api/elections (public) --------------------------
// Returns all open/published elections for the landing page
const getPublicElections = async (req, res) => {
    const { data: elections, error } = await supabaseAdmin
        .from('elections')
        .select(`
            id, title, description, organization,
            logo_url, banner_url, status,
            start_date, end_date, results_public
        `)
        .in('status', ['open', 'results_published'])
        .order('created_at', { ascending: false });

    if (error) return sendError(res, 'Failed to fetch elections.', 500);

    return sendSuccess(res, { elections });
};

// ---- GET /api/elections/all (admin) -----------------------
// Returns ALL elections for admin dashboard
const getAllElections = async (req, res) => {
    let query = supabaseAdmin
        .from('elections')
        .select(`
            id, title, description, organization,
            logo_url, banner_url, status,
            start_date, end_date, results_public,
            voter_id_format, created_at, created_by
        `)
        .order('created_at', { ascending: false });

    // Election admins only see their assigned elections
    if (req.admin.role !== 'super_admin') {
        const { data: assigned } = await supabaseAdmin
            .from('election_admins')
            .select('election_id')
            .eq('admin_id', req.admin.id);

        const ids = (assigned || []).map(a => a.election_id);
        if (ids.length === 0) return sendSuccess(res, { elections: [] });
        query = query.in('id', ids);
    }

    const { data: elections, error } = await query;
    if (error) return sendError(res, 'Failed to fetch elections.', 500);

    // Attach voter + vote counts to each election
    const enriched = await Promise.all(elections.map(async (el) => {
        const { count: voterCount } = await supabaseAdmin
            .from('voters')
            .select('*', { count: 'exact', head: true })
            .eq('election_id', el.id);

        const { count: votedCount } = await supabaseAdmin
            .from('voters')
            .select('*', { count: 'exact', head: true })
            .eq('election_id', el.id)
            .eq('has_voted', true);

        const { count: candidateCount } = await supabaseAdmin
            .from('candidates')
            .select('*', { count: 'exact', head: true })
            .eq('election_id', el.id);

        return {
            ...el,
            voter_count:     voterCount     || 0,
            voted_count:     votedCount     || 0,
            candidate_count: candidateCount || 0,
            turnout_pct: voterCount > 0
                ? Math.round((votedCount / voterCount) * 100)
                : 0,
        };
    }));

    return sendSuccess(res, { elections: enriched });
};

// ---- GET /api/elections/:id (public) ----------------------
const getElection = async (req, res) => {
    const { id } = req.params;

    const { data: election, error } = await supabaseAdmin
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !election) return sendError(res, 'Election not found.', 404);

    // Fetch positions with candidates
    const { data: positions } = await supabaseAdmin
        .from('positions')
        .select(`
            id, title, description, display_order,
            candidates (
                id, full_name, bio, photo_url, display_order
            )
        `)
        .eq('election_id', id)
        .order('display_order', { ascending: true });

    return sendSuccess(res, { election, positions: positions || [] });
};

// ---- POST /api/elections (admin) --------------------------
const createElection = async (req, res) => {
    const {
        title, description, organization,
        logo_url, banner_url,
        start_date, end_date,
        results_public, voter_id_format
    } = req.body;

    if (!title || !organization) {
        return sendError(res, 'Title and organization are required.', 400);
    }

    const { data: election, error } = await supabaseAdmin
        .from('elections')
        .insert({
            title:           title.trim(),
            description:     description     || null,
            organization:    organization.trim(),
            logo_url:        logo_url        || null,
            banner_url:      banner_url      || null,
            start_date:      start_date      || null,
            end_date:        end_date        || null,
            results_public:  results_public  ?? false,
            voter_id_format: voter_id_format || 'ANY',
            status:          'draft',
            created_by:      req.admin.id,
        })
        .select()
        .single();

    if (error) return sendError(res, 'Failed to create election.', 500);

    // If election admin, auto-assign them to this election
    if (req.admin.role === 'election_admin') {
        await supabaseAdmin.from('election_admins').insert({
            election_id: election.id,
            admin_id:    req.admin.id,
        });
    }

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: election.id,
        action:     'election_created',
        details:    { title, organization },
        ipAddress:  req.ip,
    });

    return sendSuccess(res, { election }, 'Election created successfully', 201);
};

// ---- PATCH /api/elections/:id (admin) ---------------------
const updateElection = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow status change via this route
    delete updates.status;
    delete updates.created_by;

    const { data: election, error } = await supabaseAdmin
        .from('elections')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', id)
        .select()
        .single();

    if (error) return sendError(res, 'Failed to update election.', 500);

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: id,
        action:     'election_updated',
        details:    updates,
        ipAddress:  req.ip,
    });

    return sendSuccess(res, { election }, 'Election updated successfully');
};

// ---- PATCH /api/elections/:id/toggle-status (admin) -------
// Start or stop an election
const toggleElectionStatus = async (req, res) => {
    const { id } = req.params;

    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('status, title')
        .eq('id', id)
        .single();

    if (!election) return sendError(res, 'Election not found.', 404);

    // Status flow: draft → open → closed → results_published
    const transitions = {
        'draft':              'open',
        'open':               'closed',
        'closed':             'results_published',
        'results_published':  'closed',
    };

    const newStatus = transitions[election.status];
    if (!newStatus) return sendError(res, 'Invalid status transition.', 400);

    const { data: updated, error } = await supabaseAdmin
        .from('elections')
        .update({
            status:     newStatus,
            updated_at: new Date(),
            // Set actual start/end times when toggling
            ...(newStatus === 'open'   && { start_date: new Date() }),
            ...(newStatus === 'closed' && { end_date:   new Date() }),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return sendError(res, 'Failed to update election status.', 500);

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: id,
        action:     `election_${newStatus}`,
        details:    { previous_status: election.status, new_status: newStatus },
        ipAddress:  req.ip,
    });

    const messages = {
        'open':               '🟢 Election is now OPEN for voting!',
        'closed':             '🔴 Election has been CLOSED.',
        'results_published':  '📊 Results are now PUBLIC.',
    };

    return sendSuccess(res, { election: updated }, messages[newStatus]);
};

// ---- DELETE /api/elections/:id (super admin only) ---------
const deleteElection = async (req, res) => {
    const { id } = req.params;

    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('title, status')
        .eq('id', id)
        .single();

    if (!election) return sendError(res, 'Election not found.', 404);

    if (election.status === 'open') {
        return sendError(res, 'Cannot delete an ongoing election. Close it first.', 400);
    }

    await supabaseAdmin.from('elections').delete().eq('id', id);

    await createAuditLog(supabaseAdmin, {
        adminId:   req.admin.id,
        adminName: req.admin.username,
        action:    'election_deleted',
        details:   { title: election.title },
        ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Election deleted successfully');
};

// ---- GET /api/elections/:id/results (public/admin) --------
const getElectionResults = async (req, res) => {
    const { id } = req.params;

    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();

    if (!election) return sendError(res, 'Election not found.', 404);

    // Check if results are public or if requester is admin
    const isAdmin = req.admin;
    if (!election.results_public && !isAdmin) {
        return sendError(res, 'Results are not yet public.', 403);
    }

    // Get positions with candidates and vote counts
    const { data: positions } = await supabaseAdmin
        .from('positions')
        .select('id, title, display_order')
        .eq('election_id', id)
        .order('display_order');

    const results = await Promise.all(positions.map(async (pos) => {
        const { data: candidates } = await supabaseAdmin
            .from('candidates')
            .select('id, full_name, photo_url, bio')
            .eq('position_id', pos.id)
            .order('display_order');

        const candidatesWithVotes = await Promise.all(candidates.map(async (c) => {
            const { count } = await supabaseAdmin
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('candidate_id', c.id);

            return { ...c, vote_count: count || 0 };
        }));

        // Sort by vote count descending
        candidatesWithVotes.sort((a, b) => b.vote_count - a.vote_count);
        const totalVotes = candidatesWithVotes.reduce((sum, c) => sum + c.vote_count, 0);

        return {
            ...pos,
            candidates:  candidatesWithVotes,
            total_votes: totalVotes,
        };
    }));

    // Overall stats
    const { count: totalVoters } = await supabaseAdmin
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', id);

    const { count: totalVoted } = await supabaseAdmin
        .from('voters')
        .select('*', { count: 'exact', head: true })
        .eq('election_id', id)
        .eq('has_voted', true);

    return sendSuccess(res, {
        election,
        results,
        stats: {
            total_voters:  totalVoters  || 0,
            total_voted:   totalVoted   || 0,
            turnout_pct: totalVoters > 0
                ? Math.round((totalVoted / totalVoters) * 100)
                : 0,
        }
    });
};

// ---- POST /api/elections/:id/assign-admin (super admin) ---
const assignAdmin = async (req, res) => {
    const { id }       = req.params;
    const { admin_id } = req.body;

    if (!admin_id) return sendError(res, 'admin_id is required.', 400);

    const { error } = await supabaseAdmin
        .from('election_admins')
        .insert({ election_id: id, admin_id });

    if (error) return sendError(res, 'Failed to assign admin. They may already be assigned.', 400);

    await createAuditLog(supabaseAdmin, {
        adminId:    req.admin.id,
        adminName:  req.admin.username,
        electionId: id,
        action:     'admin_assigned_to_election',
        details:    { assigned_admin_id: admin_id },
        ipAddress:  req.ip,
    });

    return sendSuccess(res, null, 'Admin assigned to election successfully');
};

module.exports = {
    getPublicElections,
    getAllElections,
    getElection,
    createElection,
    updateElection,
    toggleElectionStatus,
    deleteElection,
    getElectionResults,
    assignAdmin,
};