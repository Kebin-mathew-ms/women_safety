import prisma from './db.service';

// In-memory settings cache (refreshed on startup)
let settingsCache: Map<string, string> = new Map();
let cacheLoaded = false;

export class SettingsService {
  static async loadAll(): Promise<Map<string, string>> {
    const rows = await prisma.systemSettings.findMany();
    settingsCache = new Map(rows.map((r) => [r.settingKey, r.settingValue]));
    cacheLoaded = true;
    return settingsCache;
  }

  static async get(key: string, defaultVal = ''): Promise<string> {
    if (!cacheLoaded) await SettingsService.loadAll();
    return settingsCache.get(key) ?? defaultVal;
  }

  static async set(key: string, value: string, category = 'general', description?: string): Promise<void> {
    await prisma.systemSettings.upsert({
      where: { settingKey: key },
      update: { settingValue: value, category },
      create: { settingKey: key, settingValue: value, category, description },
    });
    settingsCache.set(key, value);
  }

  static async getAll() {
    return prisma.systemSettings.findMany({ orderBy: [{ category: 'asc' }, { settingKey: 'asc' }] });
  }

  static async upsertMany(settings: { key: string; value: string; category?: string; description?: string }[]) {
    for (const s of settings) {
      await SettingsService.set(s.key, s.value, s.category, s.description);
    }
  }

  static async seed() {
    const defaults = [
      { key: 'app.name', value: 'Safe Travel', category: 'general', description: 'Application display name' },
      { key: 'app.supportEmail', value: 'support@safetravel.app', category: 'general', description: 'Support contact email' },
      { key: 'safety.nightHoursStart', value: '22', category: 'safety', description: 'Night hours start (24h)' },
      { key: 'safety.nightHoursEnd', value: '6', category: 'safety', description: 'Night hours end (24h)' },
      { key: 'safety.crimeWeight', value: '0.4', category: 'safety', description: 'Crime density risk weight' },
      { key: 'safety.nightWeight', value: '0.3', category: 'safety', description: 'Night travel risk weight' },
      { key: 'safety.weatherWeight', value: '0.3', category: 'safety', description: 'Weather risk weight' },
      { key: 'ai.model', value: 'phi3', category: 'ai', description: 'Default Ollama model name' },
      { key: 'ai.ollamaUrl', value: 'http://localhost:11434', category: 'ai', description: 'Ollama service URL' },
      { key: 'ai.temperature', value: '0.7', category: 'ai', description: 'LLM temperature' },
      { key: 'ai.maxTokens', value: '512', category: 'ai', description: 'Max response tokens' },
      { key: 'ai.timeoutMs', value: '10000', category: 'ai', description: 'LLM request timeout (ms)' },
      { key: 'notification.sosTitle', value: '🚨 SOS ALERT', category: 'notification', description: 'SOS notification title' },
      { key: 'notification.defaultPriority', value: 'medium', category: 'notification', description: 'Default notification priority' },
      { key: 'map.defaultLat', value: '20.5937', category: 'map', description: 'Default map center latitude' },
      { key: 'map.defaultLon', value: '78.9629', category: 'map', description: 'Default map center longitude' },
      { key: 'map.defaultZoom', value: '12', category: 'map', description: 'Default map zoom level' },
      { key: 'socket.pingTimeout', value: '5000', category: 'socket', description: 'Socket.IO ping timeout (ms)' },
      { key: 'socket.pingInterval', value: '2500', category: 'socket', description: 'Socket.IO ping interval (ms)' },
    ];

    for (const s of defaults) {
      const existing = await prisma.systemSettings.findUnique({ where: { settingKey: s.key } });
      if (!existing) {
        await prisma.systemSettings.create({ data: { settingKey: s.key, settingValue: s.value, category: s.category, description: s.description } });
      }
    }
  }
}

export default SettingsService;
