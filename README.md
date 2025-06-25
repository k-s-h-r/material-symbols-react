# Material Symbols React

Material Symbols as React components with TypeScript support.

## 🚀 Features

- 🎯 **TypeScript Support**: Full TypeScript definitions included
- 🌳 **Tree Shakable**: Import only the icons you need
- 🎨 **Customizable**: Size, color, fill, weight, and more
- 🔧 **Material Symbols**: Based on Google's Material Symbols
- ⚡ **Lightweight**: Optimized SVG components
- 🎭 **Three Styles**: Outlined, Rounded, and Sharp variants
- ⚖️ **Seven Weights**: 100, 200, 300, 400, 500, 600, 700 support
- 🚀 **React 19 Ready**: Full support for React 16.8+ through React 19
- 💾 **Memory Efficient**: Lucide-style on-demand loading (99% memory reduction)

## 📦 Installation

```bash
npm install material-symbols-react
# or
yarn add material-symbols-react
# or
pnpm add material-symbols-react
```

## 🎯 Usage

### Basic Usage

```tsx
import React from 'react';
import { Home, Search, Settings } from 'material-symbols-react';

function App() {
  return (
    <div>
      <Home />
      <Search size={32} />
      <Settings color="blue" />
    </div>
  );
}
```

### Filled Icons

Filled variants are available as separate imports with the `Fill` suffix:

```tsx
import React from 'react';
import { Home, HomeFill, Star, StarFill } from 'material-symbols-react';

function App() {
  return (
    <div>
      <Home />     {/* Unfilled (outline) */}
      <HomeFill /> {/* Filled */}
      <Star />     {/* Unfilled (outline) */}
      <StarFill /> {/* Filled */}
    </div>
  );
}
```

### Style-specific Imports

```tsx
import { Home } from 'material-symbols-react/outlined';
import { Home as HomeRounded } from 'material-symbols-react/rounded';
import { Home as HomeSharp } from 'material-symbols-react/sharp';

function App() {
  return (
    <div>
      <Home />           {/* Outlined style */}
      <HomeRounded />    {/* Rounded style */}
      <HomeSharp />      {/* Sharp style */}
    </div>
  );
}
```

### Weight-specific Imports

```tsx
// Import from weight-specific endpoints
import { Home, HomeFill } from 'material-symbols-react/w100';  // Weight 100
import { Home as Home400, HomeFill as HomeFill400 } from 'material-symbols-react/w400';  // Weight 400 (default)
import { Home as Home700, HomeFill as HomeFill700 } from 'material-symbols-react/w700';  // Weight 700

// Style + weight specific imports
import { Home as HomeRounded400, HomeFill as HomeFillRounded400 } from 'material-symbols-react/rounded/w400';
import { Home as HomeSharp700, HomeFill as HomeFillSharp700 } from 'material-symbols-react/sharp/w700';

function App() {
  return (
    <div>
      <Home />           {/* Weight 100, unfilled */}
      <HomeFill />       {/* Weight 100, filled */}
      <Home400 />        {/* Weight 400, unfilled */}
      <HomeFill400 />    {/* Weight 400, filled */}
      <Home700 />        {/* Weight 700, unfilled */}
      <HomeFill700 />    {/* Weight 700, filled */}
      <HomeRounded400 /> {/* Rounded style, weight 400, unfilled */}
      <HomeFillRounded400 /> {/* Rounded style, weight 400, filled */}
    </div>
  );
}
```

### Individual Icon Imports

```tsx
// Import individual icon files for maximum tree-shaking
import Home from 'material-symbols-react/icons/outlined/w400/home';
import HomeFill from 'material-symbols-react/icons/outlined/w400/home-fill';
import Search from 'material-symbols-react/icons/rounded/w500/search';
import SearchFill from 'material-symbols-react/icons/rounded/w500/search-fill';

function App() {
  return (
    <div>
      <Home size={24} />     {/* Unfilled home icon */}
      <HomeFill size={24} /> {/* Filled home icon */}
      <Search size={32} />   {/* Unfilled search icon */}
      <SearchFill size={32} /> {/* Filled search icon */}
    </div>
  );
}
```


## 🎨 Props

All icons accept the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| string` | `24` | Icon size in pixels |
| `color` | `string` | `undefined` | Icon color (CSS color value) |

Plus all standard SVG props (`onClick`, `onMouseOver`, etc.).

## 🎭 Icon Styles & Weights

Material Symbols React supports three visual styles:

- **Outlined** (default): Clean, minimal outlined icons
- **Rounded**: Friendly, rounded corner icons
- **Sharp**: Bold, sharp corner icons

And seven font weights:

- **100**: Thin
- **200**: Extra Light
- **300**: Light
- **400**: Regular (default)
- **500**: Medium
- **600**: Semi Bold
- **700**: Bold

## 📚 Examples

### Custom Styling

```tsx
import { Home } from 'material-symbols-react';

function CustomIcon() {
  return (
    <Home
      size={48}
      color="#1976d2"
      className="my-icon"
      style={{ margin: '8px' }}
    />
  );
}
```

### Responsive Icons

```tsx
import { Menu } from 'material-symbols-react';

function ResponsiveMenu() {
  return (
    <Menu
      size="clamp(20px, 5vw, 32px)"
      style={{
        color: 'var(--primary-color)',
      }}
    />
  );
}
```

## 🔧 Development

### Prerequisites

- Node.js 16+
- npm, yarn, or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/k-s-h-r/material-symbols-react.git
cd material-symbols-react

# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Scripts

- `npm run build` - Build the library
- `npm run dev` - Development mode with watch
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## 📄 License

Material Symbols are created by [Google](https://github.com/google/material-design-icons#license).

> We have made these icons available for you to incorporate into your products under the [Apache License Version 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt). Feel free to remix and re-share these icons and documentation in your products. We'd love attribution in your app's about screen, but it's not required.

## 🙏 Acknowledgments

- [Google Material Symbols](https://fonts.google.com/icons) for the icon designs
- [Lucide React](https://lucide.dev/) for inspiration on the API design

