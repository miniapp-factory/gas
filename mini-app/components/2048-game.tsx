'use client';
import { useState, useEffect } from 'react';
import Share from '@/components/share';
import { title, description, url } from '@/lib/metadata';

const SIZE = 4;
const TARGET = 2048;

function emptyBoard() {
  const board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  return board;
}

function addRandomTile(board: number[][]) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  return board;
}

function cloneBoard(board: number[][]) {
  return board.map(row => [...row]);
}

function transpose(board: number[][]) {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]) {
  return board.map(row => [...row].reverse());
}

function slideAndMerge(row: number[]) {
  const filtered = row.filter(v => v !== 0);
  const merged: number[] = [];
  let skip = false;
  for (let i = 0; i < filtered.length; i++) {
    if (skip) { skip = false; continue; }
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      skip = true;
    } else {
      merged.push(filtered[i]);
    }
  }
  while (merged.length < SIZE) merged.push(0);
  return merged;
}

function move(board: number[][], dir: 'up' | 'down' | 'left' | 'right') {
  let newBoard = cloneBoard(board);
  if (dir === 'up' || dir === 'down') {
    newBoard = transpose(newBoard);
  }
  if (dir === 'down' || dir === 'right') {
    newBoard = reverseRows(newBoard);
  }
  newBoard = newBoard.map(row => slideAndMerge(row));
  if (dir === 'down' || dir === 'right') {
    newBoard = reverseRows(newBoard);
  }
  if (dir === 'up' || dir === 'down') {
    newBoard = transpose(newBoard);
  }
  return newBoard;
}

export default function Game() {
  const [board, setBoard] = useState<number[][]>(() => {
    const b = emptyBoard();
    return addRandomTile(addRandomTile(b));
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const updateScore = (newBoard: number[][]) => {
    let s = 0;
    for (const row of newBoard) {
      for (const v of row) {
        s += v;
      }
    }
    setScore(s);
  };

  const checkGameOver = (b: number[][]) => {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) return false;
        if (c + 1 < SIZE && b[r][c] === b[r][c + 1]) return false;
        if (r + 1 < SIZE && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  const handleMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;
    const newBoard = move(board, dir);
    if (JSON.stringify(newBoard) === JSON.stringify(board)) return;
    const withTile = addRandomTile(newBoard);
    setBoard(withTile);
    updateScore(withTile);
    if (withTile.flat().includes(TARGET)) setWon(true);
    if (checkGameOver(withTile)) setGameOver(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') handleMove('up');
      if (e.key === 'ArrowDown') handleMove('down');
      if (e.key === 'ArrowLeft') handleMove('left');
      if (e.key === 'ArrowRight') handleMove('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [board, gameOver, handleMove]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((v, i) => (
          <div key={i} className="w-12 h-12 flex items-center justify-center bg-muted rounded">
            {v !== 0 && <span>{v}</span>}
          </div>
        ))}
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div>{won ? 'You win!' : 'Game over'}</div>
          <Share text={`${title} ${description} Score: ${score}`} />
        </div>
      )}
    </div>
  );
}
