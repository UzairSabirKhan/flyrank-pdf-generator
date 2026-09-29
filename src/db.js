import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("report.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function getReportData() {
  // 1. Total number of orders
  const totalOrdersRow = db
    .prepare("SELECT COUNT(*) as total_orders FROM orders")
    .get();

  // 2. Total revenue
  const totalRevenueRow = db
    .prepare("SELECT ROUND(SUM(amount), 2) as total_revenue FROM orders")
    .get();

  // 3. Top 5 products by revenue
  const topProducts = db
    .prepare(
      `
    SELECT product, ROUND(SUM(amount), 2) as revenue, COUNT(*) as count
    FROM orders
    GROUP BY product
    ORDER BY revenue DESC
    LIMIT 5
  `,
    )
    .all();

  // 4. Orders per day for the last 7 days
  const ordersPerDay = db
    .prepare(
      `
    SELECT DATE(created_at) as order_date, COUNT(*) as count, ROUND(SUM(amount), 2) as daily_revenue
    FROM orders
    WHERE created_at >= DATETIME('now', '-7 days')
    GROUP BY DATE(created_at)
    ORDER BY order_date DESC
  `,
    )
    .all();

  // 5. All orders for the comprehensive multi-page table
  const allOrders = db
    .prepare(
      "SELECT id, customer, product, amount, created_at FROM orders ORDER BY id ASC",
    )
    .all();

  return {
    totalOrders: totalOrdersRow.total_orders,
    totalRevenue: totalRevenueRow.total_revenue,
    topProducts,
    ordersPerDay,
    allOrders,
  };
}
