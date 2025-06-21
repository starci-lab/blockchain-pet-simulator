import { useState } from 'react'
import PhaserPetGame from '../components/PhaserPetGame'
import './App.css'

function App() {
  const [speed, setSpeed] = useState(50)
  const [activity, setActivity] = useState<
    'walking' | 'sleeping' | 'eating' | 'playing'
  >('walking')

  const increaseSpeed = () => setSpeed((prev) => Math.min(prev + 25, 300))
  const decreaseSpeed = () => setSpeed((prev) => Math.max(prev - 25, 25))

  return (
    <>
      <h1>Pet Rising Game Demo</h1>
      <p>A walking pet with different activities</p>

      <div style={{ marginTop: '20px' }}>
        {/* Speed Control */}
        <div style={{ marginBottom: '15px' }}>
          <button onClick={decreaseSpeed} style={{ marginRight: '10px' }}>
            Speed -
          </button>
          <span style={{ marginRight: '10px' }}>Speed: {speed}</span>
          <button onClick={increaseSpeed}>Speed +</button>
        </div>

        {/* Activity Control */}
        <div style={{ marginBottom: '15px' }}>
          <label>Activity: </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as any)}
            style={{ marginLeft: '10px' }}
          >
            <option value='walking'>Walking</option>
            <option value='sleeping'>Sleeping</option>
            <option value='eating'>Eating</option>
            <option value='playing'>Playing</option>
          </select>
        </div>

        {/* Activity Buttons */}
        <div style={{ marginBottom: '20px' }}>
          {['walking', 'sleeping', 'eating', 'playing'].map((act) => (
            <button
              key={act}
              onClick={() => setActivity(act as any)}
              style={{
                marginRight: '5px',
                backgroundColor: activity === act ? '#007bff' : '#f8f9fa',
                color: activity === act ? 'white' : 'black',
                border: '1px solid #ccc',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {act.charAt(0).toUpperCase() + act.slice(1)}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '14px', color: '#666' }}>
          Install: <code>npm install pet-rising-game</code>
        </p>

        <PhaserPetGame speed={speed} activity={'eating'} />
      </div>
    </>
  )
}

export default App
