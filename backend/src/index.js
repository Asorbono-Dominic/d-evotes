// ============================================================
//  src/index.js — D-Evotes Express Server
// ============================================================

require('dotenv').config();
require('express-async-errors');

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ---- MIDDLEWARE --------------------------------------------
app.use(helmet());
app.use(cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (candidate photos etc)
app.use('/uploads', express.static('uploads'));

// ---- ROUTES -----------------------------------------------
app.use('/api/candidates', require('./routes/candidateRoutes'));
app.use('/api/auth',      require('./routes/authRoutes'));
// More routes will be added here as we build each feature:
app.use('/api/elections', require('./routes/electionRoutes'));
app.use('/api/voters',    require('./routes/voterRoutes'));
app.use('/api/votes',     require('./routes/voteRoutes'));
//app.use('/api/audit',     require('./routes/auditRoutes'));

// ---- HEALTH CHECK -----------------------------------------
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '🗳️ D-Evotes API is running!',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ---- 404 HANDLER ------------------------------------------
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// ---- ERROR HANDLER (must be last) -------------------------
app.use(errorHandler);

// ---- START SERVER -----------------------------------------
app.listen(PORT, () => {
    console.log(`\n🗳️  D-Evotes API running on port ${PORT}`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗  Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;