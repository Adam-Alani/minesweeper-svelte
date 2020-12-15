<script>
	import {onMount} from 'svelte';

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
			let x =Math.floor(Math.random() * (board.length));
			let y = Math.floor(Math.random() * (board[0].length));
			if(board[x][y][0] === 0){
				board[x][y][0] = -1;
				bCount++;
			}
		}
		return board;
	}
	board = generateBoard(board , [30,16], 60);
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

	//----------------------------//
	//--------- Commands ----------//

	function showCell(i , j) {
		if (board[i][j][0] === -1) {
			state = true;
		}
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

	function flagCell(i , j) {
		board[i][j][1] = 'F';
	}

	function chord(row , col) {
		const dx = [1, 1, 1, 0, 0, -1, -1, -1];
		const dy = [1, 0, -1, 1, -1, 1, 0, -1];
		let fcount = 0;
		if (board[row][col][0] >= 1) {
			for (let i = 0 ; i < 8 ; i++) {
				let nr = row + dy[i], nc = col + dx[i];
				if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[row].length ) {
					if (board[nr][nc][1] === 'F' ) {
						fcount += 1;
					}
				}
			}
		}
		if (fcount === board[row][col][0]) {
			for (let i = 0 ; i < 8 ; i++) {
				let nr = row + dy[i], nc = col + dx[i];
				if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[row].length ) {
					if (board[nr][nc][1] !== 'F') {
						showCell(nr, nc);
					}
					if (board[nr][nc][1] === 'F' && board[nr][nc][0] !== -1) {
						state = true;
					}
				}
			}
		}
		return board;
	}

	//------------------------//

	function newGame() {
		state = false;
		board = generateBoard(board , [30,16], 80);
		board = countNeighbours(board);
	}


</script>

<svelte:window
	on:keydown={(press) => {
		if (press.key === 'Enter') {
			newGame();
		}
	}}/>


<main>
	<h1 class="game-container">Shitty MineSweeper</h1>
	<div class="game-container">
		{#if state === true}
			<h1 class="end">You Lost</h1>
			<h3 class="end">Press Enter to try again</h3>
		{/if}
		<div>
			{#each board as row, i}
				<div class="row">
					{#each row as cell, j}
						{#if state === false}
							{#if board[i][j][1] === true}
								{#if board[i][j][0] === 0}
									<div on:contextmenu|preventDefault class="cell empty "></div>
								{:else if board[i][j][0] > 0}
									<div on:contextmenu|preventDefault on:click={()=> {chord(i,j)}}  class="cell num">{board[i][j][0]}</div>
								{:else}
									<div on:contextmenu|preventDefault="{() => {hideCell(i,j)}}" class="cell bomb"></div>
								{/if}
							{:else if board[i][j][1] === 'F'}
								<div on:contextmenu|preventDefault="{() => {hideCell(i,j)}}" class="cell flag"></div>
							{:else}
								<div on:click={()=> {showCell(i,j)}} on:contextmenu|preventDefault="{() => {flagCell(i,j)}}" class="cell hidden "></div>
							{/if}


						{:else}
							<div class = "lost">
							{#if board[i][j][0] === 0}
								<div on:contextmenu|preventDefault class="cell empty "></div>
							{:else if board[i][j][0] > 0}
								<div on:contextmenu|preventDefault class="cell num">{board[i][j][0]}</div>
							{:else}
								<div on:contextmenu|preventDefault="{() => {hideCell(i,j)}}" class="cell bomb"></div>
							{/if}
							</div>
						{/if}
					{/each}
				</div>
			{/each}
		</div>
	</div>

</main>

<style>

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
		box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
		-webkit-box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
		-moz-box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
	}

	.cell {
		width: 20px;
		height: 20px;
		border: solid 1px #4c4c4c;;
		border-radius: 27%;
	}
	.empty {
		background-color: #373737;
		cursor: default;
	}

	.bomb {
		border-radius: 100%;
		background-color: red;

	}

	.num {
		font-size: 11px;
		background-color: #66CCFF;
		border-radius: 100%;
		cursor: default;
		display: flex; /* or inline-flex */
		align-items: center;
		justify-content: center;
		color: white;
	}

	.hidden {
		background-color: #181818;
	}

	.flag {
		background-color: greenyellow;
	}
	h1 {
		color: #ffffff;
		font-size: 4em;
		font-weight: 600;
	}
	h3 {
		color: #ffffff;
	}
	.end {
		position: absolute;
		z-index: 1000;
		top: 25%;
		left: 50%;
		transform: translate(-50% , -25%);
		-webkit-transform: translate(-50%, -25%);

	}

	.lost {
		cursor: default;
		opacity: 25%;
	}

	.cell:hover {
		filter: brightness(150%);
	}
</style>
