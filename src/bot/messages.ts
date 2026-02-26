export class AdminMessages {
  
  static escapeMarkdown(text: string): string {
      if (!text) return ''; // Handle null, undefined, empty string
    const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
    return text.split('').map(char => 
      specialChars.includes(char) ? `\\${char}` : char
    ).join('');
  }

  static bold(text: string): string {
    return `*${text}*`;  // Don't escape here, escape when inserting user content
  }

  static monospace(text: string): string {
    return `\`${text}\``;  // Don't escape here, escape when inserting user content
  }

  // ============ MAIN MENU ============
  static mainMenu(): string {
    return `📋 *Admin Panel*

Welcome to the V2Ray Admin Bot.

Select an option below:`;
  }

  static cancelled(): string {
    return `❌ *Operation cancelled*`;
  }

  static actionCancelled(): string {
    return `❌ Action cancelled.`;
  }

  // ============ SERVICES CRUD ============
  static servicesMenu(): string {
    return `📦 *Service Management*

Select an option:`;
  }

  static noServices(): string {
    return `📭 *No services found*

Click the button below to create your first service.`;
  }

  static servicesList(services: any[]): string {
    let message = `📋 *Service List*\n\n`;
    
    services.forEach((s, index) => {
      const status = s.is_active ? '✅ Active' : '❌ Inactive';
      const dataLimit = s.data_limit_gb ? `${s.data_limit_gb} GB` : 'Unlimited';
      message += `${index + 1}\\. ${this.bold(this.escapeMarkdown(s.name))}\n`;
      message += `   🆔 ID: ${s.id}\n`;
      message += `   💰 Price: ${this.escapeMarkdown(s.price)} IRR\n`;
      message += `   ⏱️ Duration: ${s.duration_days} days\n`;
      message += `   💾 Data: ${this.escapeMarkdown(dataLimit)}\n`;
      message += `   📊 Status: ${status}\n`;
      message += `   📌 Sort Order: ${s.sort_order || 0}\n\n`;
    });
    
    return message;
  }

  static createServiceStep1(): string {
    return `➕ *Create New Service - Step 1/6*

Please enter the *service name*:
Example: Premium Plan`;
  }

  static createServiceStep2(): string {
    return `✅ Step 2/6

Please enter the *service description*:
Example: High-speed plan with 150GB data`;
  }

  static createServiceStep3(): string {
    return `✅ Step 3/6

Please enter the *service price* in IRR:
Example: 300000`;
  }

  static createServiceStep4(): string {
    return `✅ Step 4/6

Please enter the *duration* in days:
Example: 30`;
  }

  static createServiceStep5(): string {
    return `✅ Step 5/6

Please enter the *data limit* in GB:
(Enter 0 for unlimited)
Example: 150`;
  }

  static createServiceStep6(): string {
    return `✅ Step 6/6

Please enter the *display order*:
(Lower numbers appear first)
Example: 1`;
  }

  static serviceCreated(service: any): string {
    const dataLimit = service.data_limit_gb ? `${service.data_limit_gb} GB` : 'Unlimited';
    
    return `✅ *Service created successfully*

${this.bold('Name:')} ${this.escapeMarkdown(service.name)}
${this.bold('Price:')} ${service.price.toLocaleString()} IRR
${this.bold('Duration:')} ${service.duration_days} days
${this.bold('Data Limit:')} ${dataLimit}`;
  }

  static editService(service: any): string {
    const status = service.is_active ? '✅ Active' : '❌ Inactive';
    const dataLimit = service.data_limit_gb ? `${service.data_limit_gb} GB` : 'Unlimited';
    
    return `✏️ *Edit Service*

${this.bold('🆔 ID:')} ${service.id}
${this.bold('📌 Name:')} ${this.escapeMarkdown(service.name)}
${this.bold('📝 Description:')} ${this.escapeMarkdown(service.description || 'None')}
${this.bold('💰 Price:')} ${this.escapeMarkdown(service.price)} IRR
${this.bold('⏱️ Duration:')} ${service.duration_days} days
${this.bold('💾 Data Limit:')} ${this.escapeMarkdown(dataLimit)}
${this.bold('📊 Status:')} ${status}
${this.bold('📌 Sort Order:')} ${service.sort_order || 0}

Select what you want to edit:`;
  }

  static confirmDeleteService(service: any): string {
    return `⚠️ *Delete Service*

Are you sure you want to delete this service?

${this.bold('Name:')} ${this.escapeMarkdown(service.name)}
${this.bold('🆔 ID:')} ${service.id}
${this.bold('💰 Price:')} ${this.escapeMarkdown(service.price)} IRR

⚠️ *Warning:* This action cannot be undone`;
  }

  // ============ SERVERS CRUD ============
  static serversMenu(): string {
    return `🖥️ *Server Management*

Select an option:`;
  }

  static noServers(): string {
    return `📭 *No servers found*

Click the button below to add your first server.`;
  }

  static serversList(servers: any[]): string {
    let message = `📋 *Server List*\n\n`;
    
    servers.forEach((s, index) => {
      const status = s.status === 'active' ? '✅ Active' : 
                    s.status === 'maintenance' ? '🔄 Maintenance' : 
                    s.status === 'offline' ? '❌ Offline' : '⚪ Inactive';
      
      message += `${index + 1}\\. ${this.bold(this.escapeMarkdown(s.name))}\n`;
      message += `   🆔 ID: ${s.id}  📍 ${s.location || 'Unknown'}\n`;
      message += `   🌐 ${this.escapeMarkdown(s.domain)}  ${this.escapeMarkdown(s.ip)}\n`;
      message += `   📊 Users: ${s.current_users}/${s.max_users}\n`;
      message += `   📌 Status: ${status}\n\n`;
    });
    
    return message;
  }

static createServerStep1(): string {
  return `➕ *Add New Server - Step 1/12*\n\nPlease enter the *server name*:\nExample: Frankfurt-1`;
}

static createServerStep2(): string {
  return `✅ Step 2/12\n\nPlease enter the *server domain*:\nExample: de-v1-gwez.gemminie.xyz`;
}

static createServerStep3(): string {
  return `✅ Step 3/12\n\nPlease enter the *server IP address*:\nExample: 172.86.95.72`;
}

static createServerStep4(): string {
  return `✅ Step 4/12\n\nPlease enter the *API port*:\n(Default: 5000)\nExample: 5000`;
}

static createServerStep5(): string {
  return `✅ Step 5/12\n\nPlease enter the *Xray port*:\n(Default: 8445)\nExample: 8445`;
}

static createServerStep6(): string {
  return `✅ Step 6/12\n\nPlease enter the *API token*:`;
}

static createServerStep7(): string {
  return `✅ Step 7/12\n\nPlease enter the *maximum users*:\n(Default: 100)\nExample: 200`;
}

static createServerStep8(): string {
  return `✅ Step 8/12\n\nPlease enter the *server location*:\nExample: Germany`;
}

static createServerStep9(): string {
  return `✅ Step 9/12\n\nPlease enter the *server status*:\n(active, maintenance, offline)\nExample: active`;
}

static createServerStep10(): string {
  return `✅ Step 10/12\n\nPlease paste the *config format* for this server:\n\nExample:\n\`vless://USER_UUID@domain:port?security=reality&...#USER_EMAIL\``;
}

static createServerStep11(): string {
  return `✅ Step 11/12\n\nPlease enter the *CPU cores*:\n(Default: 2)\nExample: 4`;
}

static createServerStep12(): string {
  return `✅ Step 12/12\n\nPlease enter the *RAM* in GB:\n(Default: 4)\nExample: 8`;
}

  static serverCreated(server: any): string {
    return `✅ *Server added successfully*

${this.bold('Name:')} ${this.escapeMarkdown(server.name)}
${this.bold('IP:')} ${this.escapeMarkdown(server.ip)}
${this.bold('Location:')} ${server.location || 'Unknown'}
${this.bold('Capacity:')} ${server.current_users}/${server.max_users} users`;
  }

  static editServer(server: any): string {
    const status = server.status === 'active' ? '✅ Active' : 
                  server.status === 'maintenance' ? '🔄 Maintenance' : 
                  server.status === 'offline' ? '❌ Offline' : '⚪ Inactive';
    
    return `✏️ *Edit Server*

${this.bold('🆔 ID:')} ${server.id}
${this.bold('📌 Name:')} ${this.escapeMarkdown(server.name)}
${this.bold('🌐 Domain:')} ${this.escapeMarkdown(server.domain)}
${this.bold('📍 IP:')} ${this.escapeMarkdown(server.ip)}
${this.bold('🔌 API Port:')} ${server.api_port}
${this.bold('🔌 Xray Port:')} ${server.xray_port}
${this.bold('📍 Location:')} ${server.location || 'Unknown'}
${this.bold('📊 Users:')} ${server.current_users}/${server.max_users}
${this.bold('📌 Status:')} ${status}
${this.bold('💻 CPU:')} ${server.cpu_cores} cores
${this.bold('🖥️ RAM:')} ${server.ram_gb} GB

Select what you want to edit:`;
  }

  static confirmDeleteServer(server: any): string {
    return `⚠️ *Delete Server*

Are you sure you want to delete this server?

${this.bold('Name:')} ${this.escapeMarkdown(server.name)}
${this.bold('🆔 ID:')} ${server.id}
${this.bold('📍 IP:')} ${this.escapeMarkdown(server.ip)}
${this.bold('📊 Users:')} ${server.current_users}/${server.max_users}

⚠️ *Warning:* 
• This server has ${server.current_users} active users
• This action cannot be undone`;
  }

  // ============ STATISTICS ============
  static statsOverview(userStats: any, paymentStats: any, serverStats: any, activeConfigs: number, expiringCount: number): string {
    return `📊 *System Statistics*

👥 *Users*
• Total Users: ${userStats.total_users || 0}
• New Today: ${userStats.new_users_today || 0}
• Active Users: ${userStats.active_users || 0}
• Avg Balance: ${userStats.avg_balance ? Math.round(userStats.avg_balance).toLocaleString() : 0} IRR

💰 *Payments*
• Total Payments: ${paymentStats.total_payments || 0}
• Total Amount: ${paymentStats.total_amount ? Math.round(paymentStats.total_amount).toLocaleString() : 0} IRR
• Today: ${paymentStats.payments_today || 0} payments
• Today Amount: ${paymentStats.amount_today ? Math.round(paymentStats.amount_today).toLocaleString() : 0} IRR
• Pending: ${paymentStats.pending_payments || 0}

🖥️ *Servers*
• Total Servers: ${serverStats.total_servers || 0}
• Active Servers: ${serverStats.active_servers || 0}
• Active Users: ${serverStats.total_users || 0}
• Total Capacity: ${serverStats.total_capacity || 0}
• Avg Utilization: ${this.escapeMarkdown(serverStats.avg_utilization) || 0}%

📡 *Configs*
• Active Configs: ${activeConfigs}
• Expiring Soon in 3 days: ${expiringCount}`;
  }

  // static usersList(users: any[], stats: any): string {
  //   let message = `👥 *Recent Users*\n\n`;
  //   message += `📊 *Stats:* Total: ${stats.total_users || 0}   Today: ${stats.new_users_today || 0}\n\n`;
    
  //   users.forEach((u, index) => {
  //     const username = u.username ? `@${u.username}` : 'None';
  //     message += `${index + 1}\\. ${this.bold(this.escapeMarkdown(u.first_name || 'Anonymous'))}\n`;
  //     message += `   🆔 ${u.telegram_id}\n`;
  //     message += `   📧 ${username}\n`;
  //     message += `   💰 Balance: ${u.balance ? Math.round(u.balance).toLocaleString() : 0} IRR\n`;
  //     message += `   📅 Joined: ${new Date(u.created_at).toLocaleDateString()}\n\n`;
  //   });
    
  //   return message;
  // }

  static usersList(users: any[], stats: any): string {
  let message = `👥 *Recent Users*\n\n`;
  message += `📊 *Stats:* Total: ${stats.total_users || 0}   Today: ${stats.new_users_today || 0}\n\n`;

  users.forEach((u, index) => {
    const username = u.username ? `@${u.username}` : 'None';

    message += `${index + 1}. *${u.first_name || 'Anonymous'}*\n`;
    message += `   🆔 ${u.telegram_id}\n`;
    message += `   📧 ${username}\n`;
    message += `   💰 Balance: ${u.balance ? Math.round(u.balance).toLocaleString() : 0} IRR\n`;
    message += `   📅 Joined: ${new Date(u.created_at).toLocaleDateString()}\n\n`;
  });

  return message;
}



  static paymentsList(payments: any[], stats: any): string {
    let message = `💰 *Recent Payments*\n\n`;
    message += `📊 *Stats:* Total: ${stats.total_payments || 0}  Today: ${stats.payments_today || 0}\n`;
    message += `💵 Total Amount: ${this.escapeMarkdown(stats.total_amount) ? this.escapeMarkdown(Math.round(stats.total_amount).toLocaleString()) : 0} IRR\n\n`;
    
    payments.forEach((p, index) => {
      const username = p.username ? `@${p.username}` : `User ${p.user_id}`;
      const status = p.status === 'confirmed' ? '✅' : 
                    p.status === 'pending' ? '⏳' : 
                    p.status === 'declined' ? '❌' : '⚪';
      
      message += `${index + 1}\\. ${status} ${this.bold(this.escapeMarkdown(username))}\n`;
      message += `   💰 Amount: ${Math.round(p.amount).toLocaleString() || 0} IRR\n`;
      message += `   📋 Invoice: ${this.escapeMarkdown(p.invoice_number) || 0}\n`;
      message += `   📅 Date: ${new Date(p.created_at).toLocaleDateString() || 0}\n\n`;
    });
    
    return message;
  }

  // ============ VALIDATION ============
  static invalidInput(field: string): string {
    return `❌ *Invalid Input*

Please enter a valid value for ${this.bold(this.escapeMarkdown(field))}.`;
  }

  static error(message: string): string {
    return `❌ *Error*

${this.escapeMarkdown(message)}`;
  }
}