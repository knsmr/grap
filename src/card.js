grap.Card = function (suit, num) {
    if ((suit < 0) || (4 <= suit)) {
        throw("out of range");
    }
    this.suit = suit;
    this.num = num;
    this.focus = false;
    this.color = this.isRed() ? "#f33" : "#222";
};

function isCard(o) { return o instanceof grap.Card; };

grap.Card.generateAll = function() {
    var deck = [];
    for (var s = 0; s < 4; s++) {
        for(var n = 1; n <= 13; n++) {
            deck.push(new grap.Card(s, n));
        }
    }
    return deck;
};

grap.Card.prototype = {
    Suits: ['♠', '♥', '♦', '♣'],
    Faces: ['A', 'J', 'Q', 'K'],

    toString: function() {
        var s, f;

        // if it's a joker
        if (this.isJoker()) return "★★";

        s = this.Suits[this.suit];
        if (this.num == 1) {
            f = this.Faces[0];
        } else if (this.num >= 11) {
            f = this.Faces[this.num - 10];
        } else {
            f = this.num.toString();
        }
        return s + f;
    },

    isRed: function() {
        return ((this.suit == 1) || (this.suit == 2));
    },

    isJoker: function() {
        return this.num == 0;
    },

    place: function(x, y) {
        this.x = x;
        this.y = y;
        grap.Board.put(x, y, this);
        this.draw();
        return this;
    },

    draw: function() {
        grap.Screen.drawCard(this);
    },

    redraw: function() {
        this.rect.remove();
        this.draw();
    },

    move: function(x, y) {
        grap.Board.put(this.x, this.y, '');
        grap.Board.put(x, y, this);
        this.x = x;
        this.y = y;
        this.redraw();
        return this;
    },
    moveLeft:  function() { this.moveSideways(-1); },
    moveRight: function() { this.moveSideways( 1); },

    moveSideways: function(direction) {
        if (Game.State.isRunning) {
            var i = this.x + direction;
            if ((0 <= i) && (i <= 4)) {
                this.move(i, this.y);
            };
        }
    },

    dropHeight: function() {
        return grap.Board.topPosition(this.x) - 1;
    },

    isDroppable: function() {
        return (this.dropHeight() > 2);
    },

    drop: function() {
        if (!this.isDroppable()) return false;

        // TODO: fire a custome event like onDrop instead?
        this.focus = false;
        this.move(this.x, this.dropHeight());
        grap.Board.handCheck(this);
        grap.Board.selectFocus.glow(true);
        Game.State.dropped();
        Game.checkOver();
        return true;
    },

    glow: function() {
        var r = this.rect;
        r.animate({transform: 's1.2r15'}, 100);
        var g = this.rect[0].glow({
            width: 30,
            fill: false,
            opacity: 0.7,
            color: 'yellow'
        });

        setTimeout(function() {
            r.animate({transform: 's1'}, 50);
            g.remove();
        }, 1000);
    }
};
