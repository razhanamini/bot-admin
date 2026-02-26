import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
// import { BotService } from '../bot/bot.services';
import {
  V2RayConfig,
  Server,
} from '../types/v2ray.type';

dotenv.config();

export class V2RayService {
//   private botService: BotService | null = null;
  private isMonitoringActive: boolean = false;
  private httpInstances: Map<number, AxiosInstance> = new Map();
  private realityPK = process.env.REALITY_PUBLIC_KEY;
  constructor() {
    console.log('🔧 V2Ray service initialized (multi-server mode)');
  }

//   setBotService(botService: BotService) {
//     this.botService = botService;
//   }

  // ================ HTTP CLIENT MANAGEMENT ================

  private getHttpClient(server: Server): AxiosInstance {
    if (this.httpInstances.has(server.id)) {
      return this.httpInstances.get(server.id)!;
    }

    const http = axios.create({
      baseURL: `http://${server.ip}:${server.api_port}`,
      headers: {
        'x-api-token': server.api_token,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    http.interceptors.response.use(
      response => response,
      error => {
        console.error(`❌ Server ${server.id} (${server.name}) API error:`, error.message);
        return Promise.reject(error);
      }
    );

    this.httpInstances.set(server.id, http);
    return http;
  }

  // ================ SERVER SELECTION ================


  async getConfig(server: Server): Promise<V2RayConfig> {
    try {
      console.log(`📡 Fetching config from server ${server.name}...`);
      const http = this.getHttpClient(server);
      const response = await http.get('/api/xray/config');

      if (!response.data.success) {
        throw new Error('API returned success: false');
      }

      if (!response.data.config) {
        throw new Error('No config in response');
      }

      return response.data.config;
    } catch (error: any) {
      console.error(`❌ Error fetching config from server ${server.name}:`, error.message);
      throw new Error(`Failed to get Xray config from ${server.name}: ${error.message}`);
    }
  }

  async updateConfig(server: Server, config: V2RayConfig): Promise<boolean> {
    try {
      console.log(`📤 Updating config on server ${server.name}...`);
      const http = this.getHttpClient(server);

      const requestBody = { config };
      const response = await http.put('/api/xray/config', requestBody);

      if (!response.data.success) {
        throw new Error(`Update failed: ${response.data.message || 'Unknown error'}`);
      }

      console.log(`✅ Config updated on ${server.name}: ${response.data.message}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error updating config on server ${server.name}:`, error.message);
      throw new Error(`Failed to update config on ${server.name}: ${error.message}`);
    }
  }

  async restartService(server: Server): Promise<boolean> {
    try {
      console.log(`🔄 Restarting Xray service on server ${server.name}...`);
      const http = this.getHttpClient(server);

      const response = await http.post('/api/xray/restart');

      if (!response.data.success) {
        throw new Error(`Restart failed: ${response.data.message || 'Unknown error'}`);
      }

      console.log(`✅ Xray service restarted on ${server.name}: ${response.data.message}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Error restarting Xray service on server ${server.name}:`, error.message);

      // Don't throw on restart failure - config is already updated
      console.warn(`⚠️ Service restart failed on ${server.name}, but config was updated`);
      return false;
    }
  }


  

}

export default new V2RayService();