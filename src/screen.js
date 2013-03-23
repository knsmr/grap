grap.Screen = {
    shim: 7,       // defines px between cards
    width: 300,
    height: 0,     // will be calculated from the width
    deckSpace: 0,  // px to make some room to draw decks
    openDecks: [[], [], [], [], []],

    init: function() {
        this.cardSize   = (this.width - this.shim * 6) / 5;
        this.height     = (this.cardSize + this.shim) * 11 + this.shim;
        this.deckSpace = (this.cardSize + this.shim) * 3;

        if (this.paper) { this.paper.remove(); };
        this.paper = Raphael("paper", this.width, this.height);
        this.paper.rect(0, 0, this.width, this.height).attr({"fill": "#00bb00"});
        this.drawMatrix();
        this.drawFocusLine();
    },

    drawBox: function(x, y) {
        var elm;
        elm = this.paper.rect(this.absolutePos(x),
                              this.absolutePos(y) + this.deckSpace,
                              this.cardSize, this.cardSize);
        return elm;
    },

    drawMatrix: function() {
        // draw the 5 x 5 matrix
        for (var y = 3; y <= 7; y++) {
            for (var x = 0; x < 5; x++) {
                this.drawBox(x, y);
            }
        }
    },

    drawFocusLine: function() {
        this.paper.rect(1,
                        this.absolutePos(3) - this.shim / 2,
                        this.width - 1,
                        this.cardSize + this.shim).
            attr({"stroke-width": 3, "fill": "#ffffcc"});
    },

    // TODO: merge two message functions and take options instead
    flashMessage: function(msg, option) {
        var fontSize = 46 - msg.length;
        var m = this.paper.text(30, 300, msg).
            attr({'font-size': 30, 'stroke': '#cc0000',
                  'stroke-width': 2, 'fill': 'white'});

        if (option) {
            m.animate({'font-size': fontSize, x: 150}, 100, function() {
                window.setTimeout(function() {
                    m.toFront();
                    m.animate({'font-size': 20, y: 0}, 700, function() { m.remove(); });
                }, 800);
            });
        } else {
            m.animate({'font-size': fontSize, x: 150}, 100, function() {
                window.setTimeout(function() { m.remove(); }, 1000);
            });
        }
    },

    showMessage: (function() {
        var _message = "",
            raphaelMsg;
        return (function(msg) {
            if (msg === "") {
                _message = "";
                raphaelMsg.remove();
            } else {
                raphaelMsg = this.paper.text(150, 300, msg).attr({'font-size': 18});
            }
        });
    })(),

    drawDeck: function(idx) {
        var cards = grap.Decks[idx].nextThree(),
            c;

        _.each(this.openDecks[idx], function(c) {
            c.rect.remove();
        });
        if (cards === null) return;

        this.openDecks[idx] = [];
        for (var i = cards.length - 1; i >= 0; i--) {
            cards[i].x = idx;
            cards[i].y = 2 - i;
            c = grap.Screen.drawCardOnDeck(cards[i]);
            this.openDecks[idx].push(c);
        }
        grap.Board.selectFocus.glow(false);

        // draw cards that are closed
        var count = grap.Decks[idx].closedCards();
        if (count > 0) this.drawClosedCards(count, idx);
    },

    drawClosedCards: function(n, idx) {
        var x = this.absolutePos(idx),
            y, r;
        for (var i = n; i > 0; i--) {
            y = this.cardSize - (i * 4);
            r = this.paper.rect(x, y, this.cardSize, 2);
            // store the raphael elem to remove it later the same
            // way as cards.
            this.openDecks[idx].push({rect: r});
        }
    },

    drawCardOnDeck: function(card) {
        // card.y could be either 0, 1, 2
        var scale = 1 - ((3 - card.y) * 0.04);
        if (card.y == 0) card.y = 0.8;
        if (card.y == 1) card.y = 1.4;
        return this.drawCard(card, true, scale);
    },

    drawCard: function(card, deck, scale) {
        var abs_x = this.absolutePos(card.x),
            abs_y = this.absolutePos(card.y),
            s = 1.0;

        // if it should be drawn on the board, not deck area.
        if (typeof(deck) === "undefined") { abs_y += grap.Screen.deckSpace; }
        // if the scale arg is given
        if (typeof(scale) === "number") { s = scale; }

        // a cardRect consists of two objects: a rect and text
        var r = this.paper.rect(abs_x, abs_y, this.cardSize, this.cardSize);
        r.attr({"stroke-width": 3, "fill": "#ffffff"});
        var t = this.paper.text(abs_x + this.cardSize / 2, abs_y + this.cardSize / 2, card.toString());
        t.attr({fill: card.color, "font-size": this.cardSize - this.shim * 4});

        // Group the rectangle and the text. Also, set the glowing
        // effect on the rectangle if the card has a focus.
        card.rect = this.paper.set();
        if (card.focus) {
            var g = r.glow({
                width: 10,
                fill: true,
                opacity: 0.9,
                color: 'red'
            });
        };
        card.rect.push(r, t, g);
        card.rect.transform("s" + scale);
        return card;
    },

    moveCard: function(card, dx, dy) {
        var abs_dx =  dx * (this.cardSize + this.shim),
            abs_dy =  dy * (this.cardSize + this.shim),
            cmd = "t" + abs_dx + "," + abs_dy;

        card.rect.animate({transform: cmd}, 80);
        var x = card.x,
            y = card.y;
        var c = this.drawCard(card.x + dx, card.y + dy, card);
        alert(); // this function is not used at time moment.
        return c;
    },

    absolutePos: function(n) {
        return (this.shim + n * (this.cardSize + this.shim));
    }
};
