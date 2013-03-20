grap.DoubleLine = function(n) {
    this.n = n;
    this.blink();
};

grap.DoubleLine.prototype = {
    _mapping: {
        // horizontal lines from button to top
        1: [[0, 7], [1, 7], [2, 7], [3, 7], [4, 7]],
        2: [[0, 6], [1, 6], [2, 6], [3, 6], [4, 6]],
        3: [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5]],
        4: [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]],
        5: [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]],
        // vertical lines from left to right
        6: [[0, 3], [0, 4], [0, 5], [0, 6], [0, 7]],
        7: [[1, 3], [1, 4], [1, 5], [1, 6], [1, 7]],
        8: [[2, 3], [2, 4], [2, 5], [2, 6], [2, 7]],
        9: [[3, 3], [3, 4], [3, 5], [3, 6], [3, 7]],
        10: [[4, 3], [4, 4], [4, 5], [4, 6], [4, 7]],
        // diagonal lines
        11: [[0, 7], [1, 6], [2, 5], [3, 4], [4, 3]],
        12: [[0, 3], [1, 4], [2, 5], [3, 6], [4, 7]]
    },

    toPositions: function() {
        return this._mapping[this.n];
    },

    /**
     * [Card] -> Boolean
     */
    match: function(cards) {
        cards = _.map(cards, function(c) { return [c.x, c.y]; });

        /**
         * I'm not sure if there's a better way to sort this
         * array. I'm not sure if we can expect Array.sort() to be
         * stable across different browsers, either.
         */
        if ((6 <= this.n) && (this.n <= 10)) {
            cards = cards.sort(function(a, b) { return a[1] - b[1]; });
        } else {
            cards = cards.sort(function(a, b) { return a[0] - b[0]; });
        }

        return JSON.stringify(this.toPositions()) == JSON.stringify(cards);
    },

    blink: function() {
        var pos = this.toPositions(),
            elm, anim;

        _.each(pos, function(p) {
            elm = grap.Screen.drawBox(p[0], p[1]);
            elm.attr({"stroke-width": 3, "stroke": "#ffbbcc"}).
                transform("s1.1").
                glow({"color": "#ffbbcc"});

            /**
             * FIXME: This is supposed to repeat the blinking animation.
             */
            anim = Raphael.animation({stroke: 'black'}, 1000, function() {
                this.attr({"stroke": "#ffbbcc"});
            });
            elm.animate(anim.repeat());
        });
    }
};
