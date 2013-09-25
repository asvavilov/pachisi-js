// кости
jQuery.extend(Pachisi, {Dice: function() {
	this.pair = [null, null];
	self = this;
	this.drop = function() {
		for (var i = 0; i < self.pair.length; i++) {
			self.pair[i] = Math.round(Math.random() * 5 + 1);
		}
	};
}
});
