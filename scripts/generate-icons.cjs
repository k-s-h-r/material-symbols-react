#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Material Symbols Icon Data Generator (Lucide-style)
 * 
 * Generates individual icon files and lightweight metadata
 * for memory-efficient builds and optimal tree-shaking
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
  const { getKebabSnakeCaseIcons } = await import('./dev-icons.js');
  DEV_ICONS = getKebabSnakeCaseIcons();
}

/**
 * Convert kebab-case to PascalCase and ensure valid JavaScript identifier
 */
function toPascalCase(str) {
  let result = str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // If the name starts with a number, prefix with 'Icon'
  if (/^\d/.test(result)) {
    result = 'Icon' + result;
  }
  
  return result;
}

/**
 * Convert PascalCase to kebab-case for file names
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
 * Extract path data from SVG content
 */
function extractPathFromSvg(svgContent) {
  const pathMatch = svgContent.match(/<path[^>]*d="([^"]*)"[^>]*>/);
  return pathMatch ? pathMatch[1] : '';
}

function base64SVG(svgContents) {
  return Buffer.from(
    svgContents
      .replace('<svg', '<svg style="background-color: #fff;"')
      .replace('width="48"', 'width="24"')
      .replace('height="48"', 'height="24"')
      .replace('\n', '')
      .replace(
        'fill="currentColor"',
        'fill="#000"',
      ),
  ).toString('base64');
}

/**
 * Process icons for a specific style and weight - True Lucide approach
 */
async function processStyleWeightLucide(style, weight) {
  console.log(`📁 Processing ${style} icons (weight ${weight}) - True Lucide style...`);
  
  const sourceDir = path.join(__dirname, `../node_modules/@material-symbols/svg-${weight}`, style);
  
  // Check if source directory exists
  if (!fs.existsSync(sourceDir)) {
    console.warn(`   ⚠️  Source directory not found: ${sourceDir}`);
    return { iconNames: [], processedCount: 0 };
  }
  
  // Create individual icon directories
  const iconOutputDir = path.join(OUTPUT_DIR, style, `w${weight}`);
  if (!fs.existsSync(iconOutputDir)) {
    fs.mkdirSync(iconOutputDir, { recursive: true });
  }
  
  // Read all SVG files
  let svgFiles = fs.readdirSync(sourceDir).filter(file => file.endsWith('.svg'));
  
  // 開発時のアイコン制限を適用
  if (IS_DEVELOPMENT) {
    const devSvgFiles = svgFiles.filter(file => {
      const iconName = path.basename(file, '.svg');
      return DEV_ICONS.includes(iconName);
    });
    svgFiles = devSvgFiles;
    console.log(`   🚧 Development mode: Limited to ${svgFiles.length}/${fs.readdirSync(sourceDir).filter(file => file.endsWith('.svg')).length} icons`);
  }
  
  const iconNames = [];
  const rawIconNames = []; // Track raw icon names without conversion
  const iconFileMapping = new Map(); // Track component name to file name mapping
  const rawToComponentMapping = new Map(); // Track raw icon name to component name mapping
  const pathData = {}; // Track path data for each icon
  let processedCount = 0;
  
  console.log(`   Found ${svgFiles.length} icons`);
  
  for (const svgFile of svgFiles) {
    const iconName = path.basename(svgFile, '.svg');
    const svgPath = path.join(sourceDir, svgFile);
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Extract path data
    const extractedPathData = extractPathFromSvg(svgContent);
    if (!extractedPathData) {
      console.warn(`   ⚠️  Could not extract path from ${svgFile}`);
      continue;
    }
    
    // Store path data for JSON generation
    pathData[iconName] = extractedPathData;
    
    const componentName = toPascalCase(iconName);
    const fileName = toKebabCase(componentName, iconName);

    // Store raw icon name (without conversion)
    rawIconNames.push(iconName);
    
    // Store mapping from raw icon name to component name
    rawToComponentMapping.set(iconName, componentName);

    // Generate SVG Base64 for preview
    const svgBase64 = base64SVG(svgContent);

    // Create individual icon TS file (True Lucide approach)
    const iconTsContent = `import createMaterialIcon from '../../createMaterialIcon';
const __iconData = "${extractedPathData}";

/**
 * @component @name ${componentName}
 * @description Material Symbols SVG icon component, renders SVG Element with children.
 *
 * @preview ![img](data:image/svg+xml;base64,${svgBase64}) - https://marella.github.io/material-symbols/demo/#${iconName}
 *
 * @param {Object} props - Material Symbols props and any valid SVG attribute
 * @returns {JSX.Element} JSX Element
 */
const ${componentName} = createMaterialIcon("${iconName}", __iconData);

export { __iconData, ${componentName} as default };
`;
    
    const iconFilePath = path.join(iconOutputDir, `${fileName}.ts`);
    fs.writeFileSync(iconFilePath, iconTsContent);
    
    iconNames.push(componentName);
    iconFileMapping.set(componentName, fileName); // Store the mapping
    processedCount++;
  }
  
  // Generate index.ts file for this directory (Lucide-style)
  const indexContent = iconNames.map(componentName => {
    const fileName = iconFileMapping.get(componentName);
    return `export { default as ${componentName} } from './${fileName}';`;
  }).join('\n');
  
  const indexFileContent = `// Auto-generated index file for ${style} icons (weight ${weight})
// This file exports all icons in this directory for convenient importing
// Usage: import { Home, Settings } from 'material-symbols-react/${style}/w${weight}'

${indexContent}
`;
  
  const indexFilePath = path.join(iconOutputDir, 'index.ts');
  fs.writeFileSync(indexFilePath, indexFileContent);
  
  console.log(`   ✅ Processed ${processedCount} ${style} icons (weight ${weight})`);
  console.log(`   📁 Generated index.ts with ${iconNames.length} exports`);
  return { iconNames, rawIconNames, rawToComponentMapping, pathData, processedCount };
}

/**
 * Generate lightweight metadata index (Lucide approach)
 */
function generateIconIndex(allIconMetadata) {
  console.log('\n📝 Generating lightweight icon index...');
  
  // Create metadata directory
  const metadataDir = path.join(OUTPUT_DIR, 'metadata');
  if (!fs.existsSync(metadataDir)) {
    fs.mkdirSync(metadataDir, { recursive: true });
  }
  
  // Load category information from current_versions.json
  let categoryData = {};
  try {
    const categoryPath = path.join(__dirname, '../data/current_versions.json');
    if (fs.existsSync(categoryPath)) {
      categoryData = JSON.parse(fs.readFileSync(categoryPath, 'utf8'));
      console.log(`   📂 Loaded category data from: data/current_versions.json`);
    } else {
      console.log('   ⚠️ No category data found, icons will be marked as "uncategorized"');
    }
  } catch (error) {
    console.warn('⚠️ Could not load category data:', error.message);
  }
  
  // Helper function to get category for an icon
  function getIconCategory(iconName) {
    // Handle -fill variants by checking the base icon name
    let baseIconName = iconName;
    if (iconName.endsWith('-fill')) {
      baseIconName = iconName.replace('-fill', '');
    }
    
    // Look for category::icon_name pattern in categoryData
    for (const key in categoryData) {
      if (key.includes('::')) {
        const [category, name] = key.split('::');
        // Check both original name and base name (without -fill)
        if (name === iconName || name.replace(/_/g, '-') === iconName ||
            name === baseIconName || name.replace(/_/g, '-') === baseIconName) {
          return category;
        }
      }
    }
    return 'uncategorized';
  }
  
  // Generate icon index with available styles and weights
  const iconIndex = {};
  const rawIconNames = new Set(); // Track raw icon names without conversion
  const rawToComponentMapping = new Map(); // Collect all mappings
  
  // First pass: collect all raw to component mappings
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const mapping = allIconMetadata[style]?.[weight]?.rawToComponentMapping;
      if (mapping) {
        for (const [rawName, componentName] of mapping) {
          rawToComponentMapping.set(rawName, componentName);
        }
      }
    }
  }
  
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const rawNames = allIconMetadata[style]?.[weight]?.rawIconNames || [];
      
      // Add raw icon names to the set
      rawNames.forEach(rawName => rawIconNames.add(rawName));
      
      for (const rawIconName of rawNames) {
        // Skip -fill variants for icon-index.json
        if (rawIconName.endsWith('-fill')) {
          continue;
        }
        
        const componentName = rawToComponentMapping.get(rawIconName);
        
        if (!iconIndex[rawIconName]) {
          iconIndex[rawIconName] = {
            name: rawIconName,          // 元のアイコン名
            iconName: componentName,    // Reactコンポーネント名
            category: getIconCategory(rawIconName), // カテゴリ情報
            styles: [],
            weights: {}
          };
        }
        
        if (!iconIndex[rawIconName].styles.includes(style)) {
          iconIndex[rawIconName].styles.push(style);
        }
        
        if (!iconIndex[rawIconName].weights[style]) {
          iconIndex[rawIconName].weights[style] = [];
        }
        
        iconIndex[rawIconName].weights[style].push(weight);
      }
    }
  }
  
  // Write icon index
  const indexPath = path.join(metadataDir, 'icon-index.json');
  fs.writeFileSync(indexPath, JSON.stringify(iconIndex, null, 2));
  console.log(`   ✅ Generated metadata/icon-index.json`);
  
  // Generate icon names list (already excludes fill variants from iconIndex)
  const allIconNames = Object.keys(iconIndex).sort();
  const namesPath = path.join(metadataDir, 'icon-names.json');
  fs.writeFileSync(namesPath, JSON.stringify(allIconNames, null, 2));
  console.log(`   ✅ Generated metadata/icon-names.json (${allIconNames.length} icon names excluding fill variants)`);
  
  // Generate component names list (including Fill variants)
  const componentNames = [];
  
  // Add component names from iconIndex (non-fill variants)
  for (const iconData of Object.values(iconIndex)) {
    if (iconData.iconName && !componentNames.includes(iconData.iconName)) {
      componentNames.push(iconData.iconName);
    }
  }
  
  // Add Fill variant component names from rawToComponentMapping
  for (const [rawName, componentName] of rawToComponentMapping) {
    if (rawName.endsWith('-fill') && !componentNames.includes(componentName)) {
      componentNames.push(componentName);
    }
  }
  
  const sortedComponentNames = componentNames.sort();
  const componentNamesPath = path.join(metadataDir, 'component-names.json');
  fs.writeFileSync(componentNamesPath, JSON.stringify(sortedComponentNames, null, 2));
  console.log(`   ✅ Generated metadata/component-names.json (${sortedComponentNames.length} component names including Fill variants)`);
  
  return iconIndex;
}

/**
 * Generate individual icon path data JSON files
 */
function generateIconPathData(allIconMetadata) {
  console.log('\n📁 Generating individual icon path data files...');
  
  // Create paths directory
  const pathsDir = path.join(OUTPUT_DIR, 'metadata', 'paths');
  if (!fs.existsSync(pathsDir)) {
    fs.mkdirSync(pathsDir, { recursive: true });
  }
  
  // Collect all path data by icon name
  const iconPathData = {};
  
  for (const style of STYLES) {
    for (const weight of WEIGHTS) {
      const pathData = allIconMetadata[style]?.[weight]?.pathData || {};
      
      for (const [iconName, pathValue] of Object.entries(pathData)) {
        // Determine if this is a fill or outline variant
        const isFill = iconName.endsWith('-fill');
        const baseIconName = isFill ? iconName.replace('-fill', '') : iconName;
        const variant = isFill ? 'fill' : 'outline';
        
        // Initialize structure if needed
        if (!iconPathData[baseIconName]) {
          iconPathData[baseIconName] = {};
        }
        if (!iconPathData[baseIconName][style]) {
          iconPathData[baseIconName][style] = {};
        }
        if (!iconPathData[baseIconName][style][variant]) {
          iconPathData[baseIconName][style][variant] = {};
        }
        
        // Store path data
        iconPathData[baseIconName][style][variant][`w${weight}`] = pathValue;
      }
    }
  }
  
  // Write individual JSON files for each icon
  let fileCount = 0;
  for (const [iconName, data] of Object.entries(iconPathData)) {
    const filePath = path.join(pathsDir, `${iconName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    fileCount++;
  }
  
  console.log(`   ✅ Generated ${fileCount} individual path data files in metadata/paths/`);
  return iconPathData;
}




/**
 * Clean up old data files
 */
function cleanupOldFiles() {
  console.log('\n🧹 Cleaning up old data files...');
  
  const dataDir = path.join(OUTPUT_DIR, 'data');
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
    console.log(`   ✅ Removed old data directory`);
  }
  
  // Remove old icons directory
  const iconsDir = path.join(OUTPUT_DIR, 'icons');
  if (fs.existsSync(iconsDir)) {
    fs.rmSync(iconsDir, { recursive: true, force: true });
    console.log(`   ✅ Removed old icons directory`);
  }
  
  // Remove old style-specific directories (weight directories inside them)
  for (const style of STYLES) {
    const styleDir = path.join(OUTPUT_DIR, style);
    if (fs.existsSync(styleDir)) {
      // Remove only weight directories, not the main style directory
      const items = fs.readdirSync(styleDir);
      for (const item of items) {
        if (item.startsWith('w') && /w\d+/.test(item)) {
          const weightDir = path.join(styleDir, item);
          fs.rmSync(weightDir, { recursive: true, force: true });
          console.log(`   ✅ Removed old ${style}/${item} directory`);
        }
      }
    }
  }
}

/**
 * Main execution (Lucide approach)
 */
async function main() {
  console.log('🚀 Starting Material Symbols icon generation (Lucide-style)...\n');
  
  try {
    // 開発アイコンリストをロード
    if (IS_DEVELOPMENT) {
      await loadDevIcons();
    }
    
    // Clean up old files first
    cleanupOldFiles();
    
    const allIconMetadata = {};
    
    // Process each style and weight combination
    for (const style of STYLES) {
      allIconMetadata[style] = {};
      
      for (const weight of WEIGHTS) {
        const result = await processStyleWeightLucide(style, weight);
        allIconMetadata[style][weight] = result;
      }
    }
    
    // Generate lightweight metadata
    const iconIndex = generateIconIndex(allIconMetadata);
    
    // Generate individual icon path data JSON files
    generateIconPathData(allIconMetadata);
    
    // Summary
    const totalIcons = Object.keys(iconIndex).length;
    const totalFiles = totalIcons * STYLES.length * WEIGHTS.length;
    
    console.log(`\n🎉 Successfully generated icon data (Lucide-style)!`);
    console.log(`   📊 Summary:`);
    console.log(`      Unique icons: ${totalIcons}`);
    console.log(`      Individual files: ${totalFiles}`);
    console.log(`      Memory approach: On-demand loading`);
    console.log(`      Bundle size: Minimal (tree-shakable)`);
    console.log(`      Build memory: ~99% reduction vs previous approach`);
    
  } catch (error) {
    console.error('❌ Error generating icon data:', error);
    process.exit(1);
  }
}

// Run the script
main();