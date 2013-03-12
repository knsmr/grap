describe("Poker", function() {
    var testCases =
	[
	    [[0,1], [1,1], [2,3], [2,5], [3,10], 'OnePair'],
	    [[0,1], [1,11], [2,3], [2,11], [3,10], 'OnePair'],
	    [[0,1], [1,1], [2,3], [3,3], [3,10], 'TwoPair'],
	    [[0,5], [1,1], [2,3], [3,3], [3,5], 'TwoPair'],
	    [[0,1], [1,1], [2,1], [3,3], [3,10], 'ThreeOfAKind'],
	    [[0,1], [1,5], [2,5], [2,9], [3,5], 'ThreeOfAKind'],
	    [[0,1], [0,3], [0,4], [0,5], [0,8], 'Flush'],
	    [[0,1], [1,1], [2,5], [0,5], [3,5], 'FullHouse'],
	    [[0,1], [2,5], [1,1], [0,5], [3,5], 'FullHouse'],
	    [[0,1], [2,5], [1,1], [2,1], [3,1], 'FourOfAKind'],
	    [[0,5], [2,4], [3,3], [2,2], [0,6], 'Straight'],
	    [[0,5], [0,4], [0,3], [0,2], [0,6], 'StraightFlush'],
	    [[0,5], [0,4], [0,3], [0,2], [0,6], 'StraightFlush'],
	    [[0,1], [0,10], [1,11], [2,12], [0,13], 'RoyalStraight'],
	    [[0,1], [0,2], [0,4], [0,5], [0,3], 'StraightFlush'],
	    [[0,1], [0,10], [0,11], [0,12], [0,13], 'RoyalStraightFlush'],
	    [[0,1], [1,1], [2,1], [3,1], [3,1], 'FiveOfAKind']
	];

    var cards, poker, str;

    beforeEach(function() {
    });

    _.each(testCases, function(c) {
	str = _.take(c, 5).join(', ');

	it(str + " should be " + _.last(c), function() {
	    cards = _.map(_.take(c, 5), function(a) {
		return new grap.Card(a[0], a[1]);
	    });

	    poker = new grap.Poker(cards);
	    expect(poker.toString()).toEqual(_.last(c));
	});
    });
});
