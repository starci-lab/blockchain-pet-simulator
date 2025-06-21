# Pet Rising Game

A interactive React component featuring an intelligent pet with multiple activities using Phaser.js. The pet can walk, sleep, play, and chew with both automatic and user-controlled behaviors.

## Installation

```bash
npm install pet-rising-game
```

## Usage

### Basic Usage

```tsx
import React from 'react'
import PhaserPetGame from 'pet-rising-game'

function App() {
  return (
    <div>
      <h1>My Pet App</h1>
      {/* The pet will appear with automatic behavior */}
      <PhaserPetGame />
    </div>
  )
}

export default App
```

### Interactive Pet Control

```tsx
import React, { useState } from 'react'
import PhaserPetGame from 'pet-rising-game'

function App() {
  const [speed, setSpeed] = useState(50)
  const [activity, setActivity] = useState('walk')

  const handleActivityChange = (newActivity: string) => {
    setActivity(newActivity)
  }

  return (
    <div>
      <h1>Interactive Pet Game</h1>

      {/* Speed Control */}
      <div>
        <label>Speed: {speed}</label>
        <input
          type='range'
          min='25'
          max='200'
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </div>

      {/* Activity Control */}
      <div>
        <button onClick={() => handleActivityChange('walk')}>Walk</button>
        <button onClick={() => handleActivityChange('sleep')}>Sleep</button>
        <button onClick={() => handleActivityChange('idleplay')}>Play</button>
        <button onClick={() => handleActivityChange('chew')}>Chew</button>
      </div>

      <PhaserPetGame
        speed={speed}
        activity={activity}
        onActivityChange={handleActivityChange}
      />
    </div>
  )
}

export default App
```

### Automatic Pet Behavior

```tsx
import React from 'react'
import PhaserPetGame from 'pet-rising-game'

function App() {
  return (
    <div>
      <h1>Autonomous Pet</h1>
      {/* Pet will automatically walk, stop at edges, and perform random activities */}
      <PhaserPetGame speed={75} />
    </div>
  )
}

export default App
```

## Props

| Prop               | Type                                        | Default | Description                                                 |
| ------------------ | ------------------------------------------- | ------- | ----------------------------------------------------------- |
| `speed`            | `number`                                    | `50`    | Walking speed of the pet (25-200 pixels per second)         |
| `activity`         | `'walk' \| 'sleep' \| 'idleplay' \| 'chew'` | -       | Current activity (when provided, enables user control mode) |
| `onActivityChange` | `(activity: string) => void`                | -       | Callback when activity changes                              |

## Features

### Automatic Behavior

- **Smart Walking**: Pet walks back and forth across the screen
- **Edge Detection**: Automatically turns around when reaching screen edges
- **Random Activities**: Stops randomly every 10-15 seconds to perform activities
- **Activity Variety**: Randomly chooses between sleeping, playing, and chewing

### User Control

- **Manual Control**: Override automatic behavior by setting activity prop
- **Real-time Updates**: Change pet behavior instantly
- **Speed Adjustment**: Modify walking speed dynamically
- **Activity States**: Control when pet walks, sleeps, plays, or chews

### Technical Features

- **Responsive Design**: Adapts to window resizing
- **Smooth Animation**: 60 FPS sprite-based animations
- **TypeScript Support**: Full type definitions included
- **Performance Optimized**: Efficient animation system
- **Dual Animation Sets**: Different loops for user vs automatic control

## Activity Types

### Walk

- Pet moves horizontally across the screen
- Automatically flips direction at screen edges
- Default automatic behavior

### Sleep

- Pet performs sleeping animation
- **Auto mode**: Plays 2 cycles then returns to walking
- **User mode**: Loops continuously until changed

### Play (IdlePlay)

- Pet performs playful animation with 15 frames
- **Auto mode**: Plays 2 cycles then returns to walking
- **User mode**: Loops continuously until changed

### Chew

- Pet performs chewing animation
- **Auto mode**: Plays 2 cycles then returns to walking
- **User mode**: Loops continuously until changed

## Examples

### Slow Pet

```tsx
<PhaserPetGame speed={25} />
```

### Fast Pet

```tsx
<PhaserPetGame speed={150} />
```

### Controlled Sleep

```tsx
<PhaserPetGame activity='sleep' />
```

### Speed & Activity Control

```tsx
const [config, setConfig] = useState({ speed: 50, activity: 'walk' })

return (
  <div>
    <select
      value={config.activity}
      onChange={(e) => setConfig({ ...config, activity: e.target.value })}
    >
      <option value='walk'>Walk</option>
      <option value='sleep'>Sleep</option>
      <option value='idleplay'>Play</option>
      <option value='chew'>Chew</option>
    </select>

    <PhaserPetGame
      speed={config.speed}
      activity={config.activity}
      onActivityChange={(activity) => setConfig({ ...config, activity })}
    />
  </div>
)
```

## Technical Details

### Animation System

- **Frame Rate**: 60 FPS smooth animation
- **Sprite Assets**: High-quality pixel art animations
- **Animation Types**:
  - Walk: 8 frames, loops infinitely
  - Sleep: 6 frames, 2 cycles in auto mode / infinite in user mode
  - Play: 15 frames, 2 cycles in auto mode / infinite in user mode
  - Chew: 6 frames, 2 cycles in auto mode / infinite in user mode

### Behavioral Logic

- **Auto Mode**: Pet walks autonomously with random stops every 10-15 seconds
- **User Mode**: Manual control overrides automatic behavior
- **Edge Detection**: Smart collision detection at screen boundaries
- **Direction Flipping**: Automatic sprite flipping when changing direction

### Performance

- **Optimized Rendering**: Efficient sprite batching
- **Memory Management**: Proper cleanup of animations and timers
- **Responsive Design**: Adapts to different screen sizes
- **Low CPU Usage**: Optimized game loop

## TypeScript Support

This package includes full TypeScript declarations:

```tsx
interface PhaserPetGameProps {
  speed?: number
  activity?: 'walk' | 'sleep' | 'idleplay' | 'chew'
  onActivityChange?: (activity: string) => void
}
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

```json
{
  "react": "^19.0.0",
  "phaser": "^3.90.0"
}
```

## Advanced Usage

### Multiple Pets

```tsx
function MultiPetApp() {
  return (
    <div>
      <PhaserPetGame speed={50} />
      <PhaserPetGame speed={75} />
      <PhaserPetGame speed={100} />
    </div>
  )
}
```

### Pet Dashboard

```tsx
function PetDashboard() {
  const [pets, setPets] = useState([
    { id: 1, speed: 50, activity: 'walk' },
    { id: 2, speed: 75, activity: 'sleep' },
    { id: 3, speed: 100, activity: 'play' }
  ])

  const updatePet = (id: number, updates: Partial<Pet>) => {
    setPets((prev) =>
      prev.map((pet) => (pet.id === id ? { ...pet, ...updates } : pet))
    )
  }

  return (
    <div>
      {pets.map((pet) => (
        <div key={pet.id}>
          <PhaserPetGame
            speed={pet.speed}
            activity={pet.activity}
            onActivityChange={(activity) => updatePet(pet.id, { activity })}
          />
          <div>
            <button onClick={() => updatePet(pet.id, { activity: 'walk' })}>
              Walk
            </button>
            <button onClick={() => updatePet(pet.id, { activity: 'sleep' })}>
              Sleep
            </button>
            <button onClick={() => updatePet(pet.id, { activity: 'idleplay' })}>
              Play
            </button>
            <button onClick={() => updatePet(pet.id, { activity: 'chew' })}>
              Chew
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## Troubleshooting

### Common Issues

**Pet not appearing**

- Ensure the parent container has sufficient height
- Check browser console for any JavaScript errors

**Animation stuttering**

- Verify system performance and browser compatibility
- Check if other heavy processes are running

**Controls not responding**

- Ensure props are passed correctly
- Check React state updates

### Debug Mode

```tsx
// Enable debug logging
<PhaserPetGame
  speed={50}
  activity='walk'
  onActivityChange={(activity) => console.log('Activity changed:', activity)}
/>
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/your-repo/pet-rising-game
cd pet-rising-game
npm install
npm run dev
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0

- Initial release with basic walking animation
- Speed control functionality

### v2.0.0

- Added multiple activity types (sleep, play, chew)
- Implemented dual animation system
- Added user control mode
- Enhanced automatic behavior with random stops

## Support

- 📧 Email: support@pet-rising-game.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/pet-rising-game/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-repo/pet-rising-game/discussions)

## Demo

🎮 [Live Demo](https://pet-rising-game-demo.netlify.app)
