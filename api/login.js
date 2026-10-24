const { sign } = require("../lib/auth");

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.SESSION_SECRET && !process.env.DATABASE_URL && !process.env.POSTGRES_URL)
    return res.status(500).json({ error: "Add the Neon database to the project in Vercel first." });
  // Demo defaults. Set OFFICIAL_ID and OFFICIAL_PASSWORD in Vercel to use your own.
  const OFFICIAL_ID = process.env.OFFICIAL_ID || "official";
  const OFFICIAL_PASSWORD = process.env.OFFICIAL_PASSWORD || "official.login";

  const b = req.body || {};
  if (b.role === "official") {
    const idOk = String(b.id || "").trim().toLowerCase() === OFFICIAL_ID.toLowerCase();
    const pwOk = b.password === OFFICIAL_PASSWORD;
    if (!idOk || !pwOk) return res.status(401).json({ error: "Official ID or password is incorrect. Check both and try again." });
    return res.json({ token: sign({ role: "official", name: "AICTE official" }), role: "official", name: "AICTE official" });
  }

  const name = String(b.name || "").trim(), email = String(b.email || "").trim().toLowerCase();
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter your full name and a valid email address." });
  res.json({ token: sign({ role: "student", name, email }), role: "student", name, email });
};
