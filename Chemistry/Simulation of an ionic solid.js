https://www.khanacademy.org/cs/simulation-of-an-ionic-solid/1122503811

/*************************************************************
*  Modelling the atoms of an ionic solid like a salt crystal.
* 
* Particles have either + or - charge, e.g. Na+ and Cl-
* Bonds only form between ions of a different charge
* Atoms of like charge repel one another
* When cold, atoms form a solid with a lattice structure
* 
* This solid only melts at high temperature (~6 units).
* At 6 units, the solid slowly heats up before undergoing a
* phase transition in which it melts and only then the kinetic
* energy of atoms quickly increases
* 
* My previous simulation is more like water
* http://www.khanacademy.org/cs/melting-solid/1113221512
* The melting temperature is lower and structure of the solid
* is different
* 
* Use the slider to change the temperature of the container
* See how temperature affects the behaviour of the atoms
* 
* Pressure = total force of atoms on the walls
* Kinetic energy = histogram of energies for all atoms
* 
**********************************************************/

/******************************************************
 * Physical and chemical constants
*******************************************************/

// Number of atoms
var numAtoms = 100;

// Proportion of atoms that are negative
var pNegative = 0.50;

// Force due to gravity
var GRAVITY = 0.008;

// Energy lost when a bond forms
var BONDING_ENERGY = 0.998;

// Optimum distance between bonded atoms
var BOND_LENGTH = 25;

// Force of interaction between atoms
var IONIC_BOND_STRENGTH = 0.1;
var HYDROGEN_BOND_STRENGTH = 0.01;

// Maximum extent of an interaction between atoms
var BOND_LIMIT = 32;

// How close to the optimum length a bond must be for it to be drawn.
var BOND_TOLERANCE = 7;

/******************************************************
 * Simulation variables
*******************************************************/

// Speed of atoms in the walls
var wallTemp = 3.1;

var atomSize = 3;
var hotColour = color(255, 20, 0);
var coolColour = color(80, 120, 255);

// Recorded the pressure on the container
var pressure = "Na";
var cumulativeP = 0;
var deltaTime = 30;    // Average pressure of this num of frames

//frameRate(10);

// Atom object with a position, velocity and charge
var Atom = function(x, y, r, charge) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.charge = charge;
    
    this.dx = wallTemp * (random() - 0.5);
    this.dy = wallTemp * (random() - 0.5);
    
    // Move atom based on its velocity
    this.move = function() {
        this.x += this.dx;
        this.y += this.dy;
    };
    
    // Calculate the kinetic energy of an atom
    this.temp = function() {
        return sqrt(this.dx * this.dx + this.dy * this.dy);
    };
    
    this.colour = function() {
        // Colour based on heat
        return lerpColor(coolColour, hotColour, this.temp()/8);
    };
    
    // Bounce off walls
    this.bounce = function() {
        var temp = sqrt((this.dx*this.dx)+(this.dy*this.dy));
        var dtemp = (temp + wallTemp) / (2 * temp) ;
        if (this.x < this.r) {
            this.x = this.r;
            this.dx *= -dtemp;
            cumulativeP += temp;
        }
        if (this.x > 400 - this.r){
            this.x = 400 - this.r;
            this.dx *= -dtemp;
            cumulativeP += temp;
        }
        if (this.y < this.r) {
            this.y = this.r;
            this.dy *= -dtemp;
            cumulativeP += temp;
        }
        if (this.y > 400 - this.r){
            this.y = 400 - this.r;
            this.dy *= -dtemp;
            cumulativeP += temp;
        }
    };
    
    this.interact = function(that) {
        var dx = this.x - that.x;
        var dy = this.y - that.y;
        var charge_product = this.charge * that.charge;
        
        var dist = sqrt(dx * dx + dy * dy);
        if (dist < BOND_LIMIT) {
            var force;
            if (charge_product === 1) {
                // Repel
                force = IONIC_BOND_STRENGTH * (BOND_LIMIT - dist);
            } else if (charge_product === -1) {
                // Form an ionic bond
                force = IONIC_BOND_STRENGTH * (BOND_LENGTH - dist); 
            } else {
                // Form an hydrogen bond
                force = HYDROGEN_BOND_STRENGTH * (BOND_LENGTH - dist); 
            }

            var theta = atan2(dy, dx);
            
            this.dx = BONDING_ENERGY * (this.dx + force * cos(theta));
            that.dx = BONDING_ENERGY * (that.dx - force * cos(theta));
            this.dy = BONDING_ENERGY * (this.dy + force * sin(theta));
            that.dy = BONDING_ENERGY * (that.dy - force * sin(theta));
        }
        
        // Draw bond
        stroke(180, 180, 200, 250);
        if (abs(dist - BOND_LENGTH) < BOND_TOLERANCE) {
            if (charge_product !== 1) {
                line(this.x, this.y, that.x, that.y);
            }
        }
    };
};

// Initialise atoms
var atoms = [];
for (var a = 0; a < numAtoms; a++) {
    var r = atomSize;
    var y = r + round(random() * (400 - 2 * r));
    var x = r + round(random() * (400 - 2 * r));
    if (a >= numAtoms * pNegative) {
        var charge = -1;
    } else {
        var charge = 1;
    }
    atoms.push(new Atom(x, y, r, charge));
}

// Add a number of water atoms at the top of the screen
var addWaterAtom = function() {
    var r = atomSize;
    var x = r + round(random() * (400 - 2 * r));
    atoms.push(new Atom(x, r+2, r, 0));
};

var UIBoxX = 8;
var UIBoxY = 8;
var UIBoxW = 140;
var UIBoxH = 40;
var UIBoxX2 = 160;
var UIBoxW2 = 75;
var UIBoxX3 = 250;
var UIBoxW3 = 140;
var UIBoxH3 = 80;

var ballX = UIBoxX + 14 + 7 * round(wallTemp*2);
var ballY = UIBoxY + 26;
var myFont = createFont("Times", 15);

// Draw a information display box
var drawBox = function(x, y, w, h, heading) {
    noStroke();
    fill(50, 50, 50, 50);
    rect(x+2, y+2, w, h, 8);
    fill(255, 255, 255, 230);
    rect(x, y, w, h, 8);
    textFont(myFont, 15);
    fill(10, 10, 10);
    text(heading, x+10, y+16);
};

var drawHeat = function() {
    var heading = "Temperature: " + round(2 * wallTemp - 0.2) / 2;
    drawBox(UIBoxX, UIBoxY, UIBoxW, UIBoxH, heading);
    
    // Draw slider
    fill(50, 50, 50, 220);
    rect(UIBoxX+10, UIBoxY+25, UIBoxW-20, 6, 6);
    fill(160, 160, 180);
    stroke(10, 10, 10);
    ellipse(ballX, UIBoxY+28, 13, 13);
};

// Calculate average pressure over 30 frames and display it
var drawPressure = function() {
    if (frameCount % deltaTime === 0) {
        pressure = round(10 * cumulativeP / deltaTime) / 10;
        cumulativeP = 0;
    }
    drawBox(UIBoxX2, UIBoxY, UIBoxW2, UIBoxH, "Pressure");
    textFont(myFont, 13);
    text(pressure + " units", UIBoxX2+12, UIBoxY + 32);
};

var drawEnergyBox = function() {
    var energies = [0,0,0,0,0,0,0,0,0,0];
    var barWidth = round((UIBoxW3 - 36) / energies.length);
    var graphHeight = UIBoxH3 - 40;
    var graphWidth = energies.length* barWidth + 3;
    var graphX = UIBoxX3 + 0.5 * (UIBoxW3 - graphWidth);
    var graphY = UIBoxY + UIBoxH3 - 15;
    var scaleY = graphHeight / numAtoms;
    
    // Generate histogram
    var e;
    var total_energy = 0;
    for (var i = 0; i < numAtoms; i++) {
        var energy = atoms[i].temp();
        total_energy += energy;
        e = round(energy - 0.5);
        if (e > energies.length - 1) {
            e = energies.length - 1;
        }
        energies[e]++;
    }
    
    var title = "Kinetic Energy: " + round(10 * total_energy/numAtoms)/10;
    drawBox(UIBoxX3, UIBoxY, UIBoxW3, UIBoxH3, title);
    stroke(10, 10, 10);
    line(graphX, graphY, graphX+graphWidth, graphY);
    
    noStroke();
    for (e = 0; e < energies.length; e++) {
        fill(lerpColor(coolColour, hotColour, (e+0.5)/10));
        rect(graphX + 3 + e * barWidth, graphY - scaleY*energies[e],
             barWidth, scaleY * energies[e]);
        textSize(10);
        fill(10, 10, 10);
        text(e, graphX + 4 + (e - 0.5) * barWidth, graphY + 11);
    }
    
};

var i, j, atom;
var running = true;

var draw = function() {
    // Clear everything
    background(242, 243, 250);

    // Run simulation
    if (running) {
        // Calculate interaction
        for (i = 0; i < atoms.length; i++) {
            atoms[i].dy += GRAVITY;
            for (j = i+1; j < atoms.length; j++) {
                atoms[i].interact(atoms[j]);
            }
        }

        for (i = 0; i < atoms.length; i++) {
            atom = atoms[i];
            atom.move();
            atom.bounce();
        }   
    }
    
    // Draw atoms
    noStroke();
    for (i = 0; i < atoms.length; i++) {
        atom = atoms[i];
        if (atom.charge === 1) {
            fill(245, 54, 54);
        } else if (atom.charge === -1) {
            fill(10, 89, 18);
        } else {
            fill(47, 54, 181);
        }
        ellipse(atom.x, atom.y, atom.r*2, atom.r*2);
    }
    
    // Info boxes
    drawHeat();
    drawPressure();
    drawEnergyBox();
    
    // Handle mouse events
    if (mouseIsPressed) {
        // Drag ball for the temperature UI
        if (mouseX > UIBoxX+14 && mouseX < UIBoxX + UIBoxW - 14 &&
            mouseY > UIBoxY+14 && mouseY < UIBoxY + UIBoxH) {
            var x = round((mouseX - UIBoxX - 14) / 7) / 2;
            wallTemp = x + 0.1;
            ballX = x * 14 + UIBoxX + 12;
        }
    }
};

var keyReleased = function() {
    //println(keyCode);
    
    if (keyCode === 32) {
        // Spacebar toogles pausing 
        if(running) { running = false; }
        else { running = true;  }
    } else if (keyCode === 67) {
        // 'c' freezes all the atoms;
        for (i = 0; i < numAtoms; i++) {
            atoms[i].dx = 0;
            atoms[i].dy = 0;
        }
    } else if (keyCode === 87) {
        addWaterAtom();
    }
};

// Let go when mouse leaves canvas
var mouseOut = function() { mouseIsPressed = false; };