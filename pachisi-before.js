var Pachisi = function() {
		// расстояние между пользователями
		this.q = 17;
		// массив игроков
		var players = [
			new Pachisi.Player(0, false, 'green'),
			new Pachisi.Player(1, true, 'yellow'),
			new Pachisi.Player(2, true, 'red'),
			new Pachisi.Player(3, true, 'blue')
		];

		// карта ячеек безопасности
		var safes = {
			0: players[0],
			7: true,
			12: true,
			17: players[1],
			24: true,
			29: true,
			34: players[2],
			41: true,
			46: true,
			51: players[3],
			58: true,
			63: true
		};

		// карта ячеек-переходов
		var ios = {
			0: players[0].boards[0].cells.last(),
			12: players[1].boards[2].cells.first(),
			17: players[1].boards[0].cells.last(),
			29: players[2].boards[2].cells.first(),
			34: players[2].boards[0].cells.last(),
			46: players[3].boards[2].cells.first(),
			51: players[3].boards[0].cells.last(),
			63: players[0].boards[2].cells.first()
		};

		//общая глобальная доска
		var board = new Pachisi.Board(1, null, 68, safes, ios);

		// связь игроков с общей доской и связи ячеек-переходов с общей доской
		players.forEach(function(player){
			player.boards[0].cells.last().io = board.cells[player.i_begin];
			player.boards[1] = board;
			player.boards[2].cells.first().io = board.cells[player.i_end];
		});

		var dice = new Pachisi.Dice();

		// FIXME переделать инициализацию элементов управления
		// инициализация элементов управления
		var controls = function() {
			$('#dice_drop').click(function() {
				dice.drop();
				console.log(dice.pair[0], dice.pair[1]);
			});
		}
		controls();

		// FIXME отделить и переделать перерисовку
		// перерисовка
		var paint = function() {
			var $board_cells = $('#board_cells');
			$board_cells.html('');
			var $tpl_cell = $('#tpl_cell').clone(true, true).removeAttr('id');
			var $tpl_place_tpl = $tpl_cell.find('.place');
			var $tpl_place = $tpl_place_tpl.clone(true, true).show();
			$tpl_place_tpl.remove();
			board.cells.forEach(function(cell){
				var $cell = $tpl_cell.clone(true, true);
				var $places = $cell.find('.place-cells');
				var $place = $tpl_place.clone(true, true);
				for (var i = 0; i < cell.size; i++) {
					var pl = $place.clone(true, true).addClass('place_'+i);
					if (cell.places[i]) {
						pl.addClass('chip-'+cell.places[i].player.color);
					}
					$places.append(pl);
				}
				if (cell.safe) {
					$cell.addClass('safe');
					if (cell.safe.constructor == Pachisi.Player) {
						$cell.css('backgroundColor', cell.safe.color);
					}
				}
				if (cell.io) {
					var $subboard = $cell.find('.cell-'+['in', '', 'out'][cell.io.board.ind]);
					cell.io.board.cells.forEach(function(cell2){
						var $subcell = $tpl_cell.find('.place-cells').clone(true, true).css('backgroundColor', cell.io.board.player.color);
						for (var i = 0; i < cell2.size; i++) {
							var pl = $tpl_place.clone(true, true).addClass('place_'+i);
							if (cell2.places[i]) {
								pl.addClass('chip-'+cell2.places[i].player.color);
							}
							$subcell.append(pl);
						}
						$subboard.append($subcell);
					});
				}
				$board_cells.append($cell);
			});
		}
		// drawing...
		paint();
		
};
