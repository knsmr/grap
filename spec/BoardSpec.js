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

        afterEach(function() {
            grap.Board.clearDoubleLines();
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

        afterEach(function() {
            Game.State.init();
        });

        beforeEach(function() {
            var suitnum = [[0, 1], [0, 2], [1, 2], [3, 5], [3, 8]],
                card, cards = [];
            for (var i = 0; i < 5; i++) {
                card = new grap.Card(suitnum[i][0], suitnum[i][1]);
                card.place(i, 7);
                cards.push(card);
            }
            p = new grap.Poker(cards);
        });

        it("should add score 200pt", function() {
            grap.Board.addScore(p);
            expect(Game.State.score).toBe(200);
        });

        describe("When the bottom line is a double line", function() {

            beforeEach(function() {
                grap.Board.setDoubleLines(1);
                grap.Board.dlines[0].n = 1;
            });

            it("should add score 400pt", function() {
                grap.Board.addScore(p);
                expect(Game.State.score).toBe(400);
            });
        });
    });
});
