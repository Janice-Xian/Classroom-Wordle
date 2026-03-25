import React, { useState } from 'react';
import WordBankUploader from './WordBankUploader';
import DeleteConfirmModal from './DeleteConfirmModal';
import { supabase } from '../lib/supabase';

export default function WordBankSelector({ banks, selectedBank, onSelect, onClose, onConfirm, onDelete }) {
  const [showUploader, setShowUploader] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordCounts, setWordCounts] = useState({});
  const [loadedCounts, setLoadedCounts] = useState(new Set());

  // Load word count for a bank when selected
  const handleSelect = async (bank) => {
    onSelect(bank);
    if (!loadedCounts.has(bank.id)) {
      const { count } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('bank_id', bank.id);

      const { count: eligibleCount } = await supabase
        .from('words')
        .select('*', { count: 'exact', head: true })
        .eq('bank_id', bank.id)
        .gte('letter_count', 4)
        .lte('letter_count', 8);

      setWordCounts(prev => ({ ...prev, [bank.id]: { total: count || 0, eligible: eligibleCount || 0 } }));
      setLoadedCounts(prev => new Set([...prev, bank.id]));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('word_banks')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('删除失败：' + (err.message || '请检查网络'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploaderSave = async (savedBank) => {
    setShowUploader(false);
    // Refresh banks list via parent
    if (onConfirm) {
      // Notify parent to refresh and select new bank
    }
    // We'll pass back upward
    onDelete('__refresh__', savedBank);
  };

  // Sort banks by created_at DESC
  const sortedBanks = [...banks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">选择词库</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Upload button */}
          {!showUploader && (
            <button
              onClick={() => setShowUploader(true)}
              className="w-full py-2.5 border-2 border-dashed border-blue-300 text-blue-500 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-xl">＋</span> 上传新词库
            </button>
          )}

          {/* Uploader inline */}
          {showUploader && (
            <WordBankUploader
              onSave={handleUploaderSave}
              onCancel={() => setShowUploader(false)}
            />
          )}

          {/* Bank list */}
          {sortedBanks.length === 0 ? (
            <div className="text-center text-gray-400 py-8">暂无词库</div>
          ) : (
            sortedBanks.map(bank => {
              const isSelected = selectedBank?.id === bank.id;
              const counts = wordCounts[bank.id];
              return (
                <div
                  key={bank.id}
                  onClick={() => handleSelect(bank)}
                  className={`relative rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 truncate">{bank.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {bank.uploader} · {formatDate(bank.created_at)}
                      </div>
                      {isSelected && counts && (
                        <div className="text-xs text-blue-600 mt-1">
                          共 {counts.total} 个词，其中 {counts.eligible} 个4-8字母可参与游戏
                        </div>
                      )}
                      {isSelected && !counts && loadedCounts.has(bank.id) === false && (
                        <div className="text-xs text-gray-400 mt-1">加载中...</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(bank);
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                        title="删除词库"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 p-4 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={!selectedBank}
            className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认选择
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          bankName={deleteTarget.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
