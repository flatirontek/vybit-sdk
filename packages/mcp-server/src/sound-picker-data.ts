/**
 * Turns a sounds_list result into what the sound picker shows. Pure and free of
 * DOM and Node APIs: the picker UI bundles it and the tests exercise it directly.
 */

export interface PickerSound {
  key: string;
  name: string;
  description: string;
  playUrl: string | null;
  author: string | null;
  license: string | null;
  sourceUrl: string | null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// Freesound descriptions arrive as HTML; the picker renders plain text
function plainText(value: unknown): string {
  return text(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function httpsUrl(value: unknown): string | null {
  const s = text(value);
  return /^https:\/\//i.test(s) ? s : null;
}

/** "CC0", "CC BY 4.0", "CC BY-NC 3.0" from a Creative Commons URL; other short values pass through. */
export function licenseLabel(value: unknown): string | null {
  const s = text(value);
  if (!s) return null;
  if (/creativecommons\.org\/publicdomain\/zero/i.test(s)) return 'CC0';
  const cc = /creativecommons\.org\/licenses\/([a-z-]+)\/(\d+(?:\.\d+)?)/i.exec(s);
  if (cc) return `CC ${cc[1].toUpperCase()} ${cc[2]}`;
  return s.length <= 40 && !/^https?:/i.test(s) ? s : null;
}

/** The sounds in a sounds_list result: structuredContent.items, else the JSON text block. */
export function soundsFromToolResult(result: { structuredContent?: unknown; content?: unknown } | null | undefined): PickerSound[] {
  let items: unknown = (result?.structuredContent as { items?: unknown } | undefined)?.items;
  if (!Array.isArray(items) && Array.isArray(result?.content)) {
    const block = (result!.content as Array<{ type?: string; text?: string }>).find((c) => c?.type === 'text');
    try {
      items = block?.text ? JSON.parse(block.text) : null;
    } catch {
      items = null;
    }
  }
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is Record<string, any> => item !== null && typeof item === 'object' && text(item.key) !== '')
    .map((item) => {
      const meta = item.meta && typeof item.meta === 'object' ? item.meta : {};
      return {
        key: text(item.key),
        name: text(item.name) || text(item.key),
        description: plainText(item.description),
        playUrl: httpsUrl(item.proxyUrl),
        author: text(meta.username) || null,
        license: licenseLabel(meta.license),
        // older imports kept the Freesound page in source; newer ones say "freesound" and use freesoundUrl
        sourceUrl: httpsUrl(meta.freesoundUrl) || httpsUrl(meta.source),
      };
    });
}
