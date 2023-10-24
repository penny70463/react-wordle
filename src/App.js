import './App.css';
import { useState, useEffect } from 'react'

const WORD_LENGTH = 5
const WORDS = Object.freeze([
  'PLANT',
  'TRAIN',
  'SWING',
  'CRAZY',
  'LOVER',
  'JUMPS',
  'RACER',
  'TABLE',
  'SLEEP',
  'DOZER',
])

// LETTERSTATES: ['indeterminate', 'correct', 'present', 'absent']

const KEYBOARD_LAYOUT = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace'],
]

function generateRandomly() {
  let random = Math.floor(Math.random() * WORDS.length);
  return WORDS[random]
}

function App() {
  return (
    <div className="App">
      <div className="App-content">
        <Wordle triesCount={6}/>
      </div>
    </div>
  );
}

function Wordle({triesCount}) {
  let [position, setPosition] = useState([0, 0])
  let [triesRecord, setTriesRecord] = useState(() => generateRecord())
  let [gameState, setgameState] = useState('IN_PROGRESS')
  let [answer, setAnswer] = useState(generateRandomly())
  let [keyboardStatus, setKeyboardStatus] = useState({})

  useEffect(() => {
    document.addEventListener("keydown", onPressKeyDown)
    
    return (() => {
      document.removeEventListener("keydown", onPressKeyDown)
    })
  })

  function generateRecord() {
    return new Array(triesCount).fill([]).map(() => new Array(WORD_LENGTH).fill({val: '', state: 'indeterminate'})) 
  }

  // Handling key press events
  function onPressKeyDown(e) {
    let regex = /[a-zA-Z]/
    if((regex.test(e.key) && e.key.length === 1) || ['Backspace', 'Enter'].includes(e.key)) {
      onkeyDown(e.key)
    } else {
      return
    }
  }
  
  function reset() {
    setAnswer(generateRandomly())
    setgameState('IN_PROGRESS')
    setTriesRecord(generateRecord())
    setPosition([0, 0])
    setKeyboardStatus({})
  }

  function onkeyDown(val) {
    if(gameState === 'SUCCESS' || gameState === 'FAIL') return
    
    switch(val) {
      case 'Backspace':
        deleteLetter()
        break
        
      case 'Enter':
        rowValidation()
        break;
      
      default:
        addLetter(val)
    }
  }

  function addLetter(val) {
    const [row, col] = position
    if(gameState === 'PENDING' || col === WORD_LENGTH) return
    let newTriesRecord = [...triesRecord]
    newTriesRecord[row][col] = {...triesRecord[row][col], val: val.toUpperCase() }
    setTriesRecord(newTriesRecord)
    setPosition([row, col + 1])
    if(col + 1 === WORD_LENGTH) setgameState('PENDING') 
  }

  function deleteLetter() {
    if(gameState === 'PENDING') {
      setgameState('IN_PROGRESS')
    }
    const [row, col] = position
    if(col === 0) return
    setPosition([row, col - 1])
    let newTriesRecord = [...triesRecord]
    newTriesRecord[row][col - 1] = {...triesRecord[row][col - 1], val: '' }
    setTriesRecord(newTriesRecord)
    
  }

  // Handling row validation, updating keyboard status, and game state
  function rowValidation() {
    if(gameState!=='PENDING') return
    const row = position[0]
    let newTriesRecord = [...triesRecord]
    let updateKeyboardStatus = {}
    let validationRow = newTriesRecord[row].map(({val}, i) => {
      let state = ''
      if(val === answer[i]) state = 'correct'
      else if(answer.includes(val)) state = 'present'
      else state = 'absent'
      updateKeyboardStatus[val] = state
      return {val, state}
    })

    // Updating keyboard status and row record
    setKeyboardStatus({...keyboardStatus, ...updateKeyboardStatus})
    newTriesRecord[row] = validationRow
    setTriesRecord(newTriesRecord)
    let result = validationRow.every(item => item.state === 'correct') ? 'SUCCESS' : (row === triesCount - 1 ? 'FAIL' : 'IN_PROGRESS')
    
    // Updating the game state
    setgameState(result)
    if(row !== triesCount - 1) {

      // Moving to the next row
      setPosition([row + 1, 0])
    }
    
  }

  return (
    <>
      <h1>Wordle</h1>
      {['SUCCESS', 'FAIL'].includes(gameState) 
        && <GameResult 
              result={gameState}
              answer={answer} 
              onResetClick={() =>reset()}/>}
      <div className='rows'>
        {triesRecord.map((letters, row) => (
        <div
          className="letter-grid" 
          style={{ gridTemplateColumns:`repeat(${letters.length}, --size)` }}
          key={`row-${row}`}
          >
              {letters.map(({val, state}, i) => (
              <div className={`grid ${state}`} key={`grid-${i}`}>{val}</div>
              ))}
        </div>
          ))}
      </div>
      <Keyboard onkeyDown={onkeyDown} keyboardStatus={keyboardStatus}/>
    </>
  )
}

function Keyboard({onkeyDown, keyboardStatus}) {
  return (
    <div 
      className="keyboard-wrap"
      style={{ gridTemplateRows: `repeat(${KEYBOARD_LAYOUT.length}, 1fr)` }}>
        {KEYBOARD_LAYOUT.map((row, i) =>(
          <div 
            className="keyboard-row" 
            key={`keyrow-${i}`}>{
            row.map((char) => (
              <button 
                className={`keycap ${keyboardStatus[char] || ''}`}
                key={char}
                value={char}
                onClick={(e) => onkeyDown(e.target.value)}>{char}</button>
            ))
          }</div>
        ))}
    </div>
  )
}

function GameResult({result, answer, onResetClick}) {
  return(
    <>
      <strong>
        {result === 'SUCCESS' && <div>'Congratulations 🎉'</div>}
        {result === 'FAIL' && <div>WORD: {answer}</div>}
      </strong>
      <button onClick={onResetClick}>reset</button>
    </>
  )
}

export default App;
