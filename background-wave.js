Polymer({
  is: 'background-wave',

  behaviors: [
  ],

  properties: {
    amplitude: {
      type: Number,
      value: 1
    },
    speed: {
      type: Number,
      value: .01
    },
    frequency: {
      type: Number,
      value: .2
    },
    color: {
      type: String,
      value: '#fff'
    },
    speedInterpolationSpeed: {
      type: Number,
      value: .005
    },
    amplitudeInterpolationSpeed: {
      type: Number,
      value: .05
    },
    linesDefinition: {
      type: Array,
      value: [
        { color: ['#d3d3a7', "#b17454", "#924520", "#962d1f"] },
        { color: ['#d3d3a7', "#e6a722", "#af9430", "#5c4319"] },
        { color: ['#fbe6ad', "#ee945b", "#d83b26", "#962d1f"] },
        { color: ['#d3d3a7', "#b17454", "#924520", "#962d1f"] },
        { color: ['#d3d3a7', "#e6a722", "#af9430", "#5c4319"] },
        { color: ['#fbe6ad', "#ee945b", "#d83b26", "#962d1f"] },
        { color: ['#d3d3a7', "#b17454", "#924520", "#962d1f"] },
        { color: ['#d3d3a7', "#e6a722", "#af9430", "#5c4319"] },
        { color: ['#fbe6ad', "#ee945b", "#d83b26", "#962d1f"] }
      ]
    }
  },

  attached: function() {

  	var opt = opt || {};
  
  	this.phase = 0;
  	this.cache = {};
  
  	this.ratio = window.devicePixelRatio || 1;
  	
  	this.cache.width = Math.round(window.getComputedStyle(this).width.replace('px', '') * 2 * this.ratio);
  	this.cache.height = Math.round(window.getComputedStyle(this).height.replace('px', '') * 2 * this.ratio);

  	this.cache.interpolation = {
  		speed: this.speed,
  		amplitude: this.amplitude
  	};
  
  	// Canvas
  
  	this.ctx = this.$.canvas.getContext('2d');
  	this.$.canvas.width = this.cache.width;
  	this.$.canvas.height = this.cache.height;
  	this.$.canvas.style.width = this.$.canvas.style.height = '100%';

  	this.curves = [];

  	for (var i = 0; i < this.linesDefinition.length; i++) {

  		for (var j = 0; j < 1; j++) {

  			this.curves.push(new waveCurve({
  				controller: this,
  				definition: this.linesDefinition[i]
  			}));
  		}
  	}
  
  	// Start
    this._startDrawCycle();
  },
  
  _interpolate: function(propertyStr) {
  	increment = this[ propertyStr + 'InterpolationSpeed' ];
  
  	if (Math.abs(this.cache.interpolation[propertyStr] - this[propertyStr]) <= increment) {
  		this[propertyStr] = this.cache.interpolation[propertyStr];
  	} else {
  		if (this.cache.interpolation[propertyStr] > this[propertyStr]) {
  			this[propertyStr] += increment;
  		} else {
  			this[propertyStr] -= increment;
  		}
  	}
  },
  
  _clear: function() {
  	this.ctx.globalCompositeOperation = 'destination-out';
  	this.ctx.fillRect(0, 0, this.cache.width, this.cache.height);
  	this.ctx.globalCompositeOperation = 'source-over';
  },
  
  _draw: function() {
  	for (var i = 0, len = this.curves.length; i < len; i++) {
  		this.curves[i].draw();
  	}
  },
  
  _startDrawCycle: function() {
  	this._clear();
  
  	// Interpolate values
  	this._interpolate('amplitude');
  	this._interpolate('speed');
  
  	this._draw();
  	this.phase = (this.phase + Math.PI * this.speed) % (2 * Math.PI);
  
  	if (window.requestAnimationFrame) {
  		window.requestAnimationFrame(this._startDrawCycle.bind(this));
  	} else {
  		setTimeout(this._startDrawCycle.bind(this), 20);
  	}
  }
});

(function() {

  function waveCurve(opt) {
  	this.controller = opt.controller;
  	this.definition = opt.definition;
  	this.tick = 0;
  	this.direction = "up";
  	this.lastY = 0;
  	this._respawn();
  }
  
  waveCurve.prototype._respawn = function() {
  	this.amplitude = 0.5 + Math.random() * 0.5;
  	this.seed = Math.random();
  	this.openClass = 2 + (Math.random()*5)|0;
  };
  
  waveCurve.prototype._ypos = function(i) {
  	var p = this.tick;
  	var y = -1 * Math.abs(Math.sin(p)) * this.controller.amplitude * this.amplitude * this.controller.cache.height * Math.pow(1 / (1 + Math.pow(this.openClass * i, 2)), 2);
  
  	return y;
  };
  
  waveCurve.prototype._draw = function(sign) {

  	var ctx = this.controller.ctx;
    var maxY = 0;
    var minY = this.controller.cache.height;
    var lastDirection = this.direction;
  
  	this.tick += this.controller.speed * (1 - 0.5 * Math.sin(this.seed * Math.PI));
  
  	for (var n = 0; n < this.definition.color.length; n++) {

    	ctx.beginPath();
    
    	var xBase = this.controller.cache.width + (-this.controller.cache.width + this.seed * (this.controller.cache.width));
    	var yBase = this.controller.cache.height;
    	var x, y;
    	var xInit = null;
    
    	for (var i = -3; i <= 3; i += 0.005) {
    		x = xBase + i * this.controller.cache.width;
    		y = yBase + ((sign || 1) * this._ypos(i) * (1 - (n * .1)));
    
    		xInit = xInit || x;

        if (!n) {
          
          maxY = Math.max(parseFloat(y), maxY);
          minY = Math.max(parseFloat(y), minY);
        }
    		
    		ctx.lineTo(x, y);
    	}
    
    	ctx.lineTo(xInit + this.controller.cache.width, yBase);
    	ctx.closePath();
    	ctx.fillStyle = this.definition.color[n];
    
    	ctx.fill();
    }

    if (this.lastY < maxY - minY) {

      this.direction = "down";
    } else {

      this.direction = "up";
    }

    this.lastY = maxY - minY;

  	if (this.direction == "up" && lastDirection == "down") {
    	this.lastY = 0;
  		this._respawn();
  	}
  };
  
  waveCurve.prototype.draw = function() {
  	this._draw(1);
  };

  window.waveCurve = waveCurve;
})();
