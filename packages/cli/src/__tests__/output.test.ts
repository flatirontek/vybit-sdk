import { output, outputList, outputSuccess, outputError } from '../output';

// Capture stdout/stderr writes
let stdoutData: string;
let stderrData: string;

beforeEach(() => {
  stdoutData = '';
  stderrData = '';
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk: any) => {
    stdoutData += chunk;
    return true;
  });
  jest.spyOn(process.stderr, 'write').mockImplementation((chunk: any) => {
    stderrData += chunk;
    return true;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('output', () => {
  it('writes pretty JSON to stdout by default', () => {
    output({ key: 'abc', name: 'Test' });
    const parsed = JSON.parse(stdoutData);
    expect(parsed).toEqual({ key: 'abc', name: 'Test' });
    // Should be pretty-printed (multi-line)
    expect(stdoutData).toContain('\n  ');
  });

  it('writes only the key in quiet mode', () => {
    output({ key: 'abc123', name: 'Test' }, true);
    expect(stdoutData.trim()).toBe('abc123');
  });

  it('writes followingKey in quiet mode', () => {
    output({ followingKey: 'fk-999', vybName: 'Test' }, true);
    expect(stdoutData.trim()).toBe('fk-999');
  });

  it('writes id in quiet mode when no key/followingKey', () => {
    output({ id: 'reminder-abc', cron: '0 9 * * *' }, true);
    expect(stdoutData.trim()).toBe('reminder-abc');
  });
});

describe('outputList', () => {
  it('writes JSON array to stdout', () => {
    outputList([{ key: 'a' }, { key: 'b' }]);
    const parsed = JSON.parse(stdoutData);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].key).toBe('a');
  });

  it('writes one key per line in quiet mode', () => {
    outputList([{ key: 'a' }, { key: 'b' }, { key: 'c' }], true);
    const lines = stdoutData.trim().split('\n');
    expect(lines).toEqual(['a', 'b', 'c']);
  });
});

describe('outputSuccess', () => {
  it('writes success JSON to stdout', () => {
    outputSuccess('Vybit deleted');
    const parsed = JSON.parse(stdoutData);
    expect(parsed).toEqual({ success: true, message: 'Vybit deleted' });
  });

  it('writes nothing in quiet mode', () => {
    outputSuccess('Vybit deleted', true);
    expect(stdoutData).toBe('');
  });
});

describe('outputError', () => {
  it('writes structured error to stderr and exits', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    outputError({ message: 'Not found', statusCode: 404 });
    const parsed = JSON.parse(stderrData);
    expect(parsed).toEqual({ error: 'Not found', statusCode: 404 });
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('uses custom exit code', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    outputError({ message: 'Unauthorized' }, 2);
    expect(mockExit).toHaveBeenCalledWith(2);
    mockExit.mockRestore();
  });

  it('handles string errors', () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    outputError('Something went wrong');
    const parsed = JSON.parse(stderrData);
    expect(parsed.error).toBe('Something went wrong');
    mockExit.mockRestore();
  });
});
