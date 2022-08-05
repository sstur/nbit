import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import cleanup from 'rollup-plugin-cleanup';
import replace from '@rollup/plugin-replace';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'build',
      format: 'esm',
      strict: false,
      esModule: false,
    },
    external: ['fs', 'path'],
    plugins: [
      typescript({
        module: 'esnext',
        include: ['../**/*.ts'],
      }),
      replace({
        preventAssignment: true,
        delimiters: ['', ''],
        values: {
          'import Bun': '// import Bun',
          'import { Request': '// import { Request',
          'import { Response': '// import { Response',
          '(..._)': '()',
          'mockable(': '(',
          'process.env.BUN_ENV': 'undefined',
        },
      }),
      cleanup({
        extensions: ['js', 'ts'],
      }),
    ],
  },
  {
    input: 'build/dts/index.d.ts',
    output: {
      file: 'build/index.d.ts',
      format: 'es',
    },
    external: ['bun'],
    plugins: [dts()],
  },
];
