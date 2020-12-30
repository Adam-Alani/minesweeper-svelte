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






