import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface VybitConfig {
  apiKey?: string;
  accessToken?: string;
  apiUrl?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'vybit');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export function getConfigFile(): string {
  return CONFIG_FILE;
}

export function loadConfig(): VybitConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data) as VybitConfig;
    }
  } catch {
    // Ignore parse errors, return empty config
  }
  return {};
}

export function saveConfig(config: VybitConfig): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', {
    mode: 0o600,
  });
}

export function clearConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) {
    fs.unlinkSync(CONFIG_FILE);
  }
}
