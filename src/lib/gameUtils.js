/**
 * Strip non-A-Z chars, convert full-width, remove invisible chars, uppercase.
 * Returns null if result is empty or contains non-alpha.
 */
export function cleanWord(raw) {
  if (!raw) return null;
  // Remove zero-width spaces, non-breaking spaces, and other invisible chars
  let cleaned = raw.replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, '');
  // Convert full-width letters to ASCII
  cleaned = cleaned.replace(/[Ａ-Ｚａ-ｚ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
  // Remove all non-alpha chars
  cleaned = cleaned.replace(/[^A-Za-z]/g, '');
  // Uppercase
  cleaned = cleaned.toUpperCase();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Parse textarea text into valid words with optional hints.
 * - Split by newline
 * - Each line: split by comma (,), Chinese comma (，), or tab
 * - word = cleanWord(first part), hint = rest joined (trimmed)
 * - Skip invalid words
 * - Auto-deduplicate (case-insensitive, keep first)
 * Returns { valid: [{word, hint}], invalidLines: [lineNumbers] }
 */
export function parseWordList(text) {
  const lines = text.split('\n');
  const valid = [];
  const invalidLines = [];
  const seen = new Set();

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (!trimmed) return; // skip empty lines silently

    // Split by comma, Chinese comma, or tab
    const parts = trimmed.split(/[,，\t]/);
    const rawWord = parts[0] ? parts[0].trim() : '';
    const hint = parts.slice(1).map(p => p.trim()).filter(Boolean).join(' ');

    const word = cleanWord(rawWord);
    if (!word) {
      invalidLines.push(lineNum);
      return;
    }

    const wordUpper = word.toUpperCase();
    if (seen.has(wordUpper)) {
      // Duplicate - skip silently
      return;
    }

    seen.add(wordUpper);
    valid.push({ word: wordUpper, hint: hint || '' });
  });

  return { valid, invalidLines };
}

/**
 * Standard Fisher-Yates shuffle (in-place, returns array).
 */
export function fisherYatesShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw 5 session words from the full word list.
 * - Only consider 4-8 letter words
 * - Prefer words not in usedWords
 * - If remaining < 5: mix with usedWords, reshuffle all
 * - Max 3 words can be 7-8 letters long
 * - Sort ascending by letter_count (ties: random order)
 * Returns { sessionWords, newUsedWords }
 */
export function drawSessionWords(fullWordList, usedWords) {
  const usedSet = new Set(usedWords.map(w => w.toUpperCase()));

  // Filter to only 4-8 letter words
  const eligible = fullWordList.filter(item => {
    const len = item.word.length;
    return len >= 4 && len <= 8;
  });

  // Split into unused and used
  let remaining = eligible.filter(item => !usedSet.has(item.word.toUpperCase()));
  let usedEligible = eligible.filter(item => usedSet.has(item.word.toUpperCase()));

  let pool;
  let newUsedWords;

  if (remaining.length < 5) {
    // Not enough unused - reset: use all eligible words
    pool = fisherYatesShuffle(eligible);
    newUsedWords = [];
  } else {
    pool = fisherYatesShuffle(remaining);
    newUsedWords = [...usedWords];
  }

  // Take first 5, enforcing max 3 long words (7-8 letters)
  const shortPool = pool.filter(item => item.word.length <= 6);
  const longPool = pool.filter(item => item.word.length >= 7);

  const selected = [];
  let longCount = 0;

  for (const item of pool) {
    if (selected.length >= 5) break;
    if (item.word.length >= 7) {
      if (longCount < 3) {
        selected.push(item);
        longCount++;
      }
    } else {
      selected.push(item);
    }
  }

  // If we still need more (e.g., pool was all long), fill from short
  if (selected.length < 5) {
    const selectedWords = new Set(selected.map(i => i.word));
    for (const item of shortPool) {
      if (selected.length >= 5) break;
      if (!selectedWords.has(item.word)) {
        selected.push(item);
        selectedWords.add(item.word);
      }
    }
  }

  // If still not 5, fill from whatever remains
  if (selected.length < 5) {
    const selectedWords = new Set(selected.map(i => i.word));
    for (const item of pool) {
      if (selected.length >= 5) break;
      if (!selectedWords.has(item.word)) {
        selected.push(item);
        selectedWords.add(item.word);
      }
    }
  }

  // Sort ascending by letter_count (ties: preserve shuffle order = random)
  const sessionWords = selected.sort((a, b) => a.word.length - b.word.length);

  // Update used words
  const addedWords = sessionWords.map(item => item.word.toUpperCase());
  const updatedUsed = [...new Set([...newUsedWords, ...addedWords])];

  return { sessionWords, newUsedWords: updatedUsed };
}

/**
 * Returns max guesses: L+1 for 4-6 letter words, 7 for 7-8 letter words.
 */
export function getMaxGuesses(letterCount) {
  if (letterCount >= 7) return 7;
  return letterCount + 1;
}

/**
 * LOOSE Wordle evaluation:
 * - Step 1: Mark exact matches as 'green'
 * - Step 2: For non-green: if target INCLUDES the letter (any position), mark 'yellow'; else 'gray'
 * Returns array of colors.
 */
export function evaluateGuess(guess, target) {
  const guessArr = guess.toUpperCase().split('');
  const targetArr = target.toUpperCase().split('');
  const colors = new Array(guessArr.length).fill(null);

  // Step 1: exact matches
  for (let i = 0; i < guessArr.length; i++) {
    if (guessArr[i] === targetArr[i]) {
      colors[i] = 'green';
    }
  }

  // Step 2: non-green positions
  for (let i = 0; i < guessArr.length; i++) {
    if (colors[i] === 'green') continue;
    if (targetArr.includes(guessArr[i])) {
      colors[i] = 'yellow';
    } else {
      colors[i] = 'gray';
    }
  }

  return colors;
}

/**
 * Update keyboard color map with priority: green > yellow > gray > null
 */
export function updateKeyboardColors(keyboardColors, guess, colors) {
  const priority = { green: 3, yellow: 2, gray: 1, null: 0 };
  const updated = { ...keyboardColors };
  const guessArr = guess.toUpperCase().split('');

  for (let i = 0; i < guessArr.length; i++) {
    const letter = guessArr[i];
    const newColor = colors[i];
    const existing = updated[letter] || null;
    if ((priority[newColor] || 0) > (priority[existing] || 0)) {
      updated[letter] = newColor;
    }
  }

  return updated;
}

/**
 * Returns today's date as 'YYYY-MM-DD' string.
 */
export function getTodayDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
