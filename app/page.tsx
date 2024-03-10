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

  // Will need to use this .on() to modify the tile values while dragging
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

  function handleDrag(e: MouseEvent | TouchEvent | PointerEvent, i: PanInfo) {
    if (!gridRef.current) return x.set(0);

    const gridGap = parseInt(window.getComputedStyle(gridRef.current).gap);

    // The width of one cell, plus one gap width
    const tileTravelDistance =
      (gridRef.current.getBoundingClientRect().width -
        (boardSize - 1) * gridGap) /
        boardSize +
      gridGap;

    // To slide the tile in relation to its cell's center point.
    // the tile will remain closest to the center point of its own cell.
    // keep the value of xPos within the range of tileTravelDistance,
    // with x at 0 being centered in the range.
    // if range is 100, and x is 51, xPos is -49.
    // https://math.stackexchange.com/questions/3838296/integer-function-that-loops-over-a-range
    const xPos =
      Math.sign(x.get()) *
      (((Math.abs(x.get()) + (tileTravelDistance / 2 - 1)) %
        tileTravelDistance) -
        (tileTravelDistance / 2 - 1));

    x.set(xPos);
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
          <motion.button
            className="px-4 py-2 bg-green-700 rounded-full block"
            onClick={() => setBoard([])}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.65 }}
          >
            Generate board
          </motion.button>
        </div>

        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          {/* make grid-cols-3 dynamic to boardSize */}
          <div
            className="grid grid-cols-3 w-1/3 gap-4 touch-none pointer-events-auto"
            ref={gridRef}
          >
            {board.flat().map((letter, i) => {
              const coord = `${Math.floor(i / boardSize)}${i % boardSize}`;

              return (
                <motion.div
                  key={coord}
                  className="bg-zinc-700  bg-opacity-35 backdrop-blur-lg w-full aspect-square rounded-md text-5xl flex justify-center items-center select-none cursor-grab border-s border-t border-zinc-300 border-opacity-10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  whileDrag={{ scale: 1 }}
                  drag={true}
                  style={{ x }}
                  onDrag={(e, i) => {
                    handleDrag(e, i);
                  }}
                  dragSnapToOrigin={true}
                  dragTransition={{ bounceStiffness: 1000, bounceDamping: 20 }}
                  dragDirectionLock
                  onDirectionLock={axis => {
                    console.log("DIRECTION");
                    console.log(axis);
                  }}
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
