import React from 'react';

export default function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">使用说明</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-sm text-gray-700">
          {/* Input Format */}
          <section>
            <h3 className="font-bold text-base text-gray-800 mb-2">📝 词库输入格式</h3>
            <p className="mb-2">每行一个单词，可选附加提示，用英文逗号分隔：</p>
            <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm">
              <div>APPLE,苹果</div>
              <div>BANANA,香蕉</div>
              <div>SCHOOL,学校</div>
              <div>TEACHER</div>
            </div>
            <p className="mt-2 text-gray-500 text-xs">支持英文逗号、中文逗号或Tab键分隔。无提示也可以。</p>
          </section>

          {/* Game Rules */}
          <section>
            <h3 className="font-bold text-base text-gray-800 mb-2">🎮 游戏规则</h3>
            <ul className="space-y-2">
              <li>• 每局有 5 个单词，逐一猜测</li>
              <li>• 每次输入与目标单词等长的英文单词作为猜测</li>
              <li>• 4-6字母单词：猜测次数 = 字母数+1次</li>
              <li>• 7-8字母单词：最多7次猜测</li>
            </ul>
          </section>

          {/* Color Meanings */}
          <section>
            <h3 className="font-bold text-base text-gray-800 mb-2">🎨 颜色含义</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#6aaa64' }}>A</div>
                <div>
                  <div className="font-semibold">绿色</div>
                  <div className="text-gray-500 text-xs">字母正确，位置正确</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#c9b458' }}>B</div>
                <div>
                  <div className="font-semibold">黄色</div>
                  <div className="text-gray-500 text-xs">字母在单词中，但位置不对</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#787c7e' }}>C</div>
                <div>
                  <div className="font-semibold">灰色</div>
                  <div className="text-gray-500 text-xs">字母不在单词中</div>
                </div>
              </div>
            </div>
          </section>

          {/* Hint Button */}
          <section>
            <h3 className="font-bold text-base text-gray-800 mb-2">💡 提示功能</h3>
            <p>点击顶部"显示提示"按钮（或按空格键）可以显示/隐藏单词提示。</p>
          </section>

          {/* Keyboard */}
          <section>
            <h3 className="font-bold text-base text-gray-800 mb-2">⌨️ 键盘输入</h3>
            <ul className="space-y-1">
              <li>• 点击屏幕上的虚拟键盘或使用物理键盘输入</li>
              <li>• <strong>Enter</strong>：提交猜测</li>
              <li>• <strong>Backspace/DEL</strong>：删除最后一个字母</li>
              <li>• <strong>空格键</strong>：切换提示显示</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            明白了！
          </button>
        </div>
      </div>
    </div>
  );
}
