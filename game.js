// TODO:
// - use require.js
// - rewrite some actions using custom defined events
// - define a cleaner state transition table
// - remove jQuery
// - use deferred api with either jquery or a custom implementation
//
// - stop the force drop: filled, gameover
// - explicitly show a message when the minimum score surpassed the
//   required stage score
// - create a start/restart dialogue
// - use animation when moving a card
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
        grap.ForceDrop.init();
        this.State.run();
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
        $(document).keydown(function(e) {
            var keys = {
                left:  37,
                up:    38,
                right: 39,
                down:  40,
                h:     72,
                j:     74,
                k:     75,
                l:     76
            };

            var target;
            if (Game.State.isInDropzone) {
                target = grap.Board.selectedCard;
            } else if (Game.State.isChoosingTheDeck) {
                target = grap.Board.selectFocus;
            }

            var running = Game.State.isRunning;
            if (running) {
                switch(e.keyCode) {
                case keys.left:
                case keys.h:
                    target.moveLeft();
                    break;
                case keys.right:
                case keys.l:
                    target.moveRight();
                    break;
                case keys.up:
                case keys.k:
                    // as an experiment, we assign this key to forceDrop.
                    grap.Board.forceDrop();
                    break;
                case keys.down:
                case keys.j:
                    // drop it
                    if (Game.State.isInDropzone) {
                        if (grap.Board.selectedCard.drop()) {
                            Game.State.dropped();
                        }
                    } else if (Game.State.isChoosingTheDeck) {
                        grap.Board.chooseCard();
                        Game.State.chosen();
                    }
                }
            } else {
                if(e.keyCode == 89) {
                    // (y)es key
                    Game._setup();
                };
            }
        });
    },

    checkOver: function() {
        var result;
        if (grap.Board.isFilled()) {
            Game.State.stop();

            // FIXME: Are there any better ways to rewrite this fugly
            // timer nestings with a global state?
            setTimeout(function() {
                if (Game.State.numberOfRemainingHandsToGlow > 0) {
                    Game.checkOver();
                    // recurse another 1.2sec to wait for the glowing
                    // to finish
                }

                if (Game.State.stageClearCheckDone) return;

                if (Game.State.isStageClear()) {
                    setTimeout(function() {
                        Game.State.checkdone = true;
                        grap.Screen.flashMessage("STAGE CLEAR!");
                    }, 3000);
                    setTimeout(function() {
                        Game.State.gotoNextStage();
                    }, 6000);
                } else {
                    setTimeout(function() {
                        Game.State.stop();
                        grap.Screen.showMessage("Game Over. Play again? (y)");
                    }, 1000);
                }
            }, 1200);
        } else {
            result = false;
        }
        return result;
    }
};

Game.State = {
    isRunning: true,
    isInDropzone: false,
    isChoosingTheDeck: true,
    forceDropTimer: null,
    numberOfRemainingHandsToGlow: 0,
    stageClearChechDone: false,
    stage: 1,
    score: 0,

    init: function() {
        this.isRunning = true;
        this.stage = 1;
        this.score = 0;
        this.totalScore = 0;
        this.show();
    },

    run: function() {
        this.isRunning = true;
        grap.ForceDrop.start();
    },

    stop: function() {
        this.isRunning = false;
        grap.ForceDrop.stop();
    },

    dropped: function() {
        this.isInDropzone = false;
        this.isChoosingTheDeck = true;
        grap.ForceDrop.start();
    },

    chosen: function() {
        this.isInDropzone = true;
        this.isChoosingTheDeck = false;
        grap.ForceDrop.start();
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
        $("#stage").html("Stage" + this.stage + " Minimum Score: " + minScore + "pt");
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
        grap.ForceDrop.start();
        Game.State.isRunning = true;
        Game.State.stageClearChechDone = false;
    }
};

Game.Stage = {
    1: {score: 3000, dline: 0},
    2: {score: 5000, dline: 1},
    3: {score: 8000, dline: 1},
    4: {score: 10000, dline: 2},
    5: {score: 12000, dline: 2},
    6: {score: 20000, dline: 3}, // not sure if this is doable
    7: {score: 40000, dline: 4},
    8: {score: 40000, dline: 2}, // clearly, this isn't.
};

// Run the game.
Game.init();
