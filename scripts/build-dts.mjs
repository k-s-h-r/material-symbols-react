// 型情報を書き出すための処理が直列だとメモリ不足になるため、並列で1ファイルごとに対応できるようにした
// 並列分メモリは必要になるが1ファイルごとにメモリはリリースされるためメモリ不足は避けられる
import { spawn } from 'child_process';

const weights = ['w100', 'w200', 'w300', 'w400', 'w500', 'w600', 'w700'];

const entries = [
  { input: 'src/createMaterialIcon.ts', output: 'dist/createMaterialIcon.d.ts' },
  { input: 'src/outlined/index.ts', output: 'dist/outlined/index.d.ts' },
  { input: 'src/rounded/index.ts', output: 'dist/rounded/index.d.ts' },
  { input: 'src/sharp/index.ts', output: 'dist/sharp/index.d.ts' },
  ...weights.flatMap(weight => [
    { input: `src/rounded/${weight}.ts`, output: `dist/rounded/${weight}.d.ts` },
    { input: `src/sharp/${weight}.ts`, output: `dist/sharp/${weight}.d.ts` },
    { input: `src/outlined/${weight}.ts`, output: `dist/outlined/${weight}.d.ts` },
  ])
];

const maxParallel = 4; // 並列実行数（調整可能）

let index = 0;

function runRollup({ input, output }) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'rollup',
      ['-c', 'scripts/dts.single.config.mjs', '--environment', `INPUT:${input},OUTPUT:${output}`],
      { stdio: 'inherit' }
    );

    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`Failed to build: ${input}`));
    });
  });
}

async function worker() {
  while (index < entries.length) {
    const entry = entries[index++];
    await runRollup(entry);
  }
}

async function runAll() {
  await Promise.all(Array.from({ length: maxParallel }, () => worker()));
}

runAll().catch(err => {
  console.error(err);
  process.exit(1);
});