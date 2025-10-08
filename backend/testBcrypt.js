import { hashPassword, comparePassword } from "./src/utils/hash.js";

async function test() {
  const plain = "Admin@123";
  const hashed = await hashPassword(plain);

  console.log("🔑 Plain:", plain);
  console.log("🔒 Hashed:", hashed);

  const isMatch = await comparePassword(plain, hashed);
  console.log("✅ Match:", isMatch);
}

test().catch(console.error);
