import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { parseWordList, getTodayDate } from '../lib/gameUtils';

export default function WordBankUploader({ onSave, onCancel }) {
  const [text, setText] = useState('');
  const [name, setName] = useState(getTodayDate());
  const [uploader, setUploader] = useState('匿名老师');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [parseResult, setParseResult] = useState(null);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (val.trim()) {
      const result = parseWordList(val);
      setParseResult(result);
      setError('');
    } else {
      setParseResult(null);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim() || getTodayDate();
    const trimmedUploader = uploader.trim() || '匿名老师';

    if (!text.trim()) {
      setError('请输入单词内容');
      return;
    }

    const result = parseWordList(text);

    if (result.valid.length < 5) {
      setError(`至少需要5个有效单词，当前仅有 ${result.valid.length} 个`);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Insert word bank
      const { data: bankData, error: bankError } = await supabase
        .from('word_banks')
        .insert([{ name: trimmedName, uploader: trimmedUploader }])
        .select()
        .single();

      if (bankError) throw bankError;

      // Insert words in batch
      const wordsToInsert = result.valid.map(({ word, hint }) => ({
        bank_id: bankData.id,
        word: word.toUpperCase(),
        hint: hint || null,
        letter_count: word.length,
      }));

      const { error: wordsError } = await supabase
        .from('words')
        .insert(wordsToInsert);

      if (wordsError) throw wordsError;

      // Return bank with word count info
      onSave({
        ...bankData,
        name: trimmedName,
        uploader: trimmedUploader,
        wordCount: result.valid.length,
      });
    } catch (err) {
      console.error('Save error:', err);
      setError('保存失败：' + (err.message || '请检查网络连接'));
      setIsSaving(false);
    }
  };

  const eligibleCount = parseResult
    ? parseResult.valid.filter(w => w.word.length >= 4 && w.word.length <= 8).length
    : 0;

  return (
    <div className="border-t border-gray-200 pt-4 mt-2">
      <h3 className="font-bold text-gray-800 mb-3">上传新词库</h3>

      {/* Name input */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-600 mb-1">词库名称</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={getTodayDate()}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Uploader nickname */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-600 mb-1">上传者昵称</label>
        <input
          type="text"
          value={uploader}
          onChange={e => setUploader(e.target.value)}
          placeholder="匿名老师"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Word textarea */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          单词列表（每行一个，可附提示）
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder={"APPLE,苹果\nBANANA,香蕉\nSCHOOL,学校\nTEACHER,老师"}
          rows={8}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      {/* Parse result info */}
      {parseResult && (
        <div className="mb-3 text-sm space-y-1">
          <div className="text-green-600">
            ✓ 有效单词：{parseResult.valid.length} 个
            {eligibleCount < parseResult.valid.length && (
              <span className="text-gray-500">（其中 {eligibleCount} 个4-8字母可参与游戏）</span>
            )}
          </div>
          {parseResult.invalidLines.length > 0 && (
            <div className="text-amber-600">
              ⚠ 第 {parseResult.invalidLines.join('、')} 行格式有误，已跳过
            </div>
          )}
          {parseResult.valid.length < 5 && (
            <div className="text-red-500">
              ✗ 至少需要5个有效单词（当前 {parseResult.valid.length} 个）
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 py-2 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || (parseResult && parseResult.valid.length < 5)}
          className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? '保存中...' : '保存词库'}
        </button>
      </div>
    </div>
  );
}
