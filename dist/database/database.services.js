"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class DatabaseService {
    constructor() {
        this.pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
        });
    }
    async query(text, params) {
        return this.pool.query(text, params);
    }
    // ================ AUTHENTICATION ================
    async verifyAdminPassword(password) {
        return password === process.env.ADMIN_BOT_PASSWORD;
    }
    // ================ SERVICES CRUD ================
    async getServices() {
        const result = await this.query('SELECT * FROM services ORDER BY sort_order ASC, id ASC');
        return result.rows;
    }
    async getServiceById(id) {
        const result = await this.query('SELECT * FROM services WHERE id = $1', [id]);
        return result.rows[0];
    }
    async createService(service) {
        const { name, description, price, duration_days, data_limit_gb, is_active, sort_order } = service;
        const result = await this.query(`INSERT INTO services (name, description, price, duration_days, data_limit_gb, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`, [name, description, price, duration_days, data_limit_gb || null, is_active, sort_order || 0]);
        return result.rows[0];
    }
    async updateService(id, service) {
        const { name, description, price, duration_days, data_limit_gb, is_active, sort_order } = service;
        const result = await this.query(`UPDATE services 
       SET name = $1, description = $2, price = $3, duration_days = $4, 
           data_limit_gb = $5, is_active = $6, sort_order = $7, updated_at = NOW()
       WHERE id = $8
       RETURNING *`, [name, description, price, duration_days, data_limit_gb || null, is_active, sort_order || 0, id]);
        return result.rows[0];
    }
    async deleteService(id) {
        const result = await this.query('DELETE FROM services WHERE id = $1', [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
    // ================ SERVERS CRUD ================
    async getServers() {
        const result = await this.query('SELECT * FROM servers ORDER BY location, name');
        return result.rows;
    }
    async getServerById(id) {
        const result = await this.query('SELECT * FROM servers WHERE id = $1', [id]);
        return result.rows[0];
    }
    async createServer(server) {
        const { name, domain, ip, api_port, xray_port, api_token, max_users, location, status, cpu_cores, ram_gb } = server;
        const result = await this.query(`INSERT INTO servers (
        name, domain, ip, api_port, xray_port, api_token, 
        max_users, current_users, location, status, cpu_cores, ram_gb, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, $11, true)
      RETURNING *`, [name, domain, ip, api_port || 5000, xray_port || 8445, api_token,
            max_users || 100, location, status || 'active', cpu_cores || 2, ram_gb || 4]);
        return result.rows[0];
    }
    async updateServer(id, server) {
        const updates = [];
        const values = [];
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
        const result = await this.query(`UPDATE servers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, values);
        return result.rows[0];
    }
    async deleteServer(id) {
        // Check if server has any active configs
        const checkResult = await this.query('SELECT COUNT(*) FROM user_configs WHERE server_id = $1 AND status IN ($2, $3)', [id, 'active', 'test']);
        if (parseInt(checkResult.rows[0].count) > 0) {
            throw new Error('Cannot delete server with active users');
        }
        const result = await this.query('DELETE FROM servers WHERE id = $1', [id]);
        return result.rowCount !== null && result.rowCount > 0;
    }
    // ================ MONITORING ================
    async getUsersStats() {
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
    async getRecentUsers(limit = 10) {
        const result = await this.query(`SELECT id, telegram_id, username, first_name, balance, created_at 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1`, [limit]);
        return result.rows;
    }
    async getPaymentsStats() {
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
    async getRecentPayments(limit = 10) {
        const result = await this.query(`SELECT p.*, u.username, u.telegram_id 
       FROM payments p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC 
       LIMIT $1`, [limit]);
        return result.rows;
    }
    async getServerStats() {
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
    async getActiveConfigsCount() {
        const result = await this.query("SELECT COUNT(*) FROM user_configs WHERE status IN ('active', 'test')");
        return parseInt(result.rows[0].count);
    }
    async getExpiringConfigs(days = 3) {
        const result = await this.query(`SELECT uc.*, u.username, u.telegram_id, s.name as server_name, sv.name as service_name
       FROM user_configs uc
       JOIN users u ON uc.user_id = u.id
       LEFT JOIN servers s ON uc.server_id = s.id
       LEFT JOIN services sv ON uc.service_id = sv.id
       WHERE uc.status IN ('active', 'test')
       AND uc.expires_at <= NOW() + INTERVAL '$1 days'
       AND uc.expires_at > NOW()
       ORDER BY uc.expires_at ASC`, [days]);
        return result.rows;
    }
}
exports.default = new DatabaseService();
