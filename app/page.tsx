"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Generator } from "slideum_board_generator";
import {
  MotionStyle,
  PanInfo,
  Point,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

const TILE_STATUS = {
  neutral: "neutral", // ⬛
  close: "close", // 🟨
  correct: "correct", // 🟩
};

interface Tile {
  value: string;
  coord: string;
  rowIndex: number;
  colIndex: number;
  status: keyof typeof TILE_STATUS;
}

export default function Game() {
  const [board, setBoard] = useState<string[]>([]);
  const [dragDirection, setDragDirection] = useState<"x" | "y" | undefined>(
    undefined
  );
  const [dragDelta, setDragDelta] = useState<Point | undefined>(undefined);
  const [tileTravelDistance, setTileTravelDistance] = useState(0);
  const [targetTile, setTargetTile] = useState<String | null>(null);
  const [locked, setLocked] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const boardSize = Math.sqrt(board.length);
  const slide = useMotionValue(0);

  const activeTiles = useMemo((): string[] => {
    if (boardSize === 0 || !targetTile || !dragDirection) return [];

    // If traveling in x direction, we want elements in the same row as the targetTile coord
    // If traveling in y direction, we want elements in the same col as the targetTile coord
    const indexPos = parseInt(targetTile[dragDirection === "x" ? 0 : 1]);

    const active = [];

    for (let i = 0; i < boardSize ** 2; i++) {
      if (active.length === boardSize) break;

      const rowIndex = Math.floor(i / boardSize);
      const colIndex: number = i % boardSize;
      if (
        (dragDirection === "x" && indexPos === rowIndex) ||
        (dragDirection === "y" && indexPos === colIndex)
      ) {
        active.push(`${rowIndex}${colIndex}`);
      }
    }

    return active;
  }, [targetTile, boardSize, dragDirection]);

  // opacity values for tiles at the end of the words (right and bottom of grid)
  const opacityEnd = useTransform(() => {
    if (!gridRef.current || !dragDelta || !dragDirection) return 1;

    const halfTileTravelDistance = tileTravelDistance / 2 - 2;
    const delta = dragDelta[dragDirection];

    if (delta >= 0 && slide.get() >= 0) {
      return Math.abs(slide.get() / halfTileTravelDistance - 1);
    }
    if (delta < 0 && slide.get() >= 0) {
      return slide.get() / halfTileTravelDistance;
    }
    return 1;
  });

  // opacity values for tiles at the start of the words (left and top of grid)
  const opacityStart = useTransform(() => {
    if (!gridRef.current || !dragDelta || !dragDirection) return 1;

    const halfTileTravelDistance = tileTravelDistance / 2 - 2;
    const delta = dragDelta[dragDirection];

    if (delta >= 0 && slide.get() <= 0) {
      return slide.get() / halfTileTravelDistance + 1;
    }
    if (delta < 0 && slide.get() <= 0) {
      return Math.abs(slide.get() / halfTileTravelDistance);
    }
    return 1;
  });

  // function to return back tile styles based on coords
  const getStyles = useCallback(
    (rowIndex: number, colIndex: number): MotionStyle => {
      const coord = `${rowIndex}${colIndex}`;

      if (activeTiles.includes(coord)) {
        if (dragDirection === "x" && colIndex % boardSize === 0) {
          return {
            x: slide,
            opacity: opacityStart,
          };
        } else if (dragDirection === "x" && (colIndex + 1) % boardSize === 0) {
          return {
            x: slide,
            opacity: opacityEnd,
          };
        } else if (dragDirection === "y" && rowIndex === 0) {
          return {
            y: slide,
            opacity: opacityStart,
          };
        } else if (dragDirection === "y" && rowIndex === boardSize - 1) {
          return {
            y: slide,
            opacity: opacityEnd,
          };
        }
      } else {
        // If not in active tiles, remove x and y being set to slide MotionValue
        return {
          x: undefined,
          y: undefined,
          opacity: 1,
        };
      }

      // if no dragDirection, set tile to default styles
      // OR tile is not an edge tile, needs to slide in the same direction as dragDirection, but not change opacity
      return {
        x: dragDirection === "x" ? slide : undefined,
        y: dragDirection === "y" ? slide : undefined,
        opacity: 1,
      };
    },
    [dragDirection, slide, opacityEnd, opacityStart, boardSize, activeTiles]
  );

  // set tileTravelDistance
  useEffect(() => {
    // TODO: Update the distance when the window/grid element is resized
    if (!gridRef.current) return;

    const gridGap = parseInt(window.getComputedStyle(gridRef.current).gap);

    // The width of one cell, plus one gap width
    const travelDistance =
      (gridRef.current.getBoundingClientRect().width -
        (boardSize - 1) * gridGap) /
        boardSize +
      gridGap;

    setTileTravelDistance(travelDistance);
  }, [gridRef, boardSize]);

  // Will need to use this .on() to modify the tile values while dragging
  useEffect(() => {
    const slideUnsubscribe = slide.on("change", latest => {
      console.log("slide: ", latest);
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

    generateBoard().then(board => setBoard(board.flat()));
  }, [board]);

  function handleDragStart(e: MouseEvent | TouchEvent | PointerEvent) {
    // the EventTarget type attached to e.target doesn't have .getAttribute as a method
    interface ExtendedEventTarget extends EventTarget {
      getAttribute: (arg: string) => string | null;
    }
    const target = e.target as ExtendedEventTarget;
    setTargetTile(target.getAttribute("data-coord"));
  }

  function handleDrag(
    e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    if (tileTravelDistance === 0) return slide.set(0);
    setDragDelta(info.delta);

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
            className="px-4 py-2 bg-green-700 rounded-full block shadow-lg shadow-green-700/50"
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
            {board.map((letter, i) => {
              const rowIndex = Math.floor(i / boardSize);
              const colIndex = i % boardSize;
              const coord = `${rowIndex}${colIndex}`;
              const styles = getStyles(rowIndex, colIndex);

              return (
                <motion.div
                  key={coord}
                  className="bg-zinc-700  bg-opacity-35 backdrop-blur-lg w-full aspect-square rounded-md text-5xl flex justify-center items-center select-none cursor-grab active:cursor-grabbing border-s border-t border-zinc-300 border-opacity-10"
                  whileTap={{ scale: !locked ? 0.95 : 1 }}
                  whileDrag={{ scale: 1 }}
                  drag={!locked}
                  style={styles}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  dragSnapToOrigin={true}
                  dragTransition={{
                    bounceStiffness: 1000,
                    bounceDamping: 25,
                    timeConstant: 200,
                  }}
                  dragDirectionLock
                  onDirectionLock={setDragDirection}
                  onDragEnd={() => {
                    // Lock to allow for animation back to center to play
                    // prevents user interacting with board, preventing glitches
                    // unlocks in onDragTransitionEnd
                    setLocked(true);
                  }}
                  onDragTransitionEnd={() => {
                    setDragDirection(undefined);
                    setLocked(false);
                    setTargetTile(null);
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
