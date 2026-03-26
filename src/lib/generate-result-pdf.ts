import { jsPDF } from 'jspdf';
import { VivaSession } from '@/types/backend';

// ── Design Tokens ──────────────────────────────────────────────
const COLORS = {
    bg: '#ffffff',
    card: '#f8fafc',
    border: '#e2e8f0',
    primary: '#0f172a',
    muted: '#64748b',
    emerald: '#10b981',
    emeraldBg: '#ecfdf5',
    rose: '#f43f5e',
    roseBg: '#fff1f2',
    amber: '#f59e0b',
    amberBg: '#fffbeb',
    blue: '#3b82f6',
};

const PASS_THRESHOLD = 50;

// ── Helpers ────────────────────────────────────────────────────

function loadImageAsDataUrl(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas context unavailable'));
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = src;
    });
}

function fmtDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function fmtDuration(start?: string | null, end?: string | null): string {
    if (!start || !end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
}

function truncateText(text: string | undefined | null, maxLen: number): string {
    if (!text) return '—';
    return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

// ── Main Generator ─────────────────────────────────────────────

export async function generateResultPdf(session: VivaSession): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();   // 297mm
    const H = doc.internal.pageSize.getHeight();  // 210mm
    const MX = 24; // Horizontal margin
    const CW = W - MX * 2; // Content Width = 249mm

    // Draw solid white background
    doc.setFillColor(COLORS.bg);
    doc.rect(0, 0, W, H, 'F');

    // Attempt to load the brand logo
    let logo: string | null = null;
    try { logo = await loadImageAsDataUrl('/brand-logo.png'); } catch { /* skip */ }

    // ════════════════════════════════════════════════════════════
    // HEADER (y = 24)
    // ════════════════════════════════════════════════════════════
    let y = 24;

    const logoSize = 10;
    if (logo) {
        doc.addImage(logo, 'PNG', MX, y - 8, logoSize, logoSize);
    }
    const textX = logo ? MX + logoSize + 4 : MX;

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(COLORS.primary);
    doc.text('SCIRE', textX, y - 1);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.muted);
    doc.text('OFFICIAL EXAMINATION CREDENTIAL', textX, y + 4);

    // Right side meta
    const reportIdStr = `Report ID: ${truncateText(session.result_token, 12)}`;
    const dateStr = `Generated: ${fmtDate(new Date().toISOString())}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.primary);
    doc.text(reportIdStr, W - MX, y - 1, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text(dateStr, W - MX, y + 4, { align: 'right' });

    y += 12;

    // Header separator line
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MX, y, W - MX, y);

    y += 10;

    // ════════════════════════════════════════════════════════════
    // CANDIDATE & EXAM INFO CARD (y = 46)
    // ════════════════════════════════════════════════════════════
    const cardH = 34;
    doc.setFillColor(COLORS.card);
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(MX, y, CW, cardH, 3, 3, 'FD');

    // 3 Columns within card
    const colW = CW / 3;
    const paddingX = 8;
    const c1 = MX + paddingX;
    const c2 = MX + colW + paddingX;
    const c3 = MX + colW * 2 + paddingX;

    const drawField = (label: string, value: string, x: number, fy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(COLORS.muted);
        doc.text(label.toUpperCase(), x, fy);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.primary);
        doc.text(value, x, fy + 5.5);
    };

    const studentName = truncateText(session.student?.full_name, 28);
    const examTitle = truncateText(session.exam?.title, 28);
    const examCode = truncateText(session.exam?.exam_code, 20);

    let cardY = y + 8;
    drawField('Candidate Name', studentName, c1, cardY);
    drawField('Examination Title', examTitle, c2, cardY);
    drawField('Examination Code', examCode, c3, cardY);

    cardY += 14;
    drawField('Attempt Number', `#${session.attempt_number || 1}`, c1, cardY);
    drawField('Duration', fmtDuration(session.start_time, session.end_time), c2, cardY);
    drawField('Completed Date', fmtDate(session.end_time), c3, cardY);

    y += cardH + 16;

    // ════════════════════════════════════════════════════════════
    // MAIN CONTENT: 2-COLUMN SPLIT (y = 96)
    // ════════════════════════════════════════════════════════════
    // Left: Final Score & Status (Width: 110mm)
    // Right: Integrity & Review Details (Width: rest)
    
    const leftPaneW = 100;
    const rightPaneX = MX + leftPaneW + 16;
    
    // --- LEFT PANE: SCORE ---
    const score = session.final_score ?? 0;
    const passed = score >= PASS_THRESHOLD;
    const scoreColor = passed ? COLORS.emerald : COLORS.rose;
    const scoreBg = passed ? COLORS.emeraldBg : COLORS.roseBg;

    // Score Ring
    const circleR = 18;
    const circleX = MX + circleR;
    const circleY = y + circleR;

    // Track
    doc.setDrawColor(scoreBg);
    doc.setLineWidth(3.5);
    doc.circle(circleX, circleY, circleR, 'S');

    // Progress
    doc.setDrawColor(scoreColor);
    doc.setLineWidth(3.5);
    doc.circle(circleX, circleY, circleR, 'S'); // For simplicity, draw full circle in proper color

    // Score Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(scoreColor);
    doc.text(Math.round(score).toString(), circleX, circleY + 3.5, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text('OUT OF 100', circleX, circleY + 8.5, { align: 'center' });

    // Status Badge & Details
    const detailsX = circleX + circleR + 12;
    
    // Qualification Badge
    const badgeW = 44;
    const badgeH = 8;
    const badgeY = circleY - 14;
    doc.setFillColor(scoreBg);
    doc.setDrawColor(scoreColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(detailsX, badgeY, badgeW, badgeH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(scoreColor);
    const badgeLabel = passed ? 'PASSED QUALIFICATION' : 'DID NOT PASS';
    doc.text(badgeLabel, detailsX + badgeW / 2, badgeY + 5.5, { align: 'center' });

    // AI Confidence
    const confScore = session.confidence_score ? Math.round(session.confidence_score * 100) : null;
    let confY = badgeY + badgeH + 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted);
    doc.text('AI CONFIDENCE SCORE:', detailsX, confY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.text(confScore !== null ? `${confScore}%` : '—', detailsX + 38, confY);
    
    confY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted);
    doc.text('REQUIRED SCORE:', detailsX, confY);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.primary);
    doc.text(`${PASS_THRESHOLD}`, detailsX + 38, confY);

    // --- RIGHT PANE: INTEGRITY & REVIEW ---
    let ry = y;
    
    // Vertical divider line between panes
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(rightPaneX - 8, y, rightPaneX - 8, y + 40);

    // Integrity Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text('PROCTORING & SECURE BROWSER', rightPaneX, ry);
    ry += 6;

    const integrityReport = session.integrity_report;
    const isFlagged = session.integrity_flag;
    const intLabel = isFlagged ? 'Flagged for integrity review' : 'Verified (No violations detected)';
    const intColor = isFlagged ? COLORS.rose : COLORS.emerald;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(intColor);
    doc.text(intLabel, rightPaneX, ry);
    ry += 6;

    // Flag reasons (if any)
    if (isFlagged && integrityReport?.reasons?.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.rose);
        const reasons = `Reasons: ${integrityReport.reasons.join(', ')}`;
        const splitReasons = doc.splitTextToSize(reasons, CW - leftPaneW - 20);
        doc.text(splitReasons, rightPaneX, ry);
        ry += (splitReasons.length * 4) + 4;
    } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.muted);
        doc.text(`Snapshots analyzed: ${integrityReport?.total_snapshots ?? 0}`, rightPaneX, ry);
        ry += 10;
    }

    // Review Status Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.muted);
    doc.text('INSTRUCTOR REVIEW STATUS', rightPaneX, ry);
    ry += 6;

    let reviewColor = COLORS.muted;
    let reviewLabel = 'Pending Review';
    if (session.review_status === 'APPROVED') {
        reviewColor = COLORS.emerald;
        reviewLabel = 'Approved';
    } else if (session.review_status === 'REJECTED') {
        reviewColor = COLORS.rose;
        reviewLabel = 'Rejected';
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(reviewColor);
    doc.text(reviewLabel, rightPaneX, ry);
    ry += 6;

    // Review Notes
    if ((session.review_status === 'APPROVED' || session.review_status === 'REJECTED') && session.review_notes) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.primary);
        const splitNotes = doc.splitTextToSize(`" ${session.review_notes} "`, CW - leftPaneW - 20);
        doc.text(splitNotes, rightPaneX, ry);
    }


    // ════════════════════════════════════════════════════════════
    // FOOTER (y = Bottom)
    // ════════════════════════════════════════════════════════════
    const footerY = H - 24;

    // Divider
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MX, footerY - 6, W - MX, footerY - 6);

    const verifyUrl = session.result_token
        ? `${window.location.origin}/results/verify/${session.result_token}`
        : `${window.location.origin}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.primary);
    doc.text('VERIFICATION LINK', MX, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.blue);
    doc.text(verifyUrl, MX, footerY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted);
    const disclaimer = 'This document is a verifiable credential issued by Scire. To ensure its authenticity, please visit the verification link provided above.';
    const splitDisclaimer = doc.splitTextToSize(disclaimer, 100);
    doc.text(splitDisclaimer, W - MX, footerY, { align: 'right' });


    // ── Save PDF ────────────────────────────────────────────────
    const safeTitle = (session.exam?.title || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeDate = new Date().toISOString().slice(0, 10);
    doc.save(`Scire_Credential_${safeTitle}_${safeDate}.pdf`);
}
