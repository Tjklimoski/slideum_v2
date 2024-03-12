// global variable that saves the correct board

// funciton that randomizes board, validates it, and returns the starting board

// function that validates a board passed in --> returns a new baord with status' set

// VALIDATION HELPER FUNCS
// function that gets all words on passed in board
// checks for close (has a matching word on the board)
// checks for correct (has a matching word in the write location)

export const TILE_STATUS = {
  neutral: "neutral", // ⬛
  close: "close", //.... 🟨
  correct: "correct", // 🟩
} as const;

export interface AllWords {
  rows: string[];
  cols: string[];
}

export interface Tile {
  value: string;
  coord: string;
  rowIndex: number;
  colIndex: number;
  status: keyof typeof TILE_STATUS;
}

// export class GameLogic {
//   correctBoard: Tile[];
//   size: number;

//   constructor(board: Tile[]) {
//     console.log(board);
//     this.correctBoard = board;
//     this.size = Math.sqrt(board.length);
//   }

//   randomizeBoard(): Tile[] {
//     const randomizedBoard = [...this.correctBoard];
//     let currentIndex = this.correctBoard.length;
//     let randomIndex;

//     while (currentIndex > 0) {
//       randomIndex = Math.floor(Math.random() * currentIndex);
//       currentIndex--;

//       [
//         randomizedBoard[currentIndex].value,
//         randomizedBoard[randomIndex].value,
//       ] = [
//         randomizedBoard[randomIndex].value,
//         randomizedBoard[currentIndex].value,
//       ];
//     }

//     return randomizedBoard;
//   }

//   validateBoard(board: Tile[]) {
//     if (board.length !== this.correctBoard.length)
//       throw new Error("Invalid board passed");

//     let clientTiles = board;

//     console.log("CLIENT TILES: ", clientTiles);
//     const correctBoardWords = this.getWords(this.correctBoard);
//     const clientBoardWords = this.getWords(board);

//     // compare to find shared words - mark tiles yellow
//     clientTiles = this.markCloseWords(
//       correctBoardWords,
//       clientBoardWords,
//       clientTiles
//     );

//     console.log("CLIENT TILES AFTER CLOSE: ", clientTiles);

//     // compare to find shared words in correct position - mark tiles green
//     clientTiles = this.markCorrectWords(
//       correctBoardWords,
//       clientBoardWords,
//       clientTiles
//     );

//     // return the updates board
//     return clientTiles;
//   }

//   getWords(board: Tile[]) {
//     const words: AllWords = {
//       rows: [],
//       cols: [],
//     };

//     for (let i = 0; i < Math.sqrt(board.length); i++) {
//       const startingRowIndex = i * this.size;
//       const startingColIndex = i;

//       let rowWord = "";
//       let colWord = "";

//       // build rowWord
//       for (let j = startingRowIndex; j < startingRowIndex + this.size; j++) {
//         rowWord += board[j].value;
//       }

//       // build colWord
//       for (let k = 0; k < this.size; k++) {
//         const index = startingColIndex + k * this.size;
//         colWord += board[index].value;
//       }

//       words.rows[i] = rowWord;
//       words.cols[i] = colWord;
//     }

//     return words;
//   }

//   markCloseWords(
//     correctBoardWords: AllWords,
//     clientBoardWords: AllWords,
//     clientTiles: Tile[]
//   ): Tile[] {
//     const allCorrectWords = [
//       ...correctBoardWords.rows,
//       ...correctBoardWords.cols,
//     ];
//     clientBoardWords.rows.forEach((word, i) => {
//       if (allCorrectWords.includes(word)) {
//         const startingIndex = i * this.size;
//         for (let i = startingIndex; i < startingIndex + this.size; i++) {
//           clientTiles[i].status = TILE_STATUS.close;
//         }
//       }
//     });

//     clientBoardWords.cols.forEach((word, i) => {
//       if (allCorrectWords.includes(word)) {
//         const startingIndex = i;
//         for (let i = 0; i < this.size; i++) {
//           const index = startingIndex + i * this.size;
//           clientTiles[index].status = TILE_STATUS.close;
//         }
//       }
//     });

//     return clientTiles;
//   }

//   markCorrectWords(
//     correctBoardWords: AllWords,
//     clientBoardWords: AllWords,
//     clientTiles: Tile[]
//   ): Tile[] {
//     clientBoardWords.rows.forEach((word, i) => {
//       if (word === correctBoardWords.rows[i]) {
//         const startingIndex = i * this.size;
//         for (let i = startingIndex; i < startingIndex + this.size; i++) {
//           clientTiles[i].status = TILE_STATUS.correct;
//         }
//       }
//     });

//     clientBoardWords.cols.forEach((word, i) => {
//       if (word === correctBoardWords.cols[i]) {
//         const startingIndex = i;
//         for (let i = 0; i < this.size; i++) {
//           const index = startingIndex + i * this.size;
//           clientTiles[index].status = TILE_STATUS.correct;
//         }
//       }
//     });

//     return clientTiles;
//   }
// }

export function randomizeBoard(board: Tile[]): Tile[] {
  const randomizedBoard = board.map(tile => ({ ...tile }));
  let currentIndex = board.length;
  let randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [randomizedBoard[currentIndex].value, randomizedBoard[randomIndex].value] =
      [randomizedBoard[randomIndex].value, randomizedBoard[currentIndex].value];
  }

  return randomizedBoard;
}

export function validateBoard(board: Tile[], correctBoard: Tile[]): Tile[] {
  if (board.length !== correctBoard.length)
    throw new Error("Invalid board passed");

  const correctTiles = correctBoard.map(tile => ({ ...tile }));
  let clientTiles = board.map(tile => ({ ...tile }));

  const correctBoardWords = getWords(correctTiles);
  const clientBoardWords = getWords(board);

  console.log(correctBoardWords);

  clientTiles = markAllNeutral(clientTiles);

  // compare to find shared words - mark tiles yellow
  clientTiles = markCloseWords(
    correctBoardWords,
    clientBoardWords,
    clientTiles
  );

  // compare to find shared words in correct position - mark tiles green
  clientTiles = markCorrectWords(
    correctBoardWords,
    clientBoardWords,
    clientTiles
  );

  // return the updates board
  return clientTiles;
}

function getWords(board: Tile[]) {
  const size = Math.sqrt(board.length);
  const words: AllWords = {
    rows: [],
    cols: [],
  };

  for (let i = 0; i < size; i++) {
    const startingRowIndex = i * size;
    const startingColIndex = i;

    let rowWord = "";
    let colWord = "";

    // build rowWord
    for (let j = startingRowIndex; j < startingRowIndex + size; j++) {
      rowWord += board[j].value;
    }

    // build colWord
    for (let k = 0; k < size; k++) {
      const index = startingColIndex + k * size;
      colWord += board[index].value;
    }

    words.rows[i] = rowWord;
    words.cols[i] = colWord;
  }

  return words;
}

function markAllNeutral(clientTiles: Tile[]): Tile[] {
  return clientTiles.map(tile => ({ ...tile, status: TILE_STATUS.neutral }));
}

function markCloseWords(
  correctBoardWords: AllWords,
  clientBoardWords: AllWords,
  clientTiles: Tile[]
): Tile[] {
  const size = Math.sqrt(clientTiles.length);

  const allCorrectWords = [
    ...correctBoardWords.rows,
    ...correctBoardWords.cols,
  ];
  clientBoardWords.rows.forEach((word, i) => {
    if (allCorrectWords.includes(word)) {
      const startingIndex = i * size;
      for (let i = startingIndex; i < startingIndex + size; i++) {
        clientTiles[i].status = TILE_STATUS.close;
      }
    }
  });

  clientBoardWords.cols.forEach((word, i) => {
    if (allCorrectWords.includes(word)) {
      const startingIndex = i;
      for (let i = 0; i < size; i++) {
        const index = startingIndex + i * size;
        clientTiles[index].status = TILE_STATUS.close;
      }
    }
  });

  return clientTiles;
}

function markCorrectWords(
  correctBoardWords: AllWords,
  clientBoardWords: AllWords,
  clientTiles: Tile[]
): Tile[] {
  const size = Math.sqrt(clientTiles.length);

  clientBoardWords.rows.forEach((word, i) => {
    if (word === correctBoardWords.rows[i]) {
      const startingIndex = i * size;
      for (let i = startingIndex; i < startingIndex + size; i++) {
        clientTiles[i].status = TILE_STATUS.correct;
      }
    }
  });

  clientBoardWords.cols.forEach((word, i) => {
    if (word === correctBoardWords.cols[i]) {
      const startingIndex = i;
      for (let i = 0; i < size; i++) {
        const index = startingIndex + i * size;
        clientTiles[index].status = TILE_STATUS.correct;
      }
    }
  });

  return clientTiles;
}

export function isSolved(board: Tile[]): boolean {
  return board.every(tile => tile.status === TILE_STATUS.correct);
}
