import pg from 'pg';

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:postgres@localhost:5432/furniture_db?schema=public"
});

async function main() {
  console.log("Updating Delivery status constraints...");
  try {
    await pool.query(`UPDATE "Delivery" SET "deliveryStatus" = 'Pending' WHERE "deliveryStatus" IN ('Pending');`);
    await pool.query(`UPDATE "Delivery" SET "deliveryStatus" = 'Pending' WHERE "deliveryStatus" IN ('Dispatched', 'InTransit', 'Returned', 'Cancelled');`);
    console.log("Update successful. Try running npx prisma db push now.");
  } catch (err) {
    console.error("Error updating users:", err);
  } finally {
    await pool.end();
  }
}

main();
