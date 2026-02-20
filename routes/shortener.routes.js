import { readFile, writeFile } from "fs/promises";
import path from "path";
// import express from 'express';
import { Router } from "express";
import { fileURLToPath } from "url";

// const router = express.Router();
const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "url.json");

router.get("/report", (req, res) => {
  const student = [
    {
      name: "Aarav",
      grade: "10th",
      favoriteSubject: "Mathematics",
    },
    { name: "Ishita", grade: "9th", favoriteSubject: "Science" },
    { name: "Rohan", grade: "8th", favoriteSubject: "History" },
    { name: "Meera", grade: "10th", favoriteSubject: "English" },
    { name: "Kabir", grade: "11th", favoriteSubject: "Physics" },
  ];
  res.render("report", { student });
  // res.send("HIi");
});

//validateURL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const readData = async () => {
  try {
    const fileData = await readFile(dataFile, "utf-8");
    return fileData.trim() ? JSON.parse(fileData) : {};
  } catch {
    return {};
  }
};

const saveData = async (data) => {
  await writeFile(dataFile, JSON.stringify(data, null, 2));
};

router.post("/shorten", async (req, res) => {
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
      return res
        .status(400)
        .json({
          error: "Shortcode already exists. Try something new out there...",
        });
    }

    if (Object.values(data).includes(url)) {
      return res.status(400).json({ error: "already exist" });
    }

    //Read → Modify → Write cycle
    data[shortCode] = url; //nothing save in file till now it is all there in RAM only
    await saveData(data); //saves data inside url.json

    res.json({ success: true, shortCode, url });
  } catch (err) {
    console.log("Server error", err);
    // res.status(500).json({error: "Server error"});
    res.status(500).send("Server error");
  }
});

router.get("/urls", async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/s/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;
    const data = await readData();

    if (data[shortCode]) {
      return res.redirect(data[shortCode]);
    }
    res.status(404).send("short url not found");
  } catch (err) {
    res.status(500).send("Server error");
  }
});

//default export
// export default router;

//Named Exprot
export const shortenedRoutes = router;
