//============================================================
//
// The MIT License
//
// Copyright (C) 2013 Christophe Rosset - @topheman
// Copyright (C) 2013 Matthew Wagerfield - @mwagerfield
//
// Permission is hereby granted, free of charge, to any
// person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the
// Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute,
// sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice
// shall be included in all copies or substantial portions
// of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY
// OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
// LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
// EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
// FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
// AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
// OR OTHER DEALINGS IN THE SOFTWARE.
//
//============================================================

/**
 * jQuery/Zepto Parallax Plugin
 * @author Matthew Wagerfield - @mwagerfield
 * @description Creates a parallax effect between an array of layers,
 *              driving the motion from the gyroscope output of a smartdevice.
 *              If no gyroscope is available, the cursor position is used.
 */
;(function($, window, document, undefined) {

  var NAME = 'parallax';
  var MAGIC_NUMBER = 30;
  var DEFAULTS = {
    calibrationThreshold: 100,
    calibrationDelay: 500,
    supportDelay: 500,
    calibrateX: false,
    calibrateY: true,
    invertX: true,
    invertY: true,
    limitX: false,
    limitY: false,
    scalarX: 10.0,
    scalarY: 10.0,
    frictionX: 0.1,
    frictionY: 0.1,
    headtrackr: false,
    headtrackrPreferDeviceMotion: true,
    headtrackrDisplayVideo: false,
    headtrackrDebugView: false,
    headtrackrScalarX: 3,
    headtrackrScalarY: 3,
    headtrackrScriptLocation: null
  };

  function Plugin(element, options) {

    // DOM Context
    this.element = element;

    // Selections
    this.$context = $(element).data('api', this);
    this.$layers = this.$context.find('.layer');

    // Data Extraction
    var data = {
      calibrateX: this.$context.data('calibrate-x') || null,
      calibrateY: this.$context.data('calibrate-y') || null,
      invertX: this.$context.data('invert-x') || null,
      invertY: this.$context.data('invert-y') || null,
      limitX: parseFloat(this.$context.data('limit-x')) || null,
      limitY: parseFloat(this.$context.data('limit-y')) || null,
      scalarX: parseFloat(this.$context.data('scalar-x')) || null,
      scalarY: parseFloat(this.$context.data('scalar-y')) || null,
      frictionX: parseFloat(this.$context.data('friction-x')) || null,
      frictionY: parseFloat(this.$context.data('friction-y')) || null,
      headtrackr: this.$context.data('headtrackr') || null,
      headtrackrPreferDeviceMotion: this.$context.data('headtrackr-prefer-device-motion') || null,
      headtrackrDisplayVideo: this.$context.data('headtrackr-display-video') || null,
      headtrackrDebugView: this.$context.data('headtrackr-debug-view') || null,
      headtrackrScalarX: parseFloat(this.$context.data('headtrackr-scalar-x')) || null,
      headtrackrScalarY: parseFloat(this.$context.data('headtrackr-scalar-y')) || null,
      headtrackrScriptLocation: this.$context.data('headtrackr-script-location') || null
    };

    // Delete Null Data Values
    for (var key in data) {
      if (data[key] === null) delete data[key];
    }

    // Compose Settings Object
    $.extend(this, DEFAULTS, options, data);

    // States
    this.calibrationTimer = null;
    this.calibrationFlag = true;
    this.enabled = false;
    this.depths = [];
    this.raf = null;

    // Offset
    this.ox = 0;
    this.oy = 0;
    this.ow = 0;
    this.oh = 0;

    // Calibration
    this.cx = 0;
    this.cy = 0;

    // Input
    this.ix = 0;
    this.iy = 0;

    // Motion
    this.mx = 0;
    this.my = 0;

    // Velocity
    this.vx = 0;
    this.vy = 0;

    // Callbacks
    this.onFaceTracking = this.onFaceTracking.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onDeviceOrientation = this.onDeviceOrientation.bind(this);
    this.onOrientationTimer = this.onOrientationTimer.bind(this);
    this.onCalibrationTimer = this.onCalibrationTimer.bind(this);
    this.onAnimationFrame = this.onAnimationFrame.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    // Initialise
    this.initialise();
  }

  Plugin.prototype.transformSupport = function(value) {
    var element = document.createElement('div');
    var propertySupport = false;
    var propertyValue = null;
    var featureSupport = false;
    var cssProperty = null;
    var jsProperty = null;
    for (var i = 0, l = this.vendors.length; i < l; i++) {
      if (this.vendors[i] !== null) {
        cssProperty = this.vendors[i][0] + 'transform';
        jsProperty = this.vendors[i][1] + 'Transform';
      } else {
        cssProperty = 'transform';
        jsProperty = 'transform';
      }
      if (element.style[jsProperty] !== undefined) {
        propertySupport = true;
        break;
      }
    }
    switch(value) {
      case '2D':
        featureSupport = propertySupport;
        break;
      case '3D':
        if (propertySupport) {
          document.body.appendChild(element);
          element.style[jsProperty] = 'translate3d(1px,1px,1px)';
          propertyValue = window.getComputedStyle(element).getPropertyValue(cssProperty);
          featureSupport = propertyValue !== undefined && propertyValue.length > 0 && propertyValue !== "none";
          document.body.removeChild(element);
        }
        break;
    }
    return featureSupport;
  };

  Plugin.prototype.ww = null;
  Plugin.prototype.wh = null;
  Plugin.prototype.hw = null;
  Plugin.prototype.hh = null;
  Plugin.prototype.portrait = null;
  Plugin.prototype.desktop = !navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|BB10|mobi|tablet|opera mini|nexus 7)/i);
  Plugin.prototype.vendors = [null,['-webkit-','webkit'],['-moz-','Moz'],['-o-','O'],['-ms-','ms']];
  Plugin.prototype.motionSupport = !!window.DeviceMotionEvent;
  Plugin.prototype.orientationSupport = !!window.DeviceOrientationEvent;
  Plugin.prototype.getUserMediaSupport = !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
  Plugin.prototype.headtrackrEnabled = false; //will turn to true if getUserMediaSupport and no DeviceMotion (or headtrackrPreferDeviceMotion = false)
  Plugin.prototype.orientationStatus = 0;
  Plugin.prototype.transform2DSupport = Plugin.prototype.transformSupport('2D');
  Plugin.prototype.transform3DSupport = Plugin.prototype.transformSupport('3D');
  
  /**
   * Method to be called when the headtrackr feature was asked for, there is getUserMedia support and no DeviceMotion or headtrackrPreferDeviceMotion = false
   */
  Plugin.prototype.headtrackrPrepare = function(){
    if(typeof headtrackr === "undefined"){
      if(this.headtrackrScriptLocation !== null){
        var headTrackrScript = document.createElement('script'),
            self = this;
        headTrackrScript.onload = function(script){
          if(typeof headtrackr !== "undefined"){
            self.headtrackrPrepare();
          }
          else{
            throw new Error("Wrong path to headtrackr script");
          }
        };
        headTrackrScript.src = this.headtrackrScriptLocation;
        document.getElementsByTagName('body')[0].appendChild(headTrackrScript);
        return false;
      }
      else{
        throw new Error("To use the headtrackr feature, you need to include the headtrakr.js or headtrackr.min.js script before the parallax one, or set its location in the parallax option headtrackrScriptLocation");
      }
    }

    var inputVideo = document.createElement('video'),
        canvasInput = document.createElement('canvas'),
        canvasDebug = null,
        videoWidth = "320",
        videoHeight = "240",
        headtrackrOptions = {},
        self;

    //add the mousemove listener while connecting the camera
    //we'll remove it when the face is detected to plug trackr
    //then readd it when the trackr fails
    window.addEventListener('mousemove', this.onMouseMove);

    inputVideo.autoplay = true;
    inputVideo.loop = true;
    inputVideo.style.display = "none";
    inputVideo.width = videoWidth;
    inputVideo.height = videoHeight;

    canvasInput.id = "headtrackr-display-video";
    canvasInput.style.position = "fixed";
    canvasInput.style.bottom = "0px";
    canvasInput.style.right = "0px";
    canvasInput.width = videoWidth;
    canvasInput.height = videoHeight;

    if(this.headtrackrDisplayVideo === true || this.headtrackrDebugView === true){
      canvasInput.style.display = "block"; 
      if(this.headtrackrDebugView === true){
        canvasDebug = document.createElement('canvas');
        canvasDebug.id = "headtrackr-debug-view";
        canvasDebug.style.display = "block";
        canvasDebug.style.position = "fixed";
        canvasDebug.style.bottom = "0px";
        canvasDebug.style.right = "0px";
        canvasDebug.width = videoWidth;
        canvasDebug.height = videoHeight;
        headtrackrOptions.calcAngles = true;
      }
    }
    else{
      this.headtrackrDebugView = false;
      canvasInput.style.display = "none";          
    }

    this.htrackr = new headtrackr.Tracker(headtrackrOptions);

    document.getElementsByTagName('body')[0].appendChild(inputVideo);
    document.getElementsByTagName('body')[0].appendChild(canvasInput);
    if(canvasDebug !== null){
      document.getElementsByTagName('body')[0].appendChild(canvasDebug);
      this.htrackr.canvasDebug = canvasDebug;
      this.htrackr.ctxDebug = canvasDebug.getContext('2d');
    }
    
    //callback to be used to display a "please allow your webcam" for example
    if(typeof(this.headtrackrOnBeforeCameraAccess) === "function"){
      this.headtrackrOnBeforeCameraAccess();
    }

    this.htrackr.init(inputVideo, canvasInput);
    this.htrackr.start();
    this.htrackr.canvasInputInfos = {
      ww : canvasInput.width,
      wh : canvasInput.height,
      hw : canvasInput.width / 2,
      hh : canvasInput.height / 2
    };

    self = this;
    document.addEventListener('headtrackrStatus', function(e){
      console.log(e.status,e.type,e.timeStamp);
      if(e.status === "camera found"){
        if(typeof(self.headtrackrOnCameraFound) === "function"){
          self.headtrackrOnCameraFound();
        }
      }
      else if(e.status === "found"){
        window.removeEventListener('mousemove', self.onMouseMove);
        document.addEventListener("facetrackingEvent", self.onFaceTracking, false);
      }
      else if(e.status === "redetecting"){
        window.addEventListener('mousemove', self.onMouseMove);
        document.removeEventListener("facetrackingEvent", self.onFaceTracking, false);
      }
    });
  };
  
  /**
   * Method to be called when the headtrackr was to be initiated but there was no getUserMediaSupport for
   */
  Plugin.prototype.headtrackrFail = function(){
    //if no callback is set, set the default callback
    if(typeof(this.headtrackrNoGetUserMediaCallback) !== "function"){
      this.headtrackrNoGetUserMediaCallback = function(){
        var message = "<small>Sorry no getUserMedia support on your browser.</small><br><br>To test <strong>facetracking</strong>,<br><br>please use<br><strong>Chrome or Firefox</strong>";
        console.log(message.replace(/<br>/g,' ').replace(/(<([^>]+)>)/ig,''));

        var timeout = 10000;
        // create element and attach to body
        var d = document.createElement('div'),
        d2 = document.createElement('div'),
        p = document.createElement('p');
        d.setAttribute('id', 'headtrackerMessageDiv');

        d.style.left = "10%";
        d.style.right = "10%";
        d.style.top = "10%";
        d.style.fontSize = "150%";
        d.style.color = "#777";
        d.style.position = "absolute";
        d.style.fontFamily = "Helvetica, Arial, sans-serif";
        d.style.zIndex = '100002';

        d2.style.marginLeft = "auto";
        d2.style.marginRight = "auto";
        d2.style.width = "100%";
        d2.style.textAlign = "center";
        d2.style.color = "#fff";
        d2.style.backgroundColor = "#444";
        d2.style.opacity = "0.8";

        p.setAttribute('id', 'parallaxHeadtrackerNoGetUserMediaMessage');
        p.innerHTML = message;
        d2.appendChild(p);
        d.appendChild(d2);
        document.body.appendChild(d);

        setTimeout(function(){
            d.parentNode.removeChild(d);
        },timeout);

      };
    }
    this.headtrackrNoGetUserMediaCallback();
    //back to normal behaviour
    this.headtrackr = false;
  };

  Plugin.prototype.initialise = function() {

    // Configure Styles
    if (this.$context.css('position') === 'static') {
      this.$context.css({
        position:'relative'
      });
    }
    this.$layers.css({
      position:'absolute',
      display:'block',
      height:'100%',
      width:'100%',
      left: 0,
      top: 0
    });
    this.$layers.first().css({
      position:'relative'
    });

    // Cache Depths
    this.$layers.each($.proxy(function(index, element) {
      this.depths.push($(element).data('depth') || 0);
    }, this));

    // Hardware Accelerate Elements
    this.accelerate(this.$context);
    this.accelerate(this.$layers);

    // Setup
    
    //if headtrackr was asked, and can be supported (via getUserMedia), no matter if there is DeviceMotion on the device, enable it
    //if headtracker was asked but with headtrackrPreferDeviceMotion === true, the headtrackrPrepare() is made in the onOrientationTimer (where we make sure there is - or not - DeviceMotion support)
    if(this.headtrackr === true && this.getUserMediaSupport === true && (this.headtrackrPreferDeviceMotion === false || this.orientationSupport === false) && this.headtrackrEnabled === false){
      this.headtrackrPrepare();
      this.headtrackrEnabled = true;
    }
    else if(this.headtrackr === true && this.getUserMediaSupport === false && (this.headtrackrPreferDeviceMotion === false || this.orientationSupport === false) && this.headtrackrEnabled === false){
      this.headtrackrFail();
    }
    this.updateDimensions();
    this.enable();
    this.queueCalibration(this.calibrationDelay);
  };

  Plugin.prototype.updateDimensions = function() {

    // Cache Context Dimensions
    this.ox = this.$context.offset().left;
    this.oy = this.$context.offset().top;
    this.ow = this.$context.width();
    this.oh = this.$context.height();

    // Cache Window Dimensions
    this.ww = window.innerWidth;
    this.wh = window.innerHeight;
    this.hw = this.ww / 2;
    this.hh = this.wh / 2;
  };

  Plugin.prototype.queueCalibration = function(delay) {
    clearTimeout(this.calibrationTimer);
    this.calibrationTimer = setTimeout(this.onCalibrationTimer, delay);
  };

  Plugin.prototype.enable = function() {
    if (!this.enabled) {
      this.enabled = true;
      if (this.headtrackrEnabled === false && this.orientationSupport) {
        this.portrait = null;
        window.addEventListener('deviceorientation', this.onDeviceOrientation);
        setTimeout(this.onOrientationTimer, this.supportDelay);
      } 
      else if (this.headtrackrEnabled === false) {
        this.cx = 0;
        this.cy = 0;
        this.portrait = false;
        window.addEventListener('mousemove', this.onMouseMove);
      }
      else {
        document.addEventListener("facetrackingEvent", this.onFaceTracking, false);
      }
      window.addEventListener('resize', this.onWindowResize);
      this.raf = requestAnimationFrame(this.onAnimationFrame);
    }
  };

  Plugin.prototype.disable = function() {
    if (this.enabled) {
      this.enabled = false;
      if (this.headtrackrEnabled === false && this.orientationSupport) {
        window.removeEventListener('deviceorientation', this.onDeviceOrientation);
      } 
      else if (this.headtrackrEnabled === false) {
        window.removeEventListener('mousemove', this.onMouseMove);
      }
      else {
        document.removeEventListener("facetrackingEvent", this.onFaceTracking, false);
      }
      window.removeEventListener('resize', this.onWindowResize);
      cancelAnimationFrame(this.raf);
    }
  };

  Plugin.prototype.calibrate = function(x, y) {
    this.calibrateX = x === undefined ? this.calibrateX : x;
    this.calibrateY = y === undefined ? this.calibrateY : y;
  };

  Plugin.prototype.invert = function(x, y) {
    this.invertX = x === undefined ? this.invertX : x;
    this.invertY = y === undefined ? this.invertY : y;
  };

  Plugin.prototype.friction = function(x, y) {
    this.frictionX = x === undefined ? this.frictionX : x;
    this.frictionY = y === undefined ? this.frictionY : y;
  };

  Plugin.prototype.scalar = function(x, y) {
    this.scalarX = x === undefined ? this.scalarX : x;
    this.scalarY = y === undefined ? this.scalarY : y;
  };

  Plugin.prototype.headtrackrScalar = function(x, y) {
    this.headtrackrScalarX = x === undefined ? this.headtrackrScalarX : x;
    this.headtrackrScalarY = y === undefined ? this.headtrackrScalarY : y;
  };

  Plugin.prototype.limit = function(x, y) {
    this.limitX = x === undefined ? this.limitX : x;
    this.limitY = y === undefined ? this.limitY : y;
  };

  Plugin.prototype.clamp = function(value, min, max) {
    value = Math.max(value, min);
    value = Math.min(value, max);
    return value;
  };

  Plugin.prototype.css = function(element, property, value) {
    var jsProperty = null;
    for (var i = 0, l = this.vendors.length; i < l; i++) {
      if (this.vendors[i] !== null) {
        jsProperty = $.camelCase(this.vendors[i][1] + '-' + property);
      } else {
        jsProperty = property;
      }
      if (element.style[jsProperty] !== undefined) {
        element.style[jsProperty] = value;
        break;
      }
    }
  };

  Plugin.prototype.accelerate = function($element) {
    for (var i = 0, l = $element.length; i < l; i++) {
      var element = $element[i];
      this.css(element, 'transform', 'translate3d(0,0,0)');
      this.css(element, 'transform-style', 'preserve-3d');
      this.css(element, 'backface-visibility', 'hidden');
    }
  };

  Plugin.prototype.setPosition = function(element, x, y) {
    x += '%';
    y += '%';
    if (this.transform3DSupport) {
      this.css(element, 'transform', 'translate3d('+x+','+y+',0)');
    } else if (this.transform2DSupport) {
      this.css(element, 'transform', 'translate('+x+','+y+')');
    } else {
      element.style.left = x;
      element.style.top = y;
    }
  };

  Plugin.prototype.onOrientationTimer = function(event) {
    if (this.orientationSupport && this.orientationStatus === 0) {
      this.disable();
      this.orientationSupport = false;
      //only at this point we are sure there is no orientationSupport (can't rely on !!window.DeviceOrientationEvent, beacause we may be on a desktop that may expose the API but doesn't have any accelerometer)
      //so, we launch the headtrackr in fallback to deviceMotion as asked in the options as headtrackrPreferDeviceMotion = true
      if(this.headtrackr === true && this.getUserMediaSupport === true && this.headtrackrPreferDeviceMotion === true && this.headtrackrEnabled === false){
        this.headtrackrPrepare();
        this.headtrackrEnabled = true;
      }
      //in case there is no getUserMedia support but it was asked to use headtrackr 
      else if(this.headtrackr === true && this.getUserMediaSupport === false && this.headtrackrPreferDeviceMotion === true && this.headtrackrEnabled === false){
        this.headtrackrFail();
      }
      this.enable();
    }
  };

  Plugin.prototype.onCalibrationTimer = function(event) {
    this.calibrationFlag = true;
  };

  Plugin.prototype.onWindowResize = function(event) {
    this.updateDimensions();
  };

  Plugin.prototype.onAnimationFrame = function() {
    var dx = this.ix - this.cx;
    var dy = this.iy - this.cy;
    if ((Math.abs(dx) > this.calibrationThreshold) || (Math.abs(dy) > this.calibrationThreshold)) {
      this.queueCalibration(0);
    }
    if (this.portrait) {
      this.mx = (this.calibrateX ? dy : this.iy) * this.scalarX;
      this.my = (this.calibrateY ? dx : this.ix) * this.scalarY;
    } else {
      this.mx = (this.calibrateX ? dx : this.ix) * this.scalarX;
      this.my = (this.calibrateY ? dy : this.iy) * this.scalarY;
    }
    if (!isNaN(parseFloat(this.limitX))) {
      this.mx = this.clamp(this.mx, -this.limitX, this.limitX);
    }
    if (!isNaN(parseFloat(this.limitY))) {
      this.my = this.clamp(this.my, -this.limitY, this.limitY);
    }
    this.vx += (this.mx - this.vx) * this.frictionX;
    this.vy += (this.my - this.vy) * this.frictionY;
    for (var i = 0, l = this.$layers.length; i < l; i++) {
      var depth = this.depths[i];
      var layer = this.$layers[i];
      var xOffset = this.vx * depth * (this.invertX ? -1 : 1);
      var yOffset = this.vy * depth * (this.invertY ? -1 : 1);
      this.setPosition(layer, xOffset, yOffset);
    }
    this.raf = requestAnimationFrame(this.onAnimationFrame);
  };

  Plugin.prototype.onDeviceOrientation = function(event) {

    // Validate environment and event properties.
    if (!this.desktop && event.beta !== null && event.gamma !== null) {

      // Set orientation status.
      this.orientationStatus = 1;

      // Extract Rotation
      var x = (event.beta  || 0) / MAGIC_NUMBER; //  -90 :: 90
      var y = (event.gamma || 0) / MAGIC_NUMBER; // -180 :: 180

      // Detect Orientation Change
      var portrait = window.innerHeight > window.innerWidth;
      if (this.portrait !== portrait) {
        this.portrait = portrait;
        this.calibrationFlag = true;
      }

      // Set Calibration
      if (this.calibrationFlag) {
        this.calibrationFlag = false;
        this.cx = x;
        this.cy = y;
      }

      // Set Input
      this.ix = x;
      this.iy = y;
    }
  };

  Plugin.prototype.onMouseMove = function(event) {

    // Calculate Input
    this.ix = (event.pageX - this.hw) / this.hw;
    this.iy = (event.pageY - this.hh) / this.hh;
  };
  
  Plugin.prototype.onFaceTracking = function(event) {
    
    // Calculate Input
    if(event.detection === "CS"){
      this.ix = -this.headtrackrScalarX*(event.x - this.htrackr.canvasInputInfos.hw) / this.htrackr.canvasInputInfos.hw;
      this.iy = this.headtrackrScalarY*(event.y - this.htrackr.canvasInputInfos.hh) / this.htrackr.canvasInputInfos.hh;
      if(this.headtrackrDebugView === true){
        this.htrackr.canvasDebug.width = this.htrackr.canvasDebug.width;
        this.htrackr.ctxDebug.translate(event.x, event.y);
        this.htrackr.ctxDebug.rotate(event.angle-(Math.PI/2));
        this.htrackr.ctxDebug.strokeStyle = "#00CC00";
        this.htrackr.ctxDebug.strokeRect((-(event.width/2)) >> 0, (-(event.height/2)) >> 0, event.width, event.height);
        this.htrackr.ctxDebug.rotate((Math.PI/2)-event.angle);
        this.htrackr.ctxDebug.translate(-event.x, -event.y);
      }
    }
      
  };

  var API = {
    enable: Plugin.prototype.enable,
    disable: Plugin.prototype.disable,
    calibrate: Plugin.prototype.calibrate,
    friction: Plugin.prototype.friction,
    invert: Plugin.prototype.invert,
    scalar: Plugin.prototype.scalar,
    headtrackrScalar : Plugin.prototype.headtrackrScalar,
    limit: Plugin.prototype.limit
  };

  $.fn[NAME] = function (value) {
    var args = arguments;
    return this.each(function () {
      var $this = $(this);
      var plugin = $this.data(NAME);
      if (!plugin) {
        plugin = new Plugin(this, value);
        $this.data(NAME, plugin);
      }
      if (API[value]) {
        plugin[value].apply(plugin, Array.prototype.slice.call(args, 1));
      }
    });
  };

})(window.jQuery || window.Zepto, window, document);

/**
 * Request Animation Frame Polyfill.
 * @author Tino Zijdel
 * @author Paul Irish
 * @see https://gist.github.com/paulirish/1579671
 */
;(function() {

  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];

  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }

}());

