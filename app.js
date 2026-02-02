import { readFile, writeFile } from "fs/promises";
import path from "path";
import { createServer } from "http";
import { fileURLToPath } from "url";

const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFile = path.join(__dirname, "url.json");

// Serve static files
const serveFile = async (res, filePath, contentType) => {
  try {
    const data = await readFile(filePath, "utf-8");
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 Page Not Found");
  }
};

// Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const server = createServer(async (req, res) => {
  console.log(req.method, req.url);

  // ===== GET ROUTES =====
  if (req.method === "GET") {
    if (req.url === "/") {
      return serveFile(res, path.join(__dirname, "index.html"), "text/html");
    }

    if (req.url === "/style.css") {
      return serveFile(res, path.join(__dirname, "style.css"), "text/css");
    }

    // 🔥 GET ALL URLS
    if (req.url === "/urls") {
      try {
        const fileData = await readFile(dataFile, "utf-8");
        const urls = fileData.trim() ? JSON.parse(fileData) : {};
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify(urls));
      } catch {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({}));
      }
    }

    // 🔥 REDIRECT SHORT URL
    const shortCode = req.url.slice(1);
    try {
      const fileData = await readFile(dataFile, "utf-8");
      const existingData = JSON.parse(fileData);

      if (existingData[shortCode]) {
        // res.writeHead(302, { Location: existingData[shortCode] });
        res.writeHead(302, { Location: "https://youtube.com" });
        return res.end();
      }
    } catch {}

    res.writeHead(404, { "Content-Type": "text/plain" });
    return res.end("Short URL not found");
  }

  // ===== POST ROUTE =====
  if (req.method === "POST" && req.url === "/shorten") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const { url, shortCode } = JSON.parse(body);

        if (!isValidUrl(url)) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: "Invalid URL" }));
        }

        let existingData = {};

        try {
          const fileData = await readFile(dataFile, "utf-8");
          if (fileData.trim()) {
            existingData = JSON.parse(fileData);
          }
        } catch {
          existingData = {};
        }

        if (existingData[shortCode]) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "Shortcode already exists" })
          );
        }

        const isDupURL = Object.values(existingData).includes(url);
        if (isDupURL) {
          res.writeHead(400, { "Content-Type": "application/json" });
          return res.end(
            JSON.stringify({ error: "This URL already exists" })
          );
        }

        existingData[shortCode] = url;
        await writeFile(dataFile, JSON.stringify(existingData, null, 2));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, shortCode, url }));
      } catch (err) {
        console.error("SERVER ERROR:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Server error" }));
      }
    });

    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Route not found");
});

server.listen(PORT, () => {
  console.log(`🚀 Running on http://localhost:${PORT}`);
});
