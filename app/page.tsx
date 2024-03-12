"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Generator } from "slideum_board_generator";
import {
  isSolved,
  randomizeBoard,
  TILE_STATUS,
  validateBoard,
} from "@/util/gameLogic";
import type { Tile } from "@/util/gameLogic";
import {
  MotionStyle,
  PanInfo,
  Point,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";

export default function Game() {
  const [correctBoard, setCorrectBoard] = useState<Tile[]>([]);
  const [board, setBoard] = useState<Tile[]>([]);
  const [dragDirection, setDragDirection] = useState<"x" | "y" | undefined>(
    undefined
  );
  const [dragDelta, setDragDelta] = useState<Point | undefined>(undefined);
  const [tileTravelDistance, setTileTravelDistance] = useState(0);
  const [targetTile, setTargetTile] = useState<String | null>(null);
  const [locked, setLocked] = useState(false);
  const [solved, setSolved] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const boardSize = Math.sqrt(board.length);
  const slide = useMotionValue(0);
  const [previousSlidePos, setPreviousSlidePos] = useState(0);

  // Lock board if it's solved
  useEffect(() => {
    setSolved(isSolved(board));
  }, [board, setLocked]);

  const activeTiles = useMemo((): Tile[] => {
    if (board.length === 0 || !targetTile || !dragDirection) return [];

    // If traveling in x direction, we want elements in the same row as the targetTile coord
    // If traveling in y direction, we want elements in the same col as the targetTile coord
    const indexPos = parseInt(targetTile[dragDirection === "x" ? 0 : 1]);

    return board.reduce((arr: Tile[], tile) => {
      if (
        (dragDirection === "x" && indexPos === tile.rowIndex) ||
        (dragDirection === "y" && indexPos === tile.colIndex)
      )
        arr.push(tile);
      return arr;
    }, []);
  }, [targetTile, board, dragDirection]);

  // opacity values for tiles at the end of the words (right and bottom of grid)
  const opacityEnd = useTransform(() => {
    if (!gridRef.current || !dragDelta || !dragDirection) return 1;

    const halfTileTravelDistance = tileTravelDistance / 2 - 2;

    if (dragDelta[dragDirection] >= 0 && slide.get() > 0) {
      return Math.abs(slide.get() / halfTileTravelDistance - 1);
    }
    if (dragDelta[dragDirection] < 0 && slide.get() > 0) {
      return slide.get() / halfTileTravelDistance;
    }
    return 1;
  });

  // opacity values for tiles at the start of the words (left and top of grid)
  const opacityStart = useTransform(() => {
    if (!gridRef.current || !dragDelta || !dragDirection) return 1;

    const halfTileTravelDistance = tileTravelDistance / 2 - 2;

    if (dragDelta[dragDirection] >= 0 && slide.get() < 0) {
      return slide.get() / halfTileTravelDistance + 1;
    }
    if (dragDelta[dragDirection] < 0 && slide.get() < 0) {
      return Math.abs(slide.get() / halfTileTravelDistance);
    }
    return 1;
  });

  // function to return back tile styles based on coords
  const getStyles = useCallback(
    (tile: Tile): MotionStyle => {
      if (activeTiles.some(activeTile => activeTile.coord === tile.coord)) {
        if (dragDirection === "x" && tile.colIndex % boardSize === 0) {
          return {
            x: slide,
            opacity: opacityStart,
          };
        } else if (
          dragDirection === "x" &&
          (tile.colIndex + 1) % boardSize === 0
        ) {
          return {
            x: slide,
            opacity: opacityEnd,
          };
        } else if (dragDirection === "y" && tile.rowIndex === 0) {
          return {
            y: slide,
            opacity: opacityStart,
          };
        } else if (dragDirection === "y" && tile.rowIndex === boardSize - 1) {
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

  const shiftValues = useCallback(
    (delta: number) => {
      if (!dragDirection || delta === 0) return;
      setBoard(currentBoard => {
        return currentBoard.map(tile => {
          if (activeTiles.some(activeTile => activeTile.coord === tile.coord)) {
            // determine if we're using colIndex or rowIndex based on dragDirection
            // x = colIndex. y = rowIndex (the index that's DIFFERENT between active tiles)
            // if delta is positive, - 1. (tile takes the value of the tile to it's left)
            // if delta is negative, + 1. (tile takes the value of the tile to it's right)
            const activeTileIndex =
              ((dragDirection === "x" ? tile.colIndex : tile.rowIndex) -
                Math.sign(delta)) %
              boardSize;
            // using slice as activeTileIndex could be -1
            const newValue = activeTiles.slice(activeTileIndex)[0].value;
            return { ...tile, value: newValue };
          }
          return tile;
        });
      });
    },
    [setBoard, dragDirection, activeTiles, boardSize]
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

  useEffect(() => {
    if (board.length !== 0) return;

    // This will be moved to the server down the line. a request will be sent to get a board
    async function generateBoard() {
      const generator = new Generator();
      return await generator.getBoard();
    }

    generateBoard().then(board => {
      console.log("ANWSER BOARD: ", board.flat());

      const tiles: Tile[] = board.flat().map((value, i, arr) => {
        const boardSize = Math.sqrt(arr.length);
        const rowIndex = Math.floor(i / boardSize);
        const colIndex = i % boardSize;
        const coord = `${rowIndex}${colIndex}`;

        return {
          value,
          coord,
          rowIndex,
          colIndex,
          status: TILE_STATUS.neutral,
        };
      });

      setCorrectBoard(tiles);

      const newTiles = tiles.map(tile => ({ ...tile }));
      const randomizedTiles = randomizeBoard(newTiles);
      const validatedTiles = validateBoard(randomizedTiles, tiles);

      setBoard(validatedTiles);
      setSolved(false);
    });
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
    const slidePos = Math.round(
      Math.sign(slide.get()) *
        (((Math.abs(slide.get()) + (tileTravelDistance / 2 - 1)) %
          tileTravelDistance) -
          (tileTravelDistance / 2 - 1))
    );

    // I think this approach is giving me a flicker of content, as I don't know the tiles have jumped back until after they've jumped
    if (
      Math.abs(previousSlidePos - slidePos) > tileTravelDistance / 2 - 1 &&
      dragDirection
    ) {
      shiftValues(info.delta[dragDirection]);
    }

    setPreviousSlidePos(slidePos);
    slide.set(slidePos);
  }

  return (
    <>
      <main className="h-[100dvh] flex flex-col justify-between sm:block">
        <nav className="py-2 px-3 sm:py-4 sm:px-6 text-2xl bg-zinc-950 bg-opacity-25 backdrop-blur-md">
          <h1>
            Sl<span className="ms-1">i</span>
            <span className="ms-2">d</span>
            <span className="ms-3">e</span>
            <span className="ms-4">u</span>
            <span className="ms-5">m</span>
          </h1>
        </nav>

        <div className="py-2 px-3 sm:py-4 sm:px-6 mb-6 self-center">
          <motion.button
            className="px-4 py-2 bg-green-700 rounded-full block shadow-lg shadow-green-700/50"
            onClick={() => setBoard([])}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.65 }}
          >
            Generate board
          </motion.button>
        </div>

        <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
          {/* make grid-cols-3 dynamic to boardSize */}
          <div
            className="grid grid-cols-3 gap-2 sm:gap-4 touch-none pointer-events-auto max-w-[600px] min-w-[250px] w-4/5 sm:w-3/5"
            ref={gridRef}
          >
            {board.map(tile => {
              const styles = getStyles(tile);

              return (
                <motion.div
                  key={tile.coord}
                  className={`backdrop-blur-lg w-full aspect-square rounded-md flex justify-center items-center select-none cursor-grab active:cursor-grabbing border-s border-t border-zinc-300 border-opacity-10 text-5xl ${
                    tile.status === TILE_STATUS.close &&
                    "bg-yellow-400 bg-opacity-75"
                  } ${
                    tile.status === TILE_STATUS.correct &&
                    "bg-green-500 bg-opacity-75"
                  }
                  ${
                    tile.status === TILE_STATUS.neutral &&
                    "bg-zinc-700  bg-opacity-35"
                  }`}
                  whileTap={{ scale: !locked ? 0.95 : 1 }}
                  whileDrag={{ scale: 1 }}
                  drag={!locked && !solved}
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
                    setBoard(validateBoard(board, correctBoard));
                  }}
                  onDragTransitionEnd={() => {
                    setDragDirection(undefined);
                    setLocked(false);
                    setTargetTile(null);
                  }}
                  data-coord={tile.coord}
                >
                  {/* span needed to allow for dynamic font size in relation to tile size */}
                  <span className="touch-none pointer-events-none select-none">
                    {tile.value.toUpperCase()}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
