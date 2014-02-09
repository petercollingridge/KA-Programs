https://www.khanacademy.org/cs/diffusion/1064545094

/*********************************************************
*  Modelling diffusion.
* Particles bounce off one another and the walls
* 
*  Need to fix wall bouncing
*********************************************************/

// Physical variables to play with
var gravity = 0; // Force due to gravity

// Atom properties
var initialSpeed = 1;   // Equivalent to temperature
var numAtoms = 100;
var atomSize = 5;

// Wall properties
var wallX = 200;
var gapSize = 50;
var wallY1 = (height - gapSize) / 2;
var wallY2 = (height + gapSize) / 2;

var colour1 = color(40, 60, 160, 200);
var colour2 = color(160, 60, 40, 200);
textAlign(CENTER, CENTER);
textSize(15);

var dotProduct = function(ax, ay, bx, by) {
    return ax * bx + ay * by;
};

// Particles have a position, speed, colour and masss
var Particle = function(x, y, r, c, mass) {
    // Position
    this.x = x;
    this.y = y;
    
    // Radius
    this.r = r;
    this.mass = mass || this.r * this.r;
    
    // Colour
    this.c = c;
    
    // Velocity
    this.dx = initialSpeed * (random() - 0.5);
    this.dy = initialSpeed * (random() - 0.5);
};

Particle.prototype.draw = function() {
    fill(this.c);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
};

// Move ball based on its velocity
Particle.prototype.move = function() {
    this.x += this.dx;
    this.y += this.dy;
};

Particle.prototype.collide = function(that) {
    var dx = this.x - that.x;
    var dy = this.y - that.y;
    var dr = this.r + that.r;
    var d = dx * dx + dy * dy;
    
    if (d < dr * dr) {
        // Particles collide
        var collisionDist = sqrt(d + 1);
        
        // Find unit vector in direction of collision
        var collisionVi = dx / collisionDist;
        var collisionVj = dy / collisionDist;
        
        // Find velocity of particle projected on to collision vector
        var collisionV1 = dotProduct(this.dx, this.dy, dx, dy) / collisionDist;
        var collisionV2 = dotProduct(that.dx, that.dy, dx, dy) / collisionDist;
        
        // Find velocity of particle perpendicular to collision vector
        var perpV1 = dotProduct(this.dx, this.dy, -dy, dx) / collisionDist;
        var perpV2 = dotProduct(that.dx, that.dy, -dy, dx) / collisionDist;
        
        // Find movement in direction of collision
        var sumMass = this.mass + that.mass;
        var diffMass = this.mass - that.mass;
        var v1p = (diffMass * collisionV1 + 2 * that.mass * collisionV2) / sumMass;
        var v2p = (2 * this.mass * collisionV1 - diffMass * collisionV2) / sumMass;
        
        // Update velocities
        this.dx = v1p * collisionVi - perpV1 * collisionVj;
        this.dy = v1p * collisionVj + perpV1 * collisionVi;
        that.dx = v2p * collisionVi - perpV2 * collisionVj;
        that.dy = v2p * collisionVj + perpV2 * collisionVi;
        
        // Move to avoid overlap
        var overlap = dr + 1 - collisionDist;
        this.x += collisionVi * overlap;
        this.y += collisionVj * overlap;
        that.x -= collisionVi * overlap;
        that.y -= collisionVj * overlap;
    }
};

// Bounce off walls
Particle.prototype.bounce = function() {
    // Magnitude of velocity
    //var temp = dist(0, 0, this.dx, this.dy);
    //var dtemp = (temp + wallTemp) / (2 * temp);
    if (this.x < this.r) {
        this.x = this.r;
        this.dx *= -1;
        //this.dx *= -dtemp;
    }
    if (this.x > width - this.r){
        this.x = width - this.r;
        this.dx *= -1;
        //this.dx *= -dtemp;
    }
    if (this.y < this.r) {
        this.y = this.r;
        this.dy *= -1;
        //this.dy *= -dtemp;
    }
    if (this.y > height - this.r){
        this.y = height - this.r;
        this.dy *= -1;
        //this.dy *= -dtemp;
    }
    
    // Bounce off central wall
    var notInGap = (this.y - this.r <= wallY1 || this.y + this.r >= wallY2);
    
    if (this.x + this.r > wallX && this.x - this.dx + this.r < wallX && notInGap) {
        this.dx *= -1;
        this.x = 2 * wallX - this.x - this.r * 2;
    } else if (this.x - this.r < wallX && this.x - this.dx - this.r > wallX && notInGap) {
        this.dx *= -1;
        this.x = 2 * wallX - this.x + this.r * 2;
    }
    
};

// Test whether mouse is over ball
Particle.prototype.selected = function() {
    return dist(mouseX, mouseY, this.x, this.y) < this.r;
};

var initialiseParticlePositions = function(n) {
    var balls = [];
    
    // Blue balls on the left side
    for (var b = 0; b < n / 2; b++) {
        var y = atomSize + round(random() * (400 - 2 * atomSize));
        var x = atomSize + round(random() * (200 - 2 * atomSize));
        balls.push(new Particle(x, y, atomSize, colour1));
    }
    
    // Red balls on the right
    for (var b = 0; b < n / 2; b++) {
        var y = atomSize + round(random() * (400 - 2 * atomSize));
        var x = 200 + atomSize + round(random() * (200 - 2 * atomSize));
        balls.push(new Particle(x, y, atomSize, colour2));
    }
    
    return balls;
};

var balls = initialiseParticlePositions(numAtoms);

var skip = 3;
frameRate(60);

var drawInfo = function() {
    var countLeft1 = 0;
    var countLeft2 = 0;
    var countRight1 = 0;
    var countRight2 = 0;
    
    for (var i = 0; i < balls.length; i++) {
        if (balls[i].x < wallX) {
            if (balls[i].c === colour1) {
                countLeft1++;
            } else {
                countLeft2++;   
            }
        } else {
            if (balls[i].c === colour1) {
                countRight1++;
            } else {
                countRight2++;   
            }
        }
    }
    
    var w = 120;
    var pLeft = countLeft1 / (countLeft1 + countLeft2);
    var pRight = countRight1 / (countRight1 + countRight2);
    var pLeftW = round(w * pLeft);
    var pRightW = round(w * pRight);
    
    noStroke();
    fill(0, 0, 0, 100);
    rect(41, 12, w + 1, 30);
    rect(241, 12, w + 1, 30);
    
    strokeWeight(1);
    stroke(10);
    fill(255);
    rect(39, 10, w + 1, 30);
    rect(239, 10, w + 1, 30);
    
    noStroke();
    fill(colour1);
    rect(40, 11, pLeftW, 29);
    rect(240, 11, pRightW, 29);
    
    fill(colour2);
    rect(40 + pLeftW, 11, w - pLeftW, 29);
    rect(240 + pRightW, 11, w - pRightW, 29);
    
    fill(255);
    text(round(100 * pLeft) + "% Blue", 40 + w/2, 25);
    text(round(100 * pRight) + "% Blue", 240 + w/2, 25);
};

var draw = function() {
    background(250, 245, 240);
    
    // Wall
    strokeWeight(3);
    stroke(80);
    line(wallX, 0, wallX, (height - gapSize)/2);
    line(wallX, (height + gapSize)/2, wallX, height);
    
    noStroke();
    for (var i = 0; i < numAtoms; i++) {
        balls[i].draw();
    }

    for (var t = 0; t < skip; t++) {
        // Calculate acceleration
        for (var i = 0; i < numAtoms; i++) {
            balls[i].dy += gravity;
            for (var j = i + 1; j < numAtoms; j++){
                balls[i].collide(balls[j]);
            }
        }
        
        // Move balls
        for (i = 0; i < numAtoms; i++) {
            var ball = balls[i];
            ball.move();
            ball.bounce();
        }   
    }
    
    drawInfo();
};