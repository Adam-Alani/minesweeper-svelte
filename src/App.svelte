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
	function generateBoard([n, m] , b) {
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



</script>

<main>
	<div class="footer">
		<div class="buttonsRow">
			<div class="button-wrapper" style="width: 33.3%">
				<button on:click={generateBoard([8,8] , 10)} >Easy</button>
			</div><div class="button-wrapper" style="width: 33.3%">
			<button on:click={generateBoard([16,16] , 40)}>Medium</button>
		</div><div class="button-wrapper" style="width: 33.3%">
			<button on:click={generateBoard([30,16] , 99)}>Hard</button>
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
							<div class="cell empty"></div>
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
		border-radius: 50px;
		box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
		-webkit-box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
		-moz-box-shadow: 2px 0px 25px 0px rgba(0,0,0,0.55);
	}

	.cell {
		width: 20px;
		height: 20px;
	}
	.empty {
		background-color: #181818;
	}

</style>
