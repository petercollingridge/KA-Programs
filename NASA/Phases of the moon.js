https://www.khanacademy.org/cs/animate-phases-of-the-moon/1486460294

/*********************************************************
 * The red dot represents your position on the Earth.
 * It's on the equator and assumes the Earth's axis is 
 * perpendicular to its orbit with the sun and moon.
 * 
 * The top of the screen shows what you see as you look
 * into the sky.
 * 
 * I'm assuming the camera is looking down on the Earth
 * and tracking with the earth's rotation about the sun.
**********************************************************/
 
var speed = 0.8;
var days = 1;
var running = true;

var earthX = 280;
var earthY = 250;
var earthR = 32;
var earthAngle = 0;

var moonDist = 100;
var moonAngle = -20;
var moonImage, moonImageSmall, earthImage;
var drawMoonFlag = false;

var nightColour = color(4, 4, 10);
var dayColour = color(90, 190, 255);
var moonColour = color(230, 230, 230, 255);
var moonColourT = color(230, 230, 230, 0);
var earthColour = color(40, 150, 255, 255);
var earthColourT = color(40, 150, 255, 0);

// Shade sphere
var drawCresent = function(cx, cy, r, theta, col, colT) {
    var r2 = r*r;
    var s = 90 /r;
    
    for (var y = -r; y <= r; y++) {
        var d = sqrt(r2 - y*y);
        var rd = round(d);
        var light1 = cos(s * y);
        var w = 90 / d;
        
        for (var x = -rd-1; x <= rd+1; x++) {
            var p = light1 * cos(theta + (x / d) * 90);
            if (p >= 0 && p <= 1) {
                if (x < -rd || x > rd) {
                    p *= d + 0.5 - rd;
                } 
                var c = lerpColor(colT, col, p);
                stroke(c);
                point(cx + r + x + 1, cy + r + y + 1);   
            }
        }
    }
};

var drawEarth = function() {
    noStroke();
    fill(0, 16, 32);
    fill(earthColour);
    ellipse(earthX + 1, earthY + 1, earthR * 2, earthR * 2);
    fill(0, 0, 0, 200);
    arc(earthX+1, earthY+1, earthR * 2 + 2, earthR * 2 + 2, -90, 90);
    
    //image(earthImage, earthX-earthR, earthY-earthR);
    
    // Person
    var x = earthX + 1 + (earthR - 1) * cos(earthAngle);
    var y = earthY + 1 - (earthR - 1) * sin(earthAngle);
    fill(255, 0, 0);
    stroke(250);
    ellipse(x, y, 4, 4);
};

var drawMoon = function() {
    var x = earthX + round(moonDist * cos(moonAngle));
    var y = earthY - round(moonDist * sin(moonAngle));
    
    noStroke();
    fill(30);
    fill(160);
    ellipse(x, y, 28, 28);
    fill(0, 0, 0, 200);
    arc(x, y, 30, 30, -90, 90);
    //image(moonImageSmall, x-14, y-15);
};

var drawSun = function() {
    noStroke();
    fill(255, 204, 0);
    ellipse(-208, earthY, 500, 500);
};

var getSphereImage = function(r, theta, col, colT) {
    var img = createGraphics(r*2+2, r*2+2, JAVA2D);
    img.beginDraw();
    img.background(0, 0, 0, 0);
    
    var r2 = r*r;
    var s = 90 /r;
    
    for (var y = -r; y <= r; y++) {
        var d = sqrt(r2 - y*y);
        var rd = round(d);
        var light1 = cos(s * y);
        var w = 90 / d;
        
        for (var x = -rd-1; x <= rd+1; x++) {
            var p = light1 * cos(theta + (x / d) * 90);
            if (p >= 0 && p <= 1) {
                if (x < -rd || x > rd) {
                    p *= d + 0.5 - rd;
                } 
                var c = lerpColor(colT, col, p);
                img.stroke(c);
                img.point(r+x+1, r+y+1);   
            }
        }
    }
    
    drawMoonFlag = false;
    return img;
};

var getMoonType = function() {
    var moonName;
    if (moonAngle < 20 || moonAngle > 340) {
        moonName = "Full moon";
    } else if (moonAngle > 160 && moonAngle < 200) {
        moonName = "New" + " moon";
    } else if (moonAngle > 70 && moonAngle < 110) {
        moonName = "Last quarter";
    } else if (moonAngle > 160 && moonAngle < 200) {
        moonName = "First quarter";
    } else {
        if (moonAngle >=20 && moonAngle <= 160) {
            moonName = "Waning";
        } else {
            moonName = "Waxing";
        }
        if (moonAngle > 90 && moonAngle < 270) {
            moonName += " crescent";
        } else {
            moonName += " gibbous";
        }
    }
    return moonName;
};

var drawSky = function() {
    stroke(250, 250, 250);
    var skyColour;
    
    if (earthAngle > 90 && earthAngle < 270) {
        var light = sin(earthAngle - 90);
        skyColour = lerpColor(nightColour, dayColour, light);
    } else {
        skyColour = nightColour;
    }
    fill(skyColour);
    
    // Sky
    rect(-1, -1, 402, 100);
    fill(255, 255, 255);
    textAlign(LEFT, CENTER);
    text("Day " + days, 5, 12);
    text(floor(earthAngle / 15) + ":00", 5, 34);
    textAlign(CENTER, CENTER);
    text(getMoonType(), 200, 12);
    
    // Sun position
    var sunAngle = (earthAngle + 270) % 360;
    var sunInSkyX = sunAngle * 440/180 - 20;
    var sunInSkyY = 80 - 40 * sin(sunAngle);
    noStroke();
    fill(255, 204, 0);
    ellipse(sunInSkyX, sunInSkyY, 40, 40);
    
    // Moon position
    var moonInSkyAngle = (450 + moonAngle-earthAngle) % 360;
    var moonInSkyX = 420 - moonInSkyAngle * 440/180;
    var moonInSkyY = 80 - 40 * sin(moonInSkyAngle);
    
    fill(lerpColor(moonColour, skyColour, 0.9));
    ellipse(moonInSkyX, moonInSkyY, 40, 40);
    drawCresent(moonInSkyX - 21, moonInSkyY - 21 , 20,
                moonAngle, moonColour, moonColourT);
    //image(moonImage, moonInSkyX-21, moonInSkyY-21);
};

/*
moonImage = getSphereImage(20, moonAngle,
                           moonColour, moonColourT);
moonImageSmall = getSphereImage(14, 70,
                                moonColour, moonColourT);
earthImage = getSphereImage(earthR, 70,
                            earthColour, earthColourT);
*/

var draw = function() {
    background(0, 0, 0);
    
    fill(222, 222, 222);
    textSize(16);
    textAlign(RIGHT, BASELINE);
    text("Not to scale", 392, 392);
    
    drawSun();
    drawEarth();
    drawMoon();
    drawSky();
    
    // Update
    if (running) {
        moonAngle += 0.1 * speed;
        earthAngle += 2.8 * speed;
        if (earthAngle > 360) {
            days++;
            earthAngle -= 360;
            drawMoonFlag = true;
        } else if (drawMoonFlag &&
                abs(moonAngle - earthAngle) > 180) {
            /*moonImage = getSphereImage(20, moonAngle,
                            moonColour, moonColourT);*/
        }
    }
};

var mouseClicked = function() {
    if (running) {
        running = false;
    } else {
        running = true;
    }
};