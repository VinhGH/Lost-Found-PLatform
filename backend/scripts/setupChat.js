import { supabase } from '../src/config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup Chat Schema
 * Run: node backend/scripts/setupChat.js
 */
const setupChatSchema = async () => {
  try {
    console.log('🚀 Setting up Chat Schema...\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, '../database/setup_chat_schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📄 Reading SQL file:', sqlFilePath);
    console.log('📏 SQL Content length:', sqlContent.length, 'characters\n');

    // Split SQL by statement (semicolon)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📋 Found', statements.length, 'SQL statements\n');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          errorCount++;
        } else {
          successCount++;
          
          // Log table creation
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const match = statement.match(/CREATE TABLE ["']?(\w+)["']?/i);
            if (match) {
              console.log(`✅ Created table: ${match[1]}`);
            }
          }
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   ✅ Success: ${successCount} statements`);
    console.log(`   ❌ Errors: ${errorCount} statements`);
    console.log('='.repeat(50) + '\n');

    if (errorCount === 0) {
      console.log('🎉 Chat schema setup completed successfully!\n');
      console.log('📋 Tables created:');
      console.log('   - Conversation');
      console.log('   - ConversationParticipant');
      console.log('   - Message\n');
      
      // Verify tables
      await verifyTables();
    } else {
      console.log('⚠️  Setup completed with some errors. Please check above.\n');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
};

/**
 * Verify that tables were created
 */
const verifyTables = async () => {
  console.log('🔍 Verifying tables...\n');
  
  const tablesToCheck = ['Conversation', 'ConversationParticipant', 'Message'];
  
  for (const tableName of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ Table "${tableName}": ${error.message}`);
      } else {
        console.log(`✅ Table "${tableName}": OK`);
      }
    } catch (err) {
      console.log(`❌ Table "${tableName}": ${err.message}`);
    }
  }

  console.log('\n💡 Next steps:');
  console.log('   1. Test API: POST /api/chat/conversations');
  console.log('   2. Check tables in pgAdmin or psql');
  console.log('   3. Review backend/database/README_CHAT_SETUP.md\n');
};

// Run setup
setupChatSchema()
  .then(() => {
    console.log('✨ Done!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });

