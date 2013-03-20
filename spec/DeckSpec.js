describe("Deck", function() {
    var deck;

    describe("When the deck has 10 cards:", function() {
        beforeEach(function() {
            deck = new grap.Deck();
            for (var suit = 0; suit < 2; suit++) {
                for (var num = 1; num <= 5; num++) {
                    deck.addCard(new grap.Card(suit, num));
                }
            }
        });

        it("should be available", function() {
            expect(deck.available()).toBeTruthy();
        });

        it("should still be available after opening 8 cards", function() {
            for (var i = 1; i <= 8; i++) {
                deck.openCard();
            }
            expect(deck.available()).toBeTruthy();
        });

        it("should be unavailable after opening 9 cards", function() {
            for (var i = 1; i <= 9; i++) {
                deck.openCard();
            }
            expect(deck.available()).toBeFalsy();
        });
    });
});
