$(function() {
    var pp = console.log.bind(console);

    function Card(suit, num) {
	if ((suit < 0) || (4 <= suit)) {
	    throw("out of range");
	}
	this.suit = suit;
	this.num = num;
	this.focus = false;
	if ((suit == 1) || (suit == 2)) {
	    this.color = "#f33";
	} else {
	    this.color = "#222";
	}
    };
    Card.prototype = {
	Suits: ['♠', '♥', '♦', '♣'],
	Faces: ['A', 'J', 'Q', 'K'],
	toString: function() {
	    var s, f;
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
	place: function(x, y) {
	    this.x = x;
	    this.y = y;
	    Board.put(x, y, this);
	    this.draw();
	    return this;
	},
	draw: function() {
	    Screen.drawCard(this);
	},
	redraw: function() {
	    this.rect.remove();
	    this.draw();
	},
	move: function(x, y) {
	    Board.put(this.x, this.y, '');
	    Board.put(x, y, this);
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
	fall: function() {
	    var y = Board.topPosition(this.x) - 1;
	    if (y == 2) return false;
	    this.focus = false;
	    this.move(this.x, y);
	    Board.handCheck(this);
	    Board.selectFocus.glow(true);
	    Game.State.dropped();
	    Game.checkOver();
	    return true;
	},
	glow: function() {
	    var r = this.rect;
	    r.animate({transform: 's1.1'}, 200);
	    var g = this.rect[0].glow({
		width: 30,
		fill: false,
		opacity: 0.7,
		color: 'yellow'
	    });
	    setTimeout(function() {
		r.animate({transform: 's1'}, 60);
		g.remove();
	    }, 1000);
	}
    };

    var Decks = []; // a collection to store five decks.

    function Deck(cards) {
	this._ptr = 0;
	this._deck = cards || [];
    }
    Deck.prototype = {
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

    var Screen = {
	shim: 7,       // defines px between cards
	width: 380,
	height: 0,     // calculate from the width
	deckSpace: 0, // defines px to make some room to draw decks
	openDecks: [[], [], [], [], []],

	init: function() {
	    this.cardSize   = (this.width - this.shim * 6) / 5;
	    this.height     = (this.cardSize + this.shim) * 11 + this.shim;
	    this.deckSpace = (this.cardSize + this.shim) * 3,

	    this.addScore('reset');
	    if (this.paper) { this.paper.remove(); };
	    this.paper = Raphael("paper", this.width, this.height);
	    this.paper.rect(0, 0, this.width, this.height).attr({"fill": "#00bb00"});
	    this.drawMatrix();
	},
	drawMatrix: function() {
	    var s = this.cardSize,
	        f;  // focus line
	    for (var y = 3; y <= 7; y++) {
		for (var x = 0; x < 5; x++) {
		    this.paper.rect(this.absolutePos(x),
				    this.absolutePos(y) + Screen.deckSpace,
				    s, s);
		}
	    }
	    f = this.paper.rect(1,
				this.absolutePos(3) - Screen.shim / 2,
				Screen.width - 1,
				this.cardSize + Screen.shim);
	    f.attr({"stroke-width": 3, "fill": "#ffffcc"});
	},
	addScore: (function() {
	    var score = 0;
	    return (function(s) {
		score = (s == 'reset') ? 0 : score + s;
		$("#score").html("Score: " + score);
	    });
	})(),
	flashMessage: function(msg) {
	    var m = this.paper.text(100, 400, msg).attr({'font-size': 24});
	    m.animate({'font-size': 36, x: 180}, 100, function() {
		window.setTimeout(function() {
		    m.animate({'font-size': 40, y: 0}, 700, function() { m.remove(); });
		}, 800);
	    });
	},
	showMessage: (function() {
	    var _message = "",
	        raphaelMsg;
	    return (function(msg) {
		if (msg === "") {
		    _message = "";
		    pp(raphaelMsg);
		    raphaelMsg.remove();
		} else {
		    raphaelMsg = this.paper.text(200, 400, msg).attr({'font-size': 24});
		}
	    });
	})(),
	drawDeck: function(idx) {
	    var cards = Decks[idx].nextThree(),
	        c;

	    _.each(this.openDecks[idx], function(c) {
	     	c.rect.remove();
	    });
	    if (cards === null) return;

	    this.openDecks[idx] = [];
	    for (var i = cards.length - 1; i >= 0; i--) {
		cards[i].x = idx;
		cards[i].y = 2 - i;
	    	c = Screen.drawCardOnDeck(cards[i]);
		this.openDecks[idx].push(c);
	    }
	    Board.selectFocus.glow(false);
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
	    if (typeof(deck) === "undefined") { abs_y += Screen.deckSpace; }
	    // if the scale arg is given
	    if (typeof(scale) === "number") { s = scale; }

	    // a cardRect consists of two objects: a rect and text
	    var r = this.paper.rect(abs_x, abs_y, this.cardSize, this.cardSize);
	    r.attr({"stroke-width": 3, "fill": "#ffffff"});
	    var t = this.paper.text(abs_x + this.cardSize / 2, abs_y + this.cardSize / 2, card.toString());
	    t.attr({fill: card.color, "font-size": this.cardSize - this.shim * 6});

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

    var Board = {
	ci: 2,            // the index of the deck to choose from.
	selectedCard: '', // the card to drop in the dropzone.

	init: function() {
	    this._b = [['', '', '', '', ''], // line 0 : choose zone
		       ['', '', '', '', ''], // line 1 : dropzone
		       ['', '', '', '', ''], // line 2 : blank
		       ['', '', '', '', ''], // 3..7: the matrix
		       ['', '', '', '', ''], // 4
		       ['', '', '', '', ''], // 5
		       ['', '', '', '', ''], // 6
		       ['', '', '', '', '']]; // 7
	    this.prepareDecks();
	    this.cs = 2;
	    this.selectFocus.glow(true);
	},
	put: function(x, y, card) {
	    this._b[y][x] = card;
	},
	selectFocus: {
	    glow: function(val) {
		var s = Board._b[0][Board.ci];
		s.focus = val;
		s.redraw();
	    },
	    moveFocus: function(index) {
		this.glow(false);
		Board.ci = index;
		this.glow(true);
	    },
	    availableDeck: function(indexes) {
		return _.find(indexes, function(c) {
		    return (!(Board._b[0][c] === ''));
		});
	    },
	    moveLeft: function() {
		var candidates = _.select([0, 1, 2, 3, 4], function(x) {
		    return x < Board.ci;
		});
		candidates.reverse();
		var idx = this.availableDeck(candidates);
		if (typeof idx === 'undefined') return;
		this.moveFocus(idx);
	    },
	    moveRight: function() {
		var candidates = _.select([0, 1, 2, 3, 4], function(x) {
		    return x > Board.ci;
		});
		var idx = this.availableDeck(candidates);
		if (typeof idx === 'undefined') return;
		this.moveFocus(idx);
	    }
	},
	prepareDecks: function() {
	    for (var i = 0; i < 5; i++) {
		this._b[0][i] = Decks[i].peekCard().place(i, 0);
	    }
	    for (i = 0; i < 5; i++) {
		Screen.drawDeck(i);
	    }
	},
	openNextCard: function(i) {
	    if (Decks[i].available()) {
		Decks[i].openCard().place(i, 0);
	    } else {
		var availableDecks = [],
		    left, right;
		for (var d = 1; d <= 4; d++) {
		    left  = Board.ci - d;
		    if ((left >= 0) && Decks[left].available()) {
			return Board.ci -= d;
		    }
		    right = Board.ci + d;
		    if ((right <= 4) && Decks[right].available()) {
			return Board.ci += d;
		    }
		}
	    }
	},
	chooseCard: function() {
	    var chosen = this._b[0][this.ci];
	    chosen.move(this.ci, 1);
	    this.selectedCard = chosen;
	    chosen.focus = true;
	    chosen.redraw();
	    Game.State.chosen();
	    this.openNextCard(this.ci);
	    Screen.drawDeck(this.ci);
	},
	topPosition: function(x) {
	    for (var y = 3; y <= 7; y++) {
		if (this._b[y][x] instanceof Card) { return y; }
	    }
	    return 8; // very bottom
	},
	isFilled: function() {
	    var total = 0;
	    for (var y = 3; y <= 7; y++) {
		for (var x = 0; x <= 4; x++) {
		    if (this._b[y][x] instanceof Card) { total += 1 };
		}
	    }
	    return (total == 25);
	},
	onDiagonalLine: function(x, y) {
	    return (this.onDiagonalAsc(x, y) || this.onDiagonalDesc(x, y));
	},
	onDiagonalAsc: function(x, y) {
	    return ((x + y) === 7);
	},
	onDiagonalDesc: function(x, y) {
	    return ((y - x) === 3);
	},
	addScore: function(poker) {
	    var h = poker.toString().replace(/([A-Z])/g, " $1");
	    Screen.flashMessage(h);

	    var s = poker.score();
	    if (s != 0) {
		Screen.addScore(poker.score());
	    }
	},
	collectHands: function(card) {
	    // FIXME: refactor this fugly function
	    var hand = [],
	        hands= [];

	    // collect cards on the horizontal line
	    for (var x = 0; x <= 4; x++) {
		if (this._b[card.y][x] instanceof Card) {
		    hand.push(this._b[card.y][x]);
		}
	    }
	    if (hand.length == 5) { hands.push(hand); }
	    hand = [];

	    // collect cards on the vertical line
	    for (var y = 3; y <= 7; y++) {
		if (this._b[y][card.x] instanceof Card) {
		    hand.push(this._b[y][card.x]);
		}
	    }
	    if (hand.length == 5) { hands.push(hand); }
	    hand = [];

	    // collect cards on the diagonal lines if necessary
	    if (Board.onDiagonalLine(card.x, card.y)) {
		// collect cards on the diagonal line (ascending)
		for (var x = 0; x <= 4; x++) {
		    if (this._b[7 - x][x] instanceof Card) {
			hand.push(this._b[7 - x][x]);
		    }
		}
		if ((hand.length == 5) && (Board.onDiagonalAsc(card.x, card.y))) {
		    hands.push(hand);
		}
		hand = [];

		// collect cards on the diagonal line (descending)
		for (var x = 0; x <= 4; x++) {
		    if (this._b[x + 3][x] instanceof Card) {
			hand.push(this._b[x + 3][x]);
		    }
		}
		if ((hand.length == 5) && (Board.onDiagonalDesc(card.x, card.y))) {
		    hands.push(hand);
		}
		hand = [];
	    }

	    return hands;
	},
	handCheck: function(card) {
	    var hands = this.collectHands(card);
	    for (var i = 0, l = hands.length; i < l; i++) {
		var p = new Poker(hands[i]);
		if (p.score()) {
		    this.addScore(p);
		    _.each(hands[i], function(card) { card.glow(); });
		}
	    }
	}
    };

    function Poker(cards) {
	// we determine the hand in the constructor
	cards = cards.sort(function(a, b) { return a.num - b.num; });
	this.hand = {};

	this.hand.isFlush = _.every(cards, function(c) {
            return c.suit === cards[0].suit;
	});

	this.hand.isStraight = true;
	for (var i = 1; i < 5; i++) {
	    if (cards[0].num + i !== cards[i].num) {
		this.hand.isStraight = false;
	    }
	};

	this.hand.isRoyalStraight = (function() {
	    var h = _.map(cards, function(c) { return c.num; });
	    if (JSON.stringify(h) === '[1,10,11,12,13]') { return true; };
	    return false;
	})();

	if (this.hand.isStraight && this.hand.isFlush) {
	    // make sure there's only one hand matching
	    this.hand.isStraight           = false;
	    this.hand.isFlush              = false;
	    this.hand.isStraightFlush      = true;
	};

	if (this.hand.isRoyalStraight && this.hand.isFlush) {
	    this.hand.isRoyalStraight      = false;
	    this.hand.isFlush              = false;
	    this.hand.isRoyalStraightFlush = true;
	};

	var count = _.countBy(cards, function(c) { return c.num; });
	var pairs = _.filter(count, function(p) { return p >= 2; }).sort();
	this.hand.isOnePair      = (JSON.stringify(pairs) === '[2]');
	this.hand.isTwoPair      = (JSON.stringify(pairs) === '[2,2]');
	this.hand.isThreeOfAKind = (JSON.stringify(pairs) === '[3]');
	this.hand.isFullHouse    = (JSON.stringify(pairs) === '[2,3]');
	this.hand.isFourOfAKind  = (JSON.stringify(pairs) === '[4]');
//	pp(this.hand);
    };
    Poker.prototype = {
	scores: {
	    OnePair:             100,
	    TwoPair:             300,
	    ThreeOfAKind:        500,
	    FullHouse:           800,
	    FourOfAKind:        1000,
	    Straight:            900,
	    RoyalStraight:      1000,
	    Flush:               800,
	    StraightFlush:      1200,
	    RoyalStraightFlush: 1500
	},
	toString: function() {
	    var str = '';
	    for (var h in this.hand) {
		if (this.hand[h]) {
		    str = h.replace(/^is/, '');
		}
	    }
	    return str;
	},
	score: function() {
	    if (this.toString() === '') {
		return 0;
	    } else {
		return this.scores[this.toString()];
	    }
	}
    };

    var Game = {
	State: {
	    init: function() {
		this.isRunning = true;
		this.isInDropzone = false;
		this.isChoosingTheDeck = true;
	    },
	    dropped: function() {
		this.isInDropzone = false;
		this.isChoosingTheDeck = true;
	    },
	    chosen: function() {
		this.isInDropzone = true;
		this.isChoosingTheDeck = false;
	    }
	},

	init: function() {
	    Screen.init();
	    this.initDecks();
	    Board.init();
	    this.State.init();
	},
	initDecks: function() {
	    var decks = [];

	    for (var i = 0; i < 5; i++) {
		decks.push(new Deck());
	    }

	    var deck = (function() {
		var deck = [], card;
		for (var s = 0; s < 4; s++) {
		    for(var n = 1; n <= 13; n++) {
	    		deck.push(new Card(s, n));
		    }
		}
		return _.shuffle(deck);
	    })();

	    for (var i = 0, ii = deck.length; i < ii; i++) {
		var d = _.random(4);
		decks[d].addCard(deck[i]);
	    }
	    Decks = decks;
	},
	keyeventInit: function() {
	    // left-37, up-38, right-39, down-40
	    $(document).keydown(function(e) {
		var target;
		if (Game.State.isInDropzone) {
		    target = Board.selectedCard;
		} else if (Game.State.isChoosingTheDeck) {
		    target = Board.selectFocus;
		}
		var running = Game.State.isRunning;

		switch(e.keyCode) {
		case 89:
		    // (y)es key
		    if (!Game.State.isRunning) {
			// FIXME: cannot start over properly
			Game.init();
			Game.run();
		    };
		    break;
		case 37:
		    if (running) target.moveLeft();
		    break;
		case 38:
		    // alert( "up pressed" );
		    break;
		case 39:
		    if (running) target.moveRight();
		    break;
		case 40:
		    // drop it
		    if (running) {
			if (Game.State.isInDropzone) {
			    if (Board.selectedCard.fall()) {
				Game.State.dropped();
			    }
			} else if (Game.State.isChoosingTheDeck) {
			    if (Board.chooseCard()) {
				Game.State.chosen();
			    }
			}
		    }
		}
	    });
	},
	run: function() {
	    this.State.isRunning = true;
	},
	checkOver: function() {
	    if (Board.isFilled()) {
		Game.State.isRunning = false;
		setTimeout(function() {
		    Screen.showMessage("Game Over. Play again? (y)");
		}, 1000);
	    }
	},
	fillAll: function() {
	    for(var x = 0; x < 5; x++) {
		for(var y = 0; y <= 6; y++) {
		    if (y == 1) continue;
		    Decks[2].openCard().place(x, y);
		}
	    }
	}
    };

    // Run the game.
    Game.keyeventInit();
    Game.init();
    Game.run();

    //
    // Some test code.
    //
    var runTest = false;
    var testCases =
	    [
		[[0,1], [1,1], [2,3], [2,5], [3,10], 'isOnePair'],
		[[0,1], [1,11], [2,3], [2,11], [3,10], 'isOnePair'],
		[[0,1], [1,1], [2,3], [3,3], [3,10], 'isTwoPair'],
		[[0,5], [1,1], [2,3], [3,3], [3,5], 'isTwoPair'],
		[[0,1], [1,1], [2,1], [3,3], [3,10], 'isThreeOfAKind'],
		[[0,1], [1,5], [2,5], [2,9], [3,5], 'isThreeOfAKind'],
		[[0,1], [1,1], [2,5], [0,5], [3,5], 'isFullHouse'],
		[[0,1], [2,5], [1,1], [0,5], [3,5], 'isFullHouse'],
		[[0,1], [2,5], [1,1], [2,1], [3,1], 'isFourOfAKind'],
		[[0,5], [2,4], [3,3], [2,2], [0,6], 'isStraight'],
		[[0,5], [0,4], [0,3], [0,2], [0,6], 'isStraightFlush'],
		[[0,5], [0,4], [0,3], [0,2], [0,6], 'isStraightFlush'],
		[[0,1], [0,10], [1,11], [2,12], [0,13], 'isRoyalStraight'],
		[[0,1], [0,2], [0,4], [0,5], [0,3], 'isStraightFlush'],
		[[0,1], [0,10], [0,11], [0,12], [0,13], 'isRoyalStraightFlush']
	    ];
    var testSuccess = true;

    if (runTest) {
	_.each(testCases, function(c) {
	    var hand = new Array();
	    for (var i = 0; i < 5; i++) {
     		hand.push(new Card(c[i][0], c[i][1]));
	    }
	    var p = new Poker(hand);
	    var kindOfHands = _.size(_.select(p.hand, function(h) { return h; }));
	    if ( kindOfHands !== 1) {
		testSuccess = false;
		pp("test failed(could not determine to the single hand: " + p.hand);
	    }

	    if (!p.hand[_.last(c)]) {
		testSuccess = false;
		pp("test failed: " + _.last(c));
	    }
	});
	if (testSuccess) { pp("test passed: " + testCases.length + " cases"); };

    };
});
