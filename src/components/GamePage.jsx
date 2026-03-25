import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from './GameHeader';
import Grid from './Grid';
import Keyboard from './Keyboard';
import ResultModal from './ResultModal';
import SessionEndScreen from './SessionEndScreen';
import {
  evaluateGuess,
  updateKeyboardColors,
  getMaxGuesses,
  drawSessionWords,
} from '../lib/gameUtils';

const SS_KEY = 'classroomWordle_gameState';

function buildInitialState(props) {
  return {
    fullWordList: props.fullWordList || [],
    usedWords: props.usedWords || [],
    sessionWords: props.sessionWords || [],
    currentWordIndex: 0,
    guesses: [],
    currentGuess: '',
    isHintRevealed: false,
    wordStatus: 'PLAYING',
    keyboardColors: {},
    cellColors: {},
  };
}

export default function GamePage({ fullWordList, usedWords, sessionWords, selectedBank, onGoHome }) {
  // ---- State ----
  const [state, setState] = useState(() => {
    // Try to restore from sessionStorage
    try {
      const saved = sessionStorage.getItem(SS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sessionWords && parsed.sessionWords.length > 0) {
          return {
            fullWordList: parsed.fullWordList || fullWordList || [],
            usedWords: parsed.usedWords || usedWords || [],
            sessionWords: parsed.sessionWords,
            currentWordIndex: parsed.currentWordIndex || 0,
            guesses: parsed.guesses || [],
            currentGuess: parsed.currentGuess || '',
            isHintRevealed: parsed.isHintRevealed || false,
            wordStatus: parsed.wordStatus || 'PLAYING',
            keyboardColors: parsed.keyboardColors || {},
            cellColors: parsed.cellColors || {},
          };
        }
      }
    } catch (e) {
      // ignore
    }
    return buildInitialState({ fullWordList, usedWords, sessionWords });
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.wordStatus === 'WON' || parsed.wordStatus === 'LOST';
      }
    } catch (e) {}
    return false;
  });
  const [nextEnabled, setNextEnabled] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.wordStatus === 'WON' || parsed.wordStatus === 'LOST';
      }
    } catch (e) {}
    return false;
  });
  const [shakingRow, setShakingRow] = useState(-1);
  const [revealingRow, setRevealingRow] = useState(-1);
  const [showSessionEnd, setShowSessionEnd] = useState(false);

  // Refs for stable access in event handlers
  const isAnimatingRef = useRef(isAnimating);
  const showResultRef = useRef(showResult);
  const wordStatusRef = useRef(state.wordStatus);
  const nextEnabledRef = useRef(nextEnabled);

  useEffect(() => { isAnimatingRef.current = isAnimating; }, [isAnimating]);
  useEffect(() => { showResultRef.current = showResult; }, [showResult]);
  useEffect(() => { wordStatusRef.current = state.wordStatus; }, [state.wordStatus]);
  useEffect(() => { nextEnabledRef.current = nextEnabled; }, [nextEnabled]);

  // ---- Persist to sessionStorage ----
  useEffect(() => {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify({
        selectedBankId: selectedBank?.id,
        fullWordList: state.fullWordList,
        usedWords: state.usedWords,
        sessionWords: state.sessionWords,
        currentWordIndex: state.currentWordIndex,
        guesses: state.guesses,
        currentGuess: state.currentGuess,
        isHintRevealed: state.isHintRevealed,
        wordStatus: state.wordStatus,
        keyboardColors: state.keyboardColors,
        cellColors: state.cellColors,
      }));
    } catch (e) {
      // ignore storage quota errors
    }
  }, [state, selectedBank]);

  // ---- Before unload warning ----
  useEffect(() => {
    const handler = (e) => {
      if (wordStatusRef.current === 'PLAYING' && !showResultRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // ---- Current word ----
  const currentWord = state.sessionWords[state.currentWordIndex];
  const wordStr = currentWord ? currentWord.word.toUpperCase() : '';
  const maxGuesses = wordStr ? getMaxGuesses(wordStr.length) : 6;

  // ---- Submit guess ----
  // Strategy: push guess immediately to guesses (with null colors), then reveal cells
  // via cellColors over time. After animation, colors are already in cellColors.
  const submitGuess = useCallback(() => {
    const guess = state.currentGuess.toUpperCase();
    if (guess.length !== wordStr.length) return;
    if (isAnimatingRef.current) return;

    const colors = evaluateGuess(guess, wordStr);
    const rowIdx = state.guesses.length;

    // Push the guess immediately so Grid can render the row as submitted
    // Colors will come from cellColors during animation, then from guesses.colors after
    setState(prev => ({
      ...prev,
      guesses: [...prev.guesses, { guess, colors: new Array(wordStr.length).fill(null) }],
      currentGuess: '',
    }));

    // Start flip animation
    setIsAnimating(true);
    setRevealingRow(rowIdx);

    // Reveal cells one by one with staggered timing
    for (let i = 0; i < wordStr.length; i++) {
      const colIdx = i;
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          cellColors: { ...prev.cellColors, [`${rowIdx}-${colIdx}`]: colors[colIdx] },
        }));
      }, colIdx * 300 + 150); // slight offset so flip hits midpoint before color appears
    }

    // After last cell fully reveals
    const totalDuration = (wordStr.length - 1) * 300 + 500;
    setTimeout(() => {
      const isWon = colors.every(c => c === 'green');
      const newGuessesLength = rowIdx + 1;
      const isLost = !isWon && newGuessesLength >= maxGuesses;

      const newKeyboardColors = updateKeyboardColors(state.keyboardColors, guess, colors);

      // Update the guess with actual colors (so after refresh cellColors aren't needed)
      setState(prev => ({
        ...prev,
        guesses: prev.guesses.map((g, idx) =>
          idx === rowIdx ? { ...g, colors } : g
        ),
        keyboardColors: newKeyboardColors,
        wordStatus: isWon ? 'WON' : isLost ? 'LOST' : 'PLAYING',
      }));

      setIsAnimating(false);
      setRevealingRow(-1);

      if (isWon || isLost) {
        setShowResult(true);
        setTimeout(() => setNextEnabled(true), 1500);
      }
    }, totalDuration);
  }, [state, wordStr, maxGuesses]);

  // ---- Go to next word ----
  const handleNext = useCallback(() => {
    const nextIndex = state.currentWordIndex + 1;
    if (nextIndex >= state.sessionWords.length) {
      // Session complete
      setShowResult(false);
      setNextEnabled(false);
      setShowSessionEnd(true);
      return;
    }
    setState(prev => ({
      ...prev,
      currentWordIndex: nextIndex,
      guesses: [],
      currentGuess: '',
      isHintRevealed: false,
      wordStatus: 'PLAYING',
      keyboardColors: {},
      cellColors: {},
    }));
    setShowResult(false);
    setNextEnabled(false);
  }, [state.currentWordIndex, state.sessionWords.length]);

  // handleNext ref for use in event handler
  const handleNextRef = useRef(handleNext);
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  // ---- Handle key input ----
  const handleKey = useCallback((key) => {
    // Block during animation
    if (isAnimatingRef.current) return;

    // If game is done for this word
    if (wordStatusRef.current !== 'PLAYING') {
      // Allow Enter to advance when result is shown and nextEnabled
      if ((key === 'ENTER') && nextEnabledRef.current && showResultRef.current) {
        handleNextRef.current();
      }
      return;
    }
    // Block if result modal is shown
    if (showResultRef.current) return;

    if (key === 'ENTER') {
      if (state.currentGuess.length !== wordStr.length) {
        // Shake current row
        setShakingRow(state.guesses.length);
        setTimeout(() => setShakingRow(-1), 500);
        return;
      }
      submitGuess();
    } else if (key === 'DEL' || key === 'BACKSPACE') {
      setState(prev => ({
        ...prev,
        currentGuess: prev.currentGuess.slice(0, -1),
      }));
    } else if (/^[A-Z]$/.test(key.toUpperCase()) && key.length === 1) {
      const letter = key.toUpperCase();
      setState(prev => {
        if (prev.currentGuess.length >= wordStr.length) return prev;
        return { ...prev, currentGuess: prev.currentGuess + letter };
      });
    }
  }, [state.currentGuess, wordStr, submitGuess]);

  // handleKey ref for use in event handler
  const handleKeyRef = useRef(handleKey);
  useEffect(() => { handleKeyRef.current = handleKey; }, [handleKey]);

  // ---- Physical keyboard ----
  useEffect(() => {
    const handler = (e) => {
      if (showSessionEnd) return;
      if (e.key === ' ') {
        e.preventDefault();
        setState(prev => ({ ...prev, isHintRevealed: !prev.isHintRevealed }));
        return;
      }
      if (e.key === 'Enter') {
        handleKeyRef.current('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyRef.current('DEL');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyRef.current(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSessionEnd]);

  // ---- New session ----
  const handleNewSession = useCallback(() => {
    const { sessionWords: newSessionWords, newUsedWords } = drawSessionWords(
      state.fullWordList,
      state.usedWords
    );
    setState(prev => ({
      ...prev,
      sessionWords: newSessionWords,
      usedWords: newUsedWords,
      currentWordIndex: 0,
      guesses: [],
      currentGuess: '',
      isHintRevealed: false,
      wordStatus: 'PLAYING',
      keyboardColors: {},
      cellColors: {},
    }));
    setShowResult(false);
    setNextEnabled(false);
    setShowSessionEnd(false);
  }, [state.fullWordList, state.usedWords]);

  // ---- Go home ----
  const handleGoHome = () => {
    sessionStorage.removeItem(SS_KEY);
    onGoHome();
  };

  // ---- Toggle hint ----
  const handleToggleHint = () => {
    setState(prev => ({ ...prev, isHintRevealed: !prev.isHintRevealed }));
  };

  // ---- Session end screen ----
  if (showSessionEnd) {
    return (
      <SessionEndScreen
        onNewSession={handleNewSession}
        onGoHome={handleGoHome}
      />
    );
  }

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col overflow-hidden relative"
      style={{ height: '100dvh' }}
    >
      <GameHeader
        currentWordIndex={state.currentWordIndex + 1}
        totalWords={state.sessionWords.length}
        wordStatus={state.wordStatus}
        isHintRevealed={state.isHintRevealed}
        currentWord={currentWord}
        bankName={selectedBank?.name}
        onToggleHint={handleToggleHint}
        onGoHome={handleGoHome}
      />

      {/* Hint area */}
      <div className="flex-shrink-0 min-h-[40px] flex items-center justify-center px-4 py-1">
        {state.isHintRevealed && currentWord.hint && currentWord.hint.trim() ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800 max-w-sm text-center">
            💡 {currentWord.hint}
          </div>
        ) : (
          <div className="text-xs text-gray-300">
            {currentWord.hint ? '按空格键或点击💡显示提示' : ''}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <Grid
          word={wordStr}
          guesses={state.guesses}
          currentGuess={state.currentGuess}
          maxGuesses={maxGuesses}
          revealingRow={revealingRow}
          cellColors={state.cellColors}
          shakingRow={shakingRow}
        />
      </div>

      {/* Keyboard */}
      <Keyboard
        onKey={handleKey}
        keyboardColors={state.keyboardColors}
        disabled={isAnimating || state.wordStatus !== 'PLAYING' || showResult}
      />

      {/* Result modal */}
      {showResult && (
        <ResultModal
          wordStatus={state.wordStatus}
          word={wordStr}
          hint={currentWord.hint}
          onNext={handleNext}
          nextEnabled={nextEnabled}
        />
      )}
    </div>
  );
}
