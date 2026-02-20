import express from "express";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to JSON database
const dataFile = path.join(__dirname, "url.json");

// ================= MIDDLEWARE =================
app.use(express.json()); // for fetch JSON requests
app.use(express.urlencoded({ extended: true })); // for form submissions
app.use(express.static(path.join(__dirname, "public"))); // serve index.html

// ================= HELPER FUNCTIONS =================

// Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Read JSON file safely
const readData = async () => {
  try {
    const fileData = await readFile(dataFile, "utf-8");
    return fileData.trim() ? JSON.parse(fileData) : {};
  } catch {
    return {};
  }
};

// Save JSON file
const saveData = async (data) => {
  await writeFile(dataFile, JSON.stringify(data, null, 2));
};

// ================= ROUTES =================

// ===== CREATE SHORT URL =====
app.post("/shorten", async (req, res) => {
  try {
    const { url, shortCode } = req.body;

    if (!url || !shortCode) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const data = await readData();

    if (data[shortCode]) {
      return res.status(400).json({ error: "Shortcode already exists" });
    }

    if (Object.values(data).includes(url)) {
      return res.status(400).json({ error: "This URL already exists" });
    }

    data[shortCode] = url;
    await saveData(data);

    res.json({ success: true, shortCode, url });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== GET ALL SHORTENED URLS =====
app.get("/urls", async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ===== REDIRECT SHORT URL =====
// Using /s/:shortCode to avoid conflicts
app.get("/s/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const data = await readData();

    if (data[shortCode]) {
      return res.redirect(data[shortCode]);
    }

    res.status(404).send("Short URL not found");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

