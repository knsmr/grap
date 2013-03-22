grap.Board = {
    ci: 2,            // the index of the deck to choose from.
    selectedCard: '', // the card to drop in the dropzone.
    dlines: [],        // store lines where the score will be doubled

    init: function() {
        this._b = [['', '', '', '', ''], // line 0 : choose zone
                   ['', '', '', '', ''], // line 1 : dropzone
                   ['', '', '', '', ''], // line 2 : blank
                   ['', '', '', '', ''], // 3..7: the matrix
                   ['', '', '', '', ''], // 4
                   ['', '', '', '', ''], // 5
                   ['', '', '', '', ''], // 6
                   ['', '', '', '', '']]; // 7
        this.chooseLine = this._b[0];
        this.prepareDecks();
        this.cs = 2;
        this.selectFocus.glow(true);
        this.setupDoubleLines();

        Game.State.isInDropzone = false;
        Game.State.isChoosingTheDeck = true;

//        setInterval(this.forceDrop, 200);
    },

    put: function(x, y, card) {
        this._b[y][x] = card;
    },

    setupDoubleLines: function() {
        var n;
        this.clearDoubleLines();
        n = Game.Stage[Game.State.stage].dline;
        this.setDoubleLines(n);
    },

    prepareDecks: function() {
        for (var i = 0; i < 5; i++) {
            this.chooseLine[i] = grap.Decks[i].peekCard().place(i, 0);
        }
        for (i = 0; i < 5; i++) {
            grap.Screen.drawDeck(i);
        }
    },

    openNextCard: function(i) {
        if (grap.Decks[i].available()) {
            grap.Decks[i].openCard().place(i, 0);
        } else {
            var availableDecks = [],
                left, right;
            for (var d = 1; d <= 4; d++) {
                left  = grap.Board.ci - d;
                if ((left >= 0) && grap.Decks[left].available()) {
                    return grap.Board.ci -= d;
                }
                right = grap.Board.ci + d;
                if ((right <= 4) && grap.Decks[right].available()) {
                    return grap.Board.ci += d;
                }
            }
        }
    },

    closestDroppableX: function(x) {
        var y;
        for (var i = 1; i <= 4; i++) {
            if ((0 <= (x - i)) && ((x - i) <= 4)) {
                y = grap.Board.topPosition(x - i) - 1;
                if (y > 2) return (x - i);
            }
            if ((0 <= (x + i)) && ((x + i) <= 4)) {
                y = grap.Board.topPosition(x + i) - 1;
                if (y > 2) return (x + i);
            }
        }
        return false;
    },

    // TODO: probably we can merge the code from game.js key down to here.
    //
    // Whoa. We cannot use 'this' keyword here, because this function
    // is called from outside window.setInterval?? Makes sense, but WTF.
    forceDrop: function() {
        var sCard, x;
        if (Game.State.isChoosingTheDeck) {
            grap.Board.chooseCard();
            Game.State.chosen();
        } else if (Game.State.isInDropzone) {
            sCard = grap.Board.selectedCard;
            if (sCard.isDroppable()) {
                sCard.drop();
                Game.State.dropped();
            } else {
                x = grap.Board.closestDroppableX(sCard.x);
                if (x === false) return;
                sCard.move(x, sCard.y);
                sCard.drop();
            }
        }
    },

    chooseCard: function() {
        var chosen = this.chooseLine[this.ci];
        chosen.move(this.ci, 1);
        this.selectedCard = chosen;
        chosen.focus = true;
        chosen.redraw();
        Game.State.chosen();
        this.openNextCard(this.ci);
        grap.Screen.drawDeck(this.ci);
        return true;
    },

    topPosition: function(x) {
        for (var y = 3; y <= 7; y++) {
            if (isCard(this._b[y][x])) { return y; }
        }
        return 8; // very bottom
    },

    isFilled: function() {
        for (var y = 3; y <= 7; y++) {
            for (var x = 0; x <= 4; x++) {
                if (!isCard(this._b[y][x])) {
                    return false;
                }
            }
        }
        return true;
    },

    onDiagonalAsc: function(card) {
        return ((card.x + card.y) === 7);
    },

    onDiagonalDesc: function(card) {
        return ((card.y - card.x) === 3);
    },

    setDoubleLines: function(i) {
        var self = this,
            ns;

        this.clearDoubleLines();
        ns = _.take(_.shuffle(_.range(1, 13)), i);
        _.each(ns, function(n) {
            self.dlines.push(new grap.DoubleLine(n));
        });
    },

    clearDoubleLines: function() {
        this.dlines = [];
    },

    isDoubleLine: function(cards) {
        return _.any(this.dlines, function(dline) {
            return dline.match(cards);
        });
    },

    addScore: function(poker) {
        var h = poker.toString().replace(/([A-Z])/g, " $1");
        var s = poker.score();

        if (this.isDoubleLine(poker.cards)) {
            s = s * 2;
        }

        grap.Screen.flashMessage(h, true);
        Game.State.addScore(s);
    },

    collectHands: function(card) {
        var hands = [],
            self = this;

        var posHorizontal = function(card) {
            var y = card.y;
            return _.map([0, 1, 2, 3, 4], function(x) {
                return {x: x, y: y};
            });
        };

        var posVertical = function(card) {
            var x = card.x;
            return _.map([3, 4, 5, 6, 7], function(y) {
                return {x: x, y: y};
            });
        };

        var posDiagonalAsc = function() {
            return _.map([0, 1, 2, 3, 4], function(x) {
                return {x: x, y: 7 - x};
            });
        };

        var posDiagonalDesc = function() {
            return _.map([0, 1, 2, 3, 4], function(x) {
                return {x: x, y: x + 3};
            });
        };

        var collectCards = function(fn, card) {
            var hand = [], p, pos;
            pos = fn.call(self, card);
            for (var i = 0, ii = pos.length; i < ii; i++) {
                p = pos[i];
                if (self._b[p.y][p.x] instanceof grap.Card) {
                    hand.push(self._b[p.y][p.x]);
                }
            }
            return (hand.length == 5) ? hand : null;
        };

        hands.push(collectCards(posHorizontal, card));
        hands.push(collectCards(posVertical, card));

        if (this.onDiagonalAsc(card)) {
            hands.push(collectCards(posDiagonalAsc, card));
        }
        if (this.onDiagonalDesc(card)) {
            hands.push(collectCards(posDiagonalDesc, card));
        }

        hands = _.filter(hands, function(h) { return h; });
        return hands;
    },

    handCheck: function(card) {
        var hands = this.collectHands(card),
            h, hand, p, count = 0;
        var allCards = grap.Card.generateAll();

        for (var i = 0, l = hands.length; i < l; i++) {
            h = hands[i].sort(function(a, b) { return a.num - b.num; });
            // if it includes a joker, try all possible cards one
            // by one and choose the hand that makes the highest
            // score
            if (h[0].isJoker()) {
                p = _.max(_.map(allCards, function(c) {
                    hand = _.clone(h);
                    hand[0] = c;
                    return new grap.Poker(hand);
                }), function(p) {
                    return p.score();
                });
            } else {
                p = new grap.Poker(hands[i]);
            }
            if (p.score()) {
                setTimeout((function(i2, p2) {
                    return function() {
                        grap.Board.addScore(p2);
                        _.each(hands[i2], function(card) { card.glow(); });
                    };
                })(i, p), count++ * 1050);
                // need to wait for a little more than 1000ms since
                // card glowing action takes 1000ms.
            }
        }
    }
};

grap.Board.selectFocus =  {
    glow: function(val) {
        var s = grap.Board.chooseLine[grap.Board.ci];
        s.focus = val;
        s.redraw();
    },

    moveFocus: function(index) {
        // When the cursor is on the either edge.
        if (typeof index === 'undefined') return;
        this.glow(false);
        grap.Board.ci = index;
        this.glow(true);
    },

    availableDeck: function(indexes) {
        return _.find(indexes, function(c) {
            return (isCard(grap.Board.chooseLine[c]));
        });
    },

    moveLeft: function() {
        var candidates = _.select([0, 1, 2, 3, 4], function(x) {
            return x < grap.Board.ci;
        });
        candidates.reverse();
        var idx = this.availableDeck(candidates);
        this.moveFocus(idx);
    },

    moveRight: function() {
        var candidates = _.select([0, 1, 2, 3, 4], function(x) {
            return x > grap.Board.ci;
        });
        var idx = this.availableDeck(candidates);
        this.moveFocus(idx);
    }
};
