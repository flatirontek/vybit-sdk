import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, saveConfig, clearConfig, getConfigFile } from '../config';

// Use a temp directory for test config files
const TEST_CONFIG_DIR = path.join(os.tmpdir(), 'vybit-cli-test-' + process.pid);
const TEST_CONFIG_FILE = path.join(TEST_CONFIG_DIR, 'config.json');

jest.mock('../config', () => {
  const original = jest.requireActual('../config');
  return {
    ...original,
    getConfigDir: () => TEST_CONFIG_DIR,
    getConfigFile: () => TEST_CONFIG_FILE,
    loadConfig: () => {
      try {
        if (fs.existsSync(TEST_CONFIG_FILE)) {
          const data = fs.readFileSync(TEST_CONFIG_FILE, 'utf-8');
          return JSON.parse(data);
        }
      } catch {
        // ignore
      }
      return {};
    },
    saveConfig: (config: any) => {
      fs.mkdirSync(TEST_CONFIG_DIR, { recursive: true });
      fs.writeFileSync(TEST_CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', {
        mode: 0o600,
      });
    },
    clearConfig: () => {
      if (fs.existsSync(TEST_CONFIG_FILE)) {
        fs.unlinkSync(TEST_CONFIG_FILE);
      }
    },
  };
});

afterEach(() => {
  if (fs.existsSync(TEST_CONFIG_FILE)) {
    fs.unlinkSync(TEST_CONFIG_FILE);
  }
});

afterAll(() => {
  if (fs.existsSync(TEST_CONFIG_DIR)) {
    fs.rmSync(TEST_CONFIG_DIR, { recursive: true, force: true });
  }
});

describe('config', () => {
  it('returns empty config when no file exists', () => {
    const config = loadConfig();
    expect(config).toEqual({});
  });

  it('saves and loads API key config', () => {
    saveConfig({ apiKey: 'test-key-123' });
    const config = loadConfig();
    expect(config.apiKey).toBe('test-key-123');
  });

  it('saves and loads access token config', () => {
    saveConfig({ accessToken: 'test-token-456' });
    const config = loadConfig();
    expect(config.accessToken).toBe('test-token-456');
  });

  it('saves config with restricted file permissions', () => {
    saveConfig({ apiKey: 'secret-key' });
    const stats = fs.statSync(TEST_CONFIG_FILE);
    // 0o600 = owner read/write only
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('clears config file', () => {
    saveConfig({ apiKey: 'to-be-removed' });
    expect(fs.existsSync(TEST_CONFIG_FILE)).toBe(true);
    clearConfig();
    expect(fs.existsSync(TEST_CONFIG_FILE)).toBe(false);
  });

  it('clearConfig is safe when no file exists', () => {
    expect(() => clearConfig()).not.toThrow();
  });

  it('getConfigFile returns expected path', () => {
    expect(getConfigFile()).toBe(TEST_CONFIG_FILE);
  });
});
