import { seed } from "../src/services/seed.js";
import { connectDB, disconnectDB } from "../src/config/db.js";

async function main() {
  await connectDB();
  await seed();
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
  })
  .finally(async () => {
    await disconnectDB();
  });