const { neon } = require("@neondatabase/serverless");
const { verify } = require("../lib/auth");

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const HOUR = 3600000;
// Creates the table the first time it is needed, so there is nothing to set up by hand
let ready;
const init = () => (ready = ready || sql`create table if not exists complaints (id serial primary key, data jsonb not null)`);
// What each kind of user is allowed to change
const OFFICIAL_FIELDS = ["status", "urgency", "category", "remark", "collegeEmail", "archived", "archiveReason", "history", "manualRoute"];
const STUDENT_FIELDS = ["institution", "title", "description", "category", "urgency", "history", "editedAt"];
const pick = (obj, keys) => Object.fromEntries(keys.filter(k => k in obj).map(k => [k, obj[k]]));
const out = (row) => ({ ...row.data, id: row.id });
const today = () => new Date().toISOString().slice(0, 10);

module.exports = async (req, res) => {
  const user = verify((req.headers.authorization || "").replace("Bearer ", ""));
  if (!user) return res.status(401).json({ error: "Please sign in." });
  const isOfficial = user.role === "official";

  try {
    await init();
    if (req.method === "GET") {
      const rows = isOfficial
        ? await sql`select id, data from complaints order by id`
        : await sql`select id, data from complaints where data->>'email' = ${user.email} order by id`;
      return res.json(rows.map(out));
    }

    if (req.method === "POST") {
      if (isOfficial) return res.status(403).json({ error: "Officials cannot file complaints." });
      const b = req.body || {};
      if (!b.institution || !b.title || !b.description) return res.status(400).json({ error: "Fill in the institution, title and description." });
      const data = {
        ...pick(b, ["institution", "title", "description", "category", "urgency"]),
        email: user.email, student: user.name, status: "New",
        createdAt: Date.now(), date: today(),
        history: [{ when: today(), text: "Complaint filed" }]
      };
      const rows = await sql`insert into complaints (data) values (${JSON.stringify(data)}::jsonb) returning id, data`;
      return res.status(201).json(out(rows[0]));
    }

    const id = Number(req.query.id);
    const found = await sql`select id, data from complaints where id = ${id}`;
    if (!found.length) return res.status(404).json({ error: "Complaint not found." });
    const current = found[0].data;

    if (req.method === "PUT") {
      let changes;
      if (isOfficial) {
        changes = pick(req.body || {}, OFFICIAL_FIELDS);
      } else {
        if (current.email !== user.email) return res.status(403).json({ error: "This is not your complaint." });
        if (Date.now() - current.createdAt > 24 * HOUR) return res.status(403).json({ error: "The 24-hour edit window has closed." });
        changes = pick(req.body || {}, STUDENT_FIELDS);
        if (current.manualRoute) { delete changes.category; delete changes.urgency; }   // an official's choice stays
      }
      const data = { ...current, ...changes };
      const rows = await sql`update complaints set data = ${JSON.stringify(data)}::jsonb where id = ${id} returning id, data`;
      return res.json(out(rows[0]));
    }

    if (req.method === "DELETE") {
      if (!isOfficial) return res.status(403).json({ error: "Only officials can delete." });
      await sql`delete from complaints where id = ${id}`;
      return res.json({ ok: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error. Check the function logs in Vercel." });
  }
};
