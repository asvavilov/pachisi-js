// доска
jQuery.extend(Pachisi, {Board: function(ind, player, len, safes, ios, sizes) {
	// глобальный индекс доски
	this.ind = ind;
	// связь с игроком, если нужно
	this.player = player;
	// ячейки доски
	this.cells = [];
	// безопасные ячейки
	safes = safes || {};
	// переходные ячейки
	ios = ios || {};
	// размеры ячеек
	sizes = sizes || {};
	for (var i = 0; i < len; i++) {
		this.cells.push(new Pachisi.Cell(this, safes[i], ios[i], sizes[i]));
	}
}
});
