https://www.khanacademy.org/cs/challenge-modeling-accretion-disks/1180451277

/***********************************************************
 * A roughly spherical cloud of particles collapsing
 * and coalescing under its own gravity to form a star.
 * 
 * I've implemented one of Sal's suggestions, so the
 * initial cloud now starts the simulation spinning.
 * The system now evolves more slowly, but a lot more
 * interestingly. A sort of disc is created and there
 * are often several small systems of orbits orbiting
 * each other. You can often get planets orbiting the sun
 * which have satellites of their own.
 * 
 * Use the mouse to rotate the universe
 * Move the to the bottom of the screen for more controls.
 * 
 * The red line shows the normal to the mean angular momentum,
 * centred on the centre of mass of the universe.
 * 
 * The histogram shows the distribution of particle masses
 * on a log base 2 scale. The final column is the count of 
 * all particle > 2048 mass units.
 * 
 * The most distant particle is the one furthest from the 
 * centre of the universe's mass.
 * 
 * Note that scaling does no affect particle size to make 
 * it easier to follow particles at extreme scales.
***********************************************************/

// Reduce this number if simulation is too slow.
var numParticles = 250;
var initialMassRange = [2, 12];
var initialMaxDistance = 600;

// This gives the cloud some initial rotation
var startWithRotation = true;
var initialSpin = 1.8;

var GRAVITATIONAL_CONSTANT = 0.8;

// How close particles have to be for a collision
var collisionThreshold = 1.5;

// How much mass a particle needs for it to become a star
var sunThreshold = 500;

// Display variables
var backgroundColour = color(10, 10, 20);
var particleColour = color(240, 240, 220);
var sunColour = color(255, 153, 0);
var myFont = createFont("times", 12);
var angularMomentumLineHeight = 120;

var toolbarHeight = 80;
var sliderX = 20;
var sliderY = 350;
var sliderWidth = 80;
var buttonY = 365;

var rotateRate = 1; // Speed of rotation using mouse

var running = true;
var mouseOverButton = false;
var currentScale = 3;
var colourScale = initialMaxDistance * currentScale;
var maxScale = 100;
var centreX = 200;
var centreY = 200;

// These values are filled in later
var totalMass = 0;
var maxMass = 0;
var massHistogram = [];

for (var h=0; h<12; h++) {
    massHistogram.push(0);
}

// Take the logarithm base two of the mass
var binMass = function(mass) {
    for (var i=massHistogram.length-1; i>=0; i--){
        if (mass > pow(2, i)) {
            return i;
        }
    }
};

var Particle = function(x, y, z, v, m) {
    this.position = [x, y, z];
    this.velocity = v;
                     
    this.mass = m;
    this.combineWith = [];
    
    // Radius is the cube root of mass
    this.getRadius = function() {
        this.radius = pow(this.mass, 1/3);
    };
    
    this.getRadius();
    
    this.draw = function() {
        var c;
        if (this.mass < sunThreshold) {
            // Particles are darker the further away they are
            var d = constrain((this.position[2] + 0.5 * colourScale) / 
                colourScale, 0.05, 1);
            c = lerpColor(backgroundColour, particleColour, d);
        } else {
            c = sunColour;
        }
        fill(c);
        
        var r = this.radius * 2 * currentScale / log(currentScale);
        
        if (r < 1) {
            point(this.position[0], this.position[1]);
        } else {
            ellipse(this.position[0], this.position[1], r, r);
        }
    };
    
    this.move = function() {
        this.position[0] += this.velocity[0];
        this.position[1] += this.velocity[1];
        this.position[2] += this.velocity[2];
    };
    
    this.attract = function(that) {
        var dx = this.position[0] - that.position[0];
        var dy = this.position[1] - that.position[1];
        var dz = this.position[2] - that.position[2];
        var d2 = dx * dx + dy * dy + dz * dz;
        var d = sqrt(d2);
        
        if (d<(this.radius+that.radius)*collisionThreshold) {
            this.combineWith.push(that);
            return;
        }
        
        var force = GRAVITATIONAL_CONSTANT * this.mass*that.mass / d2;
        var accel1 = force / this.mass;
        var accel2 = force / that.mass;
        
        dx /= d;
        dy /= d;
        dz /= d;
        
        this.velocity[0] -= accel1 * dx;
        this.velocity[1] -= accel1 * dy;
        this.velocity[2] -= accel1 * dz;
        
        that.velocity[0] += accel2 * dx;
        that.velocity[1] += accel2 * dy;
        that.velocity[2] += accel2 * dz;
    };
    
    this.mergeWith = function(that) {
        var mass2 = this.mass + that.mass;
        var proportion = this.mass / mass2;
        
        for (var i=0; i<3; i++) {
        this.position[i] = this.position[i] * proportion + 
                           that.position[i] * (1 - proportion);
        this.velocity[i] = this.velocity[i] * proportion + 
                           that.velocity[i] * (1 - proportion);
        }

        // Update histogram
        massHistogram[binMass(this.mass)]--;
        massHistogram[binMass(mass2)]++;

        this.mass = mass2;
        if (this.mass > maxMass) { maxMass = this.mass; }
        
        this.getRadius();
        this.combineWith = [];

    };
};

var initialiseParticles = function(n) {
    var particles = [];
    var massRange = initialMassRange[1]-initialMassRange[0];
    totalMass = 0;
    
    for (var i=0; i<n; i++) {
        // Randomly distribute within sphere
        var phi = random() * 360;
        var theta = acos( random() * 2 - 1 );
        var r = initialMaxDistance * pow(random(), 1/3);
        var x = r * sin(theta) * cos(phi);
        var y = r * sin(theta) * sin(phi);
        var z = r * cos(theta);
        
        var v;
        if (startWithRotation) {
            var d = initialSpin / sqrt(x*x + y*y);
            v = [random() * d *  y,
                 random() * d * -x,
                 random() * 0.2 - 0.1];
        } else {
            v = [random()-0.5, random()-0.5, random()-0.5];
        }
        
        var m = initialMassRange[0] + random() * massRange;
        if (m > maxMass) { maxMass = m; }
        totalMass += m;
        massHistogram[binMass(m)] += 1;
        
        particles.push(new Particle(x, y, z, v, m));
    }
    
    return particles;
};

var particles = initialiseParticles(numParticles);

// Adjust to keep centred on the centre of mass
// But maybe this never changes
var centreParticles = function(particles) {
    var mid = [0, 0, 0];
    var i;
    
    for (var d=0; d<3; d++) {
        for (i=0; i<particles.length; i++) {
            var p = particles[i];
            if (p !== undefined) {
                mid[d] += p.mass * p.position[d];
            }
        }
        
        mid[d] /= totalMass;
        
        for (i=0; i<particles.length; i++) {
            particles[i].position[d] -= mid[d];
        }
    }

    resetMatrix();
    translate(centreX, centreY);
    scale(1/currentScale, 1/currentScale);
};

var drawSlider = function(x, y) {
    strokeWeight(1);
    fill(20, 20, 50);
    
    textAlign(LEFT, CENTER);
    textFont(myFont, 14);
    textSize(12);
    text("Scale 1:" + round(currentScale * 10)/10, x, y-16);
    
    rect(x, y, sliderWidth, 3, 4);
    stroke(160, 160, 160);
    line(x + 1, y, x + sliderWidth - 2, y);

    fill(180, 180, 180);
    stroke(50, 50, 50);
    var proportion = (currentScale - 0.5) / (maxScale - 0.5);
    var buttonX = x + sliderWidth * proportion - 5;
    
    rect(buttonX, y-7, 10, 16, 3);
    line(buttonX + 3, y - 2, buttonX + 7, y - 2);
    line(buttonX + 3, y + 1, buttonX + 7, y + 1);
    line(buttonX + 3, y + 4, buttonX + 7, y + 4);
};

var drawHistogram = function() {
    var barWidth = 9;
    var x = 265;
    var y = 400 - 18;
    var i;
    
    // Axis
    stroke(10,10,10);
    var axisLength = massHistogram.length * (barWidth+1) + 2;
    line(x, y, x + axisLength, y);
    
    // Label
    fill(10, 10, 20);
    textFont(myFont, 11);
    textAlign(CENTER, BASELINE);
    text("log(mass) distribution", x + axisLength/2, y+12);
    
    // Bars
    noStroke();
    
    var maxHeight = 5;
    for(i=0; i<massHistogram.length; i++) {
        if (massHistogram[i] > maxHeight) {
            maxHeight = massHistogram[i];
        }
    }
    
    var scaleHeight = (toolbarHeight - 35) / maxHeight;
    
    textFont(myFont, 10);
    for(i=0; i<massHistogram.length; i++) {
        var barHeight = round(massHistogram[i] * scaleHeight);
        fill(250, 250, 255, 180);
        rect(x+1, y-barHeight, barWidth, barHeight);
        fill(10, 10, 20);
        text(massHistogram[i], x+barWidth/2, y-barHeight-2);
        x += barWidth + 1;
    }
    
};

var findMeanAngularMomentum = function() {
    var angularM = [0,0,0];
    for (var p=0; p<particles.length; p++) {
        var a = particles[p].position;
        var b = particles[p].velocity;
        var x = a[1] * b[2] - a[2] * b[1];
        var y = a[2] * b[0] - a[0] * b[2];
        var z = a[0] * b[1] - a[1] * b[0];
        var d = sqrt(x*x + y*y + z*z) / 
                (angularMomentumLineHeight * currentScale);
        
        // Normalise and scale by mass
        //var m = particles[p].mass / d;
        var m = 10 / d;
        angularM[0] += x * m;
        angularM[1] += y * m;
        angularM[2] += z * m;
    }
    angularM[0] /= totalMass;
    angularM[1] /= totalMass;
    angularM[2] /= totalMass;
    return angularM;
};

var drawAngularMomentum = function() {
    var am = findMeanAngularMomentum();
    stroke(255, 0, 0);
    strokeWeight(currentScale*2);
    line(-am[0], -am[1], am[0], am[1]);
};

var findMostDistanceParticle = function() {
    var maxDistance = 0;
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var d = p.position[0] * p.position[0];
        d += p.position[1] * p.position[1];
        d += p.position[2] * p.position[2];
        d = sqrt(d);
        if (d > maxDistance) {
            maxDistance = d;
        }
    }
    return maxDistance;
};

var handleMouseEvents = function() {
    var y = 400 - toolbarHeight;
    mouseOverButton = false;
    
    if (mouseY > y) {
        resetMatrix();
        
        fill(200, 200, 200, 100);
        rect(0, y, 400, toolbarHeight);
        
        strokeWeight(2);
        stroke(200, 200, 200);
        line(0, y, 400, y);
        
        drawSlider(sliderX, sliderY);
        fill(20, 20, 50);
        textAlign(LEFT, CENTER);
        text("Number of bodies: " + particles.length,
             120, y+20);
        text("Most massive body: " + round(maxMass),
             120, y+40);
        text("Most distant body: "+round(findMostDistanceParticle()),
             120, y+60);     
        
        drawHistogram();
        
        strokeWeight(1);
        fill(200, 200, 200, 100);
        
        // Mouseover effect
        if (mouseY > buttonY && mouseX > 60 && mouseX < 75) {
            fill(240, 240, 240);
            mouseOverButton = true;
        }
        
        if (running) {
            // Pause button
            rect(60, buttonY, 5, 20, 5);
            rect(69, buttonY, 5, 20, 5);
        } else {
            triangle(60.5, buttonY,
                     74, buttonY + 8,
                     60.5, buttonY + 16);
        }
    }
};

var rotateY3D = function(theta){
    var ct = cos(theta);
    var st = sin(theta);
    var x, z;
    
    for (var i = 0; i < particles.length; i+=1) {
        var p = particles[i];
        x = p.position[0];
        z = p.position[2];
        p.position = [ct * x + st * z,
                      p.position[1],
                      -st * x + ct * z];
        
        x = p.velocity[0];
        z = p.velocity[2];
        p.velocity = [ct * x + st * z,
                      p.velocity[1],
                      -st * x + ct * z];
    }
};

var rotateX3D = function(theta){
    var ct = cos(theta);
    var st = sin(theta);
    var y, z;
    
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        y = p.position[1];
        z = p.position[2];
        p.position = [p.position[0],
                      ct*y - st*z,
                      st*y + ct*z];
        y = p.velocity[1];
        z = p.velocity[2];
        p.velocity = [p.velocity[0],
                      ct*y - st*z,
                      st*y + ct*z];
    }
};

var sortByZ = function(a, b) {
    return a.position[2] - b.position[2];
};

var draw = function() {
    var i, j;
    
    if (running) {
        // Gravitational attraction
        for (i=0; i<particles.length; i++) {
            for (j=i+1; j<particles.length; j++) {
                particles[i].attract(particles[j]);
            }
        }
        
        // Combining particles
        var particles_to_remove = [];
        for (i=0; i<particles.length; i++) {
            for (j=0; j<particles[i].combineWith.length; j++) {
                var p = particles[i].combineWith[j];
                particles[i].mergeWith(p);
                particles_to_remove.push(particles.indexOf(p));
            }
        }
        
        // Remove particles
        particles_to_remove.sort();
        for (i=0; i<particles_to_remove.length; i++) {
            var r = particles_to_remove[i];
            var particle = particles[r];
            if (particle !== undefined) {
                massHistogram[binMass(particle.mass)]--;
                particles.splice(r, 1);
            }
        }
        particles_to_remove = [];
        
        // Moving
        for (i=0; i<particles.length; i++) {
            particles[i].move();
        }
        //particles.sort(sortByZ);
    }
    
    centreParticles(particles);
    background(backgroundColour);
    
    drawAngularMomentum();
    
    noStroke();
    for (i=0; i<particles.length; i++) {
        particles[i].draw();
    }
    
    handleMouseEvents();
};

var mouseClicked = function() {
    if (mouseOverButton) {
        if (running) { running = false; }
        else { running = true; }   
    }
};

var mouseDragged = function() {    
    if (mouseY < 400 - toolbarHeight) {
        // Rotate universe
        rotateY3D(-(pmouseX - mouseX) * rotateRate);
        rotateX3D( (pmouseY - mouseY) * rotateRate);
    } else if (mouseX > sliderX &&
               mouseX < sliderX + sliderWidth &&
               mouseY > sliderY - 7 &&
               mouseY < sliderY + 9) {
        // Drag slider for scale
            var proportion = (mouseX - sliderX)/sliderWidth;
            currentScale = 0.3+proportion*(maxScale - 0.3);
            colourScale = initialMaxDistance * currentScale;
    }

};

var mouseOut = function(){
    mouseIsPressed = false;
};

var keyPressed = function() {
    switch (keyCode) {
        case 37:
            centreX += 20;
            break;
        case 38:
            centreY += 20;
            break;
         case 39:
            centreX -= 20;
            break;
        case 40:
            centreY -= 20;
            break;
    }
};

rotateX3D(90);