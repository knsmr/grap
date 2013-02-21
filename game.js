$(function() {
    var pp = console.log.bind(console);

    function Card(suit, num) {
	if ((suit < 0) || (4 <= suit)) {
	    throw("out of range");
	}
	this.suit = suit;
	this.num = num;
	this.focus = false;
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
	    Board._b[y][x] = this;
	    this.draw();
	    return this;
	},
	draw: function() {
	    Screen.drawCard(this);
	},
	move: function(x, y) {
	    Board._b[this.y][this.x] = '';
	    Board._b[y][x] = this;
	    this.x = x;
	    this.y = y;
	    this.rect.remove();
	    this.draw();
	    return this;
	},
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

    var Deck = {
	init: function() {
	    this._ptr = 0;
	    this._deck = (function() {
		var d = [];
		for (var s = 0; s < 4; s++) {
		    for(var n = 1; n <= 13; n++) {
			var card = new Card(s, n);
			d.push(card);
		    }
		}
		return d;
	    })();
	},
	peekCard: function() {
	    return this._deck[this._ptr];
	},
	openCard: function() {
	    this._ptr++;
	    return this.peekCard();
	},
	shuffle: function() {
	    this._deck = _.shuffle(this._deck);
	}
    };

    var Screen = {
	shim: 7,   // defines px between cards
	width: 380,

	init: function() {
	    this.addScore('reset');
	    if (this.paper) { this.paper.remove(); };
	    this.paper = Raphael("paper", this.width, 600);
	    this.paper.rect(0, 0, this.width, 600).attr({"fill": "#00bb00"});
	    this.cardSize = (this.width - this.shim * 6) / 5;
	    this.drawMatirx();
	},
	drawMatirx: function() {
	    var s = this.cardSize;
	    for (var y = 3; y <= 7; y++) {
		for (var x = 0; x < 5; x++) {
		    this.paper.rect(this.absolutePos(x),
				    this.absolutePos(y), s, s);
		}
	    }
	},
	addScore: (function() {
	    var score = 0;
	    return (function(s) {
		score = (s == 'reset') ? 0 : score + s;
		$("#score").html("Score: " + score);
	    });
	})(),
	flashMessage: function(msg) {
	    var m = this.paper.text(100, 185, msg).attr({'font-size': 24});
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
		    raphaelMsg = this.paper.text(200, 30, msg).attr({'font-size': 24});
		}
	    });
	})(),
	drawCard: function(card) {
            var abs_x = this.absolutePos(card.x),
                abs_y = this.absolutePos(card.y),
		color;
	    if ((card.suit == 1) || (card.suit == 2)) {
		color = "#f33";
	    } else {
		color = "#222";
	    }

	    // a cardRect consists of two objects: a rect and text
	    var r = this.paper.rect(abs_x, abs_y, this.cardSize, this.cardSize);
	    r.attr({"stroke-width": 3, "fill": "#ffffff"});
	    var t = this.paper.text(abs_x + this.cardSize / 2, abs_y + this.cardSize / 2, card.toString());
	    t.attr({fill: color, "font-size": this.cardSize - this.shim * 6});

	    // Group the rectangle and the text. Also, set the glowing
	    // effect on the rectangle if the card has a focus.
	    card.rect = this.paper.set();
	    if (card.focus) {
		var g = r.glow({
		    width: 10,
		    fill: true,
		    opacity: 0.9,
		    color: 'yellow'
		});
	    };
	    card.rect.push(r, t, g);
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
	    return c;
	},
	absolutePos: function(n) {
	    return (this.shim + n * (this.cardSize + this.shim));
	}
    };

    var Board = {
	init: function() {
	    this._b = [['', '', '', '', ''], // line 0 : show the next candidate card
		       ['', '', '', '', ''], // line 1 : a card to drop
		       ['', '', '', '', ''], // line 2: blank
		       ['', '', '', '', ''], // 3..7: the matrix
		       ['', '', '', '', ''], // 4
		       ['', '', '', '', ''], // 5
		       ['', '', '', '', ''], // 6
		       ['', '', '', '', '']]; // 7
	    this.nextCard = Deck.openCard().place(2, 0);
	    this.putCardInDropzone();
	},
	putCardInDropzone: function() {
	    this.selectedCard = this.nextCard;
	    this.nextCard = Deck.openCard().place(2, 0);
	    this.selectedCard.focus = true;
	    this.selectedCard.move(2, 1);
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
		this.isRunning = false;
		this.isInDropzone = false;
	    }
	},

	init: function() {
	    Screen.init();
	    Deck.init();
	    Deck.shuffle();
	    Board.init();
	    this.State.init();
	},
	keyeventInit: function() {
	    // left-37, up-38, right-39, down-40
	    $(document).keydown(function(e) {
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
		    Board.selectedCard.moveSideways(-1);
		    break;
		case 38:
		    // alert( "up pressed" );
		    break;
		case 39:
		    Board.selectedCard.moveSideways(1);
		    break;
		case 40:
		    // drop it
		    if (Game.State.isInDropzone) {
			if (Board.selectedCard.fall()) {
			    Board.putCardInDropzone();
			}
		    } else {
			Board.putCardInDropzone();
		    }
		}
	    });
	},
	run: function() {
	    this.State.isRunning = true;
	    this.State.isInDropzone = true;
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
		    Deck.openCard().place(x, y);
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
