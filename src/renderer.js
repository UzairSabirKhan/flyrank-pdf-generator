import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

export function generateReportHtml(data) {
  const topProductsRows = data.topProducts
    .map(
      (p) => `
    <tr>
      <td>${p.product}</td>
      <td>${p.count}</td>
      <td>$${p.revenue.toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  const dailyRows = data.ordersPerDay
    .map(
      (d) => `
    <tr>
      <td>${d.order_date}</td>
      <td>${d.count}</td>
      <td>$${d.daily_revenue.toLocaleString()}</td>
    </tr>
  `,
    )
    .join("");

  const allOrdersRows = data.allOrders
    .map(
      (o) => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.product}</td>
      <td>$${o.amount.toFixed(2)}</td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
    </tr>
  `,
    )
    .join("");

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Sales & Performance Report</title>
    <style>
      @page {
        size: A4;
        margin: 20mm 15mm 20mm 15mm;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        margin: 0;
        padding: 0;
        font-size: 13px;
      }
      h1 { margin-bottom: 4px; color: #0f172a; }
      .meta { color: #64748b; font-size: 12px; margin-bottom: 24px; }
      .metrics-grid {
        display: flex;
        gap: 16px;
        margin-bottom: 28px;
      }
      .metric-card {
        flex: 1;
        padding: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
      }
      .metric-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; }
      .metric-value { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 4px; }
      
      h2 { color: #334155; font-size: 16px; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        margin-bottom: 20px;
      }
      thead {
        display: table-header-group; /* Repeats table header across pages */
      }
      tr {
        break-inside: avoid; /* Prevents rows from slicing in half on page break */
        page-break-inside: avoid;
      }
      th, td {
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
      }
      th {
        background-color: #f1f5f9;
        font-size: 11px;
        text-transform: uppercase;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <h1>Executive Sales Report</h1>
    <div class="meta">Generated on: ${new Date().toLocaleDateString()} | Scope: Store Lifetime</div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Orders</div>
        <div class="metric-value">${data.totalOrders}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Total Revenue</div>
        <div class="metric-value">$${data.totalRevenue.toLocaleString()}</div>
      </div>
    </div>

    <h2>Top 5 Products by Revenue</h2>
    <table>
      <thead>
        <tr><th>Product</th><th>Units Sold</th><th>Total Revenue</th></tr>
      </thead>
      <tbody>${topProductsRows}</tbody>
    </table>

    <h2>Recent Activity (Last 7 Days)</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Orders</th><th>Revenue</th></tr>
      </thead>
      <tbody>${dailyRows}</tbody>
    </table>

    <h2>All Orders Breakdown (${data.allOrders.length} records)</h2>
    <table>
      <thead>
        <tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr>
      </thead>
      <tbody>${allOrdersRows}</tbody>
    </table>
  </body>
  </html>
  `;
}

export async function renderPdf(html, outputPath) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
  });

  await browser.close();
}
