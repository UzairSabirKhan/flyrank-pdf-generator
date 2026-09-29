import fs from "node:fs";
import path from "node:path";
import { getReportData } from "./db.js";
import { generateReportHtml, renderPdf } from "./renderer.js";

if (!fs.existsSync("reports")) fs.mkdirSync("reports");

const data = getReportData();
const html = generateReportHtml(data);
await renderPdf(html, "reports/test.pdf");
console.log("Test PDF rendered at reports/test.pdf");
