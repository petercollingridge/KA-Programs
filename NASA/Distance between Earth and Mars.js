https://www.khanacademy.org/cs/distance-between-earth-and-mars/5145009707810816

/*********************************************************
 * How does the distance between Mars and Earth change
 * over time?
 * When are the planets closest (an opposition)?
 * How often do oppositions occur?
 * 
 * Spacebar: pause
 * s: toggle show orbit shape
 * 
 * The size of the sun and planet is not to scale.
*********************************************************/
var speed = 3;          // Change in days per update
var resolution = 20;    // How accurate orbit speed is
var t = 0;

var sunX = 215;
var sunY = 268;
var sunR = 25;

var marsData = {
    size: 5,
    colour: color(212, 95, 17),
    perihelion: 207,        // million km
    aperihelion: 249,       // million km
    longitude: 336,         // degrees
    year: 686.98,           // earth days
    mass: 0.64              // 10^24 kg
};

var earthData = {
    size: 8,
    colour: color(61, 100, 255),
    perihelion: 147,        // million km
    aperihelion: 152,       // million km
    longitude: 102,         // degrees
    year: 365.25,           // earth days
    mass: 5.97              // 10^24 kg
};

// At 6pm 28th August 2003, Earth and Mars in opposition
var _year = 2002;
var _day = 239.75;
// Angles from ellipse centres, not sun (angle from sun = 335.0)
var earthAngle = 336.05;
var marsAngle = 146.25;

// Other variables
var scalingFactor = 0.5;
var running = true;
var showCycles = true;
var showAxes = false;
var plottingRate = 12;  // Plot graph every x days

var oppositions = [];
var oppositionCount = 0;
var dAngle1, dAngle2;

var Sun = function() {
    this.x = sunX;
    this.y = sunY;
    this.mass = 330000;
    this.previous_points = [];
    
    this.update = function(t) {
    };
    
    this.draw = function() {
        fill(255, 255, 0);
        ellipse(this.x, this.y, sunR, sunR);
        fill(255, 89, 0, 100);
        ellipse(this.x, this.y, sunR + 3, sunR + 3);
    };
    
    this.drawCenter = function(){
        fill(255, 255, 255);
        ellipse(this.x, this.y, 2, 2);
    };
};

var Planet = function(data, angle) {
    this.year = data.year;
    
    // Distance from ellipse centre to sun
    var focusDist = scalingFactor * (data.aperihelion - data.perihelion) / 2;
    
    // Ellipse axes
    var major = scalingFactor * data.aperihelion - focusDist;
    var minor = sqrt(major * major - focusDist * focusDist);
    
    // Store these to save repeatedly calculating them
    var phi = data.longitude;
    var cosPhi = cos(phi);
    var sinPhi = sin(phi);
    
    // Angle relative the perihelion
    this.angle = angle - phi;
    
    // Center of ellipse
    var cx = sunX - focusDist * cosPhi;
    var cy = sunY + focusDist * sinPhi;
    
    // Handy properties for calculations
    var eccentricity = focusDist / major;
    var angleConstant = 360 * major * minor / data.year;
    
    // Add a numbers of days to the orbit
    this.update = function(days) {        
        var sign = days < 0 ? -1 / resolution : 1 / resolution;

        for (var d = 0; d < abs(days) * resolution; d++) {
            // Distance from sun
            var r = major * (1 - eccentricity * eccentricity) /
                            (1 + eccentricity * cos(this.angle));
            
            // Update angle around sun
            this.angle += sign * angleConstant / (r * r);
        }
        
        var r = major * (1 - eccentricity * eccentricity) /
                        (1 + eccentricity * cos(this.angle));
                        
        // Position based on non-rotated ellipse
        var x = r * cos(this.angle) + focusDist;
        var y = r * sin(this.angle);
        
        // Rotate based on ellipse rotation
        this.x = cx + x * cosPhi - y * sinPhi;
        this.y = cy - x * sinPhi - y * cosPhi;
    };
    this.update(0);
    
    this.display = function(x, y) {
        fill(data.colour);
        ellipse(this.x, this.y, data.size, data.size);
    };
    
    this.drawCycle = function() {
        translate(cx, cy);
        rotate(data.longitude);
        ellipse(0, 0, major*2, minor*2);
        resetMatrix();
    };
    
    this.draw = function() {
        fill(data.colour);
        
        for (var i in this.previous_points) {
            var p = this.previous_points[i];
            ellipse(p[0], p[1], 2, 2);
        }
        
        this.display(this.x, this.y);
    };
};  

/********************************************************
 *               Make planets here
*********************************************************/
var sun = new Sun();
var mars = new Planet(marsData, marsAngle);
var earth = new Planet(earthData, earthAngle);
var bodies = [sun, earth, mars];

/********************************************************
 *               Date functions
*********************************************************/

var months = {
    January: 31,
    February: 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31
};

var isLeapYear = function(y) {
    return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0));
};

var dayToDate = function(d, y) {
    for (var m in months) {
        var days = months[m];
        if (m === 'February' && isLeapYear(y)) {
            days++;
        }
        if (d <= days) {
            return [d, m];
        } else {
            d -= days;
        }
    }
};

var convertDayToYear = function(days) {
    var y = 0;
    
    if (days > 365) {
        while (true) {
            var n = 365 + isLeapYear(_year + y);
            if (days > n) {
                days -= n;
                y++;
            } else {
                break;
            }
        }   
    } else if (days < 0) {
        while (true) {
            if (days < 0) {
                var n = 365 + isLeapYear(_year - 1 - y);
                days += n;
                y--;   
            } else {
                break;
            }
        }
    }
    
    return [y, days];
};

var updateDate = function(days) {
    _day += days;
    var y = convertDayToYear(_day);
    _day = y[1];
    _year += y[0];
};

var changeDay = function(change) {
    for (var i = 1; i < bodies.length; i++) {
        if (change > 0) {
            // A complete year doesn't affect the angle
            var years = floor(change / bodies[i].year);
            var days = change - bodies[i].year * years;
            bodies[i].update(days);
        } else {
            var years = floor(-change / bodies[i].year);
            var days = -change - bodies[i].year * years;
            bodies[i].update(bodies[i].year - days); 
        }
    }
    updateDate(change);
};

var setYear = function(newYear) {
    changeDay((newYear - _year) * 365.25);
};

/********************************************************
 *               Distance functions
*********************************************************/

var getKM = function(d) {
    return round(10 * d / scalingFactor) / 10;
};

var getMiles = function(d) {
    return round(10 * d / (scalingFactor * 1.6093)) / 10;
};

var d = dist(mars.x, mars.y, earth.x, earth.y);
var distances = [];

/********************************************************
 *               Oppositions functions
*********************************************************/
// Draw opposition label
var drawOppositions = function(theta1, theta2) {
    fill(255, 255, 255, 200);
    stroke(255, 255, 40, 80);
    textSize(10);
    textAlign(CENTER, CENTER);
    
    strokeWeight(1);
    for (var i in oppositions) {
        var opp = oppositions[i];
        //var data = opp.number;
        var data = opp.day + " " + opp.month;
        //data += "\n" + opp.year;
        //data += "\n" + getKM(opp.dist) + " Gm"; 
        var x = opp.x - 20 * cos(opp.angle);
        var y = opp.y - 10 * sin(opp.angle);
        
        line(sunX, sunY, opp.x, opp.y);
        text(data, x, y);
    }
};

/***********************************************************
* Check whether the change in angle between the Earth
* and Mars has changed from decreasing to increasing
* In which case record an opposition
**********************************************************/
var checkForOpposition = function() {
    var theta1 = 360 + atan2(sunY - earth.y, sunX - earth.x);
    var theta2 = 360 + atan2(sunY - mars.y, sunX - mars.x);
    dAngle2 = dAngle1;
    dAngle1 = (540 + (theta1 % 360) - (theta2 % 360)) % 360 - 180;
    
    if (dAngle2 && dAngle1 < 0 && dAngle2 > 0) {
        oppositionCount++;
        var date = dayToDate(round(_day), _year);
        var close = dist(mars.x, mars.y, earth.x, earth.y);
        oppositions.push({
            x: mars.x,
            y: mars.y,
            graphX: 45 + distances.length,
            number: oppositionCount,
            angle: theta2,
            year: _year,
            dist: close,
            day: date[0],
            month: date[1].slice(0, 3)
        });
        if (oppositions.length > 8) {
            oppositions.shift();
        }
    }
};

var recordDistance = function() {
    d = dist(mars.x, mars.y, earth.x, earth.y);
    
    if (t % plottingRate === 0) {
        distances.push(d);
        if (distances.length > 340) {
            distances.shift();
            
            for (var o in oppositions) {
                oppositions[o].graphX--;
            }
        }
    }
};

setYear(1876);

/********************************************************
 *               Display functions
*********************************************************/
var drawGraph = function() {
    var x = 45;
    var y = 44;
    var h = 65;
    
    fill(255);
    textSize(13);
    
    var date = dayToDate(round(_day), _year);
    textAlign(RIGHT, BASELINE);
    text(date[0], 22, 15);
    textAlign(LEFT, BASELINE);
    text(date[1] + " " + _year, 26, 15);
    text("Mars is " + round(getKM(d)) + "m km away", 141, 15);
    
    strokeWeight(1);
    fill(160);
    stroke(200, 200, 200, 40);
    textAlign(LEFT, CENTER);
    textSize(10);
    
    var range = [50, 400];
    for (var i in range) {
        var ly = y + h - range[i] * scalingFactor / 3.5;
        line(x, ly, 390, ly);
        text(range[i] + " Gm", 4, ly - 1);
    }
    
    stroke(40, 80, 255, 200);
    for (var i = 1; i < distances.length; i++) {
        line(x, y+h-distances[i-1]/3.5, x+1, y+h-distances[i]/3.5);
        x++;
    }
    
    stroke(255, 255, 40, 70);
    fill(255);
    textAlign(CENTER, BASELINE);
    textSize(10);
    for (var o in oppositions) {
        var opp = oppositions[o];
        
        if (opp.graphX > 55) {
            var data = opp.day + " " + opp.month + "\n" + opp.year;
            line(opp.graphX, y + 6, opp.graphX, y + h - 6);
            text(data, opp.graphX, y - 6);
            data = round(getKM(opp.dist)) + "m km"; 
            text(data, opp.graphX, y + h + 4);
        }
    }
};

var draw = function() {    
    if (running) {
        for (var i = 0; i<speed; i++) {
            t++;
            changeDay(1);
            checkForOpposition();
            recordDistance();
        }
    }
    
    background(0);
    
    noFill();
    strokeWeight(2);
    if (showCycles) {
        stroke(61, 100, 255, 60);
        earth.drawCycle();
        stroke(212, 95, 17, 36);
        mars.drawCycle();
    }
    
    strokeWeight(1);
    stroke(255, 255, 255, 80);
    line(mars.x, mars.y, earth.x, earth.y);
    line(sunX, sunY, earth.x, earth.y);
    
    drawOppositions();
    
    noStroke();
    for (var i in bodies) {
        bodies[i].draw();
    }
    
    drawGraph();
};

/********************************************************
 *               Event handling
*********************************************************/

var mousePressed = function() { 
};

var keyPressed = function() {
    // Spacebar toggles animation
    if (keyCode === 32) { running = !running; }
    if (keyCode === 83) { showCycles = !showCycles; }
};