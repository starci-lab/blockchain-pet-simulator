# Phaser Dog Game

A simple React component featuring a walking dog animation using Phaser.js. Perfect for adding a playful touch to your web applications.

## Installation

```bash
npm install phaser-dog-game-hyunn
```

## Usage

### Basic Usage

```tsx
import React from 'react'
import PhaserDogGame from 'phaser-dog-game-hyunn'

function App() {
  return (
    <div>
      <h1>My App</h1>
      {/* The dog will appear at the bottom of the screen with default speed */}
      <PhaserDogGame />
    </div>
  )
}

export default App
```

### Custom Speed

```tsx
import React from 'react'
import PhaserDogGame from 'phaser-dog-game-hyunn'

function App() {
  return (
    <div>
      <h1>My App with Different Dog Speeds</h1>

      {/* Slow dog */}
      <PhaserDogGame speed={100} />

      {/* Normal speed (default) */}
      <PhaserDogGame speed={200} />

      {/* Fast dog */}
      <PhaserDogGame speed={400} />
    </div>
  )
}

export default App
```

## Props

| Prop    | Type     | Default | Description                                       |
| ------- | -------- | ------- | ------------------------------------------------- |
| `speed` | `number` | `200`   | The walking speed of the dog in pixels per second |

## Features

- Animated dog that walks back and forth across the screen
- Fixed position at the bottom of the viewport
- Responsive design that adapts to window resizing
- Customizable walking speed
- Built with React and Phaser.js
- Full TypeScript support

## Examples

### Slow Walking Dog

```tsx
<PhaserDogGame speed={50} />
```

### Fast Running Dog

```tsx
<PhaserDogGame speed={500} />
```

### Multiple Dogs with Different Speeds

```tsx
<div>
  <PhaserDogGame speed={100} />
  <PhaserDogGame speed={300} />
</div>
```

## Dependencies

- React 19+
- Phaser 3.90+

## TypeScript Support

This package includes TypeScript declarations. The component props are fully typed:

```tsx
interface PhaserDogGameProps {
  speed?: number
}
```

## License

MIT
