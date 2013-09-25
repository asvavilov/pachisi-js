// ячейка доски
jQuery.extend(Pachisi, {Cell: function(board, safe, io, size) {
	// связь с доской
	this.board = board;
	// флаг островка безопасности
	this.safe = safe || false;
	// связанная ячейка перехода (input/output)
	this.io = io || null;
	// кол-во мест в ячейке
	this.size = size || 2;
	// места в ячейке
	this.places = [];
	for (var i = 0; i < this.size; i++) {
		this.places.push(null);
	}
}
});
