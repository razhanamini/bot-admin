// // src/services/simple-broadcast.service.ts

// import db from '../database/database.services';
// import BotService  from '../bot/admin.bot.services';

// export class SimpleBroadcastService {
//   private botService: BotService | null = null;
//   private isBroadcasting: boolean = false;
//   private broadcastStats = {
//     total: 0,
//     sent: 0,
//     failed: 0,
//     blocked: 0
//   };

//   setBotService(botService: BotService) {
//     this.botService = botService;
//   }

//   async sendToAllUsers(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<string> {
//     if (!this.botService) {
//       return '❌ Bot service not initialized';
//     }

//     if (this.isBroadcasting) {
//       return '⚠️ Another broadcast is already in progress';
//     }

//     this.isBroadcasting = true;
//     this.resetStats();

//     try {
//       // Get all active users
//       const users = await db.query(
//         'SELECT telegram_id FROM users WHERE is_active = true'
//       );
      
//       this.broadcastStats.total = users.rows.length;
      
//       if (this.broadcastStats.total === 0) {
//         return '📭 No active users found';
//       }

//       console.log(`📢 Broadcasting to ${this.broadcastStats.total} users...`);

//       // Send to each user with delay
//       for (const user of users.rows) {
//         try {
//           await this.botService.sendNotification(
//             user.telegram_id, 
//             message,
//             { parse_mode: parseMode }
//           );
//           this.broadcastStats.sent++;
          
//           // Small delay to avoid rate limiting
//           await this.delay(50);
          
//         } catch (error: any) {
//           if (error.response?.body?.error_code === 403) {
//             // User blocked the bot
//             this.broadcastStats.blocked++;
//             await this.markUserAsBlocked(user.telegram_id);
//           } else {
//             this.broadcastStats.failed++;
//           }
//         }
//       }

//       return this.getReport();
      
//     } catch (error: any) {
//       return `❌ Broadcast failed: ${error.message}`;
//     } finally {
//       this.isBroadcasting = false;
//     }
//   }

//   async sendToActiveUsers(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<string> {
//     if (!this.botService) return '❌ Bot service not initialized';
//     if (this.isBroadcasting) return '⚠️ Another broadcast is in progress';

//     this.isBroadcasting = true;
//     this.resetStats();

//     try {
//       // Get users who have used service recently (active in last 30 days)
//       const users = await db.query(`
//         SELECT DISTINCT u.telegram_id 
//         FROM users u
//         JOIN user_configs uc ON u.id = uc.user_id
//         WHERE u.is_active = true 
//         AND uc.updated_at > NOW() - INTERVAL '30 days'
//       `);
      
//       this.broadcastStats.total = users.rows.length;
      
//       if (this.broadcastStats.total === 0) {
//         return '📭 No active users found';
//       }

//       for (const user of users.rows) {
//         try {
//           await this.botService.sendNotification(user.telegram_id, message, { parse_mode: parseMode });
//           this.broadcastStats.sent++;
//           await this.delay(50);
//         } catch (error: any) {
//           if (error.response?.body?.error_code === 403) {
//             this.broadcastStats.blocked++;
//             await this.markUserAsBlocked(user.telegram_id);
//           } else {
//             this.broadcastStats.failed++;
//           }
//         }
//       }

//       return this.getReport();
      
//     } catch (error: any) {
//       return `❌ Broadcast failed: ${error.message}`;
//     } finally {
//       this.isBroadcasting = false;
//     }
//   }

//   async sendToInactiveUsers(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<string> {
//     if (!this.botService) return '❌ Bot service not initialized';
//     if (this.isBroadcasting) return '⚠️ Another broadcast is in progress';

//     this.isBroadcasting = true;
//     this.resetStats();

//     try {
//       // Get users inactive for 30+ days
//       const users = await db.query(`
//         SELECT u.telegram_id 
//         FROM users u
//         LEFT JOIN user_configs uc ON u.id = uc.user_id
//         WHERE u.is_active = true 
//         AND (uc.updated_at < NOW() - INTERVAL '30 days' OR uc.updated_at IS NULL)
//       `);
      
//       this.broadcastStats.total = users.rows.length;
      
//       if (this.broadcastStats.total === 0) {
//         return '📭 No inactive users found';
//       }

//       for (const user of users.rows) {
//         try {
//           await this.botService.sendNotification(user.telegram_id, message, { parse_mode: parseMode });
//           this.broadcastStats.sent++;
//           await this.delay(50);
//         } catch (error: any) {
//           if (error.response?.body?.error_code === 403) {
//             this.broadcastStats.blocked++;
//             await this.markUserAsBlocked(user.telegram_id);
//           } else {
//             this.broadcastStats.failed++;
//           }
//         }
//       }

//       return this.getReport();
      
//     } catch (error: any) {
//       return `❌ Broadcast failed: ${error.message}`;
//     } finally {
//       this.isBroadcasting = false;
//     }
//   }

//   async sendTestBroadcast(message: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<string> {
//     if (!this.botService) return '❌ Bot service not initialized';

//     // Get admin users (you can hardcode admin IDs or check balance > 0)
//     const adminIds = [123456789, 987654321]; // Add your admin Telegram IDs here
    
//     let sent = 0;
//     for (const adminId of adminIds) {
//       try {
//         await this.botService.sendNotification(adminId, `🧪 TEST BROADCAST\n\n${message}`, { parse_mode: parseMode });
//         sent++;
//       } catch (error) {
//         console.error(`Failed to send test to ${adminId}`);
//       }
//     }
    
//     return `✅ Test broadcast sent to ${sent} admin(s)`;
//   }

//   getStatus() {
//     return {
//       isActive: this.isBroadcasting,
//       stats: this.broadcastStats
//     };
//   }

//   cancelBroadcast() {
//     this.isBroadcasting = false;
//     return '✅ Broadcast cancelled';
//   }

//   private resetStats() {
//     this.broadcastStats = {
//       total: 0,
//       sent: 0,
//       failed: 0,
//       blocked: 0
//     };
//   }

//   private getReport(): string {
//     const { total, sent, failed, blocked } = this.broadcastStats;
//     return (
//       `✅ *Broadcast Complete*\n\n` +
//       `📊 *Statistics:*\n` +
//       `• Total: ${total}\n` +
//       `• ✅ Sent: ${sent}\n` +
//       `• ❌ Failed: ${failed}\n` +
//       `• 🚫 Blocked: ${blocked}\n` +
//       `• 📈 Success Rate: ${total > 0 ? Math.round((sent/total)*100) : 0}%`
//     );
//   }

//   private async markUserAsBlocked(telegramId: number): Promise<void> {
//     await db.query(
//       'UPDATE users SET is_active = false WHERE telegram_id = $1',
//       [telegramId]
//     );
//   }

//   private delay(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }
// }

// export default new SimpleBroadcastService();