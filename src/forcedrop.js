// Keep the timer for force droppping

grap.ForceDrop = {
    secondsToForce: 0,
    timer: null,
    bar: null, // holds a raphael object

    init: function(seconds) {
        // default to this seconds to wait for force dropping
        this.secondsToForce = seconds || 16;
    },

    start: function() {
        this.stop();

        this.bar = this.createBar();

        this.timer = setInterval(function() {
            grap.Board.forceDrop();
        }, this.secondsToForce * 1000);
    },

    stop: function() {
        clearInterval(this.timer);
        if (this.bar) {
            this.bar.remove();
        }
    },

    createBar: function() {
        var scr = grap.Screen,
            bar;
        bar = scr.paper.rect(scr.shim, 3, scr.cardSize * 5 + scr.shim * 4, 5);
        bar.attr({'fill': '#99ccff', 'fill-opacity': 0.9});
        bar.animate({'fill': 'red', width: 0}, this.secondsToForce * 1000);
        return bar;
    }
};
