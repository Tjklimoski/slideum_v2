"use client";

import { useEffect, useRef, useState } from "react";
import { Generator } from "slideum_board_generator";
import type { ResultMatrix } from "slideum_board_generator";
import { PanInfo, motion, useMotionValue } from "framer-motion";

export default function Home() {
  const [board, setBoard] = useState<ResultMatrix>([]);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const boardSize = board.length;

  const x = useMotionValue(0);

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

  // When I let go of the tiles they just keep going. need to have a dragend event
  // Should this change to a onPan event? https://www.framer.com/motion/gestures/#pan
  function handleDrag(e: MouseEvent | TouchEvent | PointerEvent, i: PanInfo) {
    if (!gridRef.current) return x.set(0);

    const tileTravelDistance =
      // 16 is the size of the gap between cells in the grid
      (gridRef.current.getBoundingClientRect().width - (boardSize - 1) * 16) /
        boardSize +
      16;
    console.log("xAnimate: ", x.get() % tileTravelDistance);
    x.set(x.get() % tileTravelDistance);
  }

  return (
    <>
      <main className="h-[100dvh]">
        <nav className="py-4 px-6 text-2xl bg-zinc-950 bg-opacity-25 backdrop-blur-md">
          <h1>
            Sl<span className="ms-1">i</span>
            <span className="ms-2">d</span>
            <span className="ms-3">e</span>
            <span className="ms-4">u</span>
            <span className="ms-5">m</span>
          </h1>
        </nav>

        <div className="py-4 px-6">
          <button
            className="px-4 py-2 bg-green-700 rounded-md block"
            onClick={() => setBoard([])}
          >
            Generate board
          </button>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          {/* make grid-cols-3 dynamic to boardSize */}
          <div
            className="grid grid-cols-3 w-1/3 gap-4 touch-none"
            ref={gridRef}
          >
            {board.flat().map((letter, i) => {
              const coord = `${Math.floor(i / boardSize)}${i % boardSize}`;

              return (
                <motion.div
                  key={coord}
                  className="bg bg-sky-700 w-full aspect-square rounded-md text-5xl flex justify-center items-center select-none cursor-grab"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  drag="x"
                  style={{ x }}
                  onDrag={(e, i) => {
                    handleDrag(e, i);
                  }}
                  data-coord={coord}
                >
                  {/* {letter.toUpperCase()} */}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
