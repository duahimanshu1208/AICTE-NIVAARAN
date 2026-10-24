import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const { student, email, institution, title, description, category, urgency, status, date } = req.body;

  try {
    await sql`INSERT INTO complaints (student, email, institution, title, description, category, urgency, status, date) 
              VALUES (${student}, ${email}, ${institution}, ${title}, ${description}, ${category}, ${urgency}, ${status}, ${date})`;
    res.status(200).json({ message: "Saved!" });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
}
