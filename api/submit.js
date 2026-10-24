import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);
  const { title, description } = req.body;

  await sql`INSERT INTO complaints (title, description) VALUES (${title}, ${description})`;

  res.status(200).json({ message: "Saved!" });
}
