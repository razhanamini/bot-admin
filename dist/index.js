"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin_bot_services_1 = __importDefault(require("./bot/admin.bot.services"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validate environment variables
const requiredEnvVars = ['ADMIN_BOT_TOKEN', 'ADMIN_BOT_PASSWORD', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars);
    process.exit(1);
}
console.log('🚀 Starting V2Ray Admin Bot...');
try {
    const adminBot = new admin_bot_services_1.default();
    adminBot.launch();
}
catch (error) {
    console.error('❌ Failed to start admin bot:', error);
    process.exit(1);
}
