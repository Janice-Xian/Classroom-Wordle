import React, { useRef } from 'react';

export default function ResultModal({ wordStatus, word, hint, onNext, nextEnabled }) {
  const clicked = useRef(false);

  const handleNext = () => {
    if (clicked.current || !nextEnabled) return;
    clicked.current = true;
    onNext();
    // Re-enable after a moment (component will likely unmount anyway)
    setTimeout(() => { clicked.current = false; }, 1000);
  };

  const isWon = wordStatus === 'WON';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-30">
      <div className="bg-white rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-xs text-center animate-bounce-in">
        {/* Status */}
        <div className={`text-2xl font-bold mb-2 ${isWon ? 'text-green-600' : 'text-red-500'}`}>
          {isWon ? '🎉 回答正确！' : '答案是：'}
        </div>

        {/* Show answer if lost */}
        {!isWon && (
          <div className="text-3xl font-bold text-gray-800 tracking-widest mb-2">
            {word}
          </div>
        )}

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!nextEnabled}
          className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
            nextEnabled
              ? isWon
                ? 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {nextEnabled ? '下一个 →' : '请稍候...'}
        </button>
      </div>
    </div>
  );
}
