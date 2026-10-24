import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    // This fetches all complaints, putting the newest ones at the top
    const complaints = await sql`SELECT * FROM complaints ORDER BY id DESC`; 
    
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: "Failed to load data" });
  }
}
