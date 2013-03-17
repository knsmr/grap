// TODO:
// - use require.js
//
// - queue the flash message so they don't overlap at a time(use promise?)
// - use animation when moving a card
// - force drop after a certain time passed
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
	    this.keyeventInit();
	    this._setup();
	}
    },

    _setup: function() {
	grap.Screen.init();
	this.initDecks();
	this.State.init();
	grap.Board.init();
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
		    Game._setup();
		    Game.run();
		};
	    }
	});
    },

    checkOver: function() {
	if (!grap.Board.isFilled()) return;

	if (Game.State.isStageClear()) {
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
	var color = this.isStageClear() ? '#88aaff' : '#ffbb33';
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
	var minScore = Game.Stage[this.stage]['score'];
	$("#stage").html("Stage: " + this.stage + " : " + minScore + "pt");
    },

    isStageClear: function() {
	return this.score - Game.Stage[this.stage]['score'] >= 0;
    },

    gotoNextStage: function() {
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
    1: {score: 3000, dline: 0},
    2: {score: 5000, dline: 1},
    3: {score: 8000, dline: 1},
    4: {score: 10000, dline: 2},
    5: {score: 15000, dline: 2},
    6: {score: 20000, dline: 2},
    7: {score: 30000, dline: 2}
};

// Run the game.
Game.init();
