import { useState } from 'react'
import './App.css'
import PhaserPetGame from '@/components/PhaserPetGame'

function App() {
  const [speed, setSpeed] = useState(50)
  const [activity, setActivity] = useState<
    'walk' | 'sleep' | 'idleplay' | 'chew'
  >('walk')

  const increaseSpeed = () => setSpeed((prev) => Math.min(prev + 25, 300))
  const decreaseSpeed = () => setSpeed((prev) => Math.max(prev - 25, 25))

  return (
    <>
      <h1>Pet Rising Game Demo</h1>
      <p>A pet with walking, sleeping, playing and chewing activities</p>

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
            <option value='walk'>Walk</option>
            <option value='sleep'>Sleep</option>
            <option value='idleplay'>Idle Play</option>
            <option value='chew'>Chew</option>
          </select>
        </div>{' '}
        {/* Activity Buttons */}
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setActivity('walk')}
            style={{
              marginRight: '10px',
              backgroundColor: '#28a745',
              color: 'white',
              border: '1px solid #28a745',
              padding: '5px 15px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔄 Auto Mode (Walk)
          </button>

          {[
            { key: 'sleep', label: '😴 Sleep' },
            { key: 'idleplay', label: '🎮 Idle Play' },
            { key: 'chew', label: '🦴 Chew' }
          ].map((act) => (
            <button
              key={act.key}
              onClick={() => setActivity(act.key as any)}
              style={{
                marginRight: '5px',
                backgroundColor: activity === act.key ? '#007bff' : '#f8f9fa',
                color: activity === act.key ? 'white' : 'black',
                border: '1px solid #ccc',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {act.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Install: <code>npm install pet-rising-game</code>
        </p>
        <PhaserPetGame publicKey='' speed={speed} activity={activity} />
      </div>
    </>
  )
}

export default App
