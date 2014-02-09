https://www.khanacademy.org/cs/survive-and-evolve/1564393660

/****************************************************
* Version 2.1
*  - Four distinct levels
*  - Up to six different proteins to synthesise
*  - Toxins and viruses
* 
* You are a simple cell in the primordial soup.
* Collect nutrients to stay alive and to reach
* your goal of replication.
* 
* In each generation there will be new challenges,
* but also new opportunities as you evolve new 
* genes to help you.
* 
* Controls:
*   Arrow keys:     Move the cell
*   WASD:           Move the cell
*   Spacebar:       Pause/Unpause
*   Numbers:        Synthesise a protein
* 
* More levels and proteins coming soon...
*   Next up: sugar metabolism and bacteria
* Also, enemy cells (eventually).
*****************************************************/
var cell;
var Rock;
var state = 'intro';
var genomeLength = 100;
var maxLife = 100;
var maxProtein = 100;
var maxATP = 1200;
var generation = 1;
var timeCount = 0;

/********************************************
*    Data objects
********************************************/

// Probabilities for particle types
// If none of these, then default to rock
var pParticles = {
    ATP: 16,
    dNTP: 2.2,
    AA: 8,
    toxin: 0
};
var pViruses = 0;

var tips = [
    "If your life is getting low, find more ATP\nor synthesise more Main proteins (press 1)",
    "If you are becoming slow, find more ATP\nor synthesise more Cyto proteins (press 2)",
    "If you have a lot of amino acids and want more protein,\nsynthesise more Ribo proteins (3)",
    "If you have a lot of spare protein,\ntry creating another DNAP protein (press 4) to speed up replication",
    "Cyto proteins make you move faster, but use up ATP",
    "If your ATP is getting low, avoid other metabolites",
    "Hitting rocks slows you down and so wastes ATP"
];
var tipNumber = 0;  // Stores which tip to show

// Enzymes that can be main
var enzymeData = {
    "Main" : {
        name: "Maintenance proteins",
        desc: "Maintain your life",
        substrates: ['ATP'],
        products: ['life'],
        km: {ATP: 400},
        kcat: 0.25,
        maxRate: 0.8,
        amount: 5,
        cost: 25
    },
    "Cyto" : {
        name: "Cytoskeletal proteins",
        desc: "Generate movement",
        substrates: ['ATP'],
        products: ['movement'],
        km: {ATP: 50},
        kcat: 0.2,
        maxRate: 1.2,
        amount: 5,
        cost: 32
    },
    "Ribo" : {
        name: "Ribosome",
        desc: "Synthesise protein from amino acids",
        substrates: ['AA', 'ATP'],
        km: {ATP: 250, AA: 10},
        kcat: 0.02,
        maxRate: 0.1,
        products: ['protein'],
        amount: 8,
        cost: 10
    },
    "DNAP" : {
        name: "DNA polymerase",
        desc: "Replicate DNA using dNTPs",
        substrates: ['dNTP', 'ATP'],
        products: ['DNA'],
        km: {ATP: 800, dNTP: 10},
        kcat: 0.1,
        maxRate: 0.1,
        cost: 64
    },
    "aTox" : {
        name: "Anti-toxin",
        desc: "Neutralises toxins",
        substrates: ['toxin'],
        km: {toxin: 5},
        kcat: 0.5,
        maxRate: 0.1,
        cost: 8
    },
    "PSII" : {
        name: "Photosystem II",
        desc: "Generates ATP during daylight",
        products: ['ATP'],
        kcat: 0.5,
        maxRate: 0.5,
        cost: 40
    }
};

var nutrientData = {
     "ATP": {
        amount: 8,
        fill: color(40, 180, 20),
        stroke: color(16, 97, 6),
        strokeT: color(19, 158, 3, 20)
     },
    "dNTP": {
        amount: 1,
        fill: color(176, 44, 242),
        stroke: color(230, 97, 230),
        strokeT: color(176, 44, 242, 20)
    },
    "AA": {
        amount: 1,
        fill: color(44, 209, 198),
        stroke: color(65, 151, 242),
        strokeT: color(8, 247, 235, 20)
    },
    "toxin": {
        amount: 8,
        fill: color(255, 0, 0),
        stroke: color(255, 99, 99),
        strokeT: color(255, 0, 0, 20)
    }
};

/********************************************
*    Fonts and colours
********************************************/
var menuFont = createFont("impact", 50);
var interFont = createFont("sans-serif", 16);
var monoFont = createFont("monospace", 16);
var handFont = createFont("cursive", 16);

var cellFill = color(127, 209, 123);
var cellStroke = color(22, 117, 17);
var seaCol = color(32, 80, 135);

var DNACol1 = color(89, 63, 107);
var DNACol2 = color(100, 10, 245);
var LifeCol1 = color(143, 23, 2);
var LifeCol2 = color(22, 117, 17);
var ProtCol1 = color(35, 43, 79);
var ProtCol2 = color(38, 49, 204);

var proteinBarWidth = 90;

/********************************************
*    Objects
********************************************/

var Enzyme = function(name, stability, act) {
    var data = enzymeData[name];
    
    this.name = name;
    this.deg = 1 - stability / (stability + 0.05);
    this.activity = data.kcat * act / (act + 8);
    this.cost = data.cost;
    this.amount = data.amount || 0;
    this.substrates = data.substrates || [];
    this.products = data.products || [];
    this.km = data.km || {};
    this.maxRate = data.maxRate;
    this.rxn = 0;
    this.saturation = 0;
    
    this.update = function() {
        if (frameCount % 60 === 0) {
            var degradation = this.amount * this.deg;
            this.amount -= degradation;
            cell.AA += degradation * 0.2;   
        }
        
        // Can't have more than maxLife
        // No need to generate movement if haven't moved
        if ((name === 'Main' && cell.metab.life >= maxLife) ||
            (name === 'Cyto' && cell.metab.movement > 0) ||
            (name === 'Ribo' && cell.metab.protein >= maxProtein)) {
            return;
        }
        
        var m;
        var minV = 1000;
        for (m=0; m<this.substrates.length; m++) {
            var metabolite = this.substrates[m];
            var conc = cell.metab[metabolite];
            var k = this.amount * conc / 
                    (this.amount + conc + this.km[metabolite]);
            if (k < minV) { minV = k; }
        }
        
        if (name === 'PSII') {
            var light = max(0, sin(timeCount/2));
            minV = this.amount * light;
        }
        this.rxn = minV * this.activity;
        this.saturation = 100 * (minV / this.amount);
        
        // Find maximum reaction rates
        if (name === 'Cyto') {
            this.rxn = min(1.5, this.rxn);
        } else if (this.rxn > this.maxRate) {
            this.maxRate = this.rxn;
        }
        
        for (m=0; m<this.substrates.length; m++) {
            cell.metab[this.substrates[m]] -= this.rxn;
        }
        
        for (m=0; m<this.products.length; m++) {
            cell.metab[this.products[m]] += this.rxn;
        }
    };
};
var Cell = function(x, y, r, n) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.nodes = [];
    this.vectors = [];
    
    this.metab = {
        DNA: 0,
        movement: 0,
        life: maxLife,
        protein: 0,
        ATP: 600,
        AA: 0,
        dNTP: 0,
        toxin: 0
    };
    
    // Used to determine whether nutrients are increasing
    this.oldMetab = {
        AA: 0,
        ATP: 600,
        dNTP: 0
    };
    
    this.metabCount = 3;
    this.deltaMetab = {};
    
    this.enzymes = [new Enzyme("Main", 8, 8), 
                    new Enzyme("Cyto", 8, 8),
                    new Enzyme("Ribo", 8, 8),
                    new Enzyme("DNAP", 8, 8)];
    
    var friction = 0.96;
    var noise = 0.1;
    var maxSpeed = 0.8;
    
    // Create cell's nodes
    for (var i = 0; i < n; i++) {
        var nx = x + r * sin(360 * i / n);
        var ny = y - r * cos(360 * i / n);
        this.nodes.push([nx, ny]);
        this.vectors.push([0, 0]);
    }
    
    this.move = function(dir, dx, dy) {
        // Convert 'movement' metabolite into speed
        var speed = 0.3 + this.metab.movement;
        this.metab.movement = 0;
        
        // Move slower if sick
        if (this.metab.toxin > 0) { speed *= 0.8; }
        
        var node = round(n * dir / 4);
        var xy;
        if (dx !== 0) {
            xy = 0;
            speed *= dx;
        } else {
            xy = 1;
            speed *= dy;
        }
        this.vectors[node][xy] += speed * (random()/2 + 0.5);
        this.vectors[(node + 1) % n][xy] += speed * random();
        this.vectors[(node + n - 1) % n][xy] += speed * random(); 
    };
    
    this.collide = function(that) {
        var dx = this.x - that.x;
        var dy = this.y - that.y;
        
        if (dx * dx + dy * dy <= this.r * this.r + 16) {
            if (that instanceof Rock) {
                // Collide with rock
                var minD = this.r * this.r;
                var node = 0;
                
                // Find closest node
                for (i = 0; i < n; i++) {
                    var dnx = that.x - this.nodes[i][0];
                    var dny = that.y - this.nodes[i][1];
                    var d = dnx * dnx + dny * dny;
                    if (d < minD) {
                        minD = d;
                        node = i;
                    }
                }
                
                // Dist and Angle between node and centre
                dx = this.nodes[node][0] - this.x;
                dy = this.nodes[node][1] - this.y;
                //var dist = sqrt(dx * dx + dy * dy);
                var theta = atan2(dy, dx);
                
                var c = -cos(theta)/2;
                var s = -sin(theta)/2;
                this.vectors[node][0] = c * 2;
                this.vectors[node][1] = s * 2;
                this.vectors[(node + 1) % n][0] = c;
                this.vectors[(node + 1) % n][1] = s;
                this.vectors[(node + n - 1) % n][0] = c;
                this.vectors[(node + n - 1) % n][1] = s;
                this.x += c * 2;
                this.y += c * 2;
                
                that.dx = -c * 30 / that.r;
                that.dy = -s * 30 / that.r;
            } else {
                // Eat nutrient
                if (!that.eaten) { that.eaten = 1; }
            }
        }
    };
    
    this.metabolism = function() {
        // Ever-present entropy
        this.metab.life -= 0.25;
        
        if (this.metab.ATP > maxATP) { this.metab.ATP = maxATP; }
        
        // Toxin
        if (this.metab.toxin > 0) {
            if (this.metab.ATP > 0) {
                this.metab.toxin -= 0.5;
                this.metab.ATP -= min(this.metab.ATP, 2);
            }
        }
        
        // Enzymes
        for (var enz=0; enz<this.enzymes.length; enz++) {
            this.enzymes[enz].update();
        }
    };
    
    this.findMetaboliteChange = function() {
        for (var m in this.oldMetab) {
            this.deltaMetab[m] = this.metab[m] - this.oldMetab[m];
            this.oldMetab[m] = this.metab[m];
        }
    };
    this.findMetaboliteChange();
    
    this.update = function(driftAngle, drift, recentre) {
        // Check for game end
        if (this.metab.DNA >= genomeLength && this.metab.toxin<0.1) {
            state = 'win';
        } else if (this.metab.life <= 0) {
            state = 'lose';
        }
        
        this.metabolism();
        
        // Update metabolite changes every half second
        if (frameCount % 15) { this.findMetaboliteChange(); }
        
        // Find cell centre
        this.x = 0;
        this.y = 0;
        var i;
        for (i = 0; i < n; i++) {
            this.x += this.nodes[i][0];
            this.y += this.nodes[i][1];
        }
        this.x /= n;
        this.y /= n;
        
        // Sick cells shrink
        var r = this.r;
        if (this.metab.toxin > 0.05) { r = this.r * 0.75; }
        
        // Move nodes to centre
        for (i = 0; i < n; i++) {
            var dx = 0.25 * (this.nodes[i][0] - 
                     (this.x + r * sin(360 * i / n)));
            var dy = 0.25 * (this.nodes[i][1] - 
                     (this.y - r * cos(360 * i / n)));
                    
            this.vectors[i][0] += 0.05 * drift * sin(driftAngle)-dx;
            this.vectors[i][1] += 0.05 * drift * cos(driftAngle)-dy;
            this.nodes[i][0] += this.vectors[i][0] + recentre[0];
            this.nodes[i][1] += this.vectors[i][1] + recentre[1];
            this.vectors[i][0] *= friction;
            this.vectors[i][1] *= friction;
            this.vectors[i][0] += noise * (random() - 0.5);
            this.vectors[i][1] += noise * (random() - 0.5);
        }
    };
    
    this.draw = function() {
        strokeWeight(2);
        stroke(cellStroke);
        if (this.metab.toxin === 0) {
            fill(cellFill);
        } else {
            var c = lerpColor(color(cellFill),
                              color(255, 38, 0),
                              (this.metab.toxin % 16) / 15);
            fill(c);
        }
        
        beginShape();
        curveVertex(this.nodes[n-1][0],
                    this.nodes[n-1][1]);
        for (var i = 0; i < n; i++) {
            curveVertex(this.nodes[i][0], this.nodes[i][1]);
        }
        curveVertex(this.nodes[0][0], this.nodes[0][1]);
        curveVertex(this.nodes[1][0], this.nodes[1][1]);
        endShape();
        
        strokeWeight(1);
        stroke(22, 117, 17);
        fill(255, 255, 255, 220);
        ellipse(this.x, this.y, this.r/2, this.r/2); 
    };
};

var rockImg = getImage("cute/Rock");

var Particle = function(x, y, type) {
    var noise = 0.1;
    
    this._init = function(x, y, r) {
        this.x = x;
        this.y = y;
        this.dx = random() - 0.5;
        this.dy = random() - 0.5;
        this.friction = 100 / (100 + r);
    };
    
    this.collide = function(that) {
        var dx = this.x - that.x;
        var dy = this.y - that.y;
        if (dx * dx + dy * dy < this.r * this.r) {
            var theta = atan2(dy, dx);
            var c = -cos(theta)/2;
            var s = -sin(theta)/2;
            this.x -= 2 * c;
            this.y -= 2 * s;
            that.x += 2 * c;
            that.y += 2 * s;
            this.dx *= -1;
            this.dy *= -1;
            that.dx *= -1;
            that.dy *= -1;
            this.angle += (random()-0.5) * 20;
            that.angle += (random()-0.5) * 20;
        }
    };
    
    this.explode = function() {
        strokeWeight(3);
        var c = lerpColor(this.stroke, this.strokeT,
               this.eaten/(20 + this.r));
        fill(c);
        stroke(c);
        var radius = this.r + this.eaten * 4;
        ellipse(this.x, this.y, radius, radius);   
        
        fill(this.stroke);
        textAlign(CENTER, CENTER);
        textFont(menuFont, 16);
        var txt = (this.amount * this.eaten) + " " + this.type;
        text(txt, this.x, this.y-this.eaten*2+5);
    };
    
    this.update = function(driftAngle, drift, recentre) {
        this.x += this.dx + drift*6/this.r * sin(driftAngle);
        this.y += this.dy + drift*6/this.r * cos(driftAngle);
        this.x += recentre[0];
        this.y += recentre[1];
        
        this.dx *= this.friction;
        this.dy *= this.friction;
        this.dx += noise * (random() - 0.5);
        this.dy += noise * (random() - 0.5);
        this.angle += this.rotate / this.r;
        this.rotate += noise * (random() - 0.5);
    };
};

var Rock = function(x, y) {    
    this.angle = random() * 360;
    this.rotate = random() * 50;
    this.r = 15 + random() * 25;
    this._init(x, y, this.r);
    
    this.draw = function() {
        pushMatrix();
        translate(round(this.x), round(this.y));
        rotate(this.angle);
        scale(this.r/100, this.r/100);
        image(rockImg, -50, -115);
        popMatrix();
    };
};
Rock.prototype = new Particle();

var Nutrient = function(x, y, type) {    
    this.r = 8 + floor(random() * 7);
    this.type = type;
    this.eaten = false;
    this._init(x, y, this.r);
    
    var data = nutrientData[this.type];
    if (data) {
        this.amount = data.amount;
        this.fill = data.fill;
        this.stroke = data.stroke;
        this.strokeT = data.strokeT;
    }
    
    this.draw = function() {
        if (this.eaten) {
            if (this.eaten <= 10 + this.r) {
                this.explode();
                this.eaten++;
                cell.metab[this.type] += this.amount;
            }
        } else {
            strokeWeight(1);
            fill(this.fill);
            stroke(this.stroke);
            ellipse(this.x, this.y, this.r, this.r);
            /*
            noStroke();
            fill(255);
            ellipse(this.x-this.r/8, this.y-this.r/8, 3, 3);
            */
        }
    };
};
Nutrient.prototype = new Particle();

var drawVirus = function(x, y) {
    strokeWeight(1);
    fill(255, 45, 45, 80);
    stroke(250, 158, 158, 80);
    triangle(x, y - 4, x - 4, y + 2, x + 4, y + 2);
    triangle(x, y + 4, x - 4, y - 2, x + 4, y - 2);
};

var Virus = function(x, y) {
    this.r = 4;
    this.eaten = false;
    this._init(x, y, this.r);
    this.stroke = color(250, 158, 158, 80);
    this.strokeT = color(250, 0, 0, 0);
    this.type = "virus";
    
    this.draw = function() {
        if (this.eaten) {
            if (this.eaten <= 10 + this.r) {
                this.explode();
                this.eaten++;
                cell.metab.DNA = max(cell.metab.DNA - 2, 0);
                cell.metab.ATP = max(cell.metab.ATP - 2, 0);
            }
        } else {
            drawVirus(this.x, this.y);
            // Randomly remove occassionally
            if (random() < 0.001) { this.eaten = 100; }
        }
    };
};
Virus.prototype = new Particle();

/******************************
 * Initialise Particle data
******************************/
var nParticles = 0;

// Example particles
var egATP = new Nutrient(115, 120, 'ATP');
var egdNTP = new Nutrient(115, 155, 'dNTP');
var egAA = new Nutrient(115, 215, 'AA');
var egToxin = new Nutrient(115, 280, 'toxin');

// Add n random particles to the given array
var addParticles = function(arr, n, x, y) {
    for (var i = 0; i < n; i++) {
        nParticles++;
        var px = x || random() * 800 - 200;
        var py = y || random() * 800 - 200;

        // Determine particle type
        var particleN = random() * 100;
        
        for (var p in pParticles) {
            particleN -= pParticles[p];
            if (particleN < 0) {
                arr.push(new Nutrient(px, py, p));
                break;
            }
        }
        if (particleN >= 0) {
            arr.push(new Rock(px, py));
        }
    }
};

var addViruses = function(x, y, arr) {
    var nViruses = 8 + floor(random() * 8);
    var px = x || random() * 800 - 200;
    var py = y || random() * 800 - 200;
    
    for (var n=0; n<nViruses; n++) {
        var theta = random() * 360;
        var d = random() * 80;
        arr.push(new Virus(px+d*cos(theta), py+d*sin(theta)));
    }
};

var nextLevel = function() {
    generation++;
    timeCount = 0;
    
    genomeLength += 20;
    maxLife += 5;
    maxProtein += 10;
    maxATP += 100;
    
    // Halve metabolite concentrations
    for (var m in cell.metab) {
        if (m === 'DNA' || m === 'protein') {cell.metab[m] = 0;}
        else if (m !== 'life') { cell.metab[m] *= 0.5; }
        else { cell.metab[m] = maxLife; }
    }
    if (cell.metab.ATP < 600) {
        cell.metab.ATP = 600;
    }
    
    // Half enzymes toward their initial concentration
    for (var i=0; i<cell.enzymes.length; i++) {
        var enz = cell.enzymes[i];
        var initConc = enzymeData[enz.name].amount || 0;
        enz.amount += 0.5 * (initConc - enz.amount);
    }
    
    // Add new proteins
    switch (generation) {
        case 2:
            cell.enzymes.push(new Enzyme("aTox", 8, 8));
            cell.oldMetab.toxin = 0;
            cell.metabCount++;
            break;
        case 3:
            pViruses = 0.02;
            break;
        case 4:
            cell.enzymes.push(new Enzyme("PSII", 8, 8));
            pParticles.ATP = 10;
            break;
    }
    
    // Make non-toxins particles less frequent
    var totalP = 0;
    for (var p in pParticles) {
        if (p !== 'toxin') {
            pParticles[p] *= 0.95;
            totalP += pParticles[p];
        }
    }
    
    // Increase toxin probability
    pParticles.toxin = 50 - totalP;
};

/******************************
 * Initialise objects
******************************/
cell = new Cell(200, 200, 18, 12);
var bodies = [cell];
addParticles(bodies, 32);

// Vector describing flow of water
var driftAngle = random() * 360;
var drift = 1;

// Working out density of particles
var recentreSum = [0, 0];

// Slowly move display towards centring on the cell
var centreDisplayOnCell = function() {
    var dx = (200 - cell.x) * 0.1;
    var dy = (200 - cell.y) * 0.1;
    return [dx, dy];
};

/******************************
 * Main game loop
******************************/

var update = function() {
    var i;
    
    // Remove offscreen particles (only ever remove 1 each time)
    for (i=1; i<bodies.length-1; i++) {
        var p = bodies[i];
        if (p.x < -400 || p.x > 800 || p.y < -400 || p.y > 800 ||
            p.eaten > 10 + p.r) {
            bodies.splice(i, 1);
            if (p instanceof Virus) {
                if (p.eaten === 15) { genomeLength += 2; }
            } else { nParticles--; }
            break;
        }
    }

    // Collision with cell
    for (i=1; i<bodies.length; i++) {
        cell.collide(bodies[i]);
    }

    // Inter-particle collisions
    for (i=1; i<bodies.length-1; i++) {
        if (bodies[i].type !== 'virus') {
            for (var j=i+1; j<bodies.length; j++) {
                if (bodies[j].type !== 'virus') {
                    bodies[i].collide(bodies[j]);
                }
            }   
        }
    }

    // Recentre screen to follow cell
    var recentre = centreDisplayOnCell();
    recentreSum[0] = recentreSum[0] * 0.5 + recentre[0];
    recentreSum[1] = recentreSum[1] * 0.5 + recentre[1];

    for (i=0; i<bodies.length; i++) {
        bodies[i].update(driftAngle, drift, recentre);
    }
    
    // Add new particles
    var movement = abs(recentreSum[0]) + abs(recentreSum[1]);
    if (movement*random() > 1 && random() < 10 / (10+nParticles)) {
        var x, y;
        // Calculate what side to add particle;
        if (abs(recentreSum[0]) > abs(recentreSum[1])) {
            x = recentreSum[0] > 0 ? -100 : 500;
        } else {
            y = recentreSum[1] > 0 ? -100: 500;
        }
        if (random() > pViruses) {
            addParticles(bodies, 1, x, y);   
        } else {
            addViruses(x, y, bodies);
        }
    }
    
    // Reorient drift direction
    if (random() < 0.007) {
        driftAngle = random() * 360;
    } else {
        driftAngle += (random() - 0.5);   
    }
};

/******************************
 * Event handling
******************************/
var keys = [];
var keyPressed = function() {
    keys[keyCode] = true;
};

var keyReleased = function() {
    if (keyCode === 32) {
        if (state === 'running') {
            state = 'paused';
        } else if (state === 'paused' || state === 'help') {
            state = 'running';
        }
    }
    
    keys[keyCode] = false;
    
    // Synthesise proteins
    // Only respond to keys when game is playing
    if (state === 'running') {
        if (keyCode >= 49 && keyCode < 49 + cell.enzymes.length) {
            var enz = cell.enzymes[keyCode - 49];
            if (cell.metab.protein >= enz.cost) {
                enz.amount++;
                cell.metab.protein -= enz.cost;
            }
        }
    }
};

// Means we can mash the keys and it works
var keyHandling = function() {
    if (keys[UP] || keys[87]) { cell.move(0, 0, -1); }
    if (keys[DOWN] || keys[83]) { cell.move(2, 0, 1); }
    if (keys[LEFT] || keys[65]) { cell.move(3, -1, 0); }
    if (keys[RIGHT] || keys[68]) { cell.move(1, 1, 0); }

};

var mouseClicked = function() {
    if (state === 'paused') {
        state = 'running';
    }
};

/******************************
 * Display
******************************/

// Health bar
var drawHealthBar = function(name, x, y, len, c1, c2, value, maxV, value2, c3) {
    var p1 = value / max(0, maxV);
    var height = 12;
    
    if (round(p1 * 100) > 99) {
        // Full bar
        fill(c2);
        stroke(180, 180, 180);
        rect(x, y, len, height, 8);
    } else {
        noStroke();
        fill(c1);
        rect(x, y, len, height, 8);
        
        if (value2 !== undefined) {
            var p2 = value2 / max(0, maxV);
            if (p2 > 0.01) {
                fill(c3);
                rect(x+1, y+1, len * min(1, p1 + p2), height-1, 8);
            }
        }
        
        // Filled in bar
        if (p1 > 0.01) {
            fill(c2);
            rect(x+1, y+1, len * p1, height-1, 8);
        }
        
        //Redo outline
        stroke(180);
        noFill();
        rect(x, y, len, height, 8);
    }
    
    fill(250, 250, 250);
    textFont(interFont, 9);
    textAlign(CENTER, BASELINE);
    var txt = name + ": " + round(value);
    
    if (value2 !== undefined) {
        txt += " / " + round(value2);
    }
    text(txt, x + len/2 + 5, y+10);
};

// Pop-up info box describing the protein passed as "data"
var showProteinInfo = function(x, y, data, n) {
    var metabPerLine = 4;
    var lineHeight = 17;
    
    stroke(250, 250, 250);
    fill(20, 20, 30);
    rect(x, y, 400 - x - 4, 71, 10);
    
    fill(230, 240, 255);
    textAlign(LEFT, TOP);
    textFont(interFont, 15);
    var txt = data.name;
    var tx = x + 7;
    text(txt, tx, y + 4);
    
    tx += textWidth(txt);
    txt = " (" + data.desc + ")";
    textFont(interFont, 11);
    text(txt, tx, y + 7);
    
    var enz = cell.enzymes[n];
    var enzAmount = round(10 * enz.amount) / 10;
    txt = "You have " + enzAmount + " units of this protein.";
    text(txt, x + 10, y + 26);
    
    if (enzAmount > 0) {
        var rxnAmount = round(30 * enz.amount * enz.rxn);
        var saturation = round(10 * enz.saturation)/10;
        txt = "It is producing " + rxnAmount + " units of ";
        txt += enz.products.join(" and ");
        txt += " per second.";
        text(txt, x + 10, y + 41);
        txt = "It is " + saturation + "% saturated.";
        text(txt, x + 10, y + 56);
    } else {
        txt = "To synthesise it, you need " + data.cost;
        txt += " protein. Then press " + (n+1) + ".";
        text(txt, x + 10, y + 41);
    }
    
    // Synthesis possibilities
    if (cell.metab.protein >= data.cost) {
        fill(0, 158, 5);
    } else {
        fill(204, 4, 4);
    }
    
    textAlign(RIGHT, BASELINE);
    text("Cost: " + data.cost + " protein", 391, y + 66);
};

// Dashboad showing metabolite concentrations and their change
var drawMetaboliteData = function() {
    var metabPerLine = 5;
    var lineHeight = 14;
    var height = lineHeight * ceil(cell.metabCount / metabPerLine);
    
    textFont(interFont, 12);
    stroke(200, 200, 200);
    fill(20);
    rect(-1, -1, 402, height + 1);
    
    // Metabolites
    fill(220, 250, 255);
    textAlign(LEFT, TOP);
    textFont(interFont, 10);
    
    noStroke();
    var y = 2;
    var x = 0;
    var dx = 400 / min(metabPerLine, cell.metabCount);
    var sx = 30;

    for (var m in cell.oldMetab) {
        var change = round(10 * cell.deltaMetab[m]);
        if (change === 0) {
            fill(128, 128, 128);
            ellipse(x+sx, y+5, 6, 6);
        } else if (change > 0) {
            fill(0, 158, 5);
            triangle(x+sx, y+2, x+sx-3, y+8, x+sx+3, y+8);
        } else {
            fill(204, 4, 4);
            triangle(x+sx, y+8, x+sx-3, y+2, x+sx+3, y+2);
        }
        
        text(m + ": " + round(cell.metab[m]), x+sx+5, y);
        x += dx;
        if (x > 400) {
            x = 0;
            y += lineHeight-2;
        }
    }
    return height;
};

var drawProteinBars = function() {
    var y = 399 - 20 * (cell.enzymes.length);

    // Are we showing Mouseover info?
    var mouseover = mouseX < proteinBarWidth && mouseY > y;
    
    // Proteins
    for (var n=0; n<cell.enzymes.length; n++) {
        var enz = cell.enzymes[n];
        var name = enz.name;
        var data = enzymeData[name];

        if (mouseover && mouseY < y + 20) {
            if (state === 'running') { state = 'paused'; }
            showProteinInfo(proteinBarWidth, 326, data, n);
            mouseover = false;
        }
        
        stroke(250, 250, 250);
        fill(10, 10, 20);
        rect(-4, y, proteinBarWidth, 20, 5);
        
        var rxnRate = enz.rxn / enz.maxRate;
        fill(ProtCol2);
        if (rxnRate >= 0.98) {
            rect(-4, y, proteinBarWidth, 20, 5);
        } else {
            noStroke();
            rect(10, y+1, (proteinBarWidth-13) * rxnRate, 19);
        }

        // Box enzyme number
        textAlign(LEFT, TOP);
        textFont(interFont, 9);
        stroke(250);
        
        var proteinBoxHeight;
        if (cell.metab.protein >= data.cost) {
            fill(ProtCol2);
            rect(0, y, 10, 20);
            fill(color(220, 250, 255));
            text((n+1), 3, y+5);
        } else {
            noFill();
            rect(0, y, 10, 20);
            fill(nutrientData.AA.stroke);
            var h = 18 * cell.metab.protein/data.cost;
            noStroke();
            rect(1, y+20 - h, 9, h);
        }
        
        // Box with protein name
        textAlign(LEFT, BASELINE);
        textFont(interFont, 12);
        fill(220, 250, 255);
        var txt = enz.name + ": " + round(enz.amount*10) / 10;
        text(txt, 14, y+15);
        
        y += 20;
    }
};

var drawInterface = function() {    
    strokeWeight(1);
    var height = drawMetaboliteData();

    // Health bars
    var ATPCol = nutrientData.ATP.stroke;
    if (cell.metab.ATP < 300 && floor(frameCount/10) % 2) {
        ATPCol = lerpColor(color(255, 38, 0), egATP.stroke,
                            cell.metab.ATP/400);
    }
    drawHealthBar("ATP", 138, height+2, 126, ATPCol, egATP.fill,
                  cell.metab.ATP, maxATP);
    drawHealthBar("Protein / AA", 6, height+2, 126,
                  ProtCol1, ProtCol2,
                  cell.metab.protein, 64,
                  cell.metab.AA, egAA.stroke);
    drawHealthBar("DNA / dNTP", 270, height+2, 126,
                  DNACol1, DNACol2,
                  cell.metab.DNA, genomeLength,
                  cell.metab.dNTP, egdNTP.fill); 
                  
    if (cell.metab.life < maxLife - 2) {
        drawHealthBar("Life", 138, height+18, 126, LifeCol1, LifeCol2,
                  cell.metab.life, maxLife);   
    }
                  
    drawProteinBars();
};

/***************************************
 * Introduction Screens
***************************************/
var introButtons = function() {
    // Buttons with lazy mouseover check
    textFont(menuFont, 36);
    textAlign(LEFT, BASELINE);
    
    if (mouseY > 360 && mouseX < 95) {
        fill(250, 250, 240);
        if (mouseIsPressed) {
            state = 'help';
            tipNumber = floor(random() * tips.length);
            update();
        }
    } else {
        fill(128, 128, 128);
    }
    text("HELP", 24, 388);
    
    if (mouseY > 360 && mouseX > 310) {
        fill(250, 250, 240);
        if (mouseIsPressed) { state = 'running'; }
    } else {
        fill(128, 128, 128);
    }
    text("PLAY", 310, 388);
};

var level1Screen = function() {
    fill(250, 250, 240);
    textFont(interFont, 20);
    textAlign(LEFT, BASELINE);
    
    var x = 15;
    var y = 43;
    var txt = "Generation 1: ";
    text(txt, x, y);
    x += textWidth(txt);
    textFont(menuFont, 30);
    text("Primordial Soup", x, y);
    
    textFont(interFont, 14);
    x = 24;
    y = 75;
    text("You are a primitive cell struggling to make a living.", x, y);
    text("You live a vast pool, rich in simple organic molecules.", x, y + 20);
    
    x = 24;
    y = 140;
    textFont(interFont, 17);
    txt = "Collect ATP (";
    text(txt, x, y);
    var cx = x+textWidth(txt) + 8;
    text(") to keep your energy up.", cx+8, y);
    
    fill(egATP.fill);
    stroke(egATP.stroke);
    ellipse(cx, y-5, 15, 15);
    
    y += 32;
    fill(250, 250, 240);
    txt = "Collect amino acids (";
    text(txt, x, y);
    cx = x+textWidth(txt) + 8;
    text(") to synthesise protein.", cx+8, y);
    
    fill(egAA.fill);
    stroke(egAA.stroke);
    ellipse(cx, y-5, 15, 15);
    
    y += 32;
    fill(250, 250, 240);
    text("When you have " + enzymeData.DNAP.cost + " protein,", x, y);
    y += 20;
    text("press 4 to synthesise DNA polymerase.", x+44, y);
    
    y += 32;
    fill(250, 250, 240);
    txt = "Then use dNTP (";
    text(txt, x, y);
    cx = x+textWidth(txt) + 8;
    text(") to synthesise DNA.", cx+8, y);
    fill(egdNTP.fill);
    stroke(egdNTP.stroke);
    ellipse(cx, y-5, 15, 15);
    
    y += 16;
    fill(250, 250, 240);
    textFont(interFont, 11);
    text("(dNTPs = deoxyribonucleoside triphosphates)", x+20, y);
    
    y += 44;
    textFont(interFont, 14);
    text("Once your DNA is replicated, you will divide", x, y);
    y += 18;
    text("and the next generation will begin...", x+100, y);
    
    introButtons();
};

var level2Screen = function() {
    fill(250, 250, 240);
    textFont(interFont, 20);
    textAlign(LEFT, BASELINE);
    
    var x = 15;
    var y = 43;
    var txt = "Generation 2: ";
    text(txt, x, y);
    x += textWidth(txt);
    textFont(menuFont, 30);
    text("Pollution!", x, y);
    
    textFont(interFont, 14);
    x = 20;
    y = 75;
    text("So far, life has been easy in the pool.", x, y);
    text("But with so much life, toxic waste products have built up.", x, y + 20);
    
    x = 24;
    y = 140;
    textFont(interFont, 17);
    txt = "Avoid the toxins (";
    text(txt, x, y);
    var cx = x+textWidth(txt) + 8;
    text(").", cx+8, y);
    
    fill(egToxin.fill);
    stroke(egToxin.stroke);
    ellipse(cx, y-5, 15, 15);
    
    y += 36;
    fill(250, 250, 240);
    text("Living in such a toxic environment", x, y);
    y += 24;
    text("creates a strong selection pressure.", x+61, y);
    
    y += 36;
    fill(250, 250, 240);
    text("You have a new" + " gene!", x, y);
    showProteinInfo(80, y+15, enzymeData.aTox, 4);
    
    introButtons();
};

var level3Screen = function() {
    fill(250, 250, 240);
    textFont(interFont, 20);
    textAlign(LEFT, BASELINE);
    
    var x = 15;
    var y = 43;
    var txt = "Generation 3: ";
    text(txt, x, y);
    x += textWidth(txt);
    textFont(menuFont, 30);
    text("Infection!", x, y);
    
    textFont(interFont, 14);
    x = 20;
    y = 75;
    text("Despite the toxins, life has found a way.", x, y);
    text("With so many cells, a new" + " menace has emerged: viruses.", x, y + 20);
    
    x = 15;
    y = 140;
    textFont(interFont, 17);
    txt = "Avoid the viruses (";
    text(txt, x, y);
    var cx = x+textWidth(txt) + 8;
    text(") in case they hijack your DNA.", cx+8, y);
    drawVirus(cx, y-5);
    
    introButtons();
};

var level4Screen = function() {
    fill(250, 250, 240);
    textFont(interFont, 20);
    textAlign(LEFT, BASELINE);
    
    var x = 12;
    var y = 43;
    var txt = "Generation 4: ";
    text(txt, x, y);
    x += textWidth(txt);
    textFont(menuFont, 30);
    text("Here comes the sun", x, y);
    
    textFont(interFont, 14);
    x = 10;
    y = 75;
    text("Despite everything, life continues to spread.", x, y);
    text("Now the pool is teeming with life and ATP is getting scarce.", x, y + 20);
    text("The pressure is on to find a new "+"source of energy.", x, y + 40);
    
    text("You have a new" + " gene!", x, y+80);
    showProteinInfo(80, y+90, enzymeData.PSII, 5);
    
    x = 20;
    y = 280;
    fill(250, 250, 240);
    textFont(interFont, 17);
    textAlign(LEFT, BASELINE);
    text("Use Photosytem II to generate enough energy", x, y);
    text("to survive and reproduce.", x+80, y+25);
    
    introButtons();
};

var genericLevelScreen = function() {
    fill(250, 250, 240);
    textFont(interFont, 20);
    textAlign(LEFT, BASELINE);
    
    var x = 15;
    var y = 43;
    var txt = "Generation " + generation + ": ";
    text(txt, x, y);
    x += textWidth(txt);
    textFont(menuFont, 30);
    text("Life goes on", x, y);
    
    textFont(interFont, 14);
    x = 20;
    y = 75;
    text("Life goes ever on and on.", x, y);
    text("But nutrients are getting rarer and toxins more common.", x, y + 20);
    
    x = 24;
    y = 140;
    textFont(interFont, 17);
    txt = "Avoid the toxins (";
    
    fill(250, 250, 240);
    text("The next level is like the last, just harder.", x, y);
    
    y += 60;
    fill(250, 250, 240);
    text("Check back later - ", x, y);
        y += 24;
    text("I might have added new" + " proteins to evolve", x+36, y);
    
    introButtons();
};

var levelIntroScreens = [ level1Screen, level2Screen, level3Screen,     level4Screen];

var nextLevelScreen = function() {
    if (generation > levelIntroScreens.length) {
        genericLevelScreen();
    } else {
        levelIntroScreens[generation-1]();
    }
};

var controlHelpScreen = function() {
    fill(250, 250, 255);
    textFont(interFont, 20);
    textAlign(CENTER, BASELINE);
    text("Use spacebar to pause and unpause", 200, 110);

    cell.draw();

    textAlign(LEFT, BASELINE);
    textFont(interFont, 14);
    text("Use the arrow keys\nor WASD to move", 225, 192);
    text("When the numbers light up,", 10, 245);
    text("use the keyboard numbers\nto synthesise proteins", 26, 262);
    text("These are the proteins you can synthesise", 100, 320);
    
    textFont(interFont, 11);    
    fill(255, 250, 0);
    text("Keep this above 0", 28, 42);
    text("By keeping this high", 148, 42);
    text("Get this to " + genomeLength, 292, 42);
    var y = 336;
    text("Numbers indictate how much you currently have", 116, y);
    text("Fullness of bar indicates reaction rate", 116, y+15);
    text("To increase both, create more of that protein", 116, y+30);
    text("Mouseover them for detailed information", 116, y+45);
    
    textAlign(CENTER, BASELINE);
    fill(250, 250, 255);
    text("Tip: " + tips[tipNumber], 200, 130);
    
    // Genes
    /*
    var x = 168;
    var y = 172;
    for (var n=0; n<cell.enzymes.length; n++) {
        fill(255, 255, 255);
        textFont(interFont, 15);
        var enz = cell.enzymes[n].name;
        var txt = (n+1) + ". " + enzymeData[enz].name;
        text(txt, x, y);
        
        fill(150, 200, 255);
        textFont(interFont, 11);
        txt = " (" + enzymeData[enz].desc + ")";
        text(txt, x+12, y+14);
        y += 38;
    }
    */
    
    // Arrows
    noFill();
    strokeWeight(2);
    stroke(255, 255, 0);
    //bezier(25, 50, 13, 47, 21, 38, 36, 30);
    //bezier(119, 50, 137, 68, 154, 40, 154, 40);
    //bezier(367, 47, 377, 48, 398, 45, 379, 27);
    //line(96, 331, 110, 325);
    line(8, 311, 20, 250);
    //bezier(120, 179, 158, 219, 164, 271, 100, 317);
    fill(255, 250, 0);
    //triangle(38, 21, 29, 25, 33, 29);
    //triangle(378, 23, 380, 33, 385, 30);
    //triangle(155, 37, 149, 42, 153, 45);
    //triangle(93, 331, 98, 328, 99, 331);
    triangle(7, 313, 6, 306, 11, 307);
    //triangle(97, 321, 102, 312, 106, 316);
    
    // Draw Cell
    /*
    var cellX = 256;
    var cellY = 268;
    var cellR = 105;
    stroke(cellStroke);
    fill(cellFill);
    beginShape();
    var blobs = [0, 0, -2, 28, 1, -3, 0, 0, 0, 0, -1];
    for (var i=0; i<14; i++) {
        var r = cellR + blobs[i%11];
        curveVertex(cellX + r * sin(360*i/11),
                    cellY + r * cos(360*i/11));
    }
    endShape();
    
    fill(40, 180, 20);
    stroke(16, 97, 6);
    ellipse(252, 200, 15, 15);
    
    fill(0, 0, 0);
    textAlign(CENTER, BASELINE);
    textFont(interFont, 16);
    text("ATP", 252, 188);
    
    // dNTP
    fill(176, 44, 242);
    stroke(230, 97, 230);
    
    //AA
    fill(8, 247, 235);
    stroke(0, 97, 201);
    */
};

var drawBackground = function() {
    // Shadowed edge
    noFill();
    strokeWeight(100);
    stroke(0, 0, 0, 5);
    for (var i=0; i<50; i++) {
        ellipse(200, 200, 450+i*3, 450+i*3);   
    }
};

var createBackground = function() {
    var img = createGraphics(400, 400, JAVA2D);
    img.background(0, 0, 0, 0);
    
    // Shadowed edge
    img.noFill();
    img.strokeWeight(120);
    img.stroke(0, 0, 0, 3);
    for (var i=0; i<100; i++) {
        img.ellipse(200, 200, 450+i*2, 450+i*2);   
    }
    return img;
};

//nextLevel();
//nextLevel();
//var backgroundShadow = createBackground();

var draw = function() {
    if (keyIsPressed) { keyHandling(); }
    background(seaCol);
    
    if (state === 'intro') {
        //image(backgroundShadow, 0, 0);
        drawBackground();
        strokeWeight(1);
        nextLevelScreen();
        return;
    }
    
    for (var i=0; i<bodies.length; i++) {
        bodies[i].draw();
    }
    //image(backgroundShadow, 0, 0);
    drawBackground();
    
    if (state === 'running') { update(); }
    
    noStroke();
    fill(60, 60, 80, 200);
    textFont(menuFont, 50);
    textAlign(CENTER, BASELINE);
    
    switch (state) {
    case 'running':
        timeCount++;
        //if (!focused) { state = 'paused'; }
        break;
    case 'paused':
        noStroke();
        rect(0, 0, 400, 400);
        fill(250, 250, 250);
        controlHelpScreen();
        break;
    case 'help':
        noStroke();
        rect(0, 0, 400, 400);
        fill(250, 250, 250);
        controlHelpScreen();
        break;
    case 'lose':
        noStroke();
        rect(0, 0, 400, 400);
        fill(240, 240, 240);
        text("You died!", 200, 167);
        break;
    case 'win':
        state = 'intro';
        nextLevel();
        break; 
    }
    drawInterface();
};