import * as core from '../index';

const outputSchemas = Object.entries(core).filter(([name]) => name.endsWith('_OUTPUT_SCHEMA')) as [string, any][];

/** Walk every nested schema node, yielding [path, node]. */
function* walk(node: any, path: string): Generator<[string, any]> {
  if (node === null || typeof node !== 'object') return;
  yield [path, node];
  for (const [key, value] of Object.entries(node)) {
    yield* walk(value, `${path}.${key}`);
  }
}

describe('output schemas', () => {
  test.each(outputSchemas)('%s stays tolerant of API drift', (_name, schema) => {
    for (const [path, node] of walk(schema, '$')) {
      expect([path, 'nullable' in node]).toEqual([path, false]);
      expect([path, 'format' in node]).toEqual([path, false]);
      expect([path, 'enum' in node]).toEqual([path, false]);
      expect([path, node.additionalProperties === false]).toEqual([path, false]);
    }
  });
});
