export function generateBoard(board , [m, n] , b) {
    for (let i = 0 ; i < n ; ++i) {
        board[i] = [];
        for (let j = 0 ; j < m ; ++j) {
            board[i][j] = [0, false];
        }
    }
    let bCount = 0;
    while (bCount < b) {
        let x =Math.floor(Math.random() * (board.length));
        let y = Math.floor(Math.random() * (board[0].length));
        if(board[x][y][0] === 0){
            board[x][y][0] = -1;
            bCount++;
        }
    }
    return board;
}

export function countNeighbours(board) {
    const dx = [1, 1, 1, 0, 0, -1, -1, -1];
    const dy = [1, 0, -1, 1, -1, 1, 0, -1];
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (board[row][col][0] === -1) {
                for (let i = 0 ; i < 8 ; i++) {
                    let nr = row + dy[i], nc = col + dx[i];
                    if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[row].length ) {
                        if (board[nr][nc][0] !== -1) {
                            board[nr][nc][0] += 1;
                        }
                    }
                }
            }
        }
    }
    return board
}