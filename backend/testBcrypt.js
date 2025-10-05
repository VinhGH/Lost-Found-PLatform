const { comparePassword } = require('./src/utils/hash');

(async () => {
  const hash = "$2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // copy từ DB cột Password
  const isMatch = await comparePassword("Admin@123", hash);
  console.log('✅ Password match:', isMatch);
})();
