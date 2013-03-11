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

var pp = console.log.bind(console);
var grap = {};  // global namespace for the entire game.

var Game = {
    init: function() {
	window.addEventListener("load", this);
    },

    handleEvent: function(e) {
	if (e.type == "load") {
	    window.removeEventListener("load", this);
	    this._setup();
	}
    },

    _setup: function() {
	grap.Screen.init();
	this.initDecks();
	grap.Board.init();
	this.State.init();
	this.keyeventInit();
	this.State.isRunning = true;
    },

    initDecks: function() {
	var decks = [];

	for (var i = 0; i < 5; i++) {
	    decks.push(new grap.Deck());
	}

	var deck = (function() {
	    var deck = grap.Card.generateAll();
	    deck.push(new grap.Card(2, 0)); // a joker
	    return _.shuffle(deck);
	})();

	for (var i = 0, ii = deck.length; i < ii; i++) {
	    var d = _.random(4);
	    decks[d].addCard(deck[i]);
	}
	grap.Decks = decks;
    },

    keyeventInit: function() {
	// left-37, up-38, right-39, down-40
	$(document).keydown(function(e) {
	    var target;
	    if (Game.State.isInDropzone) {
		target = grap.Board.selectedCard;
	    } else if (Game.State.isChoosingTheDeck) {
		target = grap.Board.selectFocus;
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
			if (grap.Board.selectedCard.drop()) {
			    Game.State.dropped();
			}
		    } else if (Game.State.isChoosingTheDeck) {
			if (grap.Board.chooseCard()) {
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
	if (!grap.Board.isFilled()) return;

	if (Game.State.stageClear()) {
	    Game.State.isRunnig = false;
	    setTimeout(function() {
		grap.Screen.flashMessage("STAGE CLEAR!");
	    }, 3000);
	    setTimeout(function() {
		Game.State.gotoNextStage();
	    }, 6000);
	} else {
	    Game.State.isRunning = false;
	    setTimeout(function() {
		grap.Screen.showMessage("Game Over. Play again? (y)");
	    }, 1000);
	}
    },

    fillAll: function() {
	for(var x = 0; x < 5; x++) {
	    for(var y = 0; y <= 6; y++) {
		if (y == 1) continue;
		grap.Decks[2].openCard().place(x, y);
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
	    grap.Screen.flashMessage("STAGE " + Game.State.stage);
	}, 200);

	this.score = 0;
	this.show();

	grap.Screen.init();
	Game.initDecks();
	grap.Board.init();
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
     	    hand.push(new grap.Card(c[i][0], c[i][1]));
	}
	var p = new grap.Poker(hand);
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

