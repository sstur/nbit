import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';

export default [
  {
    input: 'src/packages/node/index.ts',
    output: {
      dir: 'build/node',
      format: 'cjs',
      strict: false,
      esModule: false,
    },
    external: ['fs', 'path', 'stream'],
    plugins: [
      typescript({
        module: 'esnext',
        include: ['../**/*.ts'],
      }),
      replace({
        preventAssignment: true,
        delimiters: ['', ''],
        values: {
          '(..._)': '()',
        },
      }),
      cleanup({
        extensions: ['js', 'ts'],
      }),
    ],
  },
  {
    input: 'build/dts/packages/node/index.d.ts',
    output: {
      file: 'build/node/index.d.ts',
      format: 'es',
    },
    external: ['http', 'stream', 'stream/web'],
    plugins: [dts()],
  },
  {
    input: 'src/packages/express/index.ts',
    output: {
      dir: 'build/express',
      format: 'cjs',
      strict: false,
      esModule: false,
    },
    external: ['path', 'stream'],
    plugins: [
      typescript({
        module: 'esnext',
        include: ['../**/*.ts'],
      }),
      cleanup({
        extensions: ['js', 'ts'],
      }),
    ],
  },
  {
    input: 'build/dts/packages/express/index.d.ts',
    output: {
      file: 'build/express/index.d.ts',
      format: 'es',
    },
    external: ['http', 'stream', 'stream/web'],
    plugins: [dts()],
  },
];
