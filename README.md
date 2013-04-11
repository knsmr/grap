# Grap

Grap (gravitational poker) is a little game for modern browsers that I've coded as a weekend project.

![Screenshot](https://dl.dropboxusercontent.com/u/296/grap/grap01.png)

As a newbie, I wanted to know what it's like to code in JavaScript. Fiddling with the awesome SVG library Raphael.js, I ended up with a somewhat full-fledged playable game. I was just going to do some experiments with the library, though.

## How to play

The game is in the same vein as Tetris, where blocks fall and you manipulate the stuff to fit a falling block into the blocks already fixed underneath.

Grap is a combination of Tetris and the poker game, sort of. In Grap, cards are the blocks in Tetris and you are to line up cards in the 5 x 5 matrix at the bottom so that you line them up horizontally, vertically and diagonally making poker hands as many as possible. Select and move a card to drop using cursor keys(or, hjkl if you know what I mean). ★★ represents a joker, which would be considered to be any card that makes the best possible hand in that position. Pink lines indicate 'double lines' where the score will be doubled. Each stage has a minimum required score.

Grap is a replication of an old game named Ryukyu (琉球). The game hit the Japanese game market sometime around 1990. There had been a couple of versions on game consoles, too. I really loved the game. Grap should be different from the original game in many ways since my memories of the game had already been lost in oblivion... I should've googled it before coding Grap.

## TODO

### Implementation-wise

- use require.js (still, don't know how)
- rewrite some actions using custom defined events like onFall (how am I supposed to?)
- define a cleaner state transition table (should've been that way)
- remove jQuery (too much stuff in there, also I want to learn the raw APIs)
- use some deferred/promise api with either jquery or a custom implementation (damn 'this' problem and the async calls like setTimeout is confusing and dirty)
- remove underscore.js (would be fun to reinvent the whole collection apis)
- support mobile devices and touch events (maybe it's too late)

### Game-wise

- bug: stop the force drop when the board is filled or game is over
- explicitly show some message when the score surpassed the required minimum score for the stage
- create a start/restart dialogue
- use animation when moving and dropping a card
- list up all the hands that have been made
- add sound effects: use howler.js?
