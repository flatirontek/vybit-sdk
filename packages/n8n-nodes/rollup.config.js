import esbuild from 'rollup-plugin-esbuild';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const baseConfig = {
  external: ['n8n-workflow', 'n8n-core'],
  plugins: [
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
    commonjs(),
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
      format: 'cjs',
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
      format: 'cjs',
      sourcemap: false,
      exports: 'auto',
      preserveModules: false,
    },
  },
];
