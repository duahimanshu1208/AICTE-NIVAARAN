import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const complaints = await sql`SELECT * FROM complaints ORDER BY id DESC`; 
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ error: "Failed to load data" });
  }
}
