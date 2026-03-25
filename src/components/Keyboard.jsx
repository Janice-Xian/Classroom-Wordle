import React from 'react';

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'DEL'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER'],
];

const KEY_COLORS = {
  green: { bg: '#6aaa64', text: 'white' },
  yellow: { bg: '#c9b458', text: 'white' },
  gray: { bg: '#787c7e', text: 'white' },
};

function Key({ label, color, onKey, wide }) {
  const colorStyle = color && KEY_COLORS[color]
    ? { backgroundColor: KEY_COLORS[color].bg, color: KEY_COLORS[color].text }
    : { backgroundColor: '#d3d6da', color: '#111' };

  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault();
        onKey(label);
      }}
      style={colorStyle}
      className={`
        ${wide ? 'flex-[1.5]' : 'flex-1'}
        min-w-[30px] md:min-w-[40px]
        h-14 md:h-16
        font-bold rounded uppercase
        flex items-center justify-center
        text-xs md:text-sm
        select-none touch-none
        transition-opacity active:opacity-70
      `}
    >
      {label === 'DEL' ? '⌫' : label}
    </button>
  );
}

export default function Keyboard({ onKey, keyboardColors, disabled }) {
  return (
    <div
      className={`flex-shrink-0 px-1 pb-2 pt-1 ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <div className="max-w-lg mx-auto space-y-1">
        {ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1 justify-center">
            {row.map(key => (
              <Key
                key={key}
                label={key}
                color={keyboardColors[key] || null}
                onKey={onKey}
                wide={key === 'ENTER' || key === 'DEL'}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
