import React from 'react';

export default function DeleteConfirmModal({ bankName, onConfirm, onCancel, isDeleting }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">删除词库</h3>
        <p className="text-gray-600 mb-6">
          确定删除词库 <span className="font-semibold text-gray-800">"{bankName}"</span>？
          <br />
          <span className="text-red-500 text-sm">此操作不可撤销。</span>
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? '删除中...' : '确定删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
