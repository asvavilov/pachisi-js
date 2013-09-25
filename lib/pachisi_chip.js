// фишка
jQuery.extend(Pachisi, {Chip: function(player) {
	// связь с игроком
	this.player = player;
	// связь с ячейкой
	this.cell = null;
	var self = this;
	// переход фишки к ячейке
	// !!! проверки на возможность перехода должны осуществляться ранее
	this.go = function(to_cell) {
		if (self.cell) {
			for (var i = 0; i < self.cell.places.length; i++) {
				if (self.cell.places[i] == self) {
					self.cell.places[i] = null;
					break;
				}
			}
		}
		self.cell = to_cell;
		for (var i = 0; i < self.cell.places.length; i++) {
			if (!self.cell.places[i]) {
				self.cell.places[i] = self;
				break;
			}
		}
	};
}
});
