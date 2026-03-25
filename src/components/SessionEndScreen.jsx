import React from 'react';

export default function SessionEndScreen({ onNewSession, onGoHome }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-100">
      <div className="text-center p-8 max-w-sm">
        {/* Celebration */}
        <div className="text-6xl mb-4">🎊</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">太棒了！</h2>
        <p className="text-gray-600 text-lg mb-8">
          完成了本轮全部 <span className="font-bold text-orange-500">5</span> 个单词！
        </p>

        {/* Confetti dots */}
        <div className="flex justify-center gap-2 mb-8">
          {['🟡', '🟢', '🔵', '🟠', '🔴'].map((dot, i) => (
            <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
              {dot}
            </span>
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={onNewSession}
            className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg hover:bg-orange-600 active:bg-orange-700 transition-colors shadow-lg"
          >
            再来一局 🎮
          </button>
          <button
            onClick={onGoHome}
            className="w-full py-3 border-2 border-gray-300 text-gray-600 rounded-2xl font-semibold hover:bg-white transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
