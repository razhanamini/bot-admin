import AdminBotService from './bot/admin.bot.services';
import db from './database/database.services';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  try {
    // Test basic connection
    const result = await db.query('SELECT NOW() as time');
    console.log('✅ Database connected successfully');
    
    // Test servers table
    const servers = await db.query('SELECT COUNT(*) FROM servers');
    console.log(`✅ Servers table found, count: ${servers.rows[0].count}`);
    
    // Test services table
    const services = await db.query('SELECT COUNT(*) FROM services');
    console.log(`✅ Services table found, count: ${services.rows[0].count}`);
    
  } catch (error: any) {
    console.error('❌ Database connection error:', error.message);
    console.error('❌ Make sure DATABASE_URL is correct and PostgreSQL is accessible');
    process.exit(1);
  }
}

// Validate environment variables
const requiredEnvVars = ['ADMIN_BOT_TOKEN', 'ADMIN_BOT_PASSWORD', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

console.log('🚀 Starting V2Ray Admin Bot...');
console.log(`📊 Connecting to database: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}`);

testDatabaseConnection().then(() => {
  try {
    const adminBot = new AdminBotService();
    adminBot.launch();
  } catch (error: any) {
    console.error('❌ Failed to start admin bot:', error);
    process.exit(1);
  }
});