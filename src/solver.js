export function randomBegin(board) {
    let nextMove = [7,15];
    if (board[nextMove[0]][nextMove[1]][0] === 1) {
        if (15 - nextMove[0] > 7 - nextMove[1]) {
            nextMove[0] += 1;
        }
        else {
            nextMove[1] += 1;
        }
    }
    return nextMove;
}

export function countUnmarkedNeighbours(i,j , board) {
    let unmarked = [];
    let unflagged = [];
    const dx = [1, 1, 1, 0, 0, -1, -1, -1];
    const dy = [1, 0, -1, 1, -1, 1, 0, -1];
    for (let x = 0 ; x < 8 ; x++) {
        let nr = i + dy[x], nc = j + dx[x];
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[i].length ) {
            if (board[nr][nc][1] === false || board[nr][nc][1] === "F" ) {
                unmarked.push([nr,nc]);
            }
            if (board[nr][nc][1] === false) {
                unflagged.push([nr,nc])
            }
        }
    }
    return [unmarked, unflagged];
}
export function countFlags(i,j , board) {
    let flags = 0;
    const dx = [1, 1, 1, 0, 0, -1, -1, -1];
    const dy = [1, 0, -1, 1, -1, 1, 0, -1];
    for (let x = 0 ; x < 8 ; x++) {
        let nr = i + dy[x], nc = j + dx[x];
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[i].length ) {
            if (board[nr][nc][1] === "F" ) {
                flags++
            }
        }
    }
    return flags;
}

export function getOpenCells(board) {
    let possCells = [];
    for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[i].length; j++) {
            let [unmarked, unflagged] =  countUnmarkedNeighbours(i , j , board)
            if (board[i][j][1] === false || (board[i][j][0] === 0 && board[i][j][1] === true) || unflagged.length === 0) {
                continue
            }
            possCells.push([i,j]);
        }
    }
    return possCells;
}

export function bombEqualNum(possCells, board) {
    let markedCells = []
    for (let i = 0; i < possCells.length; i++) {
        let [unmarked, flagged] = countUnmarkedNeighbours(possCells[i][0],possCells[i][1], board)
        if (unmarked.length === board[possCells[i][0]][possCells[i][1]][0] ) {
            markedCells.push(unmarked);
        }

    }
    return markedCells;
}

`
Calculate probability of all arrangements, and check which one has best prob, pick that arrangement.
`

export function randomGuess(possCells,board) {
    possCells.sort((a,b) => (board[a[0]][a[1]][0] - countUnmarkedNeighbours(a[0],a[1],board)[0].length) - (board[b[0]][b[1]][0]-countUnmarkedNeighbours(b[0],b[1], board)[0].length))
    const cell = possCells[0];
    let [neighbours, _] = countUnmarkedNeighbours(cell[0],cell[1], board )
    let guess = neighbours[Math.floor(Math.random() * neighbours.length)];
    return guess;
}


export function oneDoubleTwoOne(possCells, board) {
    let toFlag = [];
    let toOpen = [];
    for (let i = 0; i < possCells.length; i++) {
        let [x,y] = possCells[i];
        if (board[x][y][0] - countFlags(x,y,board) === 1 && board[x][y+1][0] - countFlags(x,y,board) === 2 && board[x][y+2][0] - countFlags(x,y,board) === 2  && board[x][y+3][0] - countFlags(x,y,board) === 1 ) {
            if (x === 0 || (x > 0 && board[x - 1][y][1] !== false && board[x - 1][y + 1][1] !== false && board[x - 1][y + 2][1] !== false && board[x-1][y+3][1] !== false)) {
                toOpen.push([x+1, y])
                toOpen.push([x+1, y+3])
                toFlag.push([x+1, y+1])
                toFlag.push([x+1, y+2])
            }
            if (x === board.length-1 || (x < board.length - 1 && board[x + 1][y][1] !== false && board[x + 1][y + 1][1] !== false && board[x + 1][y + 2][1] !== false && board[x+1][y+3][1] !== false)) {
                toOpen.push([x-1, y])
                toOpen.push([x-1, y+3])
                toFlag.push([x-1, y+1])
                toFlag.push([x-1, y+2])
            }

        }
        if (board[x][y][0] - countFlags(x,y,board) === 1 && board[x+1][y][0] - countFlags(x,y,board) === 2 && board[x+2][y][0] - countFlags(x,y,board) === 2  && board[x+3][y][0] - countFlags(x,y,board) === 1 ) {
            if (y === 0 || (y > 0 && board[x][y - 1][1] !== false && board[x + 1][y - 1][1] !== false && board[x + 2][y - 1][1] !== false && board[x+3][y-1][1] !== false)) {
                toOpen.push([x, y+1])
                toOpen.push([x+3, y+1])
                toFlag.push([x+1, y+1])
                toFlag.push([x+2, y+1])
            }
            if (y === board.length-1 ||  (y < board.length - 1 && board[x][y + 1][1] !== false && board[x + 1][y + 1][1] !== false && board[x + 2][y + 1][1] !== false && board[x+3][y+1][1] !== false)) {
                toOpen.push([x, y-1])
                toOpen.push([x+3, y-1])
                toFlag.push([x+1, y-1])
                toFlag.push([x+2, y-1])
            }

        }

    }

    return [toFlag, toOpen]
}

export function oneTwoOne(possCells, board) {
    let toFlag = [];
    let toOpen = [];
    for (let i = 0; i < possCells.length; i++) {
        let [x,y] = possCells[i];
        if (y+2 < board[0].length ) {
            if (board[x][y][0] - countFlags(x,y,board) === 1 && board[x][y + 1][0]  - countFlags(x,y+1,board) === 2 && board[x][y + 2][0]  - countFlags(x,y+2,board) === 1) {
                if (x === 0 || (x > 0 && board[x - 1][y][1] !== false && board[x - 1][y + 1][1] !== false && board[x - 1][y + 2][1] !== false)) {
                    toOpen.push([x + 1, y + 1])
                    toFlag.push([x + 1, y])
                    toFlag.push([x + 1, y + 2])
                }
                if (x === board.length - 1 || (x < board.length - 1 && board[x + 1][y][1] !== false && board[x + 1][y + 1][1] !== false && board[x + 1][y + 2][1] !== false)) {
                    toOpen.push([x - 1, y + 1])
                    toFlag.push([x - 1, y])
                    toFlag.push([x - 1, y + 2])
                }

            }
        }
        if (x+2 < board.length) {
            if (board[x][y][0]  - countFlags(x,y,board) === 1 && board[x + 1][y][0]  - countFlags(x+1,y,board) === 2 && board[x+2][y][0]  - countFlags(x+2,y,board) === 1) {
                if (y === 0 || (y > 0 && board[x][y - 1][1] !== false && board[x + 1][y - 1][1] !== false && board[x + 2][y - 1][1] !== false)) {
                    toOpen.push([x + 1, y + 1])
                    toFlag.push([x, y + 1])
                    toFlag.push([x + 2, y + 1])
                }
                if (y === board.length - 1 || (y < board.length - 1 && board[x][y + 1][1] !== false && board[x + 1][y + 1][1] !== false && board[x + 2][y + 1][1] !== false)) {
                    toOpen.push([x + 1, y - 1])
                    toFlag.push([x, y - 1])
                    toFlag.push([x + 2, y - 1])
                }

            }
        }

    }

    return [toFlag, toOpen]
}






