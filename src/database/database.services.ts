import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  // ================ AUTHENTICATION ================
  async verifyAdminPassword(password: string): Promise<boolean> {
    return password === process.env.ADMIN_BOT_PASSWORD;
  }

  // ================ SERVICES CRUD ================
  async getServices(): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM services ORDER BY sort_order ASC, id ASC'
    );
    return result.rows;
  }

  async getServiceById(id: number): Promise<any> {
    const result = await this.query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async createService(service: any): Promise<any> {
    const { name, description, price, duration_days, data_limit_gb, is_active, sort_order } = service;
    const result = await this.query(
      `INSERT INTO services (name, description, price, duration_days, data_limit_gb, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, price, duration_days, data_limit_gb || null, is_active, sort_order || 0]
    );
    return result.rows[0];
  }

  async updateService(id: number, service: any): Promise<any> {
    const { name, description, price, duration_days, data_limit_gb, is_active, sort_order } = service;
    const result = await this.query(
      `UPDATE services 
       SET name = $1, description = $2, price = $3, duration_days = $4, 
           data_limit_gb = $5, is_active = $6, sort_order = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, description, price, duration_days, data_limit_gb || null, is_active, sort_order || 0, id]
    );
    return result.rows[0];
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await this.query(
      'DELETE FROM services WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ================ SERVERS CRUD ================
  async getServers(): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM servers ORDER BY location, name'
    );
    return result.rows;
  }

  async getServerById(id: number): Promise<any> {
    const result = await this.query(
      'SELECT * FROM servers WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  async createServer(server: any): Promise<any> {
    const { 
      name, domain, ip, api_port, xray_port, api_token, 
      max_users, location, status, cpu_cores, ram_gb 
    } = server;
    
    const result = await this.query(
      `INSERT INTO servers (
        name, domain, ip, api_port, xray_port, api_token, 
        max_users, current_users, location, status, cpu_cores, ram_gb, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, true)
      RETURNING *`,
      [name, domain, ip, api_port || 5000, xray_port || 8445, api_token, 
       max_users || 100, location, status || 'active', cpu_cores || 2, ram_gb || 4]
    );
    return result.rows[0];
  }

  async updateServer(id: number, server: any): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fields = [
      'name', 'domain', 'ip', 'api_port', 'xray_port', 'api_token',
      'max_users', 'location', 'status', 'cpu_cores', 'ram_gb', 'is_active'
    ];

    fields.forEach(field => {
      if (server[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(server[field]);
        paramIndex++;
      }
    });

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await this.query(
      `UPDATE servers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async deleteServer(id: number): Promise<boolean> {
    // Check if server has any active configs
    const checkResult = await this.query(
      'SELECT COUNT(*) FROM user_configs WHERE server_id = $1 AND status IN ($2, $3)',
      [id, 'active', 'test']
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      throw new Error('Cannot delete server with active users');
    }

    const result = await this.query(
      'DELETE FROM servers WHERE id = $1',
      [id]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ================ MONITORING ================
  async getUsersStats(): Promise<any> {
    const result = await this.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as new_users_today,
        AVG(balance) as avg_balance,
        SUM(balance) as total_balance,
        COUNT(*) FILTER (WHERE is_active = true) as active_users
      FROM users
    `);
    return result.rows[0];
  }

  async getRecentUsers(limit: number = 10): Promise<any[]> {
    const result = await this.query(
      `SELECT id, telegram_id, username, first_name, balance, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getPaymentsStats(): Promise<any> {
    const result = await this.query(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_payments,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_payments,
        SUM(amount) FILTER (WHERE status = 'confirmed') as confirmed_amount,
        COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as payments_today,
        SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as amount_today
      FROM payments
    `);
    return result.rows[0];
  }

  async getRecentPayments(limit: number = 10): Promise<any[]> {
    const result = await this.query(
      `SELECT p.*, u.username, u.telegram_id 
       FROM payments p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC 
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getServerStats(): Promise<any> {
    const result = await this.query(`
      SELECT 
        COUNT(*) as total_servers,
        COUNT(*) FILTER (WHERE status = 'active') as active_servers,
        SUM(current_users) as total_users,
        SUM(max_users) as total_capacity,
        ROUND(AVG(current_users::DECIMAL / NULLIF(max_users, 0) * 100), 1) as avg_utilization
      FROM servers
      WHERE is_active = true
    `);
    return result.rows[0];
  }

  async getActiveConfigsCount(): Promise<number> {
    const result = await this.query(
      "SELECT COUNT(*) FROM user_configs WHERE status IN ('active', 'test')"
    );
    return parseInt(result.rows[0].count);
  }

  // async getExpiringConfigs(days: number = 3): Promise<any[]> {
  //   const result = await this.query(
  //     `SELECT uc.*, u.username, u.telegram_id, s.name as server_name, sv.name as service_name
  //      FROM user_configs uc
  //      JOIN users u ON uc.user_id = u.id
  //      LEFT JOIN servers s ON uc.server_id = s.id
  //      LEFT JOIN services sv ON uc.service_id = sv.id
  //      WHERE uc.status IN ('active', 'test')
  //      AND uc.expires_at <= NOW() + INTERVAL '$1 days'
  //      AND uc.expires_at > NOW()
  //      ORDER BY uc.expires_at ASC`,
  //     [days]
  //   );
  //   return result.rows;
  // }
  async getExpiringConfigs(days: number = 3): Promise<any[]> {
  const result = await this.query(
    `SELECT uc.*, u.username, u.telegram_id, s.name as server_name, sv.name as service_name
     FROM user_configs uc
     JOIN users u ON uc.user_id = u.id
     LEFT JOIN servers s ON uc.server_id = s.id
     LEFT JOIN services sv ON uc.service_id = sv.id
     WHERE uc.status IN ('active', 'test')
     AND uc.expires_at <= NOW() + $1::interval
     AND uc.expires_at > NOW()
     ORDER BY uc.expires_at ASC`,
    [`${days} days`]  // Pass as interval string
  );
  return result.rows;
}

// ================ GIFT CODES CRUD ================

/**
 * Get all gift codes with usage statistics
 */
/**
 * Get all gift codes with usage statistics
 */
// ================ GIFT CODES CRUD ================

/**
 * Get all gift codes with usage statistics
 */
async getAllGiftCodes(): Promise<any[]> {
  try {
    const result = await this.query(
      `SELECT gc.*, 
              COUNT(gcu.id) as times_used,
              (gc.amount * gc.current_uses) as total_redeemed
       FROM gift_codes gc
       LEFT JOIN gift_code_usages gcu ON gc.id = gcu.gift_code_id
       GROUP BY gc.id
       ORDER BY gc.created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting gift codes:', error);
    return [];
  }
}

/**
 * Get active gift codes only (for user display)
 */
async getActiveGiftCodes(): Promise<any[]> {
  try {
    const result = await this.query(
      `SELECT gc.*, 
              COUNT(gcu.id) as times_used,
              (gc.amount * gc.current_uses) as total_redeemed
       FROM gift_codes gc
       LEFT JOIN gift_code_usages gcu ON gc.id = gcu.gift_code_id
       WHERE gc.is_active = true 
         AND (gc.expires_at IS NULL OR gc.expires_at > NOW())
         AND gc.current_uses < gc.max_uses
       GROUP BY gc.id
       ORDER BY gc.created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting active gift codes:', error);
    return [];
  }
}

/**
 * Get gift code by ID
 */
async getGiftCodeById(id: number): Promise<any> {
  try {
    const result = await this.query(
      `SELECT gc.*, 
              COUNT(gcu.id) as times_used,
              (gc.amount * gc.current_uses) as total_redeemed
       FROM gift_codes gc
       LEFT JOIN gift_code_usages gcu ON gc.id = gcu.gift_code_id
       WHERE gc.id = $1
       GROUP BY gc.id`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting gift code by id:', error);
    return null;
  }
}

/**
 * Get gift code by code string
 */
async getGiftCodeByCode(code: string): Promise<any> {
  try {
    const result = await this.query(
      `SELECT * FROM gift_codes WHERE code = $1`,
      [code]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting gift code by code:', error);
    return null;
  }
}

/**
 * Create a new gift code
 */
async createGiftCode(data: {
  code: string;
  amount: number;
  max_uses?: number;
  expires_at?: string | null;
}): Promise<any> {
  try {
    const maxUses = data.max_uses || 1;
    const result = await this.query(
      `INSERT INTO gift_codes (code, amount, max_uses, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.code, data.amount, maxUses, data.expires_at || null]
    );
    return result.rows[0];
  } catch (error: any) {
    console.error('Error creating gift code:', error);
    throw error;
  }
}

/**
 * Update gift code
 */
async updateGiftCode(id: number, updates: {
  amount?: number;
  max_uses?: number;
  is_active?: boolean;
  expires_at?: string | null;
}): Promise<boolean> {
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(updates.amount);
    }
    if (updates.max_uses !== undefined) {
      fields.push(`max_uses = $${paramIndex++}`);
      values.push(updates.max_uses);
    }
    if (updates.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.is_active);
    }
    if (updates.expires_at !== undefined) {
      fields.push(`expires_at = $${paramIndex++}`);
      values.push(updates.expires_at);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const query = `UPDATE gift_codes SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
    
    await this.query(query, values);
    return true;
  } catch (error) {
    console.error('Error updating gift code:', error);
    return false;
  }
}

/**
 * Delete gift code (only if no usages)
 */
async deleteGiftCode(id: number): Promise<{ success: boolean; message: string }> {
  try {
    // Check if it has any usages
    const usages = await this.query(
      'SELECT COUNT(*) as count FROM gift_code_usages WHERE gift_code_id = $1',
      [id]
    );
    
    if (parseInt(usages.rows[0].count) > 0) {
      return { 
        success: false, 
        message: 'Cannot delete: gift code has been used already' 
      };
    }
    
    // No usages, safe to delete
    await this.query('DELETE FROM gift_codes WHERE id = $1', [id]);
    return { success: true, message: 'Gift code deleted successfully' };
  } catch (error) {
    console.error('Error deleting gift code:', error);
    return { success: false, message: 'Error deleting gift code' };
  }
}

/**
 * Get usage history for a gift code
 */
async getGiftCodeUsages(giftCodeId: number): Promise<any[]> {
  try {
    const result = await this.query(
      `SELECT gcu.*, u.username, u.telegram_id, u.first_name
       FROM gift_code_usages gcu
       JOIN users u ON gcu.user_id = u.id
       WHERE gcu.gift_code_id = $1
       ORDER BY gcu.redeemed_at DESC`,
      [giftCodeId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting gift code usages:', error);
    return [];
  }
}

/**
 * Generate a random gift code
 */
async generateRandomGiftCode(): Promise<string> {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `GIFT-${code}`;
}

/**
 * Check if a gift code exists
 */
async giftCodeExists(code: string): Promise<boolean> {
  try {
    const result = await this.query(
      'SELECT id FROM gift_codes WHERE code = $1',
      [code]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking gift code existence:', error);
    return false;
  }
}

/**
 * Get gift code statistics
 */
async getGiftCodeStats(): Promise<any> {
  try {
    const result = await this.query(
      `SELECT 
         COUNT(*) as total_codes,
         SUM(CASE WHEN is_active = true AND (expires_at IS NULL OR expires_at > NOW()) AND current_uses < max_uses THEN 1 ELSE 0 END) as active_codes,
         COALESCE(SUM(amount * max_uses), 0) as total_value,
         COALESCE(SUM(amount * current_uses), 0) as total_redeemed
       FROM gift_codes`
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting gift code stats:', error);
    return {
      total_codes: 0,
      active_codes: 0,
      total_value: 0,
      total_redeemed: 0
    };
  }
}

}

export default new DatabaseService();