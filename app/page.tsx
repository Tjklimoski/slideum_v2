"use client";

import { useEffect, useState } from "react";
import { Generator } from "slideum_board_generator";
import type { ResultMatrix } from "slideum_board_generator";

export default function Home() {
  const [board, setBoard] = useState<ResultMatrix>([]);

  useEffect(() => {
    if (board.length !== 0) return;

    async function generateBoard() {
      const generator = new Generator();
      return await generator.getBoard();
    }

    generateBoard().then(board => setBoard(board));
  }, [board]);
  return (
    <>
      <nav>Slideum</nav>
      <main className="p-4">
        This is my main content
        <button
          className="px-4 py-2 bg-green-700 rounded-md block"
          onClick={() => setBoard([])}
        >
          Generate board
        </button>
        <div className="grid grid-cols-3 w-1/3 m-auto gap-4">
          {board.flat().map((letter, i) => (
            <div
              key={`${letter}${i}`}
              className="bg bg-sky-700 w-full aspect-square rounded-md text-5xl flex justify-center items-center"
            >
              {letter.toUpperCase()}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
