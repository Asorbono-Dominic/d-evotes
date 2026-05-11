// ============================================================
//  src/lib/api.ts — Axios API Client
//  All API calls go through this file
// ============================================================

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});

// ---- Attach token to every request automatically ----------
api.interceptors.request.use((config) => {
    // Check for admin token first, then voter token
    const adminToken = localStorage.getItem('admin_token');
    const voterToken = localStorage.getItem('voter_token');
    const token      = adminToken || voterToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ---- Handle expired tokens globally -----------------------
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('voter_token');
            localStorage.removeItem('admin_data');
            localStorage.removeItem('voter_data');
        }
        return Promise.reject(error);
    }
);

export default api;

// ============================================================
//  API METHODS
// ============================================================

// ---- AUTH -------------------------------------------------
export const authAPI = {
    login:          (data: { username: string; password: string }) =>
                        api.post('/auth/login', data),
    getMe:          () => api.get('/auth/me'),
    changePassword: (data: { current_password: string; new_password: string }) =>
                        api.post('/auth/change-password', data),
    createAdmin:    (data: any) => api.post('/auth/create-admin', data),
    getAllAdmins:    () => api.get('/auth/admins'),
    toggleAdmin:    (id: string) => api.patch(`/auth/admins/${id}/toggle`),
};

// ---- ELECTIONS --------------------------------------------
export const electionsAPI = {
    getPublic:      () => api.get('/elections'),
    getAll:         () => api.get('/elections/admin/all'),
    getOne:         (id: string) => api.get(`/elections/${id}`),
    getResults:     (id: string) => api.get(`/elections/${id}/results`),
    create:         (data: any) => api.post('/elections', data),
    update:         (id: string, data: any) => api.patch(`/elections/${id}`, data),
    toggleStatus:   (id: string) => api.patch(`/elections/${id}/toggle-status`),
    delete:         (id: string) => api.delete(`/elections/${id}`),
    assignAdmin:    (id: string, admin_id: string) =>
                        api.post(`/elections/${id}/assign-admin`, { admin_id }),
};

// ---- CANDIDATES -------------------------------------------
export const candidatesAPI = {
    getPositions:    (electionId: string) =>
                         api.get(`/candidates/positions/${electionId}`),
    createPosition:  (data: any) => api.post('/candidates/positions', data),
    updatePosition:  (id: string, data: any) =>
                         api.patch(`/candidates/positions/${id}`, data),
    deletePosition:  (id: string) => api.delete(`/candidates/positions/${id}`),
    getCandidates:   (electionId: string) => api.get(`/candidates/${electionId}`),
    createCandidate: (data: FormData) =>
                         api.post('/candidates', data, {
                             headers: { 'Content-Type': 'multipart/form-data' }
                         }),
    updateCandidate: (id: string, data: FormData) =>
                         api.patch(`/candidates/${id}`, data, {
                             headers: { 'Content-Type': 'multipart/form-data' }
                         }),
    deleteCandidate: (id: string) => api.delete(`/candidates/${id}`),
};

// ---- VOTERS -----------------------------------------------
export const votersAPI = {
    getVoters:       (electionId: string, params?: any) =>
                         api.get(`/voters/${electionId}`, { params }),
    addSingle:       (data: any) => api.post('/voters/single', data),
    bulkUpload:      (electionId: string, file: File) => {
        const formData = new FormData();
        formData.append('voters_file', file);
        formData.append('election_id', electionId);
        return api.post('/voters/bulk-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    downloadTemplate: (electionId: string) =>
                          api.get(`/voters/${electionId}/download-template`, {
                              responseType: 'blob'
                          }),
    generateOTP:     (data: { election_id: string; voter_id: string }) =>
                         api.post('/voters/generate-otp', data),
    login:           (data: { election_id: string; voter_id: string; otp: string }) =>
                         api.post('/voters/login', data),
    delete:          (id: string) => api.delete(`/voters/${id}`),
    resetOTP:        (id: string) => api.patch(`/voters/${id}/reset-otp`),
    resetVote:       (id: string) => api.patch(`/voters/${id}/reset-vote`),
};

// ---- VOTES ------------------------------------------------
export const votesAPI = {
    castVote:    (data: { election_id: string; votes: any[] }) =>
                     api.post('/votes/cast', data),
    getAuditLog: (electionId: string, params?: any) =>
                     api.get(`/votes/audit/${electionId}`, { params }),
    getAllLogs:  (params?: any) => api.get('/votes/audit/all', { params }),
};