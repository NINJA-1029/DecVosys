import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "users.json");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// ── Local JSON Database helpers ────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "[]");
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Seed default users on first run ───────────────────────────────────────────
function seedDB() {
  const users = readDB();
  if (users.length === 0) {
    writeDB([
      {
        userId: "admin001",
        password: "admin@123",
        role: "admin",
        extractedName: "Admin User",
        extractedPhone: "9999999999",
        isVerified: true,
      },
      {
        userId: "voter001",
        password: "voter@123",
        role: "user",
        extractedName: "SUDHARSAN M",
        extractedPhone: "9876543210",
        isVerified: false,
      },
    ]);
    console.log("✅  Default users seeded.");
  }
}
seedDB();

// ── Routes ─────────────────────────────────────────────────────────────────────

// 1. Login  (auto-creates voter account if userId is new)
app.post("/api/auth/login", (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password)
    return res.status(400).json({ error: "Missing userId or password" });

  const users = readDB();
  let user = users.find((u) => u.userId === userId);

  if (!user) {
    // auto-register new voter
    user = { userId, password, role: "user", extractedName: "", extractedPhone: "", isVerified: false };
    users.push(user);
    writeDB(users);
    console.log(`🆕 New voter registered: ${userId}`);
  } else if (user.password !== password) {
    return res.status(401).json({ error: "Invalid password" });
  }

  res.json({ message: "Login successful", user });
});

// 2. Signup — full voter registration
app.post("/api/auth/signup", (req, res) => {
  const { userId, fullName, dob, phone, email, gender, address, password } = req.body;
  if (!userId || !fullName || !password || !phone || !email)
    return res.status(400).json({ error: "Missing required fields" });

  const users = readDB();
  if (users.find((u) => u.userId === userId))
    return res.status(400).json({ error: "User ID already taken. Please choose another." });

  const newUser = {
    userId, password, role: "user",
    fullName, dob: dob || "", phone, email,
    gender: gender || "", address: address || "",
    extractedName: fullName, extractedPhone: phone,
    isVerified: false,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  writeDB(users);
  console.log(`✅ New voter signed up: ${userId} (${fullName})`);
  res.json({ message: "Account created successfully", user: newUser });
});

// 3. Save OCR-extracted ID details
app.post("/api/verify/id", (req, res) => {
  const { userId, extractedName, extractedPhone } = req.body;
  const users = readDB();
  const idx = users.findIndex((u) => u.userId === userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  users[idx].extractedName = extractedName;
  users[idx].extractedPhone = extractedPhone;
  writeDB(users);
  res.json({ message: "ID details saved", user: users[idx] });
});

// 3. Face verification result
app.post("/api/verify/face", (req, res) => {
  const { userId, matchConfidence } = req.body;
  const users = readDB();
  const idx = users.findIndex((u) => u.userId === userId);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  if (parseFloat(matchConfidence) > 0.6) {
    users[idx].isVerified = true;
    writeDB(users);
    return res.json({ message: "Face match successful. Verification complete.", verified: true });
  }
  res.json({ message: "Face match failed.", verified: false });
});

// 4. Get all users (admin debug helper)
app.get("/api/users", (_req, res) => res.json(readDB()));

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀  Backend running on http://localhost:${PORT}`);
  console.log(`📁  User DB file : ${DB_PATH}\n`);
  console.log("────────────────────────────────────────────────");
  console.log("  Default login credentials:");
  console.log("  Admin  → userId: admin001  |  password: admin@123");
  console.log("  Voter  → userId: voter001  |  password: voter@123");
  console.log("  (Any new userId + password auto-creates a voter account)");
  console.log("────────────────────────────────────────────────\n");
});
