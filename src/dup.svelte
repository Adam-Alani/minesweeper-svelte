<script>
    export let name;

    `
1. Array of N*M Size -> Three Presets -> Small, Medium, Large
2. 3 Difficulties -> Easy , Medium , Hard -> N0 of Mines increases
3. 3  states = { empty = 0 ; bomb = 'B' ; number = 1-8 ; flag = 'F' }
4. On right-click empty, -> remove all connected empties.
4.5 On right-click bomb, -> lose
(5. -> Different colors for diff numbers) `


    /// ======== Setup ======== ///
    let state = false;    //While true, game runs.
    let board = [[]];
    function generateBoard([m, n] , b) {
        board = [[]];
        for (let i = 0 ; i < n ; ++i) {
            board[i] = [];
            for (let j = 0 ; j < m ; ++j) {
                board[i][j] = 0;
            }
        }
        let bCount = 0;
        while (bCount < b) {
            let x =Math.floor(Math.random() * (board.length));
            let y = Math.floor(Math.random() * (board[0].length));
            if(board[x][y] === 0){
                board[x][y] = -1;
                bCount++;
            }
        }
        return board;
    }
    let cellsClicked = [];
    function countNeighbours(board , i , j) {
        let c = 0;

        const prevRow = board[i - 1];
        const currentRow = board[i]
        const nextRow = board[i + 1];

        [prevRow, currentRow, nextRow].forEach(row => {
            if (row) {
                if (row[j - 1] === -1) c++;
                if (row[j] === -1) c++;
                if (row[j + 1] === -1) c++;
            }
        })
        return c;
    }
    function update(board) {
        return board.map((a, i) => {
            return a.map((b, j) => {
                return b === -1 ? b : countNeighbours(board, i, j)
            })
        })
    }

    console.log(board)

</script>

<main>
    <h1>{update(board)}</h1>
    <div class="footer">
        <div class="buttonsRow">
            <div class="button-wrapper" style="width: 33.3%">
                <button on:click={() => {board = generateBoard([8,8] , 10)}} >Easy</button>
            </div><div class="button-wrapper" style="width: 33.3%">
            <button on:click={() => {board = generateBoard([16,16] , 40)}}>Medium</button>
        </div><div class="button-wrapper" style="width: 33.3%">
            <button on:click={() => {board = generateBoard([30,16] , 99)}}>Hard</button>
        </div>
        </div>
    </div>
    <h1 class="game-container">Shitty MineSweeper</h1>
    <div class="game-container">
        {#if state === true}
            <h1 class="end">You Lost</h1>
        {/if}
        <div>
            {#each board as row, i}
                <div class="row">
                    {#each row as cell, j}
                        {#if cell === 0}
                            <div class="cell "></div>
                        {:else if cell > 0}
                            <div class="cell num"></div>
                        {:else}
                            <div class="cell bomb"></div>
                        {/if}
                    {/each}
                </div>
            {/each}
        </div>
    </div>

</main>

<style>
    .footer{
        width: 100%;
        height: 75px;
        background-color: #66CCFF;
        margin: 0;
        padding: 0;
    }

    .buttonsRow{
        height: 50%;
        width: 100%;
        margin: 0;
        padding: 0;
    }

    .button-wrapper{
        display: inline-block;
        margin: 0;
        padding: 0;
    }

    button{
        height: 33px;
        width: 100%;
        margin: 2px;
    }


    .game-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;

    }
    .row {
        cursor: pointer;
        display: flex;

    }

    .cell {
        width: 20px;
        height: 20px;
        border: solid 1px #373737;;
    }
    .empty {
        background-color: #070707;
    }

    .bomb {
        border-radius: 10px;
        background-color: red;
    }

    .num {
        background-color: #66CCFF;
        border-radius: 10px;
    }

</style>
