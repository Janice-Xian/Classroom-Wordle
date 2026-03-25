import React from 'react';

export default function GameHeader({
  currentWordIndex,
  totalWords,
  wordStatus,
  isHintRevealed,
  currentWord,
  bankName,
  onToggleHint,
  onGoHome,
}) {
  const hasHint = currentWord?.hint && currentWord.hint.trim().length > 0;

  return (
    <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2 shadow-sm">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {/* Home button */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
          title="返回首页"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="hidden sm:inline">首页</span>
        </button>

        {/* Center: progress */}
        <div className="text-center">
          <div className="font-bold text-gray-800 text-base">
            第 {currentWordIndex} / {totalWords || 5} 词
          </div>
          {bankName && (
            <div className="text-xs text-gray-400 truncate max-w-[140px]">{bankName}</div>
          )}
        </div>

        {/* Hint button */}
        <button
          onClick={onToggleHint}
          className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg transition-colors ${
            hasHint
              ? isHintRevealed
                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                : 'text-blue-500 bg-blue-50 hover:bg-blue-100'
              : 'text-gray-300 cursor-default'
          }`}
          disabled={!hasHint}
          title={hasHint ? (isHintRevealed ? '隐藏提示' : '显示提示') : '无提示'}
        >
          <span>💡</span>
          <span className="hidden sm:inline">{isHintRevealed ? '隐藏提示' : '显示提示'}</span>
        </button>
      </div>
    </div>
  );
}
