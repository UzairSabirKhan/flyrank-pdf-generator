import fs from "node:fs";
import path from "node:path";
import express from "express";
import { db, getReportData } from "./db.js";
import { generateReportHtml, renderPdf } from "./renderer.js";

const app = express();
const PORT = process.env.PORT || 3000;
const REPORTS_DIR = path.resolve("reports");

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

app.use(express.json());

// Stage 0: Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Stage 4 & 5: Generate Report with Idempotency
app.post("/reports", async (req, res) => {
  const force = req.body?.force === true;

  // Stage 5 Check: If already generated today and not forced, return existing report
  if (!force) {
    const existingReport = db
      .prepare(
        `
      SELECT id, path, created_at 
      FROM reports 
      WHERE DATE(created_at) = DATE('now')
      ORDER BY id DESC
      LIMIT 1
    `,
      )
      .get();

    if (existingReport && fs.existsSync(existingReport.path)) {
      return res.status(200).json({
        id: existingReport.id,
        file: `/reports/${existingReport.id}/file`,
        cached: true,
        created_at: existingReport.created_at,
      });
    }
  }

  try {
    // 1. Query
    const reportData = getReportData();

    // 2. Prepare destination path
    const reportTimestamp = new Date().toISOString();
    const tempInsert = db
      .prepare("INSERT INTO reports (path, created_at) VALUES (?, ?)")
      .run("", reportTimestamp);
    const reportId = Number(tempInsert.lastInsertRowid);

    const filename = `sales-report-${reportId}.pdf`;
    const targetPath = path.join(REPORTS_DIR, filename);

    // 3. Render HTML to PDF
    const html = generateReportHtml(reportData);
    await renderPdf(html, targetPath);

    // 4. Store updated artifact path in database
    db.prepare("UPDATE reports SET path = ? WHERE id = ?").run(
      targetPath,
      reportId,
    );

    // 5. Return 201 Created with resource link
    return res.status(201).json({
      id: reportId,
      file: `/reports/${reportId}/file`,
      cached: false,
      created_at: reportTimestamp,
    });
  } catch (err) {
    console.error("Error generating report:", err);
    return res.status(500).json({ error: "Failed to generate report" });
  }
});

// Stage 4: Read report metadata
app.get("/reports/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db
    .prepare("SELECT id, created_at FROM reports WHERE id = ?")
    .get(id);

  if (!row) {
    return res.status(404).json({ error: `Report ${id} not found` });
  }

  res.status(200).json({
    id: row.id,
    file: `/reports/${row.id}/file`,
    created_at: row.created_at,
  });
});

// Stage 4: Serve raw PDF artifact by link
app.get("/reports/:id/file", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = db.prepare("SELECT path FROM reports WHERE id = ?").get(id);

  if (!row || !fs.existsSync(row.path)) {
    return res.status(404).json({ error: `Report file for ${id} not found` });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.sendFile(row.path);
});

app.listen(PORT, () => {
  console.log(`Report API listening at http://localhost:${PORT}`);
});
