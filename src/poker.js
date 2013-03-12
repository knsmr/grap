grap.Poker = function(cards) {
    this.cards = cards.sort(function(a, b) { return a.num - b.num; });
    this.hand = {};
    this.determineHand();
    //	pp(this.hand);
};

grap.Poker.prototype = {
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
