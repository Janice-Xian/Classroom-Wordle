import React from 'react';
import WordBankSelector from './WordBankSelector';
import HelpModal from './HelpModal';

export default function WelcomeModal({
  banks,
  selectedBank,
  loadError,
  onSelectBank,
  onDeleteBank,
  onStart,
  onRetry,
}) {
  const [showSelector, setShowSelector] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);

  const handleSelectorConfirm = () => {
    setShowSelector(false);
  };

  const handleSelectorClose = () => {
    setShowSelector(false);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center">
          {/* Title */}
          <div className="mb-6">
            <div className="text-5xl mb-3">📚</div>
            <h1 className="text-2xl font-bold text-gray-800">欢迎来到 Classroom Wordle！</h1>
          </div>

          {/* Error state */}
          {loadError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-left">
              <p className="text-red-600 text-sm font-medium">词库加载失败，请检查网络后重试</p>
              <button
                onClick={onRetry}
                className="mt-2 text-sm text-red-500 underline hover:no-underline"
              >
                重新加载
              </button>
            </div>
          )}

          {/* Bank selector area */}
          {!loadError && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">当前词库</p>
              {banks.length === 0 ? (
                <div className="text-amber-600 text-sm bg-amber-50 rounded-xl p-3">
                  暂无词库，请先上传
                </div>
              ) : selectedBank ? (
                <div className="bg-blue-50 rounded-xl p-3 text-left">
                  <p className="font-semibold text-blue-800">{selectedBank.name}</p>
                  <p className="text-xs text-blue-500 mt-0.5">上传者：{selectedBank.uploader}</p>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">未选择词库</div>
              )}
              <button
                onClick={() => setShowSelector(true)}
                className="mt-2 text-sm text-blue-500 hover:text-blue-700 underline hover:no-underline"
              >
                切换词库
              </button>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onStart}
              disabled={!selectedBank || !!loadError}
              className="w-full py-3.5 bg-blue-500 text-white rounded-2xl font-bold text-lg hover:bg-blue-600 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              开始游戏
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className="w-full py-2.5 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              使用说明
            </button>
          </div>
        </div>
      </div>

      {/* Word Bank Selector Modal */}
      {showSelector && (
        <WordBankSelector
          banks={banks}
          selectedBank={selectedBank}
          onSelect={onSelectBank}
          onClose={handleSelectorClose}
          onConfirm={handleSelectorConfirm}
          onDelete={onDeleteBank}
        />
      )}

      {/* Help Modal */}
      {showHelp && (
        <HelpModal onClose={() => setShowHelp(false)} />
      )}
    </>
  );
}
