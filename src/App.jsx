import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { drawSessionWords } from './lib/gameUtils';
import WelcomeModal from './components/WelcomeModal';
import GamePage from './components/GamePage';

const SS_KEY = 'classroomWordle_gameState';

// Built-in seed words
const BUILT_IN_WORDS = [
  { word: 'APPLE', hint: '苹果' },
  { word: 'BANANA', hint: '香蕉' },
  { word: 'ORANGE', hint: '橙子' },
  { word: 'SCHOOL', hint: '学校' },
  { word: 'TEACHER', hint: '老师' },
  { word: 'WINDOW', hint: '窗户' },
  { word: 'FRIEND', hint: '朋友' },
  { word: 'POLICE', hint: '警察' },
  { word: 'GARDEN', hint: '花园' },
  { word: 'MARKET', hint: '市场' },
];

export default function App() {
  const [view, setView] = useState('welcome'); // 'welcome' | 'game'
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gameInitData, setGameInitData] = useState(null);

  // On mount: check if game in progress, load banks
  useEffect(() => {
    checkSavedGameAndLoadBanks();
  }, []);

  const checkSavedGameAndLoadBanks = async () => {
    setIsLoading(true);
    setLoadError(null);

    // Check for saved game state
    let hasSavedGame = false;
    try {
      const saved = sessionStorage.getItem(SS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionWords && parsed.sessionWords.length > 0 &&
            (parsed.wordStatus === 'PLAYING' || parsed.wordStatus === 'WON' || parsed.wordStatus === 'LOST')) {
          hasSavedGame = true;
        }
      }
    } catch (e) {
      // ignore
    }

    // Load banks from Supabase
    try {
      const { data: banksData, error: banksError } = await supabase
        .from('word_banks')
        .select('*')
        .order('created_at', { ascending: false });

      if (banksError) throw banksError;

      let loadedBanks = banksData || [];

      // Cold start: if no banks, insert built-in bank
      if (loadedBanks.length === 0) {
        const inserted = await insertBuiltInBank();
        if (inserted) {
          loadedBanks = [inserted];
        }
      }

      setBanks(loadedBanks);

      // If there's a saved game, restore it and go to game view
      if (hasSavedGame) {
        try {
          const saved = sessionStorage.getItem(SS_KEY);
          const parsed = JSON.parse(saved);
          // Find the bank for this saved game
          const savedBank = loadedBanks.find(b => b.id === parsed.selectedBankId) || loadedBanks[0];
          setSelectedBank(savedBank);
          setGameInitData({
            fullWordList: parsed.fullWordList || [],
            sessionWords: parsed.sessionWords || [],
            usedWords: parsed.usedWords || [],
            selectedBank: savedBank,
          });
          setView('game');
        } catch (e) {
          // If restore fails, go to welcome
          sessionStorage.removeItem(SS_KEY);
          setSelectedBank(loadedBanks[0] || null);
          setView('welcome');
        }
      } else {
        setSelectedBank(loadedBanks[0] || null);
        setView('welcome');
      }
    } catch (err) {
      console.error('Failed to load banks:', err);
      setLoadError(err.message || 'Unknown error');
      setIsLoading(false);
      setView('welcome');
      return;
    }

    setIsLoading(false);
  };

  const insertBuiltInBank = async () => {
    try {
      const { data: bankData, error: bankError } = await supabase
        .from('word_banks')
        .insert([{ name: '示例词库', uploader: '系统' }])
        .select()
        .single();

      if (bankError) throw bankError;

      const wordsToInsert = BUILT_IN_WORDS.map(({ word, hint }) => ({
        bank_id: bankData.id,
        word: word.toUpperCase(),
        hint,
        letter_count: word.length,
      }));

      const { error: wordsError } = await supabase
        .from('words')
        .insert(wordsToInsert);

      if (wordsError) throw wordsError;

      return bankData;
    } catch (err) {
      console.error('Failed to insert built-in bank:', err);
      return null;
    }
  };

  const handleStart = async () => {
    if (!selectedBank) return;

    try {
      // Load all words for this bank
      const { data: wordsData, error } = await supabase
        .from('words')
        .select('*')
        .eq('bank_id', selectedBank.id);

      if (error) throw error;

      const fullWordList = (wordsData || []).map(w => ({
        word: w.word.toUpperCase(),
        hint: w.hint || '',
        letter_count: w.letter_count,
      }));

      const { sessionWords, newUsedWords } = drawSessionWords(fullWordList, []);

      setGameInitData({
        fullWordList,
        sessionWords,
        usedWords: newUsedWords,
        selectedBank,
      });

      setView('game');
    } catch (err) {
      console.error('Failed to start game:', err);
      alert('加载词库失败：' + (err.message || '请检查网络'));
    }
  };

  const handleGoHome = () => {
    sessionStorage.removeItem(SS_KEY);
    setGameInitData(null);
    setView('welcome');
  };

  const handleSelectBank = (bank) => {
    setSelectedBank(bank);
  };

  const handleDeleteBank = async (bankId, newBank) => {
    if (bankId === '__refresh__') {
      // Refresh banks list after upload
      const { data } = await supabase
        .from('word_banks')
        .select('*')
        .order('created_at', { ascending: false });
      const loadedBanks = data || [];
      setBanks(loadedBanks);
      if (newBank) {
        const found = loadedBanks.find(b => b.id === newBank.id) || loadedBanks[0];
        setSelectedBank(found);
      }
      return;
    }
    // Remove bank from list
    const updatedBanks = banks.filter(b => b.id !== bankId);
    setBanks(updatedBanks);
    // If the deleted bank was selected, pick the first available
    if (selectedBank?.id === bankId) {
      setSelectedBank(updatedBanks[0] || null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <div className="text-gray-500 text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  if (view === 'game' && gameInitData) {
    return (
      <GamePage
        fullWordList={gameInitData.fullWordList}
        sessionWords={gameInitData.sessionWords}
        usedWords={gameInitData.usedWords}
        selectedBank={gameInitData.selectedBank || selectedBank}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <WelcomeModal
      banks={banks}
      selectedBank={selectedBank}
      loadError={loadError}
      onSelectBank={handleSelectBank}
      onDeleteBank={handleDeleteBank}
      onStart={handleStart}
      onRetry={checkSavedGameAndLoadBanks}
    />
  );
}
