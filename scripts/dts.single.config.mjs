import dts from 'rollup-plugin-dts';

const input = process.env.INPUT;
const output = process.env.OUTPUT;

if (!input || !output) {
  throw new Error('INPUT and OUTPUT must be specified via --environment');
}

export default {
  input,
  output: { file: output, format: 'es' },
  plugins: [dts()],
};