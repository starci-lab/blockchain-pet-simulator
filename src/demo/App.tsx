import PhaserPetGame from '../components/PhaserPetGame'
import './App.css'
import { useState } from 'react'

function App() {
  const [speed, setSpeed] = useState(50)

  const increaseSpeed = () => setSpeed((prev) => Math.min(prev + 25, 300))
  const decreaseSpeed = () => setSpeed((prev) => Math.max(prev - 25, 25))

  return (
    <>
      <h1>Phaser Game Demo</h1>
      <p>A simple walking pet animation</p>

      <div style={{ marginTop: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <button onClick={decreaseSpeed} style={{ marginRight: '10px' }}>
            Speed -
          </button>
          <span>Speed: {speed}</span>
          <button onClick={increaseSpeed} style={{ marginLeft: '10px' }}>
            Speed +
          </button>
        </div>
        <PhaserPetGame speed={speed} />
      </div>
    </>
  )
}

export default App
