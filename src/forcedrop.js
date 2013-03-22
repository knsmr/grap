// Keep the timer for force droppping

grap.ForceDrop = {
    secondsToForce: 0,
    timer: null,

    init: function(seconds) {
        this.secondsToForce = seconds || 2;
    },

    start: function() {
        this.stop();

        this.timer = setInterval(function() {
            grap.Board.forceDrop();
        }, this.secondsToForce * 1000);
    },

    stop: function() {
        clearInterval(this.timer);
    }
};
