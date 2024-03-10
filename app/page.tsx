"use client";

import { useEffect, useRef, useState } from "react";
import { Generator } from "slideum_board_generator";
import type { ResultMatrix } from "slideum_board_generator";
import {
  PanInfo,
  Point,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

export default function Home() {
  const [board, setBoard] = useState<ResultMatrix>([]);
  const [dragDirection, setDragDirection] = useState<"x" | "y" | undefined>(
    undefined
  );
  const [dragDelta, setDragDelta] = useState<Point | undefined>(undefined);
  const [locked, setLocked] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const boardSize = board.length;

  const slide = useMotionValue(0);

  // Adjusty opacity of tiles at the end of the words (right and bottom of grid)
  const opacityEnd = useTransform(() => {
    if (!gridRef.current || !dragDelta || !dragDirection) return 1;

    const delta = dragDelta[dragDirection];

    const gridGap = parseInt(window.getComputedStyle(gridRef.current).gap);

    // The width of one cell, plus one gap width, divided in half, minus 2
    const halfTileTravelDistance =
      ((gridRef.current.getBoundingClientRect().width -
        (boardSize - 1) * gridGap) /
        boardSize +
        gridGap) /
        2 -
      2;

    if (delta >= 0 && slide.get() >= 0) {
      return Math.abs(slide.get() / halfTileTravelDistance - 1);
    }
    if (delta < 0 && slide.get() >= 0) {
      return slide.get() / halfTileTravelDistance;
    }
    return 1;
  });

  // Will need to use this .on() to modify the tile values while dragging
  useEffect(() => {
    const slideUnsubscribe = slide.on("change", latest => {
      // console.log("slide: ", latest);
    });

    return slideUnsubscribe;
  }, [slide]);

  useEffect(() => {
    if (board.length !== 0) return;

    // This will be moved to the server down the line. a request will be sent to get a board
    async function generateBoard() {
      const generator = new Generator();
      return await generator.getBoard();
    }

    generateBoard().then(board => setBoard(board));
  }, [board]);

  function handleDrag(
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    if (!gridRef.current) return slide.set(0);

    setDragDelta(info.delta);

    const gridGap = parseInt(window.getComputedStyle(gridRef.current).gap);

    // The width of one cell, plus one gap width
    const tileTravelDistance =
      (gridRef.current.getBoundingClientRect().width -
        (boardSize - 1) * gridGap) /
        boardSize +
      gridGap;

    // To slide the tile in relation to its cell's center point.
    // the tile will remain closest to the center point of its own cell.
    // keep the value of slidePos within the range of tileTravelDistance,
    // with slide at 0 being centered in the range.
    // if range is 100, and slide is 51, slidePos is -49.
    // https://math.stackexchange.com/questions/3838296/integer-function-that-loops-over-a-range
    const slidePos =
      Math.sign(slide.get()) *
      (((Math.abs(slide.get()) + (tileTravelDistance / 2 - 1)) %
        tileTravelDistance) -
        (tileTravelDistance / 2 - 1));

    slide.set(slidePos);
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

        <div className="absolute inset-0 grid place-items-center pointer-events-none ">
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
                  className="bg-zinc-700  bg-opacity-35 backdrop-blur-lg w-full aspect-square rounded-md text-5xl flex justify-center items-center select-none cursor-grab active:cursor-grabbing border-s border-t border-zinc-300 border-opacity-10"
                  whileHover={{ scale: !locked ? 1.05 : 1 }}
                  whileTap={{ scale: !locked ? 0.95 : 1 }}
                  whileDrag={{ scale: 1 }}
                  drag={!locked}
                  style={{
                    x: dragDirection === "x" ? slide : undefined,
                    y: dragDirection === "y" ? slide : undefined,
                    opacity: opacityEnd,
                  }}
                  onDrag={handleDrag}
                  dragSnapToOrigin={true}
                  dragTransition={{ bounceStiffness: 1000, bounceDamping: 25 }}
                  dragDirectionLock
                  onDirectionLock={setDragDirection}
                  onDragEnd={() => {
                    // Lock to allow for animation back to center to play
                    // prevents user trying to interact with board and prevents glitches
                    // unlocks in onDragTransitionEnd
                    setLocked(true);
                  }}
                  onDragTransitionEnd={() => {
                    setDragDirection(undefined);
                    setLocked(false);
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
