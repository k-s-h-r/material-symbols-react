import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import copy from 'rollup-plugin-copy';

const weights = [100, 200, 300, 400, 500, 600, 700];

const input = {
  'outlined/index': 'src/outlined/index.ts',
  'rounded/index': 'src/rounded/index.ts', 
  'sharp/index': 'src/sharp/index.ts'
};

// weight別ファイルを追加
weights.forEach(weight => {
  input[`rounded/w${weight}`] = `src/rounded/w${weight}.ts`;
  input[`sharp/w${weight}`] = `src/sharp/w${weight}.ts`;
  input[`outlined/w${weight}`] = `src/outlined/w${weight}.ts`;
});

export default {
  input: input,
  output: {
    dir: 'dist',
    format: 'esm',
    entryFileNames: '[name].js',
    preserveModules: true,
    preserveModulesRoot: 'src'
  },
  external: ['react'],
  plugins: [
    resolve(),
    esbuild({
      tsconfig: './tsconfig.json',
      target: 'es2019',
      sourceMap: true
    }),
    copy({
      targets: [
        { src: 'src/metadata', dest: 'dist' }
      ]
    })
  ]
};
