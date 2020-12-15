<script>
	export let name;

	`
1. Array of N*M Size -> Three Presets -> Small, Medium, Large
2. 3 Difficulties -> Easy , Medium , Hard -> N0 of Mines increases
3. 4  states = { empty = 0 ; bomb = -1 ; number = 1-8 ; flag = 'F'  }
3.5 Array structure => [ [ el , cellVisibility ] ]
4. On left-click empty, -> remove all connected empties.
4.5 On left-click bomb, -> lose
(5. -> Different colors for diff numbers) `


	/// ======== Setup ======== ///
	let state = false;    //While true, game runs.
	let board = [[]]
	function generateBoard(board , [m, n] , b) {
		for (let i = 0 ; i < n ; ++i) {
			board[i] = [];
			for (let j = 0 ; j < m ; ++j) {
				board[i][j] = [0, false];
			}
		}
		let bCount = 0;
		while (bCount < b) {
			let x =Math.floor(Math.random() * ((board.length)-1));
			let y = Math.floor(Math.random() * ((board[0].length)-1));
			if(board[x][y][0] === 0){
				board[x][y][0] = -1;
				bCount++;
			}
		}
		return board;
	}
	board = generateBoard(board , [30,16], 99);
	let cellsClicked = [];

	function countNeighbours(board) {
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
	board = countNeighbours(board);
	console.log(board)

	function showCell(i , j) {
		board[i][j][1] = true;
		if (board[i][j][0] === 0) {
			for (let k = -1; k <= 1 ; k++) {
				for (let y = -1; y <= 1 ; y++) {
					try {
						if (board[i+k][j+y][0] !== -1 && board[i+k][j+y][1] === false) {
							showCell(i+k , j+y)
						}
					}
					catch(msg){}
				}
			}
		}
	}


	function hideCell(i , j) {
		board[i][j][1] = false;
	}
</script>

<main>
	<h1>{board}</h1>

	<h1 class="game-container">Shitty MineSweeper</h1>
	<div class="game-container">
		{#if state === true}
			<h1 class="end">You Lost</h1>
		{/if}
		<div>
			{#each board as row, i}
				<div class="row">
					{#each row as cell, j}
						{#if board[i][j][1] === true}
							{#if board[i][j][0] === 0}
								<div on:contextmenu|preventDefault="{() => {hideCell(i,j)}}" class="cell empty "></div>
							{:else if board[i][j][0] > 0}
								<div on:contextmenu|preventDefault="{() => {hideCell(i,j)}}" class="cell num">{board[i][j][0]}</div>
							{:else}
								<div on:contextmenu|preventDefault="{() => {hideCell(i,j)}}" class="cell bomb"></div>
							{/if}
						{:else}
							<div on:click={()=> {showCell(i,j)}}   class="cell hidden "></div>
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

	.hidden {
		background-color: #cccccc;
	}

</style>
