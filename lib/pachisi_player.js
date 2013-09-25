// игрок
jQuery.extend(Pachisi, {Player: function(ind, ai, color) {
	// глобальный номер игрока
	this.ind = ind;
	// номер стартовой для текущего игрока ячейки на общей доске
	this.i_begin = this.q * ind;
	// номер конечной для текущего игрока ячейки на общей доске
	this.i_end = this.q * ind + 63;
	// компьютер или человек (Artifical Intelligent)
	this.ai = ai;
	// цвет игрока
	this.color = color;
	// фишки игрока
	this.chips = [
		new Pachisi.Chip(this),
		new Pachisi.Chip(this),
		new Pachisi.Chip(this),
		new Pachisi.Chip(this)
	];
	// доски игрока
	this.boards = [
		new Pachisi.Board(0, this, 1, null, null, {0: 4}),
		null,
		new Pachisi.Board(2, this, 8, null, null, {7: 4})
	];
	// расставляем фишки
	var self = this;
	this.chips.forEach(function(ch){
		ch.go(self.boards[0].cells[0]);
	});
}
});

