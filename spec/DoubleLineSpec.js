describe("DoubleLine", function() {
    var dline, n;

    describe("When it is initialized with 1", function() {
	it("should give the bottom line positions as an array", function() {
	    dline = new grap.DoubleLine(1);
	    expect(dline.toPositions()).toEqual([[0, 7], [1, 7], [2, 7], [3, 7], [4, 7]]);
	});
    });

    describe("When cards are given", function() {
	it("should return true if they are in line with this", function() {
	    var card, cards = [];
	    dline = new grap.DoubleLine(1);
	    _.each([[0, 7], [1, 7], [2, 7], [3, 7], [4, 7]], function(pos) {
		card = new grap.Card(1, 1);
		card.x = pos[0];
		card.y = pos[1];
		cards.push(card);
	    });
	    cards = _.shuffle(cards);

	    expect(dline.match(cards)).toBeTruthy();
	});
    });
});
