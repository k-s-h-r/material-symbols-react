#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Weight別exportファイル生成スクリプト
 * 
 * 各weight（100-700）とstyle（outlined, rounded, sharp）の組み合わせで
 * exportファイルを生成して、tree-shaking最適化を実現
 */

const STYLES = ['outlined', 'rounded', 'sharp'];
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700];
const OUTPUT_DIR = path.join(__dirname, '../src');

// 開発時のアイコン制限設定
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || process.env.ICON_LIMIT === 'true';

// 開発時に使用するアイコンリスト（一元管理から取得）
let DEV_ICONS = [];

// 非同期でESMモジュールをロード
async function loadDevIcons() {
  const { getPascalCaseIcons } = await import('./dev-icons.js');
  DEV_ICONS = getPascalCaseIcons();
}

/**
 * 全アイコン名を取得（Material Symbolsから自動検出）
 */
function getAllIconNames() {
  const sourceDir = path.join(__dirname, '../node_modules/@material-symbols/svg-400/outlined');
  if (!fs.existsSync(sourceDir)) {
    console.error('❌ Material Symbols source directory not found:', sourceDir);
    return [];
  }
  
  // outlined/400から全SVGファイルを取得
  const svgFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.svg'))
    .map(file => file.replace('.svg', ''));
  
  console.log(`🔍 発見された全アイコン数: ${svgFiles.length}個`);
  return svgFiles;
}

/**
 * Material Symbolsのファイル名からPascalCase名を取得
 */
function getActualIconName(iconBaseName, style, weight) {
  const sourceDir = path.join(__dirname, `../node_modules/@material-symbols/svg-${weight}`, style);
  
  // 複数の命名パターンを試行
  const nameCandidates = [
    iconBaseName,
    iconBaseName.replace(/_/g, ''),
    iconBaseName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  ];
  
  for (const candidate of nameCandidates) {
    const svgFile = path.join(sourceDir, `${candidate}.svg`);
    if (fs.existsSync(svgFile)) {
      // SVGファイル名からTypeScriptファイル名を推測
      return toPascalCase(candidate.replace(/_/g, '-'));
    }
  }
  
  return null;
}

// 全アイコン名を取得してPascalCase変換
function getAllIcons() {
  const allIconNames = getAllIconNames();
  const convertedIcons = allIconNames.map(baseName => {
    const actualName = getActualIconName(baseName, 'outlined', 400);
    return actualName ? { originalName: baseName, componentName: actualName } : null;
  }).filter(Boolean);
  
  console.log(`✅ 変換されたアイコン数: ${convertedIcons.length}個`);
  return convertedIcons;
}

/**
 * kebab-caseをPascalCaseに変換
 */
function toPascalCase(str) {
  let result = str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  if (/^\d/.test(result)) {
    result = 'Icon' + result;
  }
  
  return result;
}

/**
 * PascalCaseをkebab-caseに変換（ファイル名用）
 * Preserves original kebab-case structure for icons with hyphens
 */
function toKebabCase(str, originalName = null) {
  // If original name has hyphens/underscores, preserve that structure
  if (originalName && (originalName.includes('-') || originalName.includes('_'))) {
    return originalName.replace(/_/g, '-');
  }
  
  // Otherwise convert PascalCase to kebab-case
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * 統一テンプレートでエントリーファイルを生成
 */
function generateEntryFromTemplate(iconNames, style, weight, isMainEntry = false, isWeightOnly = false) {
  const templatePath = path.join(__dirname, './entry.template.ts');
  const template = fs.readFileSync(templatePath, 'utf8');
  
  const styleTitle = style.charAt(0).toUpperCase() + style.slice(1);
  const weightTitle = isMainEntry ? ` (Weight ${weight})` : ` ${weight}`;
  
  // アイコンエクスポート生成
  const iconExports = iconNames.map(iconInfo => {
    // Handle both old format (string) and new format (object)
    const iconName = typeof iconInfo === 'string' ? iconInfo : iconInfo.componentName;
    const originalName = typeof iconInfo === 'string' ? null : iconInfo.originalName;
    const fileName = toKebabCase(iconName, originalName);
    let importPath;
    if (isMainEntry) {
      // メインエントリーファイル (src/outlined/index.ts) から
      importPath = `./w${weight}/${fileName}`;
    } else if (isWeightOnly) {
      // ルートレベル (src/index.ts) から
      importPath = `./${style}/w${weight}/${fileName}`;
    } else {
      // weight別ファイル (src/outlined/w400.ts) から参照
      importPath = `./w${weight}/${fileName}`;
    }
    return `export { default as ${iconName} } from '${importPath}';`;
  }).join('\n');
  
  // テンプレート変数を置換
  const content = template
    .replace('{{STYLE_TITLE}}', styleTitle)
    .replace('{{WEIGHT_TITLE}}', weightTitle)
    .replace('{{DOC_DESCRIPTION}}', isMainEntry 
      ? `\n * Material Symbols ${style} icons with default weight ${weight}`
      : `\n * ${styleTitle} style icons with weight ${weight}`)
    .replace('{{DOC_USAGE}}', isMainEntry 
      ? `\n * For other weights, use: import { Home } from 'material-symbols-react/${style}/w700'\n * For other styles, use: import { Home } from 'material-symbols-react/rounded'`
      : '')
    .replace('{{TYPE_EXPORT}}', isMainEntry ? 'type { IconProps, IconComponent }' : '*')
    .replace('{{TYPE_PATH}}', isMainEntry ? '../types' : (isWeightOnly ? './types' : '../types'))
    .replace('{{CREATOR_PATH}}', isMainEntry ? '../createMaterialIcon' : (isWeightOnly ? './createMaterialIcon' : '../createMaterialIcon'))
    .replace('{{ICON_EXPORTS}}', iconExports);
    
  return content;
}

/**
 * Weight別exportファイルを生成（統一テンプレート使用）
 */
function generateWeightExport(iconNames, style, weight) {
  return generateEntryFromTemplate(iconNames, style, weight, false);
}



/**
 * Style別ディレクトリのセットアップ
 */
function setupStyleDirectories() {
  const directories = [];
  
  for (const style of STYLES) {
    const styleDir = path.join(OUTPUT_DIR, style);
    if (!fs.existsSync(styleDir)) {
      fs.mkdirSync(styleDir, { recursive: true });
    }
    directories.push(styleDir);
  }
  
  return directories;
}

/**
 * 統一テンプレートからメインエントリーファイルを生成
 */
function generateMainEntryFiles(iconNames) {
  console.log('\n📝 メインエントリーファイルを生成中...');
  
  const mainEntries = [
    { style: 'outlined', file: 'outlined/index.ts' },
    { style: 'rounded', file: 'rounded/index.ts' },
    { style: 'sharp', file: 'sharp/index.ts' }
  ];
  
  for (const entry of mainEntries) {
    const content = generateEntryFromTemplate(iconNames, entry.style, 400, true);
    const filePath = path.join(OUTPUT_DIR, entry.file);
    
    // ディレクトリが存在しない場合は作成
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ ${entry.file}生成完了 (${entry.style} w400, ${iconNames.length}個のアイコン)`);
  }
  
  // ルートのindex.tsは不要（package.jsonで直接outlined/index.jsを指定）
  console.log(`   ✅ ルートindex.ts不要 (package.jsonで直接outlined/index.jsを指定)`);
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🚀 Weight別exportファイル生成を開始...\n');
  
  try {
    // 開発アイコンリストをロード
    if (IS_DEVELOPMENT) {
      await loadDevIcons();
    }
    
    // 全アイコンを取得
    let ALL_ICONS = getAllIcons();
    
    // 開発時のアイコン制限を適用
    if (IS_DEVELOPMENT) {
      ALL_ICONS = ALL_ICONS.filter(iconInfo => DEV_ICONS.includes(iconInfo.componentName));
      console.log(`🚧 開発モード: ${ALL_ICONS.length}個のアイコンに制限されました`);
    }
    
    if (ALL_ICONS.length === 0) {
      console.error('❌ アイコンが見つかりませんでした');
      process.exit(1);
    }
    
    // Style別ディレクトリのセットアップ
    setupStyleDirectories();
    console.log(`📁 Style別ディレクトリを準備完了\n`);
    
    // 存在するアイコンのみをフィルタリング
    const validatedIcons = ALL_ICONS.filter(iconInfo => {
      // 少なくとも1つのweightで全スタイルが存在するかチェック
      const fileName = toKebabCase(iconInfo.componentName, iconInfo.originalName);
      return WEIGHTS.some(weight => {
        return STYLES.every(style => {
          const iconPath = path.join(OUTPUT_DIR, style, `w${weight}`, `${fileName}.ts`);
          return fs.existsSync(iconPath);
        });
      });
    });
    
    console.log(`🎨 Weight別exportファイル生成中...`);
    console.log(`📊 処理対象: ${validatedIcons.length}個のアイコン × ${STYLES.length}スタイル × ${WEIGHTS.length}weight = ${STYLES.length * WEIGHTS.length}個のexportファイル\n`);
    
    // 各スタイル・weight別にexportファイルを生成
    for (const style of STYLES) {
      console.log(`\n   📁 ${style} スタイルのweight別exportファイル生成中...`);
      
      for (const weight of WEIGHTS) {
        // 該当weightで存在するアイコンのみをフィルタリング
        const weightIcons = validatedIcons.filter(iconInfo => {
          const fileName = toKebabCase(iconInfo.componentName, iconInfo.originalName);
          const iconPath = path.join(OUTPUT_DIR, style, `w${weight}`, `${fileName}.ts`);
          return fs.existsSync(iconPath);
        });
        
        if (weightIcons.length > 0) {
          const exportContent = generateWeightExport(weightIcons, style, weight);
          const exportFilePath = path.join(OUTPUT_DIR, style, `w${weight}.ts`);
          
          fs.writeFileSync(exportFilePath, exportContent);
          console.log(`      ✅ ${style}/w${weight}.ts: ${weightIcons.length}個のアイコン`);
        }
      }
    }


    
    // メインエントリーファイルを生成
    if (validatedIcons.length > 0) {
      generateMainEntryFiles(validatedIcons);
    }
    
    // サマリー
    console.log(`\n🎉 Weight別export生成完了!`);
    console.log(`   📊 生成されたexportファイル: ${STYLES.length * WEIGHTS.length}個`);
    console.log(`   🎯 ユニークアイコン: ${validatedIcons.length}個`);
    console.log(`   🎨 スタイル: ${STYLES.length}種類 (${STYLES.join(', ')})`);
    console.log(`   ⚖️  Weight: ${WEIGHTS.length}種類 (${WEIGHTS.join(', ')})`);
    console.log(`   🚀 Tree-shaking: 最適化済み（必要なweightのみバンドル）`);
    console.log(`   💡 使用方法:`);
    console.log(`      • デフォルトweight 400:`);
    console.log(`        import { Home } from 'material-symbols-react';              // outlined w400`);
    console.log(`        import { Home } from 'material-symbols-react/rounded';      // rounded w400`);
    console.log(`        import { Home } from 'material-symbols-react/sharp';        // sharp w400`);
    console.log(`      • 特定weight指定:`);
    console.log(`        import { Home } from 'material-symbols-react/w100';         // outlined w100`);
    console.log(`        import { Home } from 'material-symbols-react/outlined/w100'; // outlined w100`);
    console.log(`        import { Home } from 'material-symbols-react/rounded/w700';  // rounded w700`);
    console.log(`        import { Home } from 'material-symbols-react/sharp/w500';    // sharp w500`);
    console.log(`   🌟 完全SSR対応 & 静的import方式`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();