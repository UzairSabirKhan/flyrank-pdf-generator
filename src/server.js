import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Stage 0: Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
