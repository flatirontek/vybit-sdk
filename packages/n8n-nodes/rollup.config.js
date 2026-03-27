import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

// Inline n8n-workflow values at build time so the dist has no runtime
// dependency on n8n-workflow (its npm ESM build is incomplete).
// The TypeScript source still imports from 'n8n-workflow' for type-checking.
function inlineN8nWorkflow() {
  const MODULE_ID = '\0n8n-workflow-inline';
  return {
    name: 'inline-n8n-workflow',
    resolveId(source) {
      if (source === 'n8n-workflow') return MODULE_ID;
      return null;
    },
    load(id) {
      if (id === MODULE_ID) {
        return `
export const NodeConnectionTypes = { Main: 'main' };

export class NodeApiError extends Error {
  constructor(node, errorResponse, options) {
    const message = options?.message
      || errorResponse?.message
      || errorResponse?.description
      || 'UNKNOWN ERROR';
    super(message);
    this.name = 'NodeApiError';
    this.node = node;
    this.description = options?.description || errorResponse?.description || '';
    this.httpCode = options?.httpCode || errorResponse?.httpCode || errorResponse?.statusCode;
    if (errorResponse?.stack) this.stack = errorResponse.stack;
  }
}
`;
      }
      return null;
    },
  };
}

const baseConfig = {
  external: ['n8n-core'],
  plugins: [
    inlineN8nWorkflow(),
    esbuild({
      target: 'es2020',
      minify: false,
      tsconfig: './tsconfig.json',
    }),
    json(),
    resolve({
      preferBuiltins: true,
      browser: false,
    }),
    commonjs({
      ignoreDynamicRequires: true,
      transformMixedEsModules: true,
      ignoreGlobal: true,
    }),
  ],
};

export default [
  // Credentials
  {
    ...baseConfig,
    input: {
      'credentials/VybitApi.credentials': 'src/credentials/VybitApi.credentials.ts',
      'credentials/VybitOAuth2Api.credentials': 'src/credentials/VybitOAuth2Api.credentials.ts',
    },
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: false,
      exports: 'auto',
      preserveModules: false,
    },
  },
  // Nodes
  {
    ...baseConfig,
    input: {
      'nodes/Vybit/Vybit.node': 'src/nodes/Vybit/Vybit.node.ts',
    },
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: false,
      exports: 'auto',
      preserveModules: false,
    },
  },
];
