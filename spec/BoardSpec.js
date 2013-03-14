describe("Board", function() {
    describe("When it is initialized with 2 double lines", function() {

	beforeEach(function() {
	    grap.Board.setDoubleLines(2);
	});

	it("should have 2 double lines", function() {
	    expect(grap.Board.dlines.length).toBe(2);
	});

	it("can be emptied", function() {
	    grap.Board.clearDoubleLines();
	    expect(grap.Board.dlines.length).toBe(0);
	});
    });

    describe("When it is initialized with 12 double lines", function() {

	beforeEach(function() {
	    grap.Board.setDoubleLines(12);
	});

	it("should have 12 double lines", function() {
	    expect(grap.Board.dlines.length).toBe(12);
	});

	it("should have 12 different line numbers", function() {
	    var numbers;
	    numbers = _.map(grap.Board.dlines, function(l) { return l.n; });

	    expect(_.uniq(numbers).length).toBe(12);
	});
    });

    describe("When there's a one pair completed at the bottom", function() {
	var p;

	beforeEach(function() {
	    /**
	     * FIXME: This is getting way too confusing. 'cards'
	     * represent an array of either Cards, positions, or
	     * suit:num pairs... Just like you define types for each,
	     * maybe I'd be better off using some sort of naming
	     * convention.
	    */
	    var cards = [[0, 1], [0, 2], [1, 2], [3, 5], [3, 8]],
                c, h = [];
	    for (var i = 0; i < 5; i++) {
		c = new grap.Card(cards[i][0], cards[i][1]);
		// FIXME: not working, something is wrong
//		c.place(1, 1);
		h.push(c);
	    }
	    p = new grap.Poker(h);
	});

	it("should add score 200pt", function() {
	    grap.Board.addScore(p);
	    expect(Game.State.score).toBe(200);
	});
    });
});
