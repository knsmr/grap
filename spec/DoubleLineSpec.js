describe("DoubleLine", function() {
    var dline, n;

    describe("When it is initialized with numbers", function() {
	it("should give the bottom line positions as an array", function() {
	    dline = new grap.DoubleLine(1);
	    expect(dline.toPositions()).toEqual([[0, 7], [1, 7], [2, 7], [3, 7], [4, 7]]);
	});

	it("should give the top line positions as an array", function() {
	    dline = new grap.DoubleLine(5);
	    expect(dline.toPositions()).toEqual([[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]]);
	});

	it("should give the right most line positions as an array", function() {
	    dline = new grap.DoubleLine(6);
	    expect(dline.toPositions()).toEqual([[0, 3], [0, 4], [0, 5], [0, 6], [0, 7]]);
	});

	it("should give the diagonal line positions as an array", function() {
	    dline = new grap.DoubleLine(11);
	    expect(dline.toPositions()).toEqual([[0, 7], [1, 6], [2, 5], [3, 4], [4, 3]]);
	});
    });

    describe("When cards are given", function() {
	it("should return true if they are in line with a horizontal line", function() {
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

	it("should return true if they are in line with a vertical line", function() {
	    var card, cards = [];
	    dline = new grap.DoubleLine(6);
	    _.each([[0, 3], [0, 4], [0, 5], [0, 6], [0, 7]], function(pos) {
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
