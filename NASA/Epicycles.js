https://www.khanacademy.org/cs/animate-epicycles/4520289299857408

 /*********************************************************
 * What does the orbit of Mars look like from Earth?
 * 
 * Note, the size of the sun and planets is not to scale.
 * 
 * Spacebar: pause
 * a: toggle show old positions
 * s: toggle show orbit shape
 * 
*********************************************************/
// change speed
var speed = 1500;

// Sizes
var sun_size = 20;
var mars_size = 7;
var earth_size = 13;

// Colours
var SUN_COL = color(255, 255, 0);
var MARS_COL = color(212, 95, 17);
var EARTH_COL = color(61, 100, 255);

// Earth days for orbit
var mars_year = 687;
var earth_year = 365;

// Orbit ellipse radii in millions of km (x, y)
var mars_orbit_r = [228, 227];
var earth_orbit_r = [150, 150];

// Other variables for the display
var scaling_factor = 0.5;
var orbit_plots = 5;
var max_points = 1400;
var showCycles = true;
var showOld = true;

var fixed_point;

var t = 0;
var running = true;

// Put (0, 0) in the centre to make things easier
translate(200, 200);

var Sun = function(r, colour) {
    this.x = 0;
    this.y = 0;
    this.previous_points = [];
    
    this.update = function(t) {        
        if (t % orbit_plots === 0) {
            var x = this.x - fixed_point.x;
            var y = this.y - fixed_point.y;
            this.previous_points.push([x, y]);
            if (this.previous_points.length > 460/orbit_plots) {
                this.previous_points.shift();
            }
        }
    };
    
    this.display = function(x, y) {
        fill(colour);
        ellipse(x, y, r, r);
        fill(255, 89, 0, 100);
        ellipse(x, y, r+3, r+3);
    };
    
    this.draw = function() {
        var x = this.x - fixed_point.x;
        var y = this.y - fixed_point.y;
        
        fill(colour);
        for (var i in this.previous_points) {
            var p = this.previous_points[i];
            ellipse(p[0], p[1], 2, 2);
        }
        this.display(x, y);
    };
};

var Planet = function(cx, cy, major, minor, year, r, mass, colour) {
    this.angle = 0;
    this.mass = mass;
    cx *= scaling_factor;
    cy *= scaling_factor;
    major *= scaling_factor;
    minor *= scaling_factor;
    this.x = cx + major * cos(this.angle);
    this.y = cy + minor * sin(this.angle);
    
    this.previous_points = [];
    
    this.update = function(t) {
        // Distance to sun
        var d = sqrt(this.x*this.x + this.y*this.y);
        
        // Velocity
        var v = sqrt((2/d - 1/major));
        
        // Distance from ellipse centre
        var d = dist(this.x, this.y, cx, cy);
        
        this.angle += speed * v/d;
        
        this.x = cx + major * cos(this.angle);
        this.y = cy + minor * sin(this.angle);
        
        if (t % orbit_plots === 0) {
            var x = this.x - fixed_point.x;
            var y = this.y - fixed_point.y;
            this.previous_points.push([x, y]);
            if (this.previous_points.length > max_points) {
                this.previous_points.shift();
            }
        }
    };
    
    this.display = function(x, y) {
        fill(colour);
        ellipse(x, y, r, r);
    };
    
    this.drawCycle = function() {
        ellipse(cx-fixed_point.x, cy-fixed_point.y, major*2, minor*2);
    };
    
    this.draw = function() {
        fill(colour);
        
        if (showOld) {
            for (var i in this.previous_points) {
                var p = this.previous_points[i];
                ellipse(p[0], p[1], 2, 2);
            }
        }
        
        this.display(this.x-fixed_point.x, this.y-fixed_point.y);
    };
};  

/********************************************************
 *               Make planets here
*********************************************************/
var sun = new Sun(sun_size, SUN_COL);

var mars = new Planet(21, 0,        // Centre of orbit (x, y)
                      mars_orbit_r[0], mars_orbit_r[1],
                      mars_year, mars_size, 0.11, MARS_COL);

var earth = new Planet(2.5, 0,       // Centre of orbit (x, y)
                       earth_orbit_r[0], earth_orbit_r[1],
                       earth_year, earth_size, 1, EARTH_COL);
                       
var bodies = [sun, earth, mars];
var names = ["Sun", "Earth", "Mars"];

fixed_point = earth;

var clearPoints = function() {
    for (var i in bodies) {
        bodies[i].previous_points = [];
    }  
};
/********************************************************
 *               Display functions
*********************************************************/
// Menu
var menu_x = 5;
var menu_y = 5;
var menu_w = 82;
var menu_h = bodies.length*30 + 25;

var drawOptions = function() {
    var x = menu_x - 200;
    var y = menu_y - 200;
    
    // Outline
    stroke(120, 120, 120, 120);
    fill(0, 0, 0, 200);
    rect(x, y, menu_w, menu_h);
    
    // Title
    textSize(16);
    textAlign(CENTER, BASELINE);
    fill(240);
    text("Key", x + menu_w/2, y + 18);
    
    textSize(13);
    textAlign(LEFT, CENTER);
    for (var i=0; i<bodies.length; i++) {
        bodies[i].display(x+18, y+i*30+40);
        if (fixed_point === bodies[i]) { fill(255); }
        else { fill(100); }
        text(names[i], x+35, y+i*30 + 40);
    }
};

var draw = function() {    
    if (running) {
        t++;

        for (var i in bodies) {
            bodies[i].update(t);
        }
    }
    
    background(0, 0, 0);
    noStroke();
    
    if (showCycles) {
         fill(102, 14, 14);
        mars.drawCycle();
        fill(58, 61, 1);
        earth.drawCycle();
       
    }
    
    for (var i in bodies) {
        bodies[i].draw();
    }
    
    drawOptions();
};

/********************************************************
 *               Event handling
*********************************************************/

var keyPressed = function() {
    // Spacebar toggles animation
    if (keyCode === 32) { running = !running; }
    if (keyCode === 65) { showOld = !showOld; }
    if (keyCode === 83) { showCycles = !showCycles; }
};