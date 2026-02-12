import { Telegraf, Context, Markup } from 'telegraf';
import dotenv from 'dotenv';
import db from '../database/database.services';
import { AdminMessages } from './messages';

dotenv.config();

// Session state for multi-step operations
interface SessionState {
  authenticated: boolean;
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
  }

  private getSession(userId: number): SessionState {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        authenticated: false,
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

  private async requireAuth(ctx: Context, next: () => Promise<void>) {
    const userId = ctx.from!.id;
    const session = this.getSession(userId);
    
    if (!session.authenticated) {
      await ctx.reply(AdminMessages.authRequired());
      return;
    }
    
    await next();
  }

  private setupCommands() {
    // Public commands
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from!.id;
      this.clearSession(userId);
      await ctx.reply(AdminMessages.welcome(), {
        reply_markup: {
          keyboard: [
            ['🔑 Login']
          ],
          resize_keyboard: true
        }
      });
    });

    this.bot.command('cancel', async (ctx) => {
      const userId = ctx.from!.id;
      this.clearSession(userId);
      await ctx.reply(AdminMessages.cancelled(), {
        reply_markup: {
          keyboard: [
            ['🔑 Login']
          ],
          resize_keyboard: true
        }
      });
    });

    // Authenticated commands (with middleware)
    this.bot.command('menu', this.requireAuth.bind(this), async (ctx) => {
      await this.showMainMenu(ctx);
    });

    this.bot.command('services', this.requireAuth.bind(this), async (ctx) => {
      await this.showServicesMenu(ctx);
    });

    this.bot.command('servers', this.requireAuth.bind(this), async (ctx) => {
      await this.showServersMenu(ctx);
    });

    this.bot.command('stats', this.requireAuth.bind(this), async (ctx) => {
      await this.showStats(ctx);
    });

    this.bot.command('users', this.requireAuth.bind(this), async (ctx) => {
      await this.showUsers(ctx);
    });

    this.bot.command('payments', this.requireAuth.bind(this), async (ctx) => {
      await this.showPayments(ctx);
    });
  }

  private setupHandlers() {
    // Text handlers
    this.bot.hears('🔑 Login', async (ctx) => {
      await ctx.reply(AdminMessages.enterPassword());
    });

    this.bot.hears('📦 Services', this.requireAuth.bind(this), async (ctx) => {
      await this.showServicesMenu(ctx);
    });

    this.bot.hears('🖥️ Servers', this.requireAuth.bind(this), async (ctx) => {
      await this.showServersMenu(ctx);
    });

    this.bot.hears('📊 Statistics', this.requireAuth.bind(this), async (ctx) => {
      await this.showStats(ctx);
    });

    this.bot.hears('👥 Users', this.requireAuth.bind(this), async (ctx) => {
      await this.showUsers(ctx);
    });

    this.bot.hears('💰 Payments', this.requireAuth.bind(this), async (ctx) => {
      await this.showPayments(ctx);
    });

    this.bot.hears('🔙 Main Menu', this.requireAuth.bind(this), async (ctx) => {
      await this.showMainMenu(ctx);
    });

    this.bot.hears('🔚 Logout', this.requireAuth.bind(this), async (ctx) => {
      const userId = ctx.from!.id;
      this.clearSession(userId);
      await ctx.reply(AdminMessages.loggedOut(), {
        reply_markup: {
          keyboard: [
            ['🔑 Login']
          ],
          resize_keyboard: true
        }
      });
    });

    // Password handler
    this.bot.on('text', async (ctx) => {
      const userId = ctx.from!.id;
      const session = this.getSession(userId);
      const text = ctx.message.text;

      // If not authenticated and not a command
      if (!session.authenticated && !text.startsWith('/')) {
        const isValid = await db.verifyAdminPassword(text);
        
        if (isValid) {
          session.authenticated = true;
          await ctx.reply(AdminMessages.loginSuccess(), {
            reply_markup: {
              keyboard: [
                ['📦 Services', '🖥️ Servers'],
                ['📊 Statistics', '👥 Users'],
                ['💰 Payments', '🔚 Logout']
              ],
              resize_keyboard: true
            }
          });
          await this.showMainMenu(ctx);
        } else {
          await ctx.reply(AdminMessages.invalidPassword());
        }
        return;
      }

      // Handle multi-step operations
      if (session.authenticated && session.currentAction) {
        await this.handleMultiStep(ctx, session);
      }
    });

    // Callback handlers for inline keyboards
    this.bot.action(/^services_list$/, this.requireAuth.bind(this), async (ctx) => {
      await this.listServices(ctx);
    });

    this.bot.action(/^service_create$/, this.requireAuth.bind(this), async (ctx) => {
      await this.startServiceCreate(ctx);
    });

    this.bot.action(/^service_edit_(\d+)$/, this.requireAuth.bind(this), async (ctx) => {
      const serviceId = parseInt(ctx.match[1]);
      await this.startServiceEdit(ctx, serviceId);
    });

    this.bot.action(/^service_delete_(\d+)$/, this.requireAuth.bind(this), async (ctx) => {
      const serviceId = parseInt(ctx.match[1]);
      await this.confirmServiceDelete(ctx, serviceId);
    });

    this.bot.action(/^confirm_service_delete_(\d+)$/, this.requireAuth.bind(this), async (ctx) => {
      const serviceId = parseInt(ctx.match[1]);
      await this.deleteService(ctx, serviceId);
    });

    this.bot.action(/^servers_list$/, this.requireAuth.bind(this), async (ctx) => {
      await this.listServers(ctx);
    });

    this.bot.action(/^server_create$/, this.requireAuth.bind(this), async (ctx) => {
      await this.startServerCreate(ctx);
    });

    this.bot.action(/^server_edit_(\d+)$/, this.requireAuth.bind(this), async (ctx) => {
      const serverId = parseInt(ctx.match[1]);
      await this.startServerEdit(ctx, serverId);
    });

    this.bot.action(/^server_delete_(\d+)$/, this.requireAuth.bind(this), async (ctx) => {
      const serverId = parseInt(ctx.match[1]);
      await this.confirmServerDelete(ctx, serverId);
    });

    this.bot.action(/^confirm_server_delete_(\d+)$/, this.requireAuth.bind(this), async (ctx) => {
      const serverId = parseInt(ctx.match[1]);
      await this.deleteServer(ctx, serverId);
    });

    this.bot.action(/^cancel_action$/, this.requireAuth.bind(this), async (ctx) => {
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
  }

  // ================ MAIN MENU ================
  private async showMainMenu(ctx: Context) {
    const userId = ctx.from!.id;
    this.clearSession(userId);
    
    await ctx.reply(AdminMessages.mainMenu(), {
      reply_markup: {
        keyboard: [
          ['📦 Services', '🖥️ Servers'],
          ['📊 Statistics', '👥 Users'],
          ['💰 Payments', '🔚 Logout']
        ],
        resize_keyboard: true
      }
    });
  }

  // ================ SERVICES CRUD ================
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

  private async listServices(ctx: any) {
    const services = await db.getServices();
    
    if (services.length === 0) {
      await ctx.editMessageText(AdminMessages.noServices(), {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('➕ Create Service', 'service_create')],
            [Markup.button.callback('🔙 Back', 'services_list_back')]
          ]
        }
      });
      return;
    }

    let message = AdminMessages.servicesList(services);
    
    const buttons = services.slice(0, 5).map(service => [
      Markup.button.callback(
        `✏️ ${service.name} (${service.price} IRR)`,
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

  private async listServers(ctx: any) {
    const servers = await db.getServers();
    
    if (servers.length === 0) {
      await ctx.editMessageText(AdminMessages.noServers(), {
        reply_markup: {
          inline_keyboard: [
            [Markup.button.callback('➕ Add Server', 'server_create')],
            [Markup.button.callback('🔙 Back', 'servers_list_back')]
          ]
        }
      });
      return;
    }

    let message = AdminMessages.serversList(servers);
    
    const buttons = servers.slice(0, 5).map(server => [
      Markup.button.callback(
        `✏️ ${server.name} (${server.location})`,
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

  // ================ MULTI-STEP HANDLERS ================
  private async handleMultiStep(ctx: Context, session: SessionState) {
    const text = (ctx.message as any).text;
    const userId = ctx.from!.id;

    if (session.currentAction === 'create_service') {
      await this.handleCreateServiceStep(ctx, session, text);
    } else if (session.currentAction === 'create_server') {
      await this.handleCreateServerStep(ctx, session, text);
    }
  }

  private async handleCreateServiceStep(ctx: Context, session: SessionState, text: string) {
    const userId = ctx.from!.id;

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
          await ctx.reply(AdminMessages.invalidInput('قیمت'));
          return;
        }
        session.currentItem.price = price;
        session.step = 4;
        await ctx.reply(AdminMessages.createServiceStep4());
        break;
      case 4: // Duration
        const duration = parseInt(text);
        if (isNaN(duration) || duration <= 0) {
          await ctx.reply(AdminMessages.invalidInput('مدت زمان'));
          return;
        }
        session.currentItem.duration_days = duration;
        session.step = 5;
        await ctx.reply(AdminMessages.createServiceStep5());
        break;
      case 5: // Data Limit
        const dataLimit = parseFloat(text);
        if (isNaN(dataLimit) || dataLimit < 0) {
          await ctx.reply(AdminMessages.invalidInput('محدودیت حجم'));
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
    const userId = ctx.from!.id;

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

  launch() {
    this.bot.launch();
    console.log('🤖 Admin Bot started successfully');
    
    process.once('SIGINT', () => this.bot.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
  }
}

export default AdminBotService;