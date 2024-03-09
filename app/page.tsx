"use client";

import { useEffect, useState } from "react";
import { Generator } from "slideum_board_generator";
import type { ResultMatrix } from "slideum_board_generator";
import { motion, useVelocity, useMotionValue } from "framer-motion";

export default function Home() {
  const [board, setBoard] = useState<ResultMatrix>([]);

  const x = useMotionValue(0);
  const xVelocity = useVelocity(x);

  useEffect(() => {
    return xVelocity.on("change", latest => {
      console.log("velocity: ", latest);
    });
  }, [xVelocity]);

  useEffect(() => {
    return x.on("change", latest => {
      console.log("x: ", latest);
    });
  }, [x]);

  useEffect(() => {
    if (board.length !== 0) return;

    // This will be moved to the server down the line. a request will be sent to get a board
    async function generateBoard() {
      const generator = new Generator();
      return await generator.getBoard();
    }

    generateBoard().then(board => setBoard(board));
  }, [board]);

  return (
    <>
      <main className="h-[100dvh]">
        <nav>Slideum</nav>
        <button
          className="px-4 py-2 bg-green-700 rounded-md block"
          onClick={() => setBoard([])}
        >
          Generate board
        </button>

        <div className="absolute inset-0 grid place-items-center">
          <div className="grid grid-cols-3 w-1/3 gap-4">
            {board.flat().map((letter, i) => {
              // 3 is currently hard coded. is equal to board size
              const coord = `${Math.floor(i / 3)}${i % 3}`;

              return (
                <motion.div
                  key={coord}
                  className="bg bg-sky-700 w-full aspect-square rounded-md text-5xl flex justify-center items-center select-none cursor-grab"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  drag="x"
                  style={{ x }}
                  data-coord={coord}
                >
                  {letter.toUpperCase()}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
