// TODO:
// - use test lib like jasmine?
// - split up classes into files (require.js?)
// - use custome events like below
//   https://github.com/goldfire/howler.js/blob/master/howler.js#L847
//
// - implement double score lines
// - use animation when moving a card
// - force drop after a certain time passed
// - queue the flash message so they don't overlap at a time
// - list up all the hands that have been made
// - add sound effect: use howler.js?
// - calculate the position of messages and decks from the width

$(function() {
    var pp = console.log.bind(console);

    function Card(suit, num) {
	if ((suit < 0) || (4 <= suit)) {
	    throw("out of range");
	}
	this.suit = suit;
	this.num = num;
	this.focus = false;
	this.color = this.isRed() ? "#f33" : "#222";
    };

    function isCard(o) { return o instanceof Card; };

    Card.generateAll = function() {
	var deck = [];
	for (var s = 0; s < 4; s++) {
	    for(var n = 1; n <= 13; n++) {
		deck.push(new Card(s, n));
	    }
	}
	return deck;
    };

    Card.prototype = {
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

	drop: function() {
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

    var Screen = {
	shim: 7,       // defines px between cards
	width: 380,
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
	},

	drawMatrix: function() {
	    // 5 x 5 matrix
	    for (var y = 3; y <= 7; y++) {
		for (var x = 0; x < 5; x++) {
		    this.paper.rect(this.absolutePos(x),
				    this.absolutePos(y) + Screen.deckSpace,
				    this.cardSize, this.cardSize);
		}
	    }
	    // set a background color on the focus line
	    this.paper.rect(1,
			    this.absolutePos(3) - Screen.shim / 2,
			    Screen.width - 1,
			    this.cardSize + Screen.shim).
		attr({"stroke-width": 3, "fill": "#ffffcc"});
	},

	// TODO: merge two message functions and take options instead
	flashMessage: function(msg) {
	    var fontSize = 57 - msg.length;
	    var m = this.paper.text(100, 400, msg).
		attr({'font-size': 30, 'stroke': '#cc0000',
		      'stroke-width': 2, 'fill': 'black'});

	    m.animate({'font-size': fontSize, x: 180}, 100, function() {
		window.setTimeout(function() {
		    m.toFront();
		    m.animate({'font-size': 20, y: 0}, 700, function() { m.remove(); });
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

	    // draw cards that are closed
	    var count = Decks[idx].closedCards();
	    if (count > 0) this.drawClosedCards(count, idx);
	},

	drawClosedCards: function(n, idx) {
	    var x = this.absolutePos(idx),
	        y, r;
	    for (var i = n; i > 0; i--) {
		// need to adjust 68
		y = 68 - (i * 5);
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
	    this.chooseLine = this._b[0];
	    this.prepareDecks();
	    this.cs = 2;
	    this.selectFocus.glow(true);

	    Game.State.isInDropzone = false;
	    Game.State.isChoosingTheDeck = true;
	},

	put: function(x, y, card) {
	    this._b[y][x] = card;
	},

	prepareDecks: function() {
	    for (var i = 0; i < 5; i++) {
		this.chooseLine[i] = Decks[i].peekCard().place(i, 0);
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
	    var chosen = this.chooseLine[this.ci];
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

	addScore: function(poker) {
	    var h = poker.toString().replace(/([A-Z])/g, " $1");
	    Screen.flashMessage(h);

	    var s = poker.score();
	    if (s != 0) {
		Game.State.addScore(poker.score());
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
		    if (self._b[p.y][p.x] instanceof Card) {
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
	    var allCards = Card.generateAll();

	    for (var i = 0, l = hands.length; i < l; i++) {
		h = hands[i].sort(function(a, b) { return a.num - b.num; });
		// if it includes a joker, try all possible card one
		// by one and choose the hand that makes the highest
		// score
		if (h[0].isJoker()) {
		    p = _.max(_.map(allCards, function(c) {
			hand = _.clone(h);
			hand[0] = c;
			return new Poker(hand);
		    }), function(p) {
			return p.score();
		    });
		} else {
		    p = new Poker(hands[i]);
		}
		if (p.score()) {
		    this.addScore(p);
		    _.each(hands[i], function(card) { card.glow(); });
		}
	    }
	}
    };

    Board.selectFocus =  {
	glow: function(val) {
	    var s = Board.chooseLine[Board.ci];
	    s.focus = val;
	    s.redraw();
	},

	moveFocus: function(index) {
	    // When the cursor is on the either edge.
	    if (typeof index === 'undefined') return;
	    this.glow(false);
	    Board.ci = index;
	    this.glow(true);
	},

	availableDeck: function(indexes) {
	    return _.find(indexes, function(c) {
		return (isCard(Board.chooseLine[c]));
	    });
	},

	moveLeft: function() {
	    var candidates = _.select([0, 1, 2, 3, 4], function(x) {
		return x < Board.ci;
	    });
	    candidates.reverse();
	    var idx = this.availableDeck(candidates);
	    this.moveFocus(idx);
	},

	moveRight: function() {
	    var candidates = _.select([0, 1, 2, 3, 4], function(x) {
		return x > Board.ci;
	    });
	    var idx = this.availableDeck(candidates);
	    this.moveFocus(idx);
	}
    };

    function Poker(cards) {
	cards = cards.sort(function(a, b) { return a.num - b.num; });
	this.cards = cards;
	this.hand = {};
	this.determineHand();
//	pp(this.hand);
    };

    Poker.prototype = {
	scores: {
	    OnePair:             200,
	    TwoPair:             400,
	    ThreeOfAKind:        800,
	    FullHouse:          1800,
	    FourOfAKind:        2000,
	    Straight:           1400,
	    RoyalStraight:      1800,
	    Flush:              1000,
	    StraightFlush:      2400,
	    RoyalStraightFlush: 2800,
	    FiveOfAKind:        3000
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
	},

	determineHand: function() {
	    this.hand.isFlush         = this.isFlush();
	    this.hand.isStraight      = this.isStraight();
	    this.hand.isRoyalStraight = this.isRoyalStraight();
	    this.pairs                = JSON.stringify(this.countPairs());

	    this.hand.isOnePair      = (this.pairs === '[2]');
	    this.hand.isTwoPair      = (this.pairs === '[2,2]');
	    this.hand.isThreeOfAKind = (this.pairs === '[3]');
	    this.hand.isFullHouse    = (this.pairs === '[2,3]');
	    this.hand.isFourOfAKind  = (this.pairs === '[4]');
	    this.hand.isFiveOfAKind  = (this.pairs === '[5]');

	    this.resolveDuplucation();
	},

	resolveDuplucation: function() {
	    // make sure there's only one hand matching
	    if (this.hand.isStraight && this.hand.isFlush) {
		this.hand.isStraight           = false;
		this.hand.isFlush              = false;
		this.hand.isStraightFlush      = true;
	    };

	    if (this.hand.isRoyalStraight && this.hand.isFlush) {
		this.hand.isRoyalStraight      = false;
		this.hand.isFlush              = false;
		this.hand.isRoyalStraightFlush = true;
	    };
	},

	isFlush: function() {
	    var cards = this.cards;
	    return (_.every(cards, function(c) {
		return c.suit === cards[0].suit;
	    }));
	},

	isStraight: function() {
	    for (var i = 1; i < 5; i++) {
		if (this.cards[0].num + i !== this.cards[i].num) {
		    return false;
		}
	    }
	    return true;
	},

	isRoyalStraight: function () {
	    var numbers = _.map(this.cards, function(c) { return c.num; });
	    if (JSON.stringify(numbers) === '[1,10,11,12,13]') {
		return true;
	    };
	    return false;
	},

	countPairs: function() {
	    // count the number of pairs and triplets and so forth
	    // [1, 1, 3, 4, 5] -> [2]
	    // [1, 1, 3, 3, 5] -> [2, 2]
	    // [1, 1, 3, 3, 3] -> [2, 3]
	    // [1, 2, 3, 3, 3] -> [3]
            var count, pairs;
	    count = _.countBy(this.cards, function(c) { return c.num; });
	    pairs = _.filter(count, function(p) { return p >= 2; }).sort();
	    return pairs;
	}
    };

    var Game = {
	init: function() {
	    Screen.init();
	    this.initDecks();
	    Board.init();
	    this.State.init();
	    this.keyeventInit();
	    this.State.isRunning = true;
	},

	initDecks: function() {
	    var decks = [];

	    for (var i = 0; i < 5; i++) {
		decks.push(new Deck());
	    }

	    var deck = (function() {
		var deck = Card.generateAll();
		deck.push(new Card(2, 0)); // a joker
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

		if (running) {
		    switch(e.keyCode) {
		    case 37:
			target.moveLeft();
			break;
		    case 38:
			// alert( "up pressed" );
			break;
		    case 39:
			target.moveRight();
			break;
		    case 40:
			// drop it
			if (Game.State.isInDropzone) {
			    if (Board.selectedCard.drop()) {
				Game.State.dropped();
			    }
			} else if (Game.State.isChoosingTheDeck) {
			    if (Board.chooseCard()) {
				Game.State.chosen();
			    }
			}
		    }
		} else {
		    if(e.keyCode == 89) {
			// (y)es key
			Game.init();
			Game.run();
		    };
		}
	    });
	},

	checkOver: function() {
	    if (!Board.isFilled()) return;

	    if (Game.State.stageClear()) {
		Game.State.isRunnig = false;
		setTimeout(function() {
		    Screen.flashMessage("STAGE CLEAR!");
		}, 3000);
		setTimeout(function() {
		    Game.State.gotoNextStage();
		}, 6000);
	    } else {
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

    Game.State = {
	isRunning: true,
	isInDropzone: false,
	isChoosingTheDeck: true,
	stage: 1,
	score: 0,

	init: function() {
	    this.isRunning = true;
	    this.stage = 1;
	    this.score = 0;
	    this.totalScore = 0;
	    this.show();
	},

	dropped: function() {
	    this.isInDropzone = false;
	    this.isChoosingTheDeck = true;
	},

	chosen: function() {
	    this.isInDropzone = true;
	    this.isChoosingTheDeck = false;
	},

	showScore: function() {
	    $("#score").html("Score: " + this.score + "pt");
	    var color = this.stageClear() ? '#88aaff' : '#ffbb33';
	    $("#score").css('background', color);
	},

	showTotalScore: function() {
	    $("#total-score").html("Total Score: " + this.totalScore + "pt");
	},

	addScore: function(score) {
	    this.score += score;
	    this.totalScore += score;
	    this.showScore();
	    this.showTotalScore();
	},

	show: function() {
	    this.showScore();
	    this.showTotalScore();
	    this.showStage();
	},

	showStage: function() {
	    $("#stage").html("Stage: " + this.stage + " : " + Game.Stage[this.stage] + "pt");
	},

	stageClear: function() {
	    return this.score - Game.Stage[this.stage] >= 0;
	},

	gotoNextStage: function() {
	    this.totalScore += this.score;
	    this.stage++;
	    setTimeout(function() {
		Screen.flashMessage("STAGE " + Game.State.stage);
	    }, 200);

	    this.score = 0;
	    this.show();

	    Screen.init();
	    Game.initDecks();
	    Board.init();
	    Game.Stage.isRunning = true;
	}
    };

    Game.Stage = {
	1: 1000,
	2: 3000,
	3: 5000,
	4: 8000,
	5: 10000
    };

    // Run the game.
    Game.init();

    //
    // Some test code.
    //
    var runTest = true;
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
		[[0,1], [0,10], [0,11], [0,12], [0,13], 'isRoyalStraightFlush'],
		[[0,1], [1,1], [2,1], [3,1], [3,1], 'isFiveOfAKind']
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
