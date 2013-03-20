grap.Decks = []; // a collection to store five decks.

grap.Deck = function(cards) {
    this._ptr = 0;
    this._deck = cards || [];
}

grap.Deck.prototype = {
    addCard: function(card) {
        this._deck.push(card);
        this._ptr++;
    },

    peekCard: function() {
        return this._deck[this._ptr - 1];
    },

    openCard: function() {
        this._ptr--;
        return this.peekCard();
    },

    available: function() {
        return (this._ptr > 1);
    },

    closedCards: function() {
        return this._ptr - 4;
    },

    nextThree: function() {
        var cards = [],
            c,
            p = this._ptr,
            range;
        // p: 5 -> 1,2,3
        // p: 4 -> 0,1,2
        // p: 3 -> 0,1
        // p: 2 -> 0
        // p: 1 -> null
        // p: 0 -> null
        if (p >= 4) {
            range = _.range(p - 4, p - 1);
        } else if (p == 3) {
            range = [0, 1];
        } else if (p == 2) {
            range = [0];
        } else {
            return null;
        }
        var that = this;
        _.each(range, function(i) {
            cards.push(_.clone(that._deck[i]));
        });
        return cards.reverse();
    }
};
