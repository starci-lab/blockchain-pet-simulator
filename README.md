# Pet Rising Game

A simple React component featuring a walking pet animation using Phaser.js. Perfect for adding a playful touch to your web applications.

## Installation

```bash
npm install pet-rising-game
```

## Usage

### Basic Usage

```tsx
import React from 'react'
import PhaserDogGame from 'pet-rising-game'

function App() {
  return (
    <div>
      <h1>My App</h1>
      {/* The pet will appear at the bottom of the screen with default speed */}
      <PhaserDogGame />
    </div>
  )
}

export default App
```

### Interactive Speed Control

```tsx
import React, { useState } from 'react'
import PhaserDogGame from 'pet-rising-game'

function App() {
  const [speed, setSpeed] = useState(50)

  const increaseSpeed = () => setSpeed((prev) => Math.min(prev + 25, 300))
  const decreaseSpeed = () => setSpeed((prev) => Math.max(prev - 25, 25))

  return (
    <div>
      <h1>Interactive Pet Game</h1>
      <div>
        <button onClick={decreaseSpeed}>Speed -</button>
        <span>Speed: {speed}</span>
        <button onClick={increaseSpeed}>Speed +</button>
      </div>
      <PhaserDogGame speed={speed} />
    </div>
  )
}

export default App
```

### Custom Speed

```tsx
import React from 'react'
import PhaserDogGame from 'pet-rising-game'

function App() {
  return (
    <div>
      <h1>My App with Different Pet Speeds</h1>

      {/* Slow pet */}
      <PhaserDogGame speed={25} />

      {/* Normal speed (default) */}
      <PhaserDogGame speed={50} />

      {/* Fast pet */}
      <PhaserDogGame speed={100} />
    </div>
  )
}

export default App
```

## Props

| Prop    | Type     | Default | Description                                       |
| ------- | -------- | ------- | ------------------------------------------------- |
| `speed` | `number` | `50`    | The walking speed of the pet in pixels per second |

## Features

- Animated pet that walks back and forth across the screen
- Fixed position at the bottom of the viewport
- Responsive design that adapts to window resizing
- Customizable walking speed
- Real-time speed adjustment
- Built with React and Phaser.js
- Full TypeScript support
- Sprite-based animation with smooth movement

## Examples

### Slow Walking Pet

```tsx
<PhaserDogGame speed={25} />
```

### Fast Running Pet

```tsx
<PhaserDogGame speed={150} />
```

### Speed Control Demo

```tsx
const [speed, setSpeed] = useState(50)

return (
  <div>
    <input
      type='range'
      min='25'
      max='200'
      value={speed}
      onChange={(e) => setSpeed(Number(e.target.value))}
    />
    <PhaserDogGame speed={speed} />
  </div>
)
```

## Technical Details

- **Framework**: React 19+
- **Game Engine**: Phaser 3.90+
- **Animation**: Sprite-based with 6 frames
- **Performance**: 60 FPS smooth animation
- **Assets**: Included in package

## Demo

You can see a live demo at: [GitHub Repository](https://github.com/starci-lab/blockchain-pet-simulator)

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
