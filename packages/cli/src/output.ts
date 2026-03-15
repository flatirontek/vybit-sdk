/**
 * Output utilities for the Vybit CLI.
 *
 * Design for both humans and AI agents:
 * - Data always goes to stdout as JSON
 * - Diagnostics/errors go to stderr as JSON
 * - --quiet outputs just the key/ID value
 */

/**
 * Write structured data to stdout.
 * In quiet mode, extracts and outputs only the primary identifier.
 */
export function output(data: any, quiet?: boolean): void {
  if (quiet) {
    const key = extractKey(data);
    if (key !== undefined) {
      process.stdout.write(key + '\n');
    }
    return;
  }
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Write a list to stdout.
 * In quiet mode, outputs one key per line.
 */
export function outputList(data: any[], quiet?: boolean): void {
  if (quiet) {
    for (const item of data) {
      const key = extractKey(item);
      if (key !== undefined) {
        process.stdout.write(key + '\n');
      }
    }
    return;
  }
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/**
 * Write a structured error to stderr and exit.
 */
export function outputError(error: any, exitCode: number = 1): never {
  const msg: Record<string, any> = {
    error: error.message || String(error),
  };
  if (error.statusCode) msg.statusCode = error.statusCode;
  process.stderr.write(JSON.stringify(msg) + '\n');
  return process.exit(exitCode) as never;
}

/**
 * Write a success message for operations with no return data (e.g. delete).
 */
export function outputSuccess(message: string, quiet?: boolean): void {
  if (quiet) return;
  process.stdout.write(JSON.stringify({ success: true, message }) + '\n');
}

/**
 * Extract the primary identifier from a response object.
 */
function extractKey(data: any): string | undefined {
  if (data == null || typeof data !== 'object') return String(data);
  // Try common key fields in order of specificity
  return data.key ?? data.followingKey ?? data.id ?? data.plk ?? undefined;
}
