const express = require("express");
const { Pool } = require("pg");
const ollama = require("ollama");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Set up PostgreSQL connection
const pool = new Pool({
  user: "yugabyte",
  // database?: string | undefined;
  port: 5433,
  host: "127.0.1.1",
  password: "yugabyte",
  // ssl: boolean;
});

// Middleware to parse JSON bodies
app.use(express.json());

// /api/search endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  const category = req.query.category;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    // Generate text embeddings using Ollama API
    const data = {
      model: "nomic-embed-text",
      prompt: query,
    };

    const resp = await ollama.default.embeddings(data);
    const embeddings = `[${resp.embedding}]`;

    console.log("query: ", query);
    console.log("embeddings: ", embeddings);

    const results = await pool.query(
      "SELECT headline, short_description, link from news_stories where category = $2 ORDER BY embeddings <=> $1 LIMIT 5",
      //   "SELECT * from news_stories",
      [embeddings, category]
    );

    res.json({ data: results.rows });
  } catch (error) {
    console.error(
      "Error generating embeddings or saving to the database:",
      error
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
