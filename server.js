const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const pool = require("./db");

const app = express();
app.use(cors({
  origin: [
    "https://gaya3rajeev.github.io",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
  ],
}));
app.use(express.json());

// Test route
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT COUNT(*) FROM crop");
    res.json({ message: "Backend works", crops: result.rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// SIGNUP
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const existing = await pool.query("SELECT user_id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, name, email",
      [name, email, hash]
    );
    res.status(201).json({ message: "Signup successful", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      message: "Login successful",
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- CROPS ----------
app.get("/api/crop-categories", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM crop_category ORDER BY crop_category_id");
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/crop-categories/:id/crops", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT crop_id, crop_name, season, water_requirement FROM crop WHERE crop_category_id = $1",
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/crops/:id", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM crop WHERE crop_id = $1", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Crop not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- LIVESTOCK ----------
app.get("/api/livestock-categories", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM livestock_category ORDER BY livestock_category_id");
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/livestock-categories/:id/animals", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT livestock_id, animal_name, climate_requirement, water_requirement FROM livestock WHERE livestock_category_id = $1",
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/livestock/:id", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM livestock WHERE livestock_id = $1", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "Animal not found" });
    res.json(r.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- LOCATIONS ----------
app.get("/api/locations/states", async (req, res) => {
  try {
    const r = await pool.query("SELECT DISTINCT state FROM location ORDER BY state");
    res.json(r.rows.map((x) => x.state));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/locations/districts", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT DISTINCT district FROM location WHERE state = $1 ORDER BY district",
      [req.query.state]
    );
    res.json(r.rows.map((x) => x.district));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/locations/localities", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT location_id, locality FROM location WHERE state = $1 AND district = $2 ORDER BY locality",
      [req.query.state, req.query.district]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- RECOMMENDATIONS ----------
app.get("/api/recommendations/:locationId", async (req, res) => {
  try {
    const id = req.params.locationId;
    const loc = await pool.query("SELECT * FROM location WHERE location_id = $1", [id]);
    if (loc.rows.length === 0) return res.status(404).json({ error: "Location not found" });

    const crops = await pool.query(
      `SELECT c.crop_id, c.crop_name, c.season, s.suitability, s.reason
       FROM location_crop_suitability s
       JOIN crop c ON c.crop_id = s.crop_id
       WHERE s.location_id = $1
       ORDER BY CASE s.suitability
         WHEN 'Highly Suitable' THEN 1 WHEN 'Suitable' THEN 2 ELSE 3 END`,
      [id]
    );
    const animals = await pool.query(
      `SELECT l.livestock_id, l.animal_name, s.suitability, s.reason
       FROM location_livestock_suitability s
       JOIN livestock l ON l.livestock_id = s.livestock_id
       WHERE s.location_id = $1
       ORDER BY CASE s.suitability
         WHEN 'Highly Suitable' THEN 1 WHEN 'Suitable' THEN 2 ELSE 3 END`,
      [id]
    );
    res.json({ location: loc.rows[0], crops: crops.rows, livestock: animals.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- AUTH CHECK ----------
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Login required" });
  try {
    req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ---------- CHATBOT ----------
app.post("/api/chat", auth, async (req, res) => {
  try {
    const message = (req.body.message || "").trim();
    if (!message) return res.status(400).json({ error: "Message is required" });
    const text = message.toLowerCase();
    let reply = null;

    // "Rice (Paddy)" -> ["rice (paddy)", "rice", "paddy"]
    const variants = (name) => {
      const full = name.toLowerCase();
      const clean = full.replace(/\(.*?\)/g, "").trim();
      const inner = (full.match(/\((.*?)\)/) || [])[1];
      return [full, clean, inner].filter(Boolean);
    };
    const has = (word) => new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(text);
    const matches = (name) => variants(name).some(has);

    const crops = await pool.query("SELECT * FROM crop");
    const crop = crops.rows.find((c) => matches(c.crop_name));
    if (crop) {
      reply = `${crop.crop_name} (${crop.season}). Climate: ${crop.climate}. Soil: ${crop.soil}. Fertilizer: ${crop.fertilizer}. Irrigation: ${crop.irrigation}. Pests: ${crop.pest_management}. Harvest: ${crop.harvesting}.`;
    }

    if (!reply) {
      const animals = await pool.query("SELECT * FROM livestock");
      const a = animals.rows.find((x) => matches(x.animal_name));
      if (a) {
        reply = `${a.animal_name}. Care: ${a.care} Feeding: ${a.feeding} Housing: ${a.housing} Diseases: ${a.diseases} Breeding: ${a.breeding}`;
      }
    }

    if (!reply) {
      const locs = await pool.query("SELECT * FROM location");
      const loc = locs.rows.find((l) => has(l.locality.toLowerCase()) || has(l.district.toLowerCase()));
      if (loc) {
        const c = await pool.query(
          `SELECT c.crop_name, s.suitability FROM location_crop_suitability s
           JOIN crop c ON c.crop_id = s.crop_id WHERE s.location_id = $1`,
          [loc.location_id]
        );
        const list = c.rows.map((x) => `${x.crop_name} (${x.suitability})`).join(", ");
        reply = `For ${loc.locality}, ${loc.district}: ${list || "no crop data yet"}.`;
      }
    }

    if (!reply) {
      if (has("location") || has("search")) reply = "Open 'Search by Location', pick your state, district and area, and you'll get crops and livestock that suit that place.";
      else if (has("animal") || has("livestock") || has("husbandry")) reply = "Animal Husbandry covers Poultry, Dairy, Goat, Sheep, Piggery, Aquaculture, Beekeeping and Rabbitry. Ask me about a specific animal, like 'jersey cow'.";
      else if (has("crop") || has("crops")) reply = "Crop Production is grouped into categories like Cereals, Pulses, Spices and more. Ask me about a specific crop, like 'rice' or 'turmeric'.";
      else if (has("login") || has("signup") || has("account")) reply = "You can log in or sign up from the auth page. Your details are stored securely in the database.";
      else if (has("hi") || has("hello") || has("hey")) reply = "Hello! Ask me about a crop, an animal, or a place like Kole Lands.";
      else reply = "I can help with crops, animals and locations. Try asking about rice, goat, or a place like Kole Lands.";
    }

    await pool.query(
      "INSERT INTO chat_history (user_id, user_message, bot_response) VALUES ($1, $2, $3)",
      [req.user.user_id, message, reply]
    );
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/chat/history", auth, async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT user_message, bot_response, chat_time FROM chat_history WHERE user_id = $1 ORDER BY chat_time",
      [req.user.user_id]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------- WEBSITE ENDPOINTS (shaped for the frontend) ----------
async function sendRows(res, sql, params, one) {
  try {
    const r = await pool.query(sql, params);
    if (one) {
      if (r.rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json(r.rows[0]);
    }
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

const CROP_CAT_SQL = `SELECT crop_category_id AS id, slug, category_name AS name, icon,
  color_a AS "colorA", color_b AS "colorB", blurb FROM crop_category`;
const ANIMAL_CAT_SQL = `SELECT livestock_category_id AS id, slug, category_name AS name, icon,
  color_a AS "colorA", color_b AS "colorB", blurb FROM livestock_category`;

const CROP_SQL = `SELECT c.crop_id AS id, cc.slug AS "categorySlug", c.slug, c.crop_name AS name, c.icon,
  c.growth_conditions AS growth, c.climate, c.soil, c.fertilizer AS fertilizers, c.irrigation,
  c.pest_management AS pests, c.harvesting, c.season
  FROM crop c JOIN crop_category cc ON cc.crop_category_id = c.crop_category_id`;
const ANIMAL_SQL = `SELECT l.livestock_id AS id, lc.slug AS "categorySlug", l.slug, l.animal_name AS name, l.icon,
  l.care, l.feeding, l.diseases, l.housing, l.breeding, l.management
  FROM livestock l JOIN livestock_category lc ON lc.livestock_category_id = l.livestock_category_id`;

app.get("/api/ui/crop-categories", (req, res) =>
  sendRows(res, CROP_CAT_SQL + " ORDER BY crop_category_id", [], false));
app.get("/api/ui/crop-categories/:slug", (req, res) =>
  sendRows(res, CROP_CAT_SQL + " WHERE slug = $1", [req.params.slug], true));
app.get("/api/ui/crop-categories/:slug/crops", (req, res) =>
  sendRows(res, CROP_SQL + " WHERE cc.slug = $1 ORDER BY c.crop_id", [req.params.slug], false));
app.get("/api/ui/crops/:slug", (req, res) =>
  sendRows(res, CROP_SQL + " WHERE c.slug = $1", [req.params.slug], true));

app.get("/api/ui/animal-categories", (req, res) =>
  sendRows(res, ANIMAL_CAT_SQL + " ORDER BY livestock_category_id", [], false));
app.get("/api/ui/animal-categories/:slug", (req, res) =>
  sendRows(res, ANIMAL_CAT_SQL + " WHERE slug = $1", [req.params.slug], true));
app.get("/api/ui/animal-categories/:slug/animals", (req, res) =>
  sendRows(res, ANIMAL_SQL + " WHERE lc.slug = $1 ORDER BY l.livestock_id", [req.params.slug], false));
app.get("/api/ui/animals/:slug", (req, res) =>
  sendRows(res, ANIMAL_SQL + " WHERE l.slug = $1", [req.params.slug], true));

app.listen(process.env.PORT, () =>
  console.log("Server running on port " + process.env.PORT)
);