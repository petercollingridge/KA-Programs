https://www.khanacademy.org/cs/curiosity-landing-simulation/2005175964

/************************************************************
 * Can you guide Curiosity, the Mars Science Laboratory (MSL)
 * safely through entry, descent and landing (EDL)?
 * 
 * Please note that while I've tried to make this simulation
 * as accurate as I can, I've had to make a number of
 * simplifications. The correct parameters therefore do not
 * quite reflect the true parameters for EDL. Always consult
 * a trained rocket scientist before attempting to land any
 * equipment on an alien planets. Landing craft may go down
 * as well as up.
 * 
 * To Do
 *  - Give feedback if mission fails
 *  - Improve heat equation
 *  - Animation of crashing/exploding
 * 
 * Thanks to Chris Torrence for the Try Again button.
***********************************************************/

// Constants
var dragCoefficient;
var parachuteDrag = 121;
var landerDrag = 6;
var rocketPower = 12;           // m/s^2
var fuelUsage = 1;              // kg per m/s^2
var MARS_RADIUS = 3175;
var backshellMass = 20;         // kg
var wireLength = 7.8;           // m

// So many horrible global variables
var dt,
    time,
    position,
    oldPositions,
    speed,
    temperature,
    mass,
    fuel,
    fuelUsed;
var drag, velocity, acceleration, lift, density, angleOfAttack;
var result, mode, running, scorches, xOffset;
var backshellPos, backshellVel, roverPos;
var divY, divDY;

var events,
    eventTimer,
    sufr,
    parachute,
    parachuteLength,
    parachuteGrowth,
    heatshield,
    peakTemp,
    peakDrag,
    backshell,
    retrorockets,
    constDeceleration,
    skyCrane,
    craneLength,
    snatch,
    touchdown;

var resetParameters = function() {
    dt = 0.2;                   // s
    time = 0;                   // s
    position = [0, 131000];     // m
    speed = 5800;               // m/s
    acceleration = [0, 0];      // m/s^2
    temperature = 5;            // K
    mass = 3690;                // kg
    fuel = 391;                 // kg
    dragCoefficient = 8;
    xOffset = 0;
    running = true;
    mode = 'choice';
    
    scorches = [];
    oldPositions = [position];
    
    // Events
    events = [];
    eventTimer = false;
    sufr = false;
    parachute = 'stowed';
    heatshield = true;
    peakTemp = false;
    peakDrag = false;
    backshell = true;
    retrorockets = false;
    constDeceleration = false;
    backshellPos = false;
    roverPos = false;
    skyCrane = false;
    snatch = false;
    touchdown = false;
    craneLength = 0;
    parachuteLength = 0;
    parachuteGrowth = 1;
    divY = 180;
    divDY = 0;
};
resetParameters();

// Display Parameters
var impFont = createFont("Impact", 40);
var sansFont = createFont("sans", 40);
var monoFont = createFont("monospace", 40);

var ground = [];
var ground2 = [];
for (var i=0; i<25;i++) {
    if (i < 15) {
        ground2.push(random(90, 110)/100);   
    }
    ground.push(random(85, 115)/100);
}

/*************************************************
 *    GUI Objects
*************************************************/

var Slider = function(x, y, w, min_v, max_v, current_v) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.min = min_v;
    this.max = max_v;
    this.scale = (max_v - min_v) / w;
    this.val = current_v === undefined ? min_v : current_v;
    this.bx = this.x + (this.val - min_v) / this.scale;
    
    this.held = false;

    this.draw = function() {
        noStroke();
        fill(200);
        rect(this.x, this.y-1, this.width+2, 3, 4);
        
        strokeWeight(1);
        stroke(60);
        line(this.x + 1, this.y-1, x + this.width, this.y);
    
        fill(180);
        stroke(50);
        rect(this.bx, this.y-8, 10, 16, 3);
        
        for (var i=0; i<3; i++) {
            var y = this.y + i*3 - 3;
            stroke(50);
            line(this.bx + 3, y, this.bx + 7, y); 
            stroke(200);
            line(this.bx + 3, y+1, this.bx + 7, y+1); 
        }
    };
    
    this.selected = function() {
        this.held = mouseX > this.bx - 1 && mouseX < this.bx + 11 && 
                    mouseY > this.y - 9 && mouseY < this.y + 9;
    };
    
    this.drag = function() {
        if (this.held) {
            var x = constrain(mouseX, this.x, this.x + this.width);
            this.bx = x;
            this.val = this.min + (x - this.x) * this.scale;
        }
    };
    
    this.update = function(d) {
        this.val = constrain(this.val + d, this.min, this.max);
        this.bx = (this.val - this.min) / this.scale + this.x;
    };
};

var Button = function(x, y, w, h, name, clickF) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.name = name;
    this.defaultCol = color(180, 180, 180);
    this.highlightCol = color(250, 60, 60);
    this.clickF = clickF;
    this.showing = true;
    
    this.highlight = function() {
        if (mouseX >= this.x && mouseX <= this.x + this.w && 
            mouseY >= this.y && mouseY <= this.y + this.h) {
            this.mouseover = true;
        } else {
            this.mouseover = false;
        }
    };
    
    this.click = function() {
        if (this.showing && this.mouseover) {
            if (this.clickF) {
                this.clickF();
                return true;
            }
        }
    };
    
    this.draw = function() {
        if (!this.showing) { return; }
        
        noStroke();
        if (this.mouseover) {
            fill(this.highlightCol);
        } else {
            fill(this.defaultCol);
        }
        rect(this.x, this.y, this.w, this.h, 8);
        
        fill(10);
        textFont(impFont, 28);
        textAlign(CENTER, CENTER);
        text(this.name, this.x + this.w/2, this.y + this.h/2);
    };
};

var writeTime = function(t) {
    var minutes = floor(t / 60);
    var seconds = t % 60;
    var t = minutes + ":";
    if (floor(seconds) < 10) { t += '0'; }
    return t + floor(seconds);
};

// Add comma to number so 15001 becomes 15,001
var addComma = function(n) {
    if (n < 1000) { return n; }
    var thousands = floor(n/1000);
    var hundreds = n % 1000;
    if (hundreds < 10) { hundreds = '00' + hundreds; }
    else if (hundreds < 100) { hundreds = '0' + hundreds; }
    return thousands + "," + hundreds;
};

var writeDegrees = function(d) { return round(100 * d) /100  +"°"; };
var writeSpeed = function(d) { return round(d*25)  +" m/s"; };
var writeAltitude = function(d) { return d  +" m"; };

/*******************************************************
 *      Parameters that we get to choose
*******************************************************/
var parameters = {
    "Angle of attack": {
        min: 5,
        max: 85,
        func: writeDegrees,
        details: "Angle at which MSL enters the atmosphere relative to the surface. Therefore 90° represents travelling straight down."
    },
    "SUFR": {
        min: 0,
        max: 240,
        func: writeSpeed,
        details: "Velocity below which MSL executes Straighten Up and Fly Right. This maneuver reorients the MSL to avoid lift and aligns the landing sensor."
    },
    "Parachute": {
        min: 0,
        max: 720,
        func: writeTime,
        details: "Time at which the parachute is deployed. The parachute can withstand speeds up to Mach 2.2 (750 m/s)."
    },
    "Heatshield": {
        min: 0,
        max: 720,
        func: writeTime,
        details: "Time at which the heatshield is jettisoned. Sensors can then be activated, allowing MSL to measure its altitude. The MSL must be travelling at a sub-sonic speed <340 m/s."
    },
    "Backshell": {
        min: 0,
        max: 8000,
        func: writeAltitude,
        details: "Altitude at which the backshell with the parachute is detached. The heatshield must be jettisoned before accurate alititude measurements can be made."
    },
    "Freefall": {
        min: 0,
        max: 40,
        func: writeTime,
        details: "Time that MSL spends in freefall after backshell (with parachute) separates and before the retrorockets fire."
    },
    "Constant velocity": {
        min: 0,
        max: 800,
        func: writeAltitude,
        details: "Height by which the MSL aims to reach a constant velocity."
    },
    "Skycrane": {
        min: 0,
        max: 160,
        func: writeAltitude,
        details: "Height at which the MSL starts to descend from the MSL the skycrane."
    }
};

var sliders = [];
var sliderY = 75;
var sliderDY = 30;

for (var p in parameters) {
    var para = parameters[p];
    var s = new Slider(210, sliderY, 160, para.min, para.max);
    para.slider = s;
    sliders.push(s);
    sliderY += sliderDY;
}

var startEntry = function() {
    mode = "running";
    angleOfAttack = sliders[0].val;
    velocity = [speed * cos(angleOfAttack), -speed * sin(angleOfAttack)];
};

var buttons = [
    new Button(240, 353, 140, 32, "Start Entry!", startEntry),
    new Button(240, 353, 140, 32, "Abort", resetParameters),
    new Button(240, 353, 140, 32, "Try again!", resetParameters)
];
buttons[1].showing = false;
buttons[2].showing = false;

/*************************************************
 *    Physics functions
*************************************************/

var calculateAtmosphericDensity = function(altitude) {
    var h = altitude / 11100;   // scale height 11.1 km
    return 20000 / exp(h);
};

var calculateDrag = function(speed, density) {
    var s = speed / 1000;
    return dragCoefficient * density * s * s;
};

// What is the constant deceleration required to reach a given
// vertical velocity by the time we reach a given height?
var calculateDecleration = function(targetSpeed, targetHeight) {
    var s = -velocity[1];
    var t = 2 * (position[1] - targetHeight) / (targetSpeed + s);
    return max(0, (s - targetSpeed) / t);
};

/*************************************************
 *    Events
*************************************************/

// Test to see if events have occurred
// Shouldn't need to test each one every time
var updateEvents = function() {
    if (position[1] > 50000 && velocity[1] > 0) {
        mode = 'end';
        result  = "Skimming away!";
        return;
    }
    
    if (position[1] < 2) {
        position[1] = 0;
        mode = 'end';
        if (fuel < 1) {
            result = "Insufficient fuel!";
        } else {
            result  = "Crash!";   
        }
        return;
    }
    
    if (position[1] < 5 && retrorockets && velocity[1] > -1) {
        mode = 'end';
        result = "Dust damage!";
        return;
    }
    
    // SUFR
    if (!sufr && speed < sliders[1].val * 25) {
        sufr = true;
        mass -= 150;
        events.push([time, "SUFR executed", false]);
    }
    
    // Parachute
    if (parachute === 'stowed' && time > sliders[2].val) {
        if (speed < 750) {
            parachute = 'deployed';
            dragCoefficient = parachuteDrag;
            events.push([time, "Parachute deployed", false]);
            dt /= 2;
        } else {
            parachute = 'destroyed';
            mass -= 100;
            events.push([time, "Parachute destroyed", true]);
        }
    }
    
    // Heatshield
    if (heatshield && time > sliders[3].val) {
        heatshield = false;
        mass -= 440;
        if (position[1] > 18000) {
            events.push([time, "Heatshield jettisoned", true]);
        } else {
            events.push([time, "Heatshield jettisoned", false]);
        }
    }
    
    // Backshell seperation
    if (backshell && sufr && !heatshield && 
        position[1] < sliders[4].val) {
        backshell = false;
        backshellPos = [position[0], position[1]];
        backshellVel = [velocity[0], velocity[1]];
        if (parachute === 'destroyed') {
            mass -= 100;   
        } else {
            mass -= 200;
        }
        parachute = false;
        dragCoefficient = landerDrag;
        eventTimer = time;
        events.push([time, "Backshell separated", false]);
    }
    
    // Retrorockets on - reduce velocity by the time we reach
    // a certain height
    if (!skyCrane && eventTimer && time-eventTimer > sliders[5].val) {
        if (sliders[5].val === 0) {
            mode = "end";
            result = "Collision!";
        }
        eventTimer = false;
        retrorockets = 'initial';
        dt /= 2;
        events.push([time, "Retrorockets engaged", false]);
        constDeceleration = calculateDecleration(20, sliders[6].val);
        /*
        println(round(position[1]) + " m to " + round(sliders[6].val) +  "m");
        println(round(speed) + " m/s to 20 m/s");
        println(round(constDeceleration*10)/10 + " m/s^2");
        */
    }
    
    // Retrorockets to constant velocity
    if (retrorockets === 'initial' && position[1] < sliders[6].val) {
        retrorockets = 'const velocity';
        events.push([time, "Constant velocity", false]);
    }
    
    // Retrorockets to constant deceleration
    if (retrorockets === 'const velocity' && position[1] < 55) {
        retrorockets = 'const deceleration';
        constDeceleration = calculateDecleration(0.75, 21);
        events.push([time, "Constant deceleration", false]);
    }
    
    // Retrorockets to constant deceleration
    if (retrorockets === 'const deceleration' && velocity[1] > -0.8) {
        retrorockets = 'const velocity 2';
    }
    
    // Start sky crane
    if (!skyCrane && !backshell && position[1] < sliders[7].val) {
        skyCrane = true;
    }
    
    // Sky crane maneuver 
    if (skyCrane) {
        if (craneLength === 0) {
            divDY = 15;
            dt /= 2;
            eventTimer = time;
            events.push([time, "Rover separation", false]);
        }
        
        // Lengthen crane if we still have length
        if (craneLength < wireLength) {
            craneLength += dt * 1.1;   
        }
        
        if (!snatch && time - eventTimer > 7) {
            snatch = true;
            divDY = 15;
            events.push([time, "Snatch (wheels down)", false]);
        }
        
        // Touchdown - wait 2 seconds to unhitch
        if (!touchdown && position[1] - craneLength < 1) {
            if (velocity[1] < -2 || !snatch) {
                mode = 'end';
                result  = "Heavy landing!";
                return;
            }
            
            touchdown = true;
            eventTimer = time;
            divDY = 15;
            events.push([time, "Touchdown", false]);
        }
        
        // Flyaway if we have touched down for 2 seconds
        if (touchdown && retrorockets !== 'flyaway' &&
            time - eventTimer >= 2) {
            retrorockets = 'flyaway';
            eventTimer = time;
            divDY = 15;
            events.push([time, "Fly away", false]);
        }
        
        // Success
        if (retrorockets === 'flyaway' && fuel > 0 &&
            time - eventTimer >= 8) {
            mode = 'end';
            result = "Mission successful";
        }
    }
};

var calculateBackshellPosition = function() {
    backshellPos[0] += backshellVel[0] * dt;
    backshellPos[1] += backshellVel[1] * dt;
    
    var angle = atan2(backshellVel[1], backshellVel[0]);
    var BSspeed = dist(0, 0, backshellVel[0], backshellVel[1]);
    var dragMag = calculateDrag(BSspeed, 
        calculateAtmosphericDensity(position[1])) / backshellMass;
    
    backshellVel[0] -= dragMag * cos(angle) * dt;
    backshellVel[1] -= dragMag * sin(angle) * dt;
    backshellVel[1] -= 42700000 / pow(MARS_RADIUS + 
                            backshellPos[1] / 1000, 2);
};

var calculatePosition = function() {    
    position[0] += velocity[0] * dt;
    position[1] += velocity[1] * dt;
    
    if (round(time * 10) % 20 === 0) {
        oldPositions.push([position[0], position[1]]);
    }
    
    var velocityAngle = atan2(velocity[1], velocity[0]);
    density = calculateAtmosphericDensity(position[1]);
    var gravity = 42700000 / pow(MARS_RADIUS + position[1]/1000, 2);
    var dragMag = calculateDrag(speed, density) / mass;
    
    // Calculate whether deceleration has peaked
    if (!peakDrag && dragMag > 10 &&
        dragMag < dist(0, 0, drag[0], drag[1])) {
        peakDrag = true;
        events.push([time, "Peak decel. " + round(dragMag / 0.981)/10 + " G", false]);
    }
    
    if (retrorockets) { angleOfAttack = 90; }
    else if (sufr) { angleOfAttack = -velocityAngle; }
    
    var c = cos(velocityAngle);
    var s = sin(velocityAngle);
    drag = [-dragMag * c, -dragMag * s];
    fuelUsed = 0;
    
    if (!sufr) {
        var liftToDrag = 0.24 * (90 - angleOfAttack) / 74;
        var liftMag = liftToDrag * dragMag;
        if (round(time/4) % 2 === 0) {
            liftMag += 8;
        }
        lift = [-liftMag * s, liftMag * c];
    } else if (retrorockets) {
        drag = [0, 0];

        switch (retrorockets) {
            case 'initial':
                // Get to 20 m/s
                lift = [0, min(12, constDeceleration + gravity)];
                break;
             case 'const velocity':
                lift = [-velocity[0]/2, gravity];
                break;
            case 'const deceleration':
                lift = [0, min(12, constDeceleration + gravity)];
                break;
            case 'const velocity 2':
                lift = [-velocity[0]/2, gravity];
                break;
            case 'flyaway':
                lift = [0.5, gravity + 1];
                break;
        }
        
        fuelUsed = max(0, fuelUsage * (lift[0] + lift[1]) * dt);
        fuel -= fuelUsed;
        if (fuel < 0) {
            mass -= fuelUsed;
            fuel = 0;
            lift = [0, 0];
        }
    } else {
        lift = [0, 0];
    }

    acceleration = [lift[0] + drag[0], lift[1] + drag[1] - gravity];
    velocity[0] += acceleration[0] * dt;
    velocity[1] += acceleration[1] * dt;
    speed = dist(0, 0, velocity[0], velocity[1]);

    //temp = 5 + (temp - 5 + speed * density/550 * dt) * 0.35;
    var newTemp = 5 + density*(0.0125 + pow(speed, 1.2) / 40000);
    if (!peakTemp && newTemp > 500 && newTemp < temperature) {
        peakTemp = true;
        events.push([time, "Peak temp. " +round(temperature) + " K", false]);
    }
    
    temperature = newTemp;
    if ((heatshield && temperature > 10000) ||
        (!heatshield && temperature > 400)) {
        mode = "end";
        result = "Curiosity Overheated!";
    }
    
    if (backshellPos) {
        calculateBackshellPosition();
    }
    
    if (skyCrane && !touchdown) {
        roverPos = [position[0], max(0, position[1] - craneLength)];
    }
};

/*************************************************
 *    Display functions
*************************************************/
var drawParameterChoice = function() {    
    fill(255);
    textFont(impFont, 28);
    textAlign(CENTER, BASELINE);
    var titleY = 48;
    var txt = "Curiosity Landing Parameters";
    text(txt, 200, titleY);
    
    stroke(255);
    strokeWeight(1);
    line(195 - textWidth(txt)/2, titleY + 3,
         205 + textWidth(txt)/2, titleY + 3);
    
    var tx = 20;    
    textAlign(LEFT, BASELINE);
    
    for (var p in parameters) {        
        var slider = parameters[p].slider;
        var ty = slider.y + 7;
        slider.draw();
        
        fill(250);
        textFont(impFont, 18);
        txt = p + ":  " + parameters[p].func(slider.val);
        text(txt, tx, ty);
        
        // Mouse over text
        if (mouseY <= ty + 8 && mouseY > ty - sliderDY + 8) {
            fill(250);
            textFont(sansFont, 12);
            text(parameters[p].details, 25, 308, 350, 200);
        }
    }

    buttons[0].draw();
    buttons[0].showing = true;
    buttons[1].showing = false;
    buttons[2].showing = false;
};

var logEvents = function() {
    stroke(225);
    fill(0);
    //rect(0, divY, 400, 400-divY);
    line(0, divY, 400, divY);

    textFont(sansFont, 13);
    textAlign(CENTER, BASELINE);    
    fill(255);
    text("Time: " + writeTime(time), 90, 23);

    textFont(monoFont, 11);
    textAlign(LEFT, BASELINE);
    
    var tx = 12;
    var ty = 40;
    for (var e in events) {
        var evt = events[e];
        fill(255);
        var txt = writeTime(evt[0]) + " ";
        text(txt, tx, ty);
        
        if (evt[2]) {
            var p = (frameCount % 10) / 10;
            fill(lerpColor(color(255,0,0), color(0,0,0), p));
        } else {
            fill(230);
        }
        text(evt[1], tx + textWidth(txt), ty);
        ty += 15;
    }
};

var drawShape = function(x, y, dx, dy) {    
    beginShape();
    vertex(x - dx[0], y + dy[0]);
    bezierVertex(x-dx[1],y+dy[1], x+dx[1], y+dy[1], x+dx[0], y+dy[0]);
    vertex(x + dx[2], y + dy[2]);
    bezierVertex(x-dx[3],y+dy[3], x+dx[3], y+dy[3], x-dx[2], y+dy[2]);
    vertex(x - dx[0], y + dy[0]);
    endShape();
};

var drawCuriosity = function() {    
    var x = 0;
    var y = 0;
    var dx = [11, 21, 70, 124, 124, 10];
    var dy = [-78, -62, -44, 16, 27, 63];
    var bx = [0, 3, 12, 0, -6, 5];
    var by = [-80, -64, -50, 25, 40, 65];
    var cols = [color(240, 240, 240),
                color(200, 200, 200),
                color(160, 160, 160),
                color(30, 30, 30),
                color(77, 44, 9)];

    // Landing radar
    if (!heatshield) {
        noFill();
        strokeWeight(6);
        
        for (var i = 0; i < 4; i++) {
            var d = (frameCount + i * 12) % 48;
            var c = lerpColor(color(45, 64, 245, 0), color(45, 64, 245, 255), 1 - d/50);
            stroke(c);
            arc(x, y + 10 + d * 2, d * 5.6, d * 4, 30, 150);   
        }
    }

    var n = heatshield ? dx.length - 1 : dx.length - 2;
    
    beginDraw();
    strokeWeight(1);
    stroke(10);
    for (var i=0; i<n; i++) {
        fill(cols[i]);
        stroke(cols[i]);
        var xs = [dx[i], bx[i], dx[i + 1], bx[i + 1]];
        var ys = [dy[i], by[i], dy[i + 1], by[i + 1]];
        drawShape(x, y, xs, ys);  
    }
    endDraw();
    
    noStroke();
    fill(40);
    ellipse(23, -55, 9, 5);
    ellipse(-86, 8, 6, 9);
    ellipse(-72, 9, 7, 9);
    ellipse(-57, 10, 7, 9);
    
    // Scorching
    strokeWeight(3);
    stroke(36, 20, 10, 50);
    for (var i=0; i<scorches.length; i++) {
        var theta = scorches[i][0];
        var r = scorches[i][1];
        var c = cos(theta);
        var s = sin(theta);
        var x1 = s*200;
        var y1 = c*38 - 14;
        var a = atan2(y1 - (-9 - c*34), x1 - s*130);
        line(x1, y1, x1-r*cos(theta-a), y1-r*sin(theta+a));
    }
    
    // Exhaust
    if (!sufr && round(time/4) % 2 === 0) {
        strokeWeight(2);
        stroke(255, 255, 255, 100);
        for (var i=0; i<10; i++) {
            var theta = 304 + random(-10, 10);
            var d = 10 + random(20);
            line(23, -55, 23 + d * cos(theta), -55 + d * sin(theta));
        }
    }

    if (parachute === 'deployed') {
        fill(200);
        noStroke();
        rect(x-2, y-140, 3, 60);
        strokeWeight(1);
        stroke(200);
        line(x, y-140, x+20, y-800);
        line(x, y-140, x-20, y-800);
        line(x, y-140, x+50, y-800);
        line(x, y-140, x-50, y-800);
        line(x, y-140, x+70, y-800);
        line(x, y-140, x-70, y-800);
    }
};

var drawDescentStage= function(x, y) {
    var w = 110;
    var h = 60;
    noStroke();
    fill(120);
    rect(x-w/2, y-h/2, w, h);
    
    fill(230);
    ellipse(x-w/2-3, y+4, 26, 46);
    ellipse(x+w/2+3, y+4, 26, 46);
    
    var n = round(20 * fuelUsed);
    
    noStroke();
    // Thruster 1
    pushMatrix();
    translate(x-w/2-32, y+48);
    rotate(10);
        // Gas
        fill(250, 195, 125, 80);
        for (var i = 0; i < n; i++) {
            ellipse(0, 0, 6, random()*(n*5+40));
        }
        
        // Thruster
        fill(100);
        arc(0, -1, 9, 30, -180, 0);
        fill(80);
        rect(-4, -30, 8, 16);
    popMatrix();
    
    // Thruster 2
    pushMatrix();
    translate(x+w/2+32, y+48);
    rotate(-10);
        // Gas
        fill(250, 195, 125, 80);
        for (var i = 0; i < n; i++) {
            ellipse(0, 0, 6, random()*(n*5+40));
        }
        
        // Thruster
        fill(100);
        arc(0, -1, 9, 30, -180, 0);
        fill(80);
        rect(-4, -30, 8, 16);
    popMatrix();
    
    // Central circle
    fill(200);
    strokeWeight(3);
    stroke(40);
    ellipse(x, y, 40, 40);
    noStroke();
    fill(240);
    ellipse(x-5, y-5, 5, 5);
    
    // Triangular fins
    strokeWeight(1);
    stroke(40);
    fill(180);
    quad(x-w/2+25, y-h/2+1, x-w/2-32, y+10,
         x-w/2-32, y+18, x-w/2+25, y+h/2-1);
    quad(x+w/2-25, y-h/2+1, x+w/2+32, y+10,
         x+w/2+32, y+18, x+w/2-25, y+h/2-1);
    
    stroke(80);
    strokeWeight(3);
    line(x-w/2+24, y-h/2+6, x-6, y+h/2-5);
    line(x+w/2-24, y-h/2+6, x+6, y+h/2-5);
    
    stroke(30);
    line(x-w/2+24, y-h/2+6, x+w/2-24, y-h/2+6);
    
    stroke(80);
    strokeWeight(1);
    rect(x-w/2+22, y+h/2-6, w-44, 4);
};

var drawArrow = function(x, y, dx, dy, fCol, sCol, _scale) {
    var magnitude = dist(0, 0, dx, dy);
    var arrowSize = sqrt(magnitude);
    if (_scale) { arrowSize *= _scale; }
    if (arrowSize < 1) { return; }
    var arrowLength = arrowSize*2;
    var arrowWidth = ceil(arrowSize/8);

    fill(fCol);
    noStroke();
    translate(x, y);
    rotate(270 - atan2(dy, dx));
    rect(-arrowWidth, 0, arrowWidth*2, arrowLength);
    triangle(-arrowWidth*2, arrowLength-1, arrowWidth*2, arrowLength-1, 0, arrowLength + arrowWidth*3);
    
    stroke(sCol);
    line(-arrowWidth, 0, -arrowWidth, arrowLength-1);
    line(arrowWidth, 0, arrowWidth, arrowLength-1);
    line(-arrowWidth, arrowLength-1, -arrowWidth*2, arrowLength-1);
    line(arrowWidth, arrowLength-1, arrowWidth*2, arrowLength-1);
    line(-arrowWidth*2, arrowLength-1, 0, arrowLength + arrowWidth*3+1);
    line(arrowWidth*2, arrowLength-1, 0, arrowLength + arrowWidth*3+1);
    resetMatrix();
};

// Vector quantities (lift, deceleration, velocity)
var drawVectorMagnitudes = function() {
    var decel = dist(0, 0, acceleration[0], acceleration[1]);
    var liftS = dist(0, 0, lift[0], lift[1]);
    var ty = 352;
    var txt;
    
    textFont(sansFont, 12);
    textAlign(LEFT, BASELINE);
    
    if (liftS !== 0) {
        txt = "Lift: " + round(liftS)/10 + " m/s";
        var dx = textWidth(txt);
        fill(20, 160, 20);
        text(txt, 18, ty);
        textFont(sansFont, 7);
        text("2", 19+dx, ty - 7);   
    }
    
    textFont(sansFont, 13);
    fill(240, 50, 50);
    txt = "Deceleration: " + round(decel)/10 + " m/s";
    var dx = textWidth(txt);
    text(txt, 18, ty + 16);
    textFont(sansFont, 7);
    text("2", 19 + dx, ty + 9);
    textFont(sansFont, 13);
    text("(" + round(decel/0.981)/10 + " G)", 28 + dx, ty + 16);
    
    fill(80, 80, 240);
    if (speed > 10) {
        text("Velocity: " + round(speed) + " m/s", 18, ty + 32);
    } else if (speed > 1){
        text("Velocity: " + round(speed*10)/10 + " m/s", 18, ty + 32);
    } else {
        text("Velocity: " + round(speed*100)/100 + " m/s", 18, ty + 32);
    }
};

var drawFuel = function() {
    var x = 60;
    var y = 325;
    
    stroke(250);
    if (fuel < 100) {
        var p = (frameCount % 10) / 10;
        fill(lerpColor(color(100,0,0), color(0,0,0), p));   
    } else {
        fill(0);    
    }
    
    strokeWeight(1);
    arc(x, y, 80, 70, 180, 360);
    for (var i=180; i<=360; i+=45) {
        line(x+36*cos(i), y+31.5*sin(i), x+40*cos(i), y+35*sin(i));
    }
    
    stroke(220, 30, 30, 180);
    strokeWeight(2);
    var theta = 180 + 180 *(fuel/391);
    line(x, y, x + 36 * cos(theta), y + 31.5 * sin(theta));

    strokeWeight(1);
    stroke(255);
    fill(0);
    ellipse(x, y, 3, 3);
    
    textAlign(CENTER, TOP);
    fill(255);
    textFont(sansFont, 9);
    text("Fuel: " + round(fuel) + " kg", x, y - 16);
};

var drawVectors = function() {
    fill(255);
    textFont(impFont, 18);
    textAlign(LEFT, BASELINE);
    
    var decel = dist(0, 0, acceleration[0], acceleration[1]);
    var liftS = dist(0, 0, lift[0], lift[1]);
    var cx = 200;
    var cy = (height + divY) / 2 - 10;
    var shake = constrain(decel/50, 0, 5) * sin(time*800);
    cx += shake * sin(angleOfAttack);
    cy += shake * cos(angleOfAttack);
    
    noStroke();
    translate(cx, cy);

    if (backshell) {
        rotate(270 + angleOfAttack);
        scale(0.4, 0.4);
        drawCuriosity();
        noStroke();
        var p = constrain((temperature - 400)/2500, 0, 1);
        for (var i=0; i<round(100 * p); i++) {
            fill(lerpColor(color(225, 0, 0, 5),
                           color(255, 245, 245, 8), p));
            arc(0, 32-i, 250+i*2, 85, 0, 180);
        }
        if (running && random() < p) {
            var theta = random(-38, 37);
            var d = random(2, 8) * random(2, 5);
            scorches.push([theta, d]);
        }
    } else {
        var p = constrain(liftS, 0, 5);
        rotate(p * sin(time * p));
        scale(0.6, 0.6);
        drawDescentStage(0, 0);
    }
    
    resetMatrix();
    
    strokeWeight(2);
    drawArrow(cx, cy, velocity[0], velocity[1],
              color(80, 80, 240, 220), color(34, 34, 181));
    drawArrow(cx, cy, drag[0], drag[1],
              color(240, 50, 50, 200), color(191, 17, 17), 4);
    drawArrow(cx, cy, lift[0], lift[1],
              color(20, 160, 20, 200), color(5, 107, 5), 3);
    
    // Temperature stats
    var tx = 246;
    textFont(sansFont, 11);
    textAlign(LEFT, BASELINE);
    fill(255);
    
    var txt = "Temperature: " + round(temperature) + " K";
    text(txt, tx, divY + 44);
    
    // Line to heatshield
    stroke(100);
    strokeWeight(1);
    line(tx, divY + 48, tx + textWidth(txt) + 2, divY + 48);
    
    var hx, hy;
    if (heatshield) {
        hx = cx + 24 * cos(angleOfAttack - 42);
        hy = cy + 24 * sin(angleOfAttack - 42);
    } else {
        hx = cx + 28 * cos(angleOfAttack - 110);
        hy = cy + 28 * sin(angleOfAttack - 110);
    }
    // Reduce shaking a bit
    hy = 5 * round(hy / 5);
    
    line(tx + textWidth(txt)/2, divY + 48, tx + textWidth(txt)/2, hy);
    line(tx + textWidth(txt)/2, hy, hx, hy);
    
    text("Air temperature: " + round(5+density*0.0125) + " K", tx, divY + 30);
    txt = "Atmosphere: " + round(density)/1000 + " g/m";
    text(txt, tx, divY + 16);
    tx += textWidth(txt);
    textFont(sansFont, 7);
    text("3", tx, divY + 9);
    
    drawVectorMagnitudes();
    drawFuel();
    buttons[1].showing = true;
    buttons[1].draw();
};

var drawBackshell = function(x, y, w) {
    var top = -w/3;
    translate(x, y);
    rotate(270 + angleOfAttack);
    if (!backshell || parachute === 'deployed') {
        if (parachuteLength < 35) {
            parachuteLength += parachuteGrowth;
            parachuteGrowth++;
        }
        var s = w * parachuteLength / 36;
        var parachuteY = top - 4 * s;
        stroke(255, 255, 255, 180);
        line(0, top, 0, parachuteY);
        line(0, top - s/2, -s, parachuteY);
        line(0, top - s/2, s, parachuteY);
        line(0, top - s/2, -s/2, parachuteY);
        line(0, top - s/2, s/2, parachuteY);
        fill(255, 255, 255, 180);
        arc(0, parachuteY, s * 2, s * 2.5, 180, 360);
    }
    
    if (heatshield) {
        noStroke();
        fill(87, 54, 13);
        triangle(w/2+2, 0, -w/2-2, 0, 0, w/4);
    }

    stroke(100);
    fill(180);
    quad(-w/4, top, w/4, top, w/2+1, 0, -w/2-1, 0); 
    resetMatrix();
};

var drawGround = function(points, h) {
    var s = 400 / (points.length - 1);
    beginShape();
        vertex(0, divY);
        vertex(0, divY - h);
        for (var i=0; i<points.length; i++) {
            curveVertex((i + 1) * s, divY - h * points[i]);
        }
        vertex(400, divY - h);
        vertex(400, divY);
        vertex(400, divY);
        vertex(0, divY);
        vertex(0, divY);
    endShape();
};

// Draw small rover image
var drawRover = function(x, y, w, mag) {
    stroke(100);
    fill(200);
    rect(x - w/2 + 2, y - w/5, w/2 + w/5, w/4);
    quad(x + w/5 + 2, y - w/5,
         x + w/5 + 2, y + w/4 - 5,
         x + w/2, y + w/4 - 6,
         x + w/2, y - w/4);
    
    var wheels = y + 3 - mag/2-1;
    var wx1 = x - w/2 + 1;
    var wx2 = x + w/2;
    var wx3 = x + 1;
    
    if (snatch) {
        stroke(30);
        strokeWeight(2);
        wheels += 7;
        line(x - w/5, y, wx1, wheels - 4);
        line(x - w/5, y, x + w/4, y + 4);
        line(x + w/4, y + 4, wx2, wheels - 4);
        line(x + w/4, y + 4, wx3, wheels - 4);
    }
    
    stroke(20);
    strokeWeight(2);
    noFill();
    ellipse(wx1, wheels, 7-mag, 7-mag);
    ellipse(wx2, wheels, 7-mag, 7-mag);
    ellipse(wx3, wheels, 7-mag, 7-mag);
    noStroke();
    fill(100);
    ellipse(wx1, wheels, 3, 3);
    ellipse(wx2, wheels, 3, 3);
    ellipse(wx3, wheels, 3, 3);
};

var drawSideView = function() {
    // Calculate scaling
    var maxHeight, xPos;
    if (touchdown) {
        xPos = roverPos[0];
        maxHeight = (roverPos[1] + wireLength) * 2.5;
    } else {
        xPos = position[0];
        maxHeight = min(150000, max(4, position[1]) * 2.5);
        
        // Slide top view horizontally
        if (xPos/1000 - xOffset > 250) {
            xOffset += ((xPos/1000 - xOffset) - 250) * 0.01;
        }
    }
    var _scale = 140000 / maxHeight;
    var mag = floor(log(maxHeight) / log(10));
    var w = 32 - 4 * mag;
    
    var scaleX = function(x) {
        return (xPos * (1 - _scale) + x * _scale) / 1000 - xOffset;
    };
    
    var scaleY = function(y) {
        return divY - 10 - (divY - 32) * y / maxHeight;
    };
    
    // Gradient background
    strokeWeight(1);
    var marsCol = color(204, 138, 116);
    for (var y = 1; y < (divY - 5); y++) {
        var p = maxHeight / 150000 * y / (divY-5);
        stroke(lerpColor(marsCol, color(0, 0, 0), pow(p, 0.15)));
        line(0, divY - y, 400, divY - y);
    }
    
    // Draw ground
    noStroke();
    fill(133, 75, 57);
    drawGround(ground, 1200 / maxHeight);
    fill(97, 36, 16);
    drawGround(ground2, 800 / maxHeight);
    
    // Old positions
    fill(60, 200, 250, 80);
    for (var i=1; i<oldPositions.length-1; i++) {
        var coord = oldPositions[i];
        if (coord[0] / 1000 > 0) {
            ellipse(scaleX(coord[0]), scaleY(coord[1]), 3, 3);   
        }
    }
    
    // MSL positions
    var x = scaleX(position[0]);
    var y = scaleY(position[1]);
    
    stroke(255, 255, 255, 30);
    line(x + 10, y, 380, y);
    
    if (backshell) {
        drawBackshell(x, y, w);
    } else {
        var y2 = scaleY(backshellPos[1]);
        if (y2 < divY) {
            var x2 = scaleX(backshellPos[0]);
            drawBackshell(x2, y2, w); 
        }
        
        if (skyCrane) {
            // Rover position
            var x2 = scaleX(roverPos[0]);
            var y2 = scaleY(roverPos[1]);

            // Wires
            stroke(255, 255, 255, 180);
            if (retrorockets !== 'flyaway') {
                line(x2 - w/4, y, x2 - w/4, y2 - 1);
                line(x2 + w/4, y, x2 + w/4, y2 - 1);   
            } else {
                var d = craneLength * _scale / 1000;
                var angle = atan2(y2 - y, x2 - x);
                var dx = d * cos(angle);
                var dy = d * sin(angle);
                line(x - w/4, y, x - w/4 + dx, y + dy);
                line(x + w/4, y, x + w/4 + dx, y + dy);
            }
            
            drawRover(x2, y2-2, w, mag);
        }

        strokeWeight(1);

        // Crane platform 
        stroke(100);
        fill(120);
        rect(x - w/2, y - w/4, w, w/2);
        fill(180);
        triangle(x - w/4, y-w/4+1, x - w/4, y+w/4-1, x - w*0.75, y+3);
        triangle(x + w/4, y-w/4+1, x + w/4, y+w/4-1, x + w*0.75, y+3);
        fill(200);
        stroke(40);
        ellipse(x, y, w/4, w/4);
    }
    
    // Altitude text
    var maxH = floor(maxHeight / pow(10, mag)) * pow(10, mag);
    if (maxHeight === 150000) {
        maxH = 150000;
    }

    x = 385;
    var y2 = scaleY(maxH);
    stroke(255);
    line(x, scaleY(0), x, y2);
    line(x-3, y, x, y);

    textFont(sansFont, 11);
    textAlign(RIGHT, BASELINE);
    fill(255);
    text("Altitude (m)", x - 2, 22);
    textFont(sansFont, 11);
    text("0", x - 4, divY - 4);
    textAlign(RIGHT, TOP);
    text(addComma(round(maxH)), x - 4, y2);
    textAlign(RIGHT, CENTER);
    
    if (position[1] > 20) {
        text(addComma(round(position[1])), x - 4, y);   
    } else {
        text(""+round(position[1]*10)/10, x - 4, y);
    }
};

var drawEndScreen = function() {
    fill(255);
    textFont(impFont, 36);
    textAlign(CENTER, TOP);
    text(result, 200, divY + 10);
    
    textFont(sansFont, 14);
    textAlign(LEFT, TOP);
    var txt = "The Mars Science Laboratory ";
    switch (result) {
        case "Collision!":
            txt += " applied its retrorockets propelled itself into the backshell. It was destroyed on impact.";
            break;
        case "Crash!":
            txt += "hit the surface of Mars, travelling at ";
            txt += round(speed) + " m/s.";
            if (sliders[0].val > 18) {
                txt += "\n\nTry a shallower angle of attack.";
            }
            break;
        case "Curiosity Overheated!":
            txt += "reached a temperature of "; 
            txt +=  writeDegrees(temperature) + " K and overheated.";
            txt += " It was " + round(position[1]) + " m above ";
            txt += "the surface of Mars, travelling at ";
            txt += round(speed) + " m/s.";
            txt += "\n\nTry jettisoning the heatshield later.";
            break;
        case "Insufficient fuel!":
            txt += "sky crane crashed into the rover, damaging it";
            txt += "\n\nYou need to slow down more before powered descent. Try a shallower angle of attack or open your parachute sooner.";
            break;
        case "Skimming away!":
            txt += "skimmed off the atmosphere and back into space.";
            txt += "\n\nTry a steeper angle of attack or executing ";
            txt += "SUFR at a slower speed.";
            break;
        case "Heavy landing!":
            txt += "was lowered from the skycrane travelling at ";
            txt += round(speed) + " m/s, ";
            if (!snatch) {
                txt += "without its wheels deployed, ";
            }
            txt += "and was damaged.";
            break;
        case "Dust damage!":
            txt += "was lowered from the skycrane, but damaged by";
            txt += " dust blown by the retrorockets";
            txt += "\nTry increasing the height at which the skycrane starts.";
            break;
    }

    if (result !== "Mission successful") {
        var tx = 25;
        fill(255);
        textAlign(LEFT, TOP);
        text(txt, tx, divY + 54, 400-tx*2, 400);
        //buttons[2].x = 240;
        //buttons[2].y = 353;
    } else {
        drawVectorMagnitudes();
        drawFuel();
        buttons[2].x = 130;
        buttons[2].y = 295;
    }
    buttons[0].showing = false;
    buttons[1].showing = false;
    buttons[2].showing = true;
    buttons[2].draw();
};

var draw = function() {
    background(0);

    if (divDY > 0) {
        divDY--;
        divY++;
    }

    if (mode === 'choice') {
        drawParameterChoice();
    } else if (mode === 'running') {
        if (running) {
            time += dt;
            
            updateEvents();
            calculatePosition();
        }
        
        drawVectors();
        drawSideView();
        logEvents();
    } else {
        drawSideView();
        logEvents();
        drawEndScreen();
    }

    // Border
    noFill();
    stroke(0, 0, 0, 60);
    strokeWeight(6);
    rect(5, 5, 390, 390, 26);
    
    stroke(220, 220, 250);
    strokeWeight(20);
    rect(-5, -5, 410, 410, 40);
    
    stroke(120, 120, 150);
    strokeWeight(2);
    rect(5, 5, 390, 390, 26);
    
    /*
    strokeWeight(2);
    stroke(0, 0, 0, 60);
    arc(12, 12, 32, 32, -15, 105);
    noStroke();
    fill(220, 220, 250);
    ellipse(12, 12, 30, 30);
    strokeWeight(2);
    stroke(120, 120, 150);
    arc(12, 12, 30, 30, -20, 110);
    */
    
};

var mousePressed = function() {    
    for (var s in sliders) {
        sliders[s].selected();
    }
    
    for (var b in buttons) {
        buttons[b].click();
    }
};

var mouseReleased = function() {
    for (var s in sliders) {
        sliders[s].held = false;
    }
};

var mouseDragged = function() {
    for (var s in sliders) {
        sliders[s].drag();
    }
};

var mouseMoved = function() {
    for (var b in buttons) {
        buttons[b].highlight();
    }
};

var keyPressed = function() {
    if (keyCode === 32) { running = !running; }
};