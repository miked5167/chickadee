import { sql } from '@vercel/postgres';

async function checkSlug() {
  try {
    const result = await sql`
      SELECT id, name, slug FROM advisors WHERE id = 2112
    `;
    console.log('Advisor found:', result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkSlug();
