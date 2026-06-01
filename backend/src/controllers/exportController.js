// ============================================================
//  src/controllers/exportController.js
//  Export election results to Excel or PDF
// ============================================================

const { supabaseAdmin } = require('../db/supabase');
const ExcelJS           = require('exceljs');
const PDFDocument       = require('pdfkit');

// ---- Helper: fetch full results data ----------------------
const getResultsData = async (electionId) => {
    const { data: election } = await supabaseAdmin
        .from('elections')
        .select('*')
        .eq('id', electionId)
        .single();

    const { data: positions } = await supabaseAdmin
        .from('positions')
        .select('id, title, display_order')
        .eq('election_id', electionId)
        .order('display_order');

    const results = await Promise.all(positions.map(async (pos) => {
        const { data: candidates } = await supabaseAdmin
            .from('candidates')
            .select('id, full_name, bio')
            .eq('position_id', pos.id);

        const candidatesWithVotes = await Promise.all(candidates.map(async (c) => {
            const { count } = await supabaseAdmin
                .from('votes')
                .select('*', { count: 'exact', head: true })
                .eq('candidate_id', c.id);
            return { ...c, vote_count: count || 0 };
        }));

        candidatesWithVotes.sort((a, b) => b.vote_count - a.vote_count);
        const total = candidatesWithVotes.reduce((s, c) => s + c.vote_count, 0);

        return { ...pos, candidates: candidatesWithVotes, total_votes: total };
    }));

    const { count: totalVoters } = await supabaseAdmin
        .from('voters').select('*', { count: 'exact', head: true }).eq('election_id', electionId);
    const { count: totalVoted } = await supabaseAdmin
        .from('voters').select('*', { count: 'exact', head: true }).eq('election_id', electionId).eq('has_voted', true);

    return {
        election,
        results,
        stats: {
            total_voters:  totalVoters  || 0,
            total_voted:   totalVoted   || 0,
            turnout_pct:   totalVoters > 0 ? Math.round((totalVoted / totalVoters) * 100) : 0,
        }
    };
};

// ---- GET /api/export/:electionId/excel --------------------
const exportExcel = async (req, res) => {
    const { electionId } = req.params;
    const { election, results, stats } = await getResultsData(electionId);

    const wb = new ExcelJS.Workbook();
    wb.creator   = 'D-Evotes Platform';
    wb.created   = new Date();

    // ---- Sheet 1: Summary ---------------------------------
    const summary = wb.addWorksheet('Summary');
    summary.columns = [
        { header: 'Field', key: 'field', width: 25 },
        { header: 'Value', key: 'value', width: 40 },
    ];

    // Style header row
    summary.getRow(1).font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    summary.getRow(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1520' } };
    summary.getRow(1).alignment = { horizontal: 'center' };

    summary.addRows([
        { field: 'Election Title',    value: election.title        },
        { field: 'Organization',      value: election.organization },
        { field: 'Status',            value: election.status       },
        { field: 'Total Voters',      value: stats.total_voters    },
        { field: 'Votes Cast',        value: stats.total_voted     },
        { field: 'Voter Turnout',     value: `${stats.turnout_pct}%` },
        { field: 'Export Date',       value: new Date().toLocaleString() },
    ]);

    // ---- Sheet 2: Results per position --------------------
    const resultsSheet = wb.addWorksheet('Results');
    resultsSheet.columns = [
        { header: 'Position',    key: 'position',   width: 25 },
        { header: 'Candidate',   key: 'candidate',  width: 30 },
        { header: 'Votes',       key: 'votes',      width: 12 },
        { header: 'Percentage',  key: 'percentage', width: 14 },
        { header: 'Rank',        key: 'rank',       width: 10 },
    ];

    resultsSheet.getRow(1).font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    resultsSheet.getRow(1).fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D1520' } };
    resultsSheet.getRow(1).alignment = { horizontal: 'center' };

    results.forEach((pos) => {
        pos.candidates.forEach((c, idx) => {
            const pct = pos.total_votes > 0 ? ((c.vote_count / pos.total_votes) * 100).toFixed(1) : '0.0';
            const row = resultsSheet.addRow({
                position:   pos.title,
                candidate:  c.full_name,
                votes:      c.vote_count,
                percentage: `${pct}%`,
                rank:       idx + 1,
            });

            // Highlight winner in green
            if (idx === 0 && c.vote_count > 0) {
                row.font = { bold: true, color: { argb: 'FF00AA55' } };
            }
        });

        // Empty row between positions
        resultsSheet.addRow({});
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="results_${election.title.replace(/\s+/g, '_')}.xlsx"`);

    await wb.xlsx.write(res);
    res.end();
};

// ---- GET /api/export/:electionId/pdf ----------------------
const exportPDF = async (req, res) => {
    const { electionId } = req.params;
    const { election, results, stats } = await getResultsData(electionId);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="results_${election.title.replace(/\s+/g, '_')}.pdf"`);
    doc.pipe(res);

    // ---- Header -------------------------------------------
    doc.fontSize(22).font('Helvetica-Bold')
       .text('ELECTION RESULTS', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).font('Helvetica')
       .text(election.title, { align: 'center' });
    doc.fontSize(11).fillColor('#666666')
       .text(election.organization, { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(0.5);

    // ---- Summary stats ------------------------------------
    doc.fontSize(11).fillColor('#000000');
    const statsY = doc.y;
    doc.text(`Total Voters: ${stats.total_voters}`,   50,  statsY);
    doc.text(`Votes Cast: ${stats.total_voted}`,      200, statsY);
    doc.text(`Turnout: ${stats.turnout_pct}%`,        350, statsY);
    doc.text(`Status: ${election.status.toUpperCase()}`, 450, statsY);
    doc.moveDown(1.5);

    // ---- Results per position -----------------------------
    results.forEach((pos) => {
        // Check if we need a new page
        if (doc.y > 680) doc.addPage();

        // Position title
        doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000')
           .text(pos.title.toUpperCase(), { underline: false });
        doc.fontSize(9).font('Helvetica').fillColor('#666666')
           .text(`${pos.total_votes} vote${pos.total_votes !== 1 ? 's' : ''} cast`);
        doc.moveDown(0.3);

        // Table header
        const tableX   = 50;
        const colWidths = [30, 220, 80, 80, 80];
        const headers   = ['#', 'Candidate', 'Votes', 'Percentage', 'Status'];
        let   currentX  = tableX;

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
        doc.rect(tableX, doc.y, 495, 18).fill('#0d1520');
        headers.forEach((h, i) => {
            doc.text(h, currentX + 4, doc.y - 14, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
            currentX += colWidths[i];
        });
        doc.moveDown(0.2);

        // Rows
        pos.candidates.forEach((c, idx) => {
            if (doc.y > 720) doc.addPage();

            const pct      = pos.total_votes > 0 ? ((c.vote_count / pos.total_votes) * 100).toFixed(1) : '0.0';
            const isWinner = idx === 0 && c.vote_count > 0;
            const rowColor = isWinner ? '#f0fff4' : (idx % 2 === 0 ? '#f9f9f9' : '#ffffff');
            const rowY     = doc.y;
            currentX       = tableX;

            doc.rect(tableX, rowY, 495, 18).fill(rowColor);
            doc.fontSize(9).font(isWinner ? 'Helvetica-Bold' : 'Helvetica')
               .fillColor(isWinner ? '#00aa55' : '#000000');

            const cells = [String(idx + 1), c.full_name, String(c.vote_count), `${pct}%`, isWinner ? '🏆 Winner' : ''];
            cells.forEach((cell, i) => {
                doc.text(cell, currentX + 4, rowY + 4, { width: colWidths[i] - 8, align: i === 0 ? 'center' : 'left' });
                currentX += colWidths[i];
            });
            doc.y = rowY + 20;
        });

        doc.moveDown(1);
    });

    // ---- Footer -------------------------------------------
    doc.fontSize(8).fillColor('#999999')
       .text(`Generated by D-Evotes Platform · ${new Date().toLocaleString()}`, 50, 780, { align: 'center' });

    doc.end();
};

module.exports = { exportExcel, exportPDF };