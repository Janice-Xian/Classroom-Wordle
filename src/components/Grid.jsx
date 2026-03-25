import React from 'react';

const COLORS = {
  green: { bg: '#6aaa64', text: 'white', border: '#6aaa64' },
  yellow: { bg: '#c9b458', text: 'white', border: '#c9b458' },
  gray: { bg: '#787c7e', text: 'white', border: '#787c7e' },
};

function Cell({ letter, color, isRevealing, colIndex }) {
  // Style based on color
  const style = color && COLORS[color]
    ? { backgroundColor: COLORS[color].bg, color: COLORS[color].text, borderColor: COLORS[color].border }
    : letter
    ? { backgroundColor: 'white', color: '#333', borderColor: '#999' }
    : { backgroundColor: 'white', color: '#333', borderColor: '#d3d6da' };

  // Flip animation applied per-cell during reveal
  const animClass = isRevealing ? 'animate-flip' : '';
  const animStyle = isRevealing
    ? { animationDelay: `${colIndex * 300}ms`, ...style }
    : style;

  return (
    <div
      className={`aspect-square flex items-center justify-center text-2xl font-bold border-2 uppercase select-none min-w-[32px] md:min-w-[48px] ${animClass}`}
      style={animStyle}
    >
      {letter || ''}
    </div>
  );
}

export default function Grid({
  word,
  guesses,
  currentGuess,
  maxGuesses,
  revealingRow,
  cellColors,
  shakingRow,
}) {
  const wordLength = word ? word.length : 5;
  const rows = [];

  for (let rowIdx = 0; rowIdx < maxGuesses; rowIdx++) {
    const isSubmitted = rowIdx < guesses.length;
    const isCurrent = rowIdx === guesses.length && revealingRow !== rowIdx;
    const isShaking = shakingRow === rowIdx;
    const isRevealing = revealingRow === rowIdx;

    const cells = [];
    for (let colIdx = 0; colIdx < wordLength; colIdx++) {
      let letter = '';
      let color = null;

      if (isSubmitted) {
        const g = guesses[rowIdx];
        letter = g.guess[colIdx] || '';
        // Prefer cellColors (set during reveal animation), then guess colors
        const ck = `${rowIdx}-${colIdx}`;
        const cellColor = cellColors && cellColors[ck];
        const guessColor = g.colors && g.colors[colIdx];
        // cellColor takes priority (it's set mid-animation)
        // guessColor is the final answer
        color = cellColor || guessColor || null;
      } else if (isCurrent) {
        letter = currentGuess[colIdx] || '';
      }

      cells.push(
        <Cell
          key={colIdx}
          letter={letter}
          color={color}
          isRevealing={isRevealing && isSubmitted}
          colIndex={colIdx}
        />
      );
    }

    rows.push(
      <div
        key={rowIdx}
        className={`grid gap-1 ${isShaking ? 'animate-shake' : ''}`}
        style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}
      >
        {cells}
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 flex items-center justify-center py-2 px-2">
      <div className="w-full max-w-sm mx-auto px-2">
        <div className="space-y-1">
          {rows}
        </div>
      </div>
    </div>
  );
}
