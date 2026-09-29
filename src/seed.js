import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("report.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer TEXT NOT NULL,
    product TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL
  );
`);

db.exec("DELETE FROM orders;");

const products = [
  "Mechanical Keyboard",
  "Ergonomic Mouse",
  "4K Monitor",
  "USB-C Dock",
  "Desk Mat",
  "Webcam 1080p",
];
const customers = [
  "Alice Smith",
  "Bob Jones",
  "Charlie Brown",
  "Diana Prince",
  "Evan Wright",
  "Fiona Gallagher",
];

const insertStmt = db.prepare(`
  INSERT INTO orders (customer, product, amount, created_at)
  VALUES (?, ?, ?, ?)
`);

const now = Date.now();
const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

for (let i = 0; i < 200; i++) {
  const customer = customers[Math.floor(Math.random() * customers.length)];
  const product = products[Math.floor(Math.random() * products.length)];
  const amount = parseFloat((Math.random() * (200 - 5) + 5).toFixed(2));

  const orderDate = new Date(
    now - Math.floor(Math.random() * thirtyDaysMs),
  ).toISOString();

  insertStmt.run(customer, product, amount, orderDate);
}

const count = db.prepare("SELECT COUNT(*) as count FROM orders").get();
console.log(`Database seeded successfully. Total orders: ${count.count}`);
