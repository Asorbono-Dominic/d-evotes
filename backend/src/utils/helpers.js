// ============================================================
//  src/utils/helpers.js — Shared Utility Functions
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

// ---- OTP GENERATOR ----------------------------------------
// Format: 2 uppercase letters + current year = 6 chars
// OR 4 uppercase letters + current year = 8 chars
const generateOTP = () => {
    const letters = Array.from({ length: 4 }, () =>
        String.fromCharCode(65 + Math.floor(Math.random() * 26))
    ).join('');
    const year = new Date().getFullYear();
    return `${letters}${year}`; // e.g. ABCD2025 — 8 characters
};

// ---- JWT TOKEN GENERATOR ----------------------------------
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

// ---- JWT TOKEN VERIFIER -----------------------------------
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// ---- STANDARD API RESPONSE --------------------------------
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const sendError = (res, message = 'An error occurred', statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null,
    });
};

// ---- AUDIT LOG HELPER -------------------------------------
const createAuditLog = async (supabaseAdmin, { adminId, adminName, electionId, action, details, ipAddress }) => {
    try {
        await supabaseAdmin.from('audit_logs').insert({
            admin_id:    adminId    || null,
            admin_name:  adminName  || 'System',
            election_id: electionId || null,
            action,
            details:     details    || {},
            ip_address:  ipAddress  || null,
        });
    } catch (err) {
        // Don't crash the app if audit log fails — just log it
        console.error('Audit log error:', err.message);
    }
};

// ---- VALIDATE VOTER ID FORMAT -----------------------------
// format: 'ANY' | 'STD000' | 'GH00000000' etc
// Numbers in format = digits, Letters = letters
const validateVoterIdFormat = (voterId, format) => {
    if (!format || format === 'ANY') return true;

    if (voterId.length !== format.length) return false;

    for (let i = 0; i < format.length; i++) {
        const fChar = format[i];
        const vChar = voterId[i];

        if (fChar >= 'A' && fChar <= 'Z') {
            // Expect a letter
            if (!/[A-Za-z]/.test(vChar)) return false;
        } else if (fChar >= '0' && fChar <= '9') {
            // Expect a digit
            if (!/[0-9]/.test(vChar)) return false;
        } else {
            // Expect exact character match (e.g. '/', '-')
            if (vChar !== fChar) return false;
        }
    }
    return true;
};

module.exports = {
    generateOTP,
    generateToken,
    verifyToken,
    sendSuccess,
    sendError,
    createAuditLog,
    validateVoterIdFormat,
};