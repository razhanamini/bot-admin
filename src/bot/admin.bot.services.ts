// import { Telegraf, Context, Markup } from 'telegraf';
// import dotenv from 'dotenv';
// import db from '../database/database.services';
// import { AdminMessages } from './messages';

// dotenv.config();

// // Session state for multi-step operations
// interface SessionState {
//   currentAction: string | null;
//   currentItem: any;
//   step: number;
// }

// class AdminBotService {
//   private bot: Telegraf;
//   private sessions: Map<number, SessionState> = new Map();

//   constructor() {
//     const token = process.env.ADMIN_BOT_TOKEN;
//     if (!token) {
//       throw new Error('ADMIN_BOT_TOKEN is not defined in environment variables');
//     }

//     this.bot = new Telegraf(token);
//     this.setupCommands();
//     this.setupHandlers();
//     this.setupCallbacks();
//   }

//   private getSession(userId: number): SessionState {
//     if (!this.sessions.has(userId)) {
//       this.sessions.set(userId, {
//         currentAction: null,
//         currentItem: null,
//         step: 0
//       });
//     }
//     return this.sessions.get(userId)!;
//   }

//   private clearSession(userId: number) {
//     this.sessions.delete(userId);
//   }

//   private setupCommands() {
//     this.bot.command('start', async (ctx) => {
//       const userId = ctx.from!.id;
//       this.clearSession(userId);
//       await this.showMainMenu(ctx);
//     });

//     this.bot.command('cancel', async (ctx) => {
//       const userId = ctx.from!.id;
//       this.clearSession(userId);
//       await ctx.reply(AdminMessages.cancelled(), {
//         reply_markup: {
//           keyboard: [
//             ['📦 Services', '🖥️ Servers'],
//             ['📊 Statistics', '👥 Users'],
//             ['💰 Payments']
//           ],
//           resize_keyboard: true
//         }
//       });
//     });

//     this.bot.command('menu', async (ctx) => {
//       await this.showMainMenu(ctx);
//     });

//     this.bot.command('services', async (ctx) => {
//       await this.showServicesMenu(ctx);
//     });

//     this.bot.command('servers', async (ctx) => {
//       await this.showServersMenu(ctx);
//     });

//     this.bot.command('stats', async (ctx) => {
//       await this.showStats(ctx);
//     });

//     this.bot.command('users', async (ctx) => {
//       await this.showUsers(ctx);
//     });

//     this.bot.command('payments', async (ctx) => {
//       await this.showPayments(ctx);
//     });
//   }

//   private setupHandlers() {
//     // Main menu buttons
//     this.bot.hears('📦 Services', async (ctx) => {
//       await this.showServicesMenu(ctx);
//     });

//     this.bot.hears('🖥️ Servers', async (ctx) => {
//       await this.showServersMenu(ctx);
//     });

//     this.bot.hears('📊 Statistics', async (ctx) => {
//       await this.showStats(ctx);
//     });

//     this.bot.hears('👥 Users', async (ctx) => {
//       await this.showUsers(ctx);
//     });

//     this.bot.hears('💰 Payments', async (ctx) => {
//       await this.showPayments(ctx);
//     });

//     this.bot.hears('🔙 Main Menu', async (ctx) => {
//       await this.showMainMenu(ctx);
//     });

//     // Handle multi-step operations
//     this.bot.on('text', async (ctx) => {
//       const userId = ctx.from!.id;
//       const session = this.getSession(userId);
//       const text = ctx.message.text;

//       // Skip if it's a command or menu button
//       if (text.startsWith('/') || 
//           text === '📦 Services' || 
//           text === '🖥️ Servers' || 
//           text === '📊 Statistics' || 
//           text === '👥 Users' || 
//           text === '💰 Payments' || 
//           text === '🔙 Main Menu') {
//         return;
//       }

//       // Handle multi-step operations
//       if (session.currentAction) {
//         await this.handleMultiStep(ctx, session, text);
//       }
//     });
//   }

//   private setupCallbacks() {
//     // Services
//     this.bot.action(/^services_list$/, async (ctx) => {
//       await this.listServices(ctx);
//     });

//     this.bot.action(/^service_create$/, async (ctx) => {
//       await this.startServiceCreate(ctx);
//     });

//     this.bot.action(/^service_edit_(\d+)$/, async (ctx) => {
//       const serviceId = parseInt(ctx.match[1]);
//       await this.startServiceEdit(ctx, serviceId);
//     });

//     this.bot.action(/^service_delete_(\d+)$/, async (ctx) => {
//       const serviceId = parseInt(ctx.match[1]);
//       await this.confirmServiceDelete(ctx, serviceId);
//     });

//     this.bot.action(/^confirm_service_delete_(\d+)$/, async (ctx) => {
//       const serviceId = parseInt(ctx.match[1]);
//       await this.deleteService(ctx, serviceId);
//     });

//     // Servers
//     this.bot.action(/^servers_list$/, async (ctx) => {
//       await this.listServers(ctx);
//     });

//     this.bot.action(/^server_create$/, async (ctx) => {
//       await this.startServerCreate(ctx);
//     });

//     this.bot.action(/^server_edit_(\d+)$/, async (ctx) => {
//       const serverId = parseInt(ctx.match[1]);
//       await this.startServerEdit(ctx, serverId);
//     });

//     this.bot.action(/^server_delete_(\d+)$/, async (ctx) => {
//       const serverId = parseInt(ctx.match[1]);
//       await this.confirmServerDelete(ctx, serverId);
//     });

//     this.bot.action(/^confirm_server_delete_(\d+)$/, async (ctx) => {
//       const serverId = parseInt(ctx.match[1]);
//       await this.deleteServer(ctx, serverId);
//     });

//     this.bot.action(/^cancel_action$/, async (ctx) => {
//       const userId = ctx.from!.id;
//       const session = this.getSession(userId);
//       session.currentAction = null;
//       session.currentItem = null;
//       session.step = 0;
//       await ctx.answerCbQuery();
//       await ctx.editMessageText(AdminMessages.actionCancelled(), {
//         reply_markup: { inline_keyboard: [] }
//       });
//     });

//     this.bot.action(/^back_to_main$/, async (ctx) => {
//       await ctx.answerCbQuery();
//       await ctx.deleteMessage();
//       await this.showMainMenu(ctx);
//     });

//     this.bot.action(/^back_to_services$/, async (ctx) => {
//       await ctx.answerCbQuery();
//       await ctx.deleteMessage();
//       await this.showServicesMenu(ctx);
//     });

//     this.bot.action(/^back_to_servers$/, async (ctx) => {
//       await ctx.answerCbQuery();
//       await ctx.deleteMessage();
//       await this.showServersMenu(ctx);
//     });

//     this.bot.action(/^refresh_stats$/, async (ctx) => {
//       await ctx.answerCbQuery('🔄 Refreshing...');
//       await ctx.deleteMessage();
//       await this.showStats(ctx);
//     });

//     this.bot.action(/^refresh_users$/, async (ctx) => {
//       await ctx.answerCbQuery('🔄 Refreshing...');
//       await ctx.deleteMessage();
//       await this.showUsers(ctx);
//     });

//     this.bot.action(/^refresh_payments$/, async (ctx) => {
//       await ctx.answerCbQuery('🔄 Refreshing...');
//       await ctx.deleteMessage();
//       await this.showPayments(ctx);
//     });
//   }

//   // ================ MAIN MENU ================
//   private async showMainMenu(ctx: Context) {
//     await ctx.reply(AdminMessages.mainMenu(), {
//       reply_markup: {
//         keyboard: [
//           ['📦 Services', '🖥️ Servers'],
//           ['📊 Statistics', '👥 Users'],
//           ['💰 Payments']
//         ],
//         resize_keyboard: true
//       }
//     });
//   }

//   // ================ SERVICES CRUD ================
//   private async showServicesMenu(ctx: Context) {
//     await ctx.reply(AdminMessages.servicesMenu(), {
//       reply_markup: {
//         inline_keyboard: [
//           [Markup.button.callback('📋 List All Services', 'services_list')],
//           [Markup.button.callback('➕ Create New Service', 'service_create')],
//           [Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]
//         ]
//       }
//     });
//   }

//   private async listServices(ctx: any) {
//     const services = await db.getServices();
    
//     if (services.length === 0) {
//       await ctx.editMessageText(AdminMessages.noServices(), {
//         reply_markup: {
//           inline_keyboard: [
//             [Markup.button.callback('➕ Create Service', 'service_create')],
//             [Markup.button.callback('🔙 Back', 'back_to_services')]
//           ]
//         }
//       });
//       return;
//     }

//     const message = AdminMessages.servicesList(services);
    
//     const buttons = services.slice(0, 5).map((service: any) => [
//       Markup.button.callback(
//         `✏️ ${service.name} (${service.price.toLocaleString()} IRR)`,
//         `service_edit_${service.id}`
//       ),
//       Markup.button.callback('❌', `service_delete_${service.id}`)
//     ]);

//     buttons.push([Markup.button.callback('➕ Create New', 'service_create')]);
//     buttons.push([Markup.button.callback('🔙 Back', 'back_to_services')]);

//     await ctx.editMessageText(message, {
//       parse_mode: 'MarkdownV2',
//       reply_markup: {
//         inline_keyboard: buttons
//       }
//     });
//   }

  // private async startServiceCreate(ctx: any) {
  //   const userId = ctx.from.id;
  //   const session = this.getSession(userId);
    
  //   session.currentAction = 'create_service';
  //   session.currentItem = {};
  //   session.step = 1;
    
  //   await ctx.editMessageText(AdminMessages.createServiceStep1(), {
  //     reply_markup: {
  //       inline_keyboard: [
  //         [Markup.button.callback('❌ Cancel', 'cancel_action')]
  //       ]
  //     }
  //   });
  // }

  // private async startServiceEdit(ctx: any, serviceId: number) {
  //   const service = await db.getServiceById(serviceId);
    
  //   if (!service) {
  //     await ctx.answerCbQuery('Service not found!');
  //     return;
  //   }
    
  //   const userId = ctx.from.id;
  //   const session = this.getSession(userId);
    
  //   session.currentAction = 'edit_service';
  //   session.currentItem = service;
  //   session.step = 1;
    
  //   await ctx.editMessageText(AdminMessages.editService(service), {
  //     parse_mode: 'MarkdownV2',
  //     reply_markup: {
  //       inline_keyboard: [
  //         [Markup.button.callback('✏️ Edit Name', `edit_service_name_${serviceId}`)],
  //         [Markup.button.callback('✏️ Edit Description', `edit_service_desc_${serviceId}`)],
  //         [Markup.button.callback('✏️ Edit Price', `edit_service_price_${serviceId}`)],
  //         [Markup.button.callback('✏️ Edit Duration', `edit_service_duration_${serviceId}`)],
  //         [Markup.button.callback('✏️ Edit Data Limit', `edit_service_data_${serviceId}`)],
  //         [Markup.button.callback('🔄 Toggle Active', `toggle_service_${serviceId}`)],
  //         [Markup.button.callback('❌ Delete', `service_delete_${serviceId}`)],
  //         [Markup.button.callback('🔙 Back', 'services_list')]
  //       ]
  //     }
  //   });
  // }

  // private async confirmServiceDelete(ctx: any, serviceId: number) {
  //   const service = await db.getServiceById(serviceId);
    
  //   await ctx.editMessageText(AdminMessages.confirmDeleteService(service), {
  //     parse_mode: 'MarkdownV2',
  //     reply_markup: {
  //       inline_keyboard: [
  //         [
  //           Markup.button.callback('✅ Yes, Delete', `confirm_service_delete_${serviceId}`),
  //           Markup.button.callback('❌ No, Cancel', 'services_list')
  //         ]
  //       ]
  //     }
  //   });
  // }

  // private async deleteService(ctx: any, serviceId: number) {
  //   try {
  //     await db.deleteService(serviceId);
  //     await ctx.answerCbQuery('✅ Service deleted successfully!');
  //     await this.listServices(ctx);
  //   } catch (error: any) {
  //     await ctx.answerCbQuery(`❌ Error: ${error.message}`);
  //   }
  // }

  // // ================ SERVERS CRUD ================
  // private async showServersMenu(ctx: Context) {
  //   await ctx.reply(AdminMessages.serversMenu(), {
  //     reply_markup: {
  //       inline_keyboard: [
  //         [Markup.button.callback('📋 List All Servers', 'servers_list')],
  //         [Markup.button.callback('➕ Add New Server', 'server_create')],
  //         [Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]
  //       ]
  //     }
  //   });
  // }

  // private async listServers(ctx: any) {
  //   const servers = await db.getServers();
    
  //   if (servers.length === 0) {
  //     await ctx.editMessageText(AdminMessages.noServers(), {
  //       reply_markup: {
  //         inline_keyboard: [
  //           [Markup.button.callback('➕ Add Server', 'server_create')],
  //           [Markup.button.callback('🔙 Back', 'back_to_servers')]
  //         ]
  //       }
  //     });
  //     return;
  //   }

  //   const message = AdminMessages.serversList(servers);
    
  //   const buttons = servers.slice(0, 5).map((server: any) => [
  //     Markup.button.callback(
  //       `✏️ ${server.name} (${server.location || 'Unknown'})`,
  //       `server_edit_${server.id}`
  //     ),
  //     Markup.button.callback('❌', `server_delete_${server.id}`)
  //   ]);

  //   buttons.push([Markup.button.callback('➕ Add New Server', 'server_create')]);
  //   buttons.push([Markup.button.callback('🔙 Back', 'back_to_servers')]);

  //   await ctx.editMessageText(message, {
  //     parse_mode: 'MarkdownV2',
  //     reply_markup: {
  //       inline_keyboard: buttons
  //     }
  //   });
  // }

//   private async startServerCreate(ctx: any) {
//     const userId = ctx.from.id;
//     const session = this.getSession(userId);
    
//     session.currentAction = 'create_server';
//     session.currentItem = {};
//     session.step = 1;
    
//     await ctx.editMessageText(AdminMessages.createServerStep1(), {
//       reply_markup: {
//         inline_keyboard: [
//           [Markup.button.callback('❌ Cancel', 'cancel_action')]
//         ]
//       }
//     });
//   }

//   private async startServerEdit(ctx: any, serverId: number) {
//     const server = await db.getServerById(serverId);
    
//     if (!server) {
//       await ctx.answerCbQuery('Server not found!');
//       return;
//     }
    
//     const userId = ctx.from.id;
//     const session = this.getSession(userId);
    
//     session.currentAction = 'edit_server';
//     session.currentItem = server;
//     session.step = 1;
    
//     await ctx.editMessageText(AdminMessages.editServer(server), {
//       parse_mode: 'MarkdownV2',
//       reply_markup: {
//         inline_keyboard: [
//           [Markup.button.callback('✏️ Edit Name', `edit_server_name_${serverId}`)],
//           [Markup.button.callback('✏️ Edit Domain/IP', `edit_server_host_${serverId}`)],
//           [Markup.button.callback('✏️ Edit Ports', `edit_server_ports_${serverId}`)],
//           [Markup.button.callback('✏️ Edit API Token', `edit_server_token_${serverId}`)],
//           [Markup.button.callback('✏️ Edit Capacity', `edit_server_capacity_${serverId}`)],
//           [Markup.button.callback('🔄 Toggle Status', `toggle_server_${serverId}`)],
//           [Markup.button.callback('❌ Delete', `server_delete_${serverId}`)],
//           [Markup.button.callback('🔙 Back', 'servers_list')]
//         ]
//       }
//     });
//   }

//   private async confirmServerDelete(ctx: any, serverId: number) {
//     const server = await db.getServerById(serverId);
    
//     await ctx.editMessageText(AdminMessages.confirmDeleteServer(server), {
//       parse_mode: 'MarkdownV2',
//       reply_markup: {
//         inline_keyboard: [
//           [
//             Markup.button.callback('✅ Yes, Delete', `confirm_server_delete_${serverId}`),
//             Markup.button.callback('❌ No, Cancel', 'servers_list')
//           ]
//         ]
//       }
//     });
//   }

//   private async deleteServer(ctx: any, serverId: number) {
//     try {
//       await db.deleteServer(serverId);
//       await ctx.answerCbQuery('✅ Server deleted successfully!');
//       await this.listServers(ctx);
//     } catch (error: any) {
//       await ctx.answerCbQuery(`❌ Error: ${error.message}`);
//     }
//   }

  // // ================ MULTI-STEP HANDLERS ================
  // private async handleMultiStep(ctx: Context, session: SessionState, text: string) {
  //   if (session.currentAction === 'create_service') {
  //     await this.handleCreateServiceStep(ctx, session, text);
  //   } else if (session.currentAction === 'create_server') {
  //     await this.handleCreateServerStep(ctx, session, text);
  //   }
  // }

  // private async handleCreateServiceStep(ctx: Context, session: SessionState, text: string) {
  //   switch (session.step) {
  //     case 1: // Name
  //       session.currentItem.name = text;
  //       session.step = 2;
  //       await ctx.reply(AdminMessages.createServiceStep2());
  //       break;
  //     case 2: // Description
  //       session.currentItem.description = text;
  //       session.step = 3;
  //       await ctx.reply(AdminMessages.createServiceStep3());
  //       break;
  //     case 3: // Price
  //       const price = parseFloat(text);
  //       if (isNaN(price) || price < 0) {
  //         await ctx.reply(AdminMessages.invalidInput('price'));
  //         return;
  //       }
  //       session.currentItem.price = price;
  //       session.step = 4;
  //       await ctx.reply(AdminMessages.createServiceStep4());
  //       break;
  //     case 4: // Duration
  //       const duration = parseInt(text);
  //       if (isNaN(duration) || duration <= 0) {
  //         await ctx.reply(AdminMessages.invalidInput('duration'));
  //         return;
  //       }
  //       session.currentItem.duration_days = duration;
  //       session.step = 5;
  //       await ctx.reply(AdminMessages.createServiceStep5());
  //       break;
  //     case 5: // Data Limit
  //       const dataLimit = parseFloat(text);
  //       if (isNaN(dataLimit) || dataLimit < 0) {
  //         await ctx.reply(AdminMessages.invalidInput('data limit'));
  //         return;
  //       }
  //       session.currentItem.data_limit_gb = dataLimit || null;
  //       session.step = 6;
  //       await ctx.reply(AdminMessages.createServiceStep6());
  //       break;
  //     case 6: // Sort Order
  //       const sortOrder = parseInt(text);
  //       session.currentItem.sort_order = isNaN(sortOrder) ? 0 : sortOrder;
  //       session.currentItem.is_active = true;
        
  //       try {
  //         const service = await db.createService(session.currentItem);
  //         await ctx.reply(AdminMessages.serviceCreated(service), {
  //           parse_mode: 'MarkdownV2'
  //         });
  //         session.currentAction = null;
  //         session.currentItem = null;
  //         session.step = 0;
  //         await this.showServicesMenu(ctx);
  //       } catch (error: any) {
  //         await ctx.reply(AdminMessages.error(error.message));
  //       }
  //       break;
  //   }
  // }

  // private async handleCreateServerStep(ctx: Context, session: SessionState, text: string) {
  //   switch (session.step) {
  //     case 1: // Name
  //       session.currentItem.name = text;
  //       session.step = 2;
  //       await ctx.reply(AdminMessages.createServerStep2());
  //       break;
  //     case 2: // Domain
  //       session.currentItem.domain = text;
  //       session.step = 3;
  //       await ctx.reply(AdminMessages.createServerStep3());
  //       break;
  //     case 3: // IP
  //       session.currentItem.ip = text;
  //       session.step = 4;
  //       await ctx.reply(AdminMessages.createServerStep4());
  //       break;
  //     case 4: // API Port
  //       const apiPort = parseInt(text);
  //       session.currentItem.api_port = isNaN(apiPort) ? 5000 : apiPort;
  //       session.step = 5;
  //       await ctx.reply(AdminMessages.createServerStep5());
  //       break;
  //     case 5: // Xray Port
  //       const xrayPort = parseInt(text);
  //       session.currentItem.xray_port = isNaN(xrayPort) ? 8445 : xrayPort;
  //       session.step = 6;
  //       await ctx.reply(AdminMessages.createServerStep6());
  //       break;
  //     case 6: // API Token
  //       session.currentItem.api_token = text;
  //       session.step = 7;
  //       await ctx.reply(AdminMessages.createServerStep7());
  //       break;
  //     case 7: // Max Users
  //       const maxUsers = parseInt(text);
  //       session.currentItem.max_users = isNaN(maxUsers) ? 100 : maxUsers;
  //       session.step = 8;
  //       await ctx.reply(AdminMessages.createServerStep8());
  //       break;
  //     case 8: // Location
  //       session.currentItem.location = text;
  //       session.step = 9;
  //       await ctx.reply(AdminMessages.createServerStep9());
  //       break;
  //     case 9: // Status
  //       session.currentItem.status = text.toLowerCase();
  //       session.step = 10;
  //       await ctx.reply(AdminMessages.createServerStep10());
  //       break;
  //     case 10: // CPU Cores
  //       const cpuCores = parseInt(text);
  //       session.currentItem.cpu_cores = isNaN(cpuCores) ? 2 : cpuCores;
  //       session.step = 11;
  //       await ctx.reply(AdminMessages.createServerStep11());
  //       break;
  //     case 11: // RAM GB
  //       const ramGb = parseInt(text);
  //       session.currentItem.ram_gb = isNaN(ramGb) ? 4 : ramGb;
        
  //       try {
  //         const server = await db.createServer(session.currentItem);
  //         await ctx.reply(AdminMessages.serverCreated(server), {
  //           parse_mode: 'MarkdownV2'
  //         });
  //         session.currentAction = null;
  //         session.currentItem = null;
  //         session.step = 0;
  //         await this.showServersMenu(ctx);
  //       } catch (error: any) {
  //         await ctx.reply(AdminMessages.error(error.message));
  //       }
  //       break;
  //   }
  // }

  // // ================ MONITORING ================
  // private async showStats(ctx: Context) {
  //   const userStats = await db.getUsersStats();
  //   const paymentStats = await db.getPaymentsStats();
  //   const serverStats = await db.getServerStats();
  //   const activeConfigs = await db.getActiveConfigsCount();
  //   const expiringConfigs = await db.getExpiringConfigs(3);
    
  //   const message = AdminMessages.statsOverview(
  //     userStats,
  //     paymentStats,
  //     serverStats,
  //     activeConfigs,
  //     expiringConfigs.length
  //   );
    
  //   await ctx.reply(message, {
  //     parse_mode: 'MarkdownV2',
  //     reply_markup: {
  //       inline_keyboard: [
  //         [Markup.button.callback('🔄 Refresh', 'refresh_stats')],
  //         [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
  //       ]
  //     }
  //   });
  // }

//   private async showUsers(ctx: Context) {
//     const users = await db.getRecentUsers(10);
//     const stats = await db.getUsersStats();
    
//     const message = AdminMessages.usersList(users, stats);
    
//     await ctx.reply(message, {
//       parse_mode: 'MarkdownV2',
//       reply_markup: {
//         inline_keyboard: [
//           [Markup.button.callback('🔄 Refresh', 'refresh_users')],
//           [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
//         ]
//       }
//     });
//   }

//   private async showPayments(ctx: Context) {
//     const payments = await db.getRecentPayments(10);
//     const stats = await db.getPaymentsStats();
    
//     const message = AdminMessages.paymentsList(payments, stats);
    
//     await ctx.reply(message, {
//       parse_mode: 'MarkdownV2',
//       reply_markup: {
//         inline_keyboard: [
//           [Markup.button.callback('🔄 Refresh', 'refresh_payments')],
//           [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
//         ]
//       }
//     });
//   }

//   launch() {
//     this.bot.launch();
//     console.log('🤖 Admin Bot started successfully (no authentication)');
    
//     // Enable graceful stop
//     process.once('SIGINT', () => this.bot.stop('SIGINT'));
//     process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
//   }
// }

// export default AdminBotService;

import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import db from '../database/database.services';
import { AdminMessages } from './messages';

dotenv.config();

// Session state for multi-step operations
interface SessionState {
  currentAction: string | null;
  currentItem: any;
  step: number;
}

class AdminBotService {
  private bot: Telegraf;
  private sessions: Map<number, SessionState> = new Map();

  constructor() {
    const token = process.env.ADMIN_BOT_TOKEN;
    if (!token) {
      throw new Error('ADMIN_BOT_TOKEN is not defined in environment variables');
    }

    this.bot = new Telegraf(token);
    this.setupCommands();
    this.setupHandlers();
    this.setupCallbacks();
  }

  private getSession(userId: number): SessionState {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        currentAction: null,
        currentItem: null,
        step: 0
      });
    }
    return this.sessions.get(userId)!;
  }

  private clearSession(userId: number) {
    this.sessions.delete(userId);
  }

  private setupCommands() {
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from!.id;
      this.clearSession(userId);
      await this.showMainMenu(ctx);
    });

    this.bot.command('cancel', async (ctx) => {
      const userId = ctx.from!.id;
      this.clearSession(userId);
      await ctx.reply(AdminMessages.cancelled(), {
        reply_markup: {
          keyboard: [
            ['📦 Services', '🖥️ Servers'],
            ['📊 Statistics', '👥 Users'],
            ['💰 Payments', '🎁 Gift Codes']
          ],
          resize_keyboard: true
        }
      });
    });

    this.bot.command('menu', async (ctx) => {
      await this.showMainMenu(ctx);
    });

    this.bot.command('services', async (ctx) => {
      await this.showServicesMenu(ctx);
    });

    this.bot.command('servers', async (ctx) => {
      await this.showServersMenu(ctx);
    });

    this.bot.command('gifts', async (ctx) => {
      await this.showGiftCodesMenu(ctx);
    });

    this.bot.command('stats', async (ctx) => {
      await this.showStats(ctx);
    });

    this.bot.command('users', async (ctx) => {
      await this.showUsers(ctx);
    });

    this.bot.command('payments', async (ctx) => {
      await this.showPayments(ctx);
    });
  }


  private async showUsers(ctx: Context) {
    const users = await db.getRecentUsers(10);
    const stats = await db.getUsersStats();
    
    const message = AdminMessages.usersList(users, stats);
    
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔄 Refresh', 'refresh_users')],
          [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
        ]
      }
    });
  }

  private async showPayments(ctx: Context) {
    const payments = await db.getRecentPayments(10);
    const stats = await db.getPaymentsStats();
    
    const message = AdminMessages.paymentsList(payments, stats);
    
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔄 Refresh', 'refresh_payments')],
          [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
        ]
      }
    });
  }

    // ================ MONITORING ================
  private async showStats(ctx: Context) {
    const userStats = await db.getUsersStats();
    const paymentStats = await db.getPaymentsStats();
    const serverStats = await db.getServerStats();
    const activeConfigs = await db.getActiveConfigsCount();
    const expiringConfigs = await db.getExpiringConfigs(3);
    
    const message = AdminMessages.statsOverview(
      userStats,
      paymentStats,
      serverStats,
      activeConfigs,
      expiringConfigs.length
    );
    
    await ctx.reply(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔄 Refresh', 'refresh_stats')],
          [Markup.button.callback('🔙 Main Menu', 'back_to_main')]
        ]
      }
    });
  }

    private async showServicesMenu(ctx: Context) {
    await ctx.reply(AdminMessages.servicesMenu(), {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('📋 List All Services', 'services_list')],
          [Markup.button.callback('➕ Create New Service', 'service_create')],
          [Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]
        ]
      }
    });
  }

    // ================ SERVERS CRUD ================
  private async showServersMenu(ctx: Context) {
    await ctx.reply(AdminMessages.serversMenu(), {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('📋 List All Servers', 'servers_list')],
          [Markup.button.callback('➕ Add New Server', 'server_create')],
          [Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]
        ]
      }
    });
  }

  private setupHandlers() {
    // Main menu buttons
    this.bot.hears('📦 Services', async (ctx) => {
      await this.showServicesMenu(ctx);
    });

    this.bot.hears('🖥️ Servers', async (ctx) => {
      await this.showServersMenu(ctx);
    });

    this.bot.hears('📊 Statistics', async (ctx) => {
      await this.showStats(ctx);
    });

    this.bot.hears('👥 Users', async (ctx) => {
      await this.showUsers(ctx);
    });

    this.bot.hears('💰 Payments', async (ctx) => {
      await this.showPayments(ctx);
    });

    this.bot.hears('🎁 Gift Codes', async (ctx) => {
      await this.showGiftCodesMenu(ctx);
    });

    this.bot.hears('🔙 Main Menu', async (ctx) => {
      await this.showMainMenu(ctx);
    });

    // Handle multi-step operations
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from!.id;
      const session = this.getSession(userId);
      const text = ctx.message.text;

      // Skip if it's a command or menu button
      if (text.startsWith('/') || 
          text === '📦 Services' || 
          text === '🖥️ Servers' || 
          text === '📊 Statistics' || 
          text === '👥 Users' || 
          text === '💰 Payments' || 
          text === '🎁 Gift Codes' || 
          text === '🔙 Main Menu') {
        return;
      }

      // Handle multi-step operations
      if (session.currentAction) {
        await this.handleMultiStep(ctx, session, text);
      }
    });
  }

  

  private async listServices(ctx: any) {
    const services = await db.getServices();
    
    if (services.length === 0) {
      await ctx.editMessageText(AdminMessages.noServices(), {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('➕ Create Service', 'service_create')],
            [Markup.button.callback('🔙 Back', 'back_to_services')]
          ]
        }
      });
      return;
    }

    const message = AdminMessages.servicesList(services);
    
    const buttons = services.slice(0, 5).map((service: any) => [
      Markup.button.callback(
        `✏️ ${service.name} (${service.price.toLocaleString()} IRR)`,
        `service_edit_${service.id}`
      ),
      Markup.button.callback('❌', `service_delete_${service.id}`)
    ]);

    buttons.push([Markup.button.callback('➕ Create New', 'service_create')]);
    buttons.push([Markup.button.callback('🔙 Back', 'back_to_services')]);

    await ctx.editMessageText(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }


  private async startServiceCreate(ctx: any) {
    const userId = ctx.from.id;
    const session = this.getSession(userId);
    
    session.currentAction = 'create_service';
    session.currentItem = {};
    session.step = 1;
    
    await ctx.editMessageText(AdminMessages.createServiceStep1(), {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('❌ Cancel', 'cancel_action')]
        ]
      }
    });
  }



  private async startServiceEdit(ctx: any, serviceId: number) {
    const service = await db.getServiceById(serviceId);
    
    if (!service) {
      await ctx.answerCbQuery('Service not found!');
      return;
    }
    
    const userId = ctx.from.id;
    const session = this.getSession(userId);
    
    session.currentAction = 'edit_service';
    session.currentItem = service;
    session.step = 1;
    
    await ctx.editMessageText(AdminMessages.editService(service), {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('✏️ Edit Name', `edit_service_name_${serviceId}`)],
          [Markup.button.callback('✏️ Edit Description', `edit_service_desc_${serviceId}`)],
          [Markup.button.callback('✏️ Edit Price', `edit_service_price_${serviceId}`)],
          [Markup.button.callback('✏️ Edit Duration', `edit_service_duration_${serviceId}`)],
          [Markup.button.callback('✏️ Edit Data Limit', `edit_service_data_${serviceId}`)],
          [Markup.button.callback('🔄 Toggle Active', `toggle_service_${serviceId}`)],
          [Markup.button.callback('❌ Delete', `service_delete_${serviceId}`)],
          [Markup.button.callback('🔙 Back', 'services_list')]
        ]
      }
    });
  }

  private async confirmServiceDelete(ctx: any, serviceId: number) {
    const service = await db.getServiceById(serviceId);
    
    await ctx.editMessageText(AdminMessages.confirmDeleteService(service), {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            Markup.button.callback('✅ Yes, Delete', `confirm_service_delete_${serviceId}`),
            Markup.button.callback('❌ No, Cancel', 'services_list')
          ]
        ]
      }
    });
  }

  private async deleteService(ctx: any, serviceId: number) {
    try {
      await db.deleteService(serviceId);
      await ctx.answerCbQuery('✅ Service deleted successfully!');
      await this.listServices(ctx);
    } catch (error: any) {
      await ctx.answerCbQuery(`❌ Error: ${error.message}`);
    }
  }


  private async listServers(ctx: any) {
    const servers = await db.getServers();
    
    if (servers.length === 0) {
      await ctx.editMessageText(AdminMessages.noServers(), {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('➕ Add Server', 'server_create')],
            [Markup.button.callback('🔙 Back', 'back_to_servers')]
          ]
        }
      });
      return;
    }

    const message = AdminMessages.serversList(servers);
    
    const buttons = servers.slice(0, 5).map((server: any) => [
      Markup.button.callback(
        `✏️ ${server.name} (${server.location || 'Unknown'})`,
        `server_edit_${server.id}`
      ),
      Markup.button.callback('❌', `server_delete_${server.id}`)
    ]);

    buttons.push([Markup.button.callback('➕ Add New Server', 'server_create')]);
    buttons.push([Markup.button.callback('🔙 Back', 'back_to_servers')]);

    await ctx.editMessageText(message, {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }



  private async startServerCreate(ctx: any) {
    const userId = ctx.from.id;
    const session = this.getSession(userId);
    
    session.currentAction = 'create_server';
    session.currentItem = {};
    session.step = 1;
    
    await ctx.editMessageText(AdminMessages.createServerStep1(), {
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('❌ Cancel', 'cancel_action')]
        ]
      }
    });
  }

  private async startServerEdit(ctx: any, serverId: number) {
    const server = await db.getServerById(serverId);
    
    if (!server) {
      await ctx.answerCbQuery('Server not found!');
      return;
    }
    
    const userId = ctx.from.id;
    const session = this.getSession(userId);
    
    session.currentAction = 'edit_server';
    session.currentItem = server;
    session.step = 1;
    
    await ctx.editMessageText(AdminMessages.editServer(server), {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('✏️ Edit Name', `edit_server_name_${serverId}`)],
          [Markup.button.callback('✏️ Edit Domain/IP', `edit_server_host_${serverId}`)],
          [Markup.button.callback('✏️ Edit Ports', `edit_server_ports_${serverId}`)],
          [Markup.button.callback('✏️ Edit API Token', `edit_server_token_${serverId}`)],
          [Markup.button.callback('✏️ Edit Capacity', `edit_server_capacity_${serverId}`)],
          [Markup.button.callback('🔄 Toggle Status', `toggle_server_${serverId}`)],
          [Markup.button.callback('❌ Delete', `server_delete_${serverId}`)],
          [Markup.button.callback('🔙 Back', 'servers_list')]
        ]
      }
    });
  }

  private async confirmServerDelete(ctx: any, serverId: number) {
    const server = await db.getServerById(serverId);
    
    await ctx.editMessageText(AdminMessages.confirmDeleteServer(server), {
      parse_mode: 'MarkdownV2',
      reply_markup: {
        inline_keyboard: [
          [
            Markup.button.callback('✅ Yes, Delete', `confirm_server_delete_${serverId}`),
            Markup.button.callback('❌ No, Cancel', 'servers_list')
          ]
        ]
      }
    });
  }

  private async deleteServer(ctx: any, serverId: number) {
    try {
      await db.deleteServer(serverId);
      await ctx.answerCbQuery('✅ Server deleted successfully!');
      await this.listServers(ctx);
    } catch (error: any) {
      await ctx.answerCbQuery(`❌ Error: ${error.message}`);
    }
  }



  private setupCallbacks() {
    // Services
    this.bot.action(/^services_list$/, async (ctx) => {
      await this.listServices(ctx);
    });

    this.bot.action(/^service_create$/, async (ctx) => {
      await this.startServiceCreate(ctx);
    });

    this.bot.action(/^service_edit_(\d+)$/, async (ctx) => {
      const serviceId = parseInt(ctx.match[1]);
      await this.startServiceEdit(ctx, serviceId);
    });

    this.bot.action(/^service_delete_(\d+)$/, async (ctx) => {
      const serviceId = parseInt(ctx.match[1]);
      await this.confirmServiceDelete(ctx, serviceId);
    });

    this.bot.action(/^confirm_service_delete_(\d+)$/, async (ctx) => {
      const serviceId = parseInt(ctx.match[1]);
      await this.deleteService(ctx, serviceId);
    });

    // Servers
    this.bot.action(/^servers_list$/, async (ctx) => {
      await this.listServers(ctx);
    });

    this.bot.action(/^server_create$/, async (ctx) => {
      await this.startServerCreate(ctx);
    });

    this.bot.action(/^server_edit_(\d+)$/, async (ctx) => {
      const serverId = parseInt(ctx.match[1]);
      await this.startServerEdit(ctx, serverId);
    });

    this.bot.action(/^server_delete_(\d+)$/, async (ctx) => {
      const serverId = parseInt(ctx.match[1]);
      await this.confirmServerDelete(ctx, serverId);
    });

    this.bot.action(/^confirm_server_delete_(\d+)$/, async (ctx) => {
      const serverId = parseInt(ctx.match[1]);
      await this.deleteServer(ctx, serverId);
    });

    // Gift Codes
    this.bot.action(/^gift_codes_list$/, async (ctx) => {
      await this.listGiftCodes(ctx);
    });

    this.bot.action(/^gift_code_create$/, async (ctx) => {
      await this.startGiftCodeCreate(ctx);
    });

    this.bot.action(/^gift_code_edit_(\d+)$/, async (ctx) => {
      const giftId = parseInt(ctx.match[1]);
      await this.startGiftCodeEdit(ctx, giftId);
    });

    this.bot.action(/^gift_code_delete_(\d+)$/, async (ctx) => {
      const giftId = parseInt(ctx.match[1]);
      await this.confirmGiftCodeDelete(ctx, giftId);
    });

    this.bot.action(/^confirm_gift_delete_(\d+)$/, async (ctx) => {
      const giftId = parseInt(ctx.match[1]);
      await this.deleteGiftCode(ctx, giftId);
    });

    this.bot.action(/^gift_code_usages_(\d+)$/, async (ctx) => {
      const giftId = parseInt(ctx.match[1]);
      await this.showGiftCodeUsages(ctx, giftId);
    });

    this.bot.action(/^gift_code_toggle_(\d+)$/, async (ctx) => {
      const giftId = parseInt(ctx.match[1]);
      await this.toggleGiftCodeStatus(ctx, giftId);
    });

    this.bot.action(/^gift_code_random$/, async (ctx) => {
      await this.generateRandomGiftCode(ctx);
    });

    this.bot.action(/^cancel_action$/, async (ctx) => {
      const userId = ctx.from!.id;
      const session = this.getSession(userId);
      session.currentAction = null;
      session.currentItem = null;
      session.step = 0;
      await ctx.answerCbQuery();
      await ctx.editMessageText(AdminMessages.actionCancelled(), {
        reply_markup: { inline_keyboard: [] }
      });
    });

    this.bot.action(/^back_to_main$/, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      await this.showMainMenu(ctx);
    });

    this.bot.action(/^back_to_services$/, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      await this.showServicesMenu(ctx);
    });

    this.bot.action(/^back_to_servers$/, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      await this.showServersMenu(ctx);
    });

    this.bot.action(/^back_to_gifts$/, async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.deleteMessage();
      await this.showGiftCodesMenu(ctx);
    });

    this.bot.action(/^refresh_stats$/, async (ctx) => {
      await ctx.answerCbQuery('🔄 Refreshing...');
      await ctx.deleteMessage();
      await this.showStats(ctx);
    });

    this.bot.action(/^refresh_users$/, async (ctx) => {
      await ctx.answerCbQuery('🔄 Refreshing...');
      await ctx.deleteMessage();
      await this.showUsers(ctx);
    });

    this.bot.action(/^refresh_payments$/, async (ctx) => {
      await ctx.answerCbQuery('🔄 Refreshing...');
      await ctx.deleteMessage();
      await this.showPayments(ctx);
    });

    this.bot.action(/^refresh_gifts$/, async (ctx) => {
      await ctx.answerCbQuery('🔄 Refreshing...');
      await ctx.deleteMessage();
      await this.listGiftCodes(ctx);
    });
  }

  // ================ MAIN MENU ================
  private async showMainMenu(ctx: Context) {
    await ctx.reply(AdminMessages.mainMenu(), {
      reply_markup: {
        keyboard: [
          ['📦 Services', '🖥️ Servers'],
          ['📊 Statistics', '👥 Users'],
          ['💰 Payments', '🎁 Gift Codes']
        ],
        resize_keyboard: true
      }
    });
  }



  // ================ GIFT CODES CRUD ================
  private async showGiftCodesMenu(ctx: Context) {
    await ctx.reply('🎁 *Gift Code Management*\n\nSelect an option:', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('📋 List All Gift Codes', 'gift_codes_list')],
          [Markup.button.callback('➕ Create New Gift Code', 'gift_code_create')],
          [Markup.button.callback('🎲 Generate Random Code', 'gift_code_random')],
          [Markup.button.callback('🔙 Back to Main Menu', 'back_to_main')]
        ]
      }
    });
  }

  private async listGiftCodes(ctx: any) {
    const giftCodes = await db.getAllGiftCodes();
    
    if (giftCodes.length === 0) {
      await ctx.editMessageText('📭 *No gift codes found*\n\nClick the button below to create your first gift code.', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('➕ Create Gift Code', 'gift_code_create')],
            [Markup.button.callback('🎲 Generate Random', 'gift_code_random')],
            [Markup.button.callback('🔙 Back', 'back_to_gifts')]
          ]
        }
      });
      return;
    }

    let message = '🎁 *Gift Codes List*\n\n';
    
    giftCodes.slice(0, 8).forEach((g: any, index: number) => {
      const status = !g.is_active ? '❌ Inactive' : 
                    g.expires_at && new Date(g.expires_at) < new Date() ? '⏰ Expired' :
                    g.current_uses >= g.max_uses ? '✅ Fully Used' : '🟢 Active';
      
      const expiryInfo = g.expires_at ? `📅 Expires: ${new Date(g.expires_at).toLocaleDateString()}\n` : '';
      
      message += `${index + 1}. *${g.code}*\n`;
      message += `   💰 Amount: ${g.amount.toLocaleString()} IRR\n`;
      message += `   📊 Uses: ${g.current_uses}/${g.max_uses}\n`;
      message += `   💵 Redeemed: ${g.total_redeemed.toLocaleString()} IRR\n`;
      message += `   📌 Status: ${status}\n`;
      message += `   ${expiryInfo}`;
      message += `   📅 Created: ${new Date(g.created_at).toLocaleDateString()}\n\n`;
    });

    if (giftCodes.length > 8) {
      message += `\n*... and ${giftCodes.length - 8} more*`;
    }

    const buttons = giftCodes.slice(0, 5).map((g: any) => [
      Markup.button.callback(
        `✏️ ${g.code} (${g.amount.toLocaleString()} IRR)`,
        `gift_code_edit_${g.id}`
      ),
      Markup.button.callback('📊', `gift_code_usages_${g.id}`),
      Markup.button.callback('❌', `gift_code_delete_${g.id}`)
    ]);

    buttons.push([
      Markup.button.callback('➕ Create New', 'gift_code_create'),
      Markup.button.callback('🎲 Random', 'gift_code_random'),
      Markup.button.callback('🔄 Refresh', 'refresh_gifts')
    ]);
    buttons.push([Markup.button.callback('🔙 Back', 'back_to_gifts')]);

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: buttons
      }
    });
  }

  private async startGiftCodeCreate(ctx: any) {
    const userId = ctx.from.id;
    const session = this.getSession(userId);
    
    session.currentAction = 'create_gift';
    session.currentItem = {};
    session.step = 1;
    
    await ctx.editMessageText(
      '➕ *Create Gift Code - Step 1/6*\n\n' +
      'Please enter the *gift code*:\n' +
      '(Or type "random" to generate automatically)\n\n' +
      'Example: SUMMER2024',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('🎲 Generate Random', 'gift_code_random')],
            [Markup.button.callback('❌ Cancel', 'cancel_action')]
          ]
        }
      }
    );
  }

  private async startGiftCodeEdit(ctx: any, giftId: number) {
    const gift = await db.getGiftCodeById(giftId);
    
    if (!gift) {
      await ctx.answerCbQuery('Gift code not found!');
      return;
    }
    
    const userId = ctx.from.id;
    const session = this.getSession(userId);
    
    session.currentAction = 'edit_gift';
    session.currentItem = gift;
    session.step = 1;
    
    const status = !gift.is_active ? '❌ Inactive' : 
                   gift.expires_at && new Date(gift.expires_at) < new Date() ? '⏰ Expired' :
                   gift.current_uses >= gift.max_uses ? '✅ Fully Used' : '🟢 Active';
    
    const expiryInfo = gift.expires_at ? `📅 ${new Date(gift.expires_at).toLocaleDateString()}` : '🚫 No expiry';
    
    await ctx.editMessageText(
      `✏️ *Edit Gift Code*\n\n` +
      `🎁 *Code:* \`${gift.code}\`\n` +
      `💰 *Amount:* ${gift.amount.toLocaleString()} IRR\n` +
      `📊 *Uses:* ${gift.current_uses}/${gift.max_uses}\n` +
      `💵 *Redeemed:* ${gift.total_redeemed.toLocaleString()} IRR\n` +
      `📌 *Status:* ${status}\n` +
      `⏰ *Expires:* ${expiryInfo}\n` +
      `👤 *Created by:* ${gift.created_by_username || 'System'}\n` +
      `📅 *Created:* ${new Date(gift.created_at).toLocaleDateString()}\n\n` +
      `Select what you want to edit:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('💰 Edit Amount', `edit_gift_amount_${giftId}`)],
            [Markup.button.callback('📊 Edit Max Uses', `edit_gift_uses_${giftId}`)],
            [Markup.button.callback('⏰ Edit Expiry', `edit_gift_expiry_${giftId}`)],
            [Markup.button.callback('🔄 Toggle Active', `gift_code_toggle_${giftId}`)],
            [Markup.button.callback('📊 View Usages', `gift_code_usages_${giftId}`)],
            [Markup.button.callback('❌ Delete', `gift_code_delete_${giftId}`)],
            [Markup.button.callback('🔙 Back', 'gift_codes_list')]
          ]
        }
      }
    );
  }

  private async confirmGiftCodeDelete(ctx: any, giftId: number) {
    const gift = await db.getGiftCodeById(giftId);
    
    await ctx.editMessageText(
      `⚠️ *Delete Gift Code*\n\n` +
      `Are you sure you want to delete this gift code?\n\n` +
      `🎁 *Code:* \`${gift.code}\`\n` +
      `💰 *Amount:* ${gift.amount.toLocaleString()} IRR\n` +
      `📊 *Uses:* ${gift.current_uses}/${gift.max_uses}\n\n` +
      `⚠️ *Warning:* This action cannot be undone.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              Markup.button.callback('✅ Yes, Delete', `confirm_gift_delete_${giftId}`),
              Markup.button.callback('❌ No, Cancel', 'gift_codes_list')
            ]
          ]
        }
      }
    );
  }

  private async deleteGiftCode(ctx: any, giftId: number) {
    try {
      const success = await db.deleteGiftCode(giftId);
      if (success) {
        await ctx.answerCbQuery('✅ Gift code deleted successfully!');
        await this.listGiftCodes(ctx);
      } else {
        await ctx.answerCbQuery('❌ Failed to delete gift code');
      }
    } catch (error: any) {
      await ctx.answerCbQuery(`❌ Error: ${error.message}`);
    }
  }

  private async toggleGiftCodeStatus(ctx: any, giftId: number) {
    try {
      const gift = await db.getGiftCodeById(giftId);
      const success = await db.updateGiftCode(giftId, { is_active: !gift.is_active });
      
      if (success) {
        await ctx.answerCbQuery(`✅ Gift code ${gift.is_active ? 'deactivated' : 'activated'}!`);
        await this.startGiftCodeEdit(ctx, giftId);
      } else {
        await ctx.answerCbQuery('❌ Failed to update status');
      }
    } catch (error: any) {
      await ctx.answerCbQuery(`❌ Error: ${error.message}`);
    }
  }
private async showGiftCodeUsages(ctx: any, giftId: number) {
  try {
    const gift = await db.getGiftCodeById(giftId);
    const usages = await db.getGiftCodeUsages(giftId);
    
    if (!gift) {
      await ctx.editMessageText('❌ Gift code not found', {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('🔙 Back', 'gift_codes_list')]
          ]
        }
      });
      return;
    }
    
    if (usages.length === 0) {
      await ctx.editMessageText(
        `📊 *Gift Code Usages*\n\n` +
        `🎁 *Code:* \`${gift.code}\`\n` +
        `💰 *Amount:* ${gift.amount.toLocaleString()} IRR\n` +
        `📊 *Uses:* ${gift.current_uses}/${gift.max_uses}\n\n` +
        `📭 *No usage records found*`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [Markup.button.callback('🔙 Back', `gift_code_edit_${giftId}`)]
            ]
          }
        }
      );
      return;
    }

    let message = `📊 *Gift Code Usages*\n\n`;
    message += `🎁 *Code:* \`${gift.code}\`\n`;
    message += `💰 *Amount:* ${gift.amount.toLocaleString()} IRR\n`;
    message += `📊 *Total Uses:* ${gift.current_uses}/${gift.max_uses}\n`;
    message += `💵 *Total Redeemed:* ${(gift.amount * gift.current_uses).toLocaleString()} IRR\n\n`;
    message += `*Recent Usages:*\n`;

    usages.slice(0, 10).forEach((u: any, index: number) => {
      message += `${index + 1}. 👤 ${u.first_name || 'Unknown'} (@${u.username || 'no username'})\n`;
      message += `   💰 +${gift.amount.toLocaleString()} IRR\n`; // Use gift.amount instead of u.amount_received
      message += `   📅 ${new Date(u.redeemed_at).toLocaleString()}\n\n`;
    });

    if (usages.length > 10) {
      message += `\n*... and ${usages.length - 10} more*`;
    }

    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔄 Refresh', `gift_code_usages_${giftId}`)],
          [Markup.button.callback('🔙 Back', `gift_code_edit_${giftId}`)]
        ]
      }
    });
  } catch (error) {
    console.error('Error in showGiftCodeUsages:', error);
    await ctx.editMessageText('❌ Error loading gift code usages', {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [Markup.button.callback('🔙 Back', 'gift_codes_list')]
        ]
      }
    });
  }
}
  private async generateRandomGiftCode(ctx: any) {
    try {
      const code = await db.generateRandomGiftCode();
      
      // Pre-fill the creation form with random code
      const userId = ctx.from.id;
      const session = this.getSession(userId);
      
      if (session.currentAction === 'create_gift' && session.step === 1) {
        session.currentItem.code = code;
        session.step = 2;
        
        await ctx.editMessageText(
          '✅ *Random Code Generated*\n\n' +
          `🎁 *Code:* \`${code}\`\n\n` +
          'Step 2/6: Please enter the *gift amount* in IRR:\n' +
          'Example: 50000',
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('❌ Cancel', 'cancel_action')]
              ]
            }
          }
        );
      } else {
        await ctx.answerCbQuery(`🎲 Random code: ${code}`);
        await ctx.editMessageText(
          `🎲 *Random Code Generated*\n\n` +
          `\`${code}\`\n\n` +
          `Use this code or create another one.`,
          {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [Markup.button.callback('➕ Create with this code', 'gift_code_create')],
                [Markup.button.callback('🎲 Generate Another', 'gift_code_random')],
                [Markup.button.callback('🔙 Back', 'gift_codes_list')]
              ]
            }
          }
        );
      }
    } catch (error) {
      await ctx.answerCbQuery('❌ Failed to generate code');
    }
  }

  // ... (rest of your existing methods for services, servers, etc.)
  // Include all the existing methods like showServicesMenu, listServices, 
  // showServersMenu, listServers, showStats, showUsers, showPayments, etc.


  // ================ MULTI-STEP HANDLERS ================
  private async handleMultiStep(ctx: Context, session: SessionState, text: string) {
    if (session.currentAction === 'create_service') {
      await this.handleCreateServiceStep(ctx, session, text);
    } else if (session.currentAction === 'create_server') {
      await this.handleCreateServerStep(ctx, session, text);
    } else if (session.currentAction === 'create_gift') {
      await this.handleCreateGiftStep(ctx, session, text);
    } else if (session.currentAction === 'edit_gift') {
      await this.handleEditGiftStep(ctx, session, text);
    }
  }

  private async handleCreateGiftStep(ctx: Context, session: SessionState, text: string) {
    switch (session.step) {
      case 1: // Code
        if (text.toLowerCase() === 'random') {
          const code = await db.generateRandomGiftCode();
          session.currentItem.code = code;
        } else {
          session.currentItem.code = text.toUpperCase().trim();
        }
        session.step = 2;
        await ctx.reply(
          '✅ Step 2/6\n\n' +
          'Please enter the *gift amount* in IRR:\n' +
          'Example: 50000',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 2: // Amount
        const amount = parseFloat(text.replace(/,/g, ''));
        if (isNaN(amount) || amount <= 0) {
          await ctx.reply('❌ Please enter a valid positive number');
          return;
        }
        session.currentItem.amount = amount;
        session.step = 3;
        await ctx.reply(
          '✅ Step 3/6\n\n' +
          'Please enter the *maximum number of uses*:\n' +
          '(Enter 1 for single-use, or more for multi-use)\n' +
          'Example: 1',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 3: // Max Uses
        const maxUses = parseInt(text);
        if (isNaN(maxUses) || maxUses <= 0) {
          await ctx.reply('❌ Please enter a valid positive number');
          return;
        }
        session.currentItem.max_uses = maxUses;
        session.step = 4;
        await ctx.reply(
          '✅ Step 4/6\n\n' +
          'Please enter the *expiry days* (or 0 for no expiry):\n' +
          'Example: 30',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 4: // Expiry
        const days = parseInt(text);
        if (days > 0) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          session.currentItem.expires_at = expiryDate.toISOString();
        } else {
          session.currentItem.expires_at = null;
        }
        session.step = 5;
        await ctx.reply(
          '✅ Step 5/6\n\n' +
          'Minimum balance required? (Enter 0 for none)\n' +
          'Example: 10000',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 5: // Min Balance
        const minBalance = parseFloat(text.replace(/,/g, ''));
        session.currentItem.min_balance_required = isNaN(minBalance) ? 0 : minBalance;
        session.step = 6;
        await ctx.reply(
          '✅ Step 6/6\n\n' +
          'First purchase only? (yes/no)\n' +
          'Example: no',
          { parse_mode: 'Markdown' }
        );
        break;
        
      case 6: // First purchase only
        session.currentItem.first_purchase_only = text.toLowerCase() === 'yes' || text.toLowerCase() === 'y';
        session.currentItem.created_by = ctx.from!.id;
        
        try {
          const gift = await db.createGiftCode(session.currentItem);
          await ctx.reply(
            `✅ *Gift Code Created Successfully*\n\n` +
            `🎁 *Code:* \`${gift.code}\`\n` +
            `💰 *Amount:* ${gift.amount.toLocaleString()} IRR\n` +
            `📊 *Max Uses:* ${gift.max_uses}\n` +
            `💵 *Total Value:* ${(gift.amount * gift.max_uses).toLocaleString()} IRR\n` +
            `${gift.expires_at ? `⏰ *Expires:* ${new Date(gift.expires_at).toLocaleDateString()}\n` : ''}`,
            { parse_mode: 'Markdown' }
          );
          session.currentAction = null;
          session.currentItem = null;
          session.step = 0;
          await this.showGiftCodesMenu(ctx);
        } catch (error: any) {
          await ctx.reply(`❌ Error: ${error.message}`);
        }
        break;
    }
  }

  private async handleEditGiftStep(ctx: Context, session: SessionState, text: string) {
    // This would handle inline editing of specific fields
    // For simplicity, we'll just show the edit menu again
    await ctx.reply('Please use the buttons to edit specific fields.');
    await this.startGiftCodeEdit(ctx as any, session.currentItem.id);
  }

  // ... (rest of your existing methods)
  // Include all the existing methods like handleCreateServiceStep, handleCreateServerStep, etc.

  // ================ MULTI-STEP HANDLERS ================
  // private async handleMultiStep(ctx: Context, session: SessionState, text: string) {
  //   if (session.currentAction === 'create_service') {
  //     await this.handleCreateServiceStep(ctx, session, text);
  //   } else if (session.currentAction === 'create_server') {
  //     await this.handleCreateServerStep(ctx, session, text);
  //   }
  // }

  private async handleCreateServiceStep(ctx: Context, session: SessionState, text: string) {
    switch (session.step) {
      case 1: // Name
        session.currentItem.name = text;
        session.step = 2;
        await ctx.reply(AdminMessages.createServiceStep2());
        break;
      case 2: // Description
        session.currentItem.description = text;
        session.step = 3;
        await ctx.reply(AdminMessages.createServiceStep3());
        break;
      case 3: // Price
        const price = parseFloat(text);
        if (isNaN(price) || price < 0) {
          await ctx.reply(AdminMessages.invalidInput('price'));
          return;
        }
        session.currentItem.price = price;
        session.step = 4;
        await ctx.reply(AdminMessages.createServiceStep4());
        break;
      case 4: // Duration
        const duration = parseInt(text);
        if (isNaN(duration) || duration <= 0) {
          await ctx.reply(AdminMessages.invalidInput('duration'));
          return;
        }
        session.currentItem.duration_days = duration;
        session.step = 5;
        await ctx.reply(AdminMessages.createServiceStep5());
        break;
      case 5: // Data Limit
        const dataLimit = parseFloat(text);
        if (isNaN(dataLimit) || dataLimit < 0) {
          await ctx.reply(AdminMessages.invalidInput('data limit'));
          return;
        }
        session.currentItem.data_limit_gb = dataLimit || null;
        session.step = 6;
        await ctx.reply(AdminMessages.createServiceStep6());
        break;
      case 6: // Sort Order
        const sortOrder = parseInt(text);
        session.currentItem.sort_order = isNaN(sortOrder) ? 0 : sortOrder;
        session.currentItem.is_active = true;
        
        try {
          const service = await db.createService(session.currentItem);
          await ctx.reply(AdminMessages.serviceCreated(service), {
            parse_mode: 'MarkdownV2'
          });
          session.currentAction = null;
          session.currentItem = null;
          session.step = 0;
          await this.showServicesMenu(ctx);
        } catch (error: any) {
          await ctx.reply(AdminMessages.error(error.message));
        }
        break;
    }
  }

  private async handleCreateServerStep(ctx: Context, session: SessionState, text: string) {
    switch (session.step) {
      case 1: // Name
        session.currentItem.name = text;
        session.step = 2;
        await ctx.reply(AdminMessages.createServerStep2());
        break;
      case 2: // Domain
        session.currentItem.domain = text;
        session.step = 3;
        await ctx.reply(AdminMessages.createServerStep3());
        break;
      case 3: // IP
        session.currentItem.ip = text;
        session.step = 4;
        await ctx.reply(AdminMessages.createServerStep4());
        break;
      case 4: // API Port
        const apiPort = parseInt(text);
        session.currentItem.api_port = isNaN(apiPort) ? 5000 : apiPort;
        session.step = 5;
        await ctx.reply(AdminMessages.createServerStep5());
        break;
      case 5: // Xray Port
        const xrayPort = parseInt(text);
        session.currentItem.xray_port = isNaN(xrayPort) ? 8445 : xrayPort;
        session.step = 6;
        await ctx.reply(AdminMessages.createServerStep6());
        break;
      case 6: // API Token
        session.currentItem.api_token = text;
        session.step = 7;
        await ctx.reply(AdminMessages.createServerStep7());
        break;
      case 7: // Max Users
        const maxUsers = parseInt(text);
        session.currentItem.max_users = isNaN(maxUsers) ? 100 : maxUsers;
        session.step = 8;
        await ctx.reply(AdminMessages.createServerStep8());
        break;
      case 8: // Location
        session.currentItem.location = text;
        session.step = 9;
        await ctx.reply(AdminMessages.createServerStep9());
        break;
      case 9: // Status
        session.currentItem.status = text.toLowerCase();
        session.step = 10;
        await ctx.reply(AdminMessages.createServerStep10());
        break;
      case 10: // CPU Cores
        const cpuCores = parseInt(text);
        session.currentItem.cpu_cores = isNaN(cpuCores) ? 2 : cpuCores;
        session.step = 11;
        await ctx.reply(AdminMessages.createServerStep11());
        break;
      case 11: // RAM GB
        const ramGb = parseInt(text);
        session.currentItem.ram_gb = isNaN(ramGb) ? 4 : ramGb;
        
        try {
          const server = await db.createServer(session.currentItem);
          await ctx.reply(AdminMessages.serverCreated(server), {
            parse_mode: 'MarkdownV2'
          });
          session.currentAction = null;
          session.currentItem = null;
          session.step = 0;
          await this.showServersMenu(ctx);
        } catch (error: any) {
          await ctx.reply(AdminMessages.error(error.message));
        }
        break;
    }
  }


  launch() {
    this.bot.launch();
    console.log('🤖 Admin Bot started successfully with Gift Code CRUD');
    
    // Enable graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export default AdminBotService;