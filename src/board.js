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
	this.clearDoubleLines();

	Game.State.isInDropzone = false;
	Game.State.isChoosingTheDeck = true;
    },

    put: function(x, y, card) {
	this._b[y][x] = card;
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

    chooseCard: function() {
	var chosen = this.chooseLine[this.ci];
	chosen.move(this.ci, 1);
	this.selectedCard = chosen;
	chosen.focus = true;
	chosen.redraw();
	Game.State.chosen();
	this.openNextCard(this.ci);
	grap.Screen.drawDeck(this.ci);
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

    onDiagonalLine: function(card) {
	var x = card.x,
	    y = card.y;
	return (this.onDiagonalAsc(x, y) || this.onDiagonalDesc(x, y));
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

	grap.Screen.flashMessage(h);
	if (s != 0) {
	    Game.State.addScore(s);
	}
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
	    h, hand, p;
	var allCards = grap.Card.generateAll();

	for (var i = 0, l = hands.length; i < l; i++) {
	    h = hands[i].sort(function(a, b) { return a.num - b.num; });
	    // if it includes a joker, try all possible card one
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
		this.addScore(p);
		_.each(hands[i], function(card) { card.glow(); });
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
