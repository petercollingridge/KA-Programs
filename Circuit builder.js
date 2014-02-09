https://www.khanacademy.org/cs/circuit-builder/2401149160

/*****************************************************
 * Version 1
 * Basically working with not too many bugs.
 * 
 * CAUTION: editing the code (particular comments for some reason)
 * may cause the program to crash
 * 
 * To do:
 *  - Components
 *      Relay
 *      Multiple batteries
 * 
 *  - Other
 *      Add clear button
 *      Save switch states
 *      Add IDs to components and connections
 *      Allow component to be added onto wire
 *      Improve button show/hide function
 *      Wrap GUI into a object
 *      Undo/Redo
 *      Condense save code further
 *      Make Wire inherit from Component (?)
 *      Find voltage and current
 * 
 * BUGS
 *  - Rotating object onto another causes problems
 *  - Selecting a wire, then its component should ensure wire selected
******************************************************/

var loadCircuit = 'a;4w9444w=4A4u>;w4446m47w484;w4;7;w9:=:w?;A;wA;A4s8;w9<=<';

// Grid scale - Don't make too small!
var _scale = 14;
var grid;

var mode1 = "add";
var mode2 = "wire";

// Display variables
var drawCrosses = true;
var BACKGROUND = color(255, 255, 255);
var HIGHLIGHT = color(0, 0, 255, 120);
var sansFont = createFont("sans", 40);

/*******************************************************
 *      General functions
********************************************************/
var removeObjectFromArray = function(obj, arr) {
    obj.toDelete = true;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].toDelete) {
            arr.splice(i, 1);
            break;
        }
    }
    obj.toDelete = false;
};

/*******************************************************
 *      Saving circuit functions
********************************************************/

// Convert from ASCII to number
var getNumber = function(i) {
    return loadCircuit.charCodeAt(i) - 48;
};

var encodeNumbers = function(arr) {
    var code = "0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var s = '';
    for (var i = 0; i < arr.length; i++) {
        s += code.charAt(arr[i]);
    }
    return s;
};

// Map component and its direction to letter
var componentToLetter = {
    'Battery': 'abcd',
    'Light': 'lm',
    'Switch': 'qr',
    'STDP switch': 'stuv',
};

// Map letter to component and its direction
var letterToComponent = {
    'a': ['battery', 0],
    'b': ['battery', 1],
    'c': ['battery', 2],
    'd': ['battery', 3],
    'l': ['light', 0],
    'm': ['light', 1],
    'q': ['switch', 0],
    'r': ['switch', 1],
    's': ['switch2', 0],
    't': ['switch2', 1],
    'u': ['switch2', 2],
    'v': ['switch2', 3],
};

// Encode components as a string
var saveCircuit = function() {
    var s = "Replace the first line of code with:\n";
    s += "var loadCircuit = '";

    for (var i = 0; i < grid.components.length; i++) {
        var comp = grid.components[i];
        
        if (comp.name === 'Wire') {
            var x1 = comp.connections[0].x;
            var y1 = comp.connections[0].y;
            var x2 = comp.connections[1].x;
            var y2 = comp.connections[1].y;
            s += 'w' + encodeNumbers([x1, y1, x2, y2]);
        } else {
            var letter = componentToLetter[comp.name];
            if (letter) {
                var n = comp.direction % letter.length;
                s += letter.charAt(n);
            }
            s += encodeNumbers([comp.x, comp.y]);
        }
    }
    
    println(s + "';");
};

/*******************************************************
 *      Define objects
********************************************************/

// A point between one or more components
var Connection = function(grid, x, y) {
    this.name = "connection";
    this.x = x;
    this.y = y;
    this.components = [];
    this.isHighlighted = false;
    this.selectedComponent = 0;
    
    grid.allObjects[x + "," + y] = this;
    
    this.draw = function() {
        var cx = grid.x + this.x * grid.gap;
        var cy = grid.y + this.y * grid.gap;
        
        if (this.isHighlighted) {
            stroke(0, 0, 255, 120);
            strokeWeight(5);
            ellipse(cx, cy, 6, 6);
        }
        
        fill(0);
        noStroke();
        ellipse(cx, cy, 6, 6);
        
        fill(255);
        ellipse(cx, cy, 1, 1);
    };
    
    this.highlight = function() {
        this.isHighlighted = true;
        grid.highlighted.push(this);
        
        // Highlight a selected component
        var s = this.selectedComponent % this.components.length;
        this.selectedComponent = s;
        this.components[s].highlight();
    };
    
    this.toggleHighlight = function() {
        // Deselect everything first
        for (var i = 0; i < this.components.length; i++) {
            this.components[i].isHighlighted = false;
            this.components[i].isSelected = false;
        }
        grid.highlighted = [];
        
        this.selectedComponent++;
        this.highlight();
        grid.select(this.components[this.selectedComponent]);
    };
    
    this.remove = function() {
        // Remove connections from connected components
        for (var j = 0; j < this.components.length; j++) {
            removeObjectFromArray(this, this.components[j].connections);
        }
        grid.removeFromGrid(this);
    };
    
    this.checkPower = function(isSource) {
        this.powerChecked = true;
        var power = this.power;
        
        // Find neighbours not yet checked
        var neighbours = [];
        for (var i = 0; i < this.neighbours.length; i++) {
            var n = this.neighbours[i];
            if (!n.powerChecked && !(isSource && n.power)) {
                neighbours.push(n);
            }
        }
        
        for (var i = 0; i < neighbours.length; i++) {
            if (neighbours[i].power) {
                power = true;
                break;
            }
            
            if (neighbours[i].checkPower()) {
                power = true;
                if (i < neighbours.length - 1 && !this.source) {
                    this.source = true;
                    grid.toCheck.unshift(this);
                }
                break;
            }
        }
        
        this.power = power;
        return power;
    };
};

/*********************************************************
 *      Generic Component object and specific components
**********************************************************/

var Component = function(grid, x, y, direction) {
    this.x = x;
    this.y = y;
    this.direction = direction;
    this.connections = [];
    this.positions = [[x, y]];
    this.isHighlighted = false;
    this.isObstruction = true;
    this.power = false;
    this.fixed = false;
    
    this.getPositions = function() {
        return [[this.x, this.y]];
    };
    
    this.getConnections = function() {
        var d = this.connectionDist;
        if (this.direction % 2) {
            return [[this.x, this.y - d], [this.x, this.y + d]];
        } else {
            return [[this.x - d, this.y], [this.x + d, this.y]];
        }
    };
    
    // Given a connection return the connection connected
    // to it through this component
    // Assume there are only two connections for now
    this.getConnected = function(cxn) {
        if (this.connections[0].x === cxn.x &&
            this.connections[0].y === cxn.y) {
                return this.connections[1];
        } else {
            return this.connections[0];
        }
    };
    
    // Are positions blocked by anything or connections blocked
    // by something other than connection or why
    this.isBlocked = function() {
        this.positions = this.getPositions();
        if (!grid.isClear(this.positions)) {
            return true;
        }
        if (!grid.isClear(this.getConnections(), true)) {
            return true;
        }
        return false;
    };
    
    this.addConnections = function() {
        var cxns = this.getConnections();
        for (var i = 0; i < cxns.length; i++) {
            grid.addConnection(this, cxns[i][0], cxns[i][1]);   
        }
    };
    
    this.fix = function() {
        if (this.isBlocked()) { return; }
        this.addConnections();
        
        grid.components.push(this);
        grid.addObject(this, this.positions);
        this.fixed = true;
        if (mode1 === 'add') {
            this.createNew();   
        } else {
            grid.heldComponent = false;
        }
    };
    
    // Gets overwritten
    this.createNew = function() { };
    
    this.rotate = function(d) {
        this.direction = (this.direction + d + 4) % 4;
        
        // Fix mapping
        grid.removeObjPointsFromGrid(this);
        this.positions = this.getPositions();
        grid.addObject(this, this.positions);
        
        // Edit connections
        if (this.connections.length > 0) {
            
            for (var c = 0; c < this.connections.length; c++) {
                var cxn = this.connections[c];
                if (cxn.components.length === 1) {
                    // Remove connection is this is only component
                    grid.removeFromGrid(cxn);
                } else {
                    // Remove self from connection
                    removeObjectFromArray(this, cxn.components);
                }
            }
            this.connections = [];
        
            this.addConnections();
            grid.toUpdate = true;
        }
    };
    
    this.highlight = function() {
        this.isHighlighted = true;
        grid.highlighted.push(this);
    };
    
    this.draw = function() {
        translate(grid.x + this.x * grid.gap,
                  grid.y + this.y * grid.gap);
        rotate(this.direction * 90);
        
        if (this.fixed) {
            this.drawImage();
        } else {
            var coord = grid.getMousePosition();
            this.x = coord[0];
            this.y = coord[1];
            if (this.isBlocked()) {
                this.drawImage(true);
            } else {
                this.drawImage();
            }
        }
        resetMatrix();
    };
    
    // To be overwritten
    this.click = function() {};
};

var Battery = function(grid, x, y, direction) {
    Component.call(this, grid, x, y, direction);
    this.name = "Battery";
    this.connectionDist = 2;
    
    this.getPositions = function() {
        var positions;
        if (this.direction % 2) {
            positions = [[this.x, this.y - 1], [this.x, this.y + 1]];
        } else {
            positions = [[this.x - 1, this.y], [this.x + 1, this.y]];
        }
        return [[this.x, this.y]].concat(positions);
    };
    
    // Treat the connections of a battery as unconnected
    this.getConnected = function(cxn) {
        return false;
    };
    
    this.createNew = function() {
        grid.heldComponent = new Battery(grid, this.x, this.y, this.direction);
    };
};
Battery.prototype = Object.create(Component.prototype);

var Light = function(grid, x, y, direction) {
    Component.call(this, grid, x, y, direction);
    this.name = "Light";
    this.connectionDist = 1;
    
    this.createNew = function() {
        grid.heldComponent = new Light(grid, this.x, this.y, this.direction);
    };
};
Light.prototype = Object.create(Component.prototype);

var Switch = function(grid, x, y, direction) {
    Component.call(this, grid, x, y, direction);
    this.name = "Switch";
    this.connectionDist = 1;
    this.open = true;
    
    this.click = function() {
        this.open = !this.open;
        grid.toUpdate = true;
    };
    
    // Treat the connections of a battery as unconnected
    this.getConnected = function(cxn) {
        if (this.open) {
            return false;   
        } else {
            if (this.connections[0].x === cxn.x &&
                this.connections[0].y === cxn.y) {
                    return this.connections[1];
            } else {
                return this.connections[0];
            }
        }
    };
    
    this.createNew = function() {
        grid.heldComponent = new Switch(grid, this.x, this.y, this.direction);
    };
};
Switch.prototype = Object.create(Component.prototype);

var Switch2 = function(grid, x, y, direction) {
    Component.call(this, grid, x, y, direction);
    this.name = "STDP switch";
    this.open = 0;
    
    this.click = function() {
        this.open = 1 - this.open;
        grid.toUpdate = true;
    };
    
    // Probably a more efficient way to do this
    this.getConnections = function() {
        switch(this.direction % 4) {
            case 0:
                return [[this.x - 1, this.y],
                        [this.x + 1, this.y - 1],
                        [this.x + 1, this.y + 1]];
            case 1:
                return [[this.x, this.y - 1],
                        [this.x + 1, this.y + 1],
                        [this.x - 1, this.y + 1]];
            case 2:
                return [[this.x + 1, this.y],
                        [this.x - 1, this.y + 1],
                        [this.x - 1, this.y - 1]];
            case 3:
                return [[this.x, this.y + 1],
                        [this.x + 1, this.y - 1],
                        [this.x - 1, this.y - 1]];
        }
    };
    
    // If open then one pair is connected otherwise
    // the other pair is connected
    this.getConnected = function(cxn) {
        // Find number of given connection
        var i;
        for (i = 0; i < this.connections.length; i++) {
            if (this.connections[i].x === cxn.x &&
                this.connections[i].y === cxn.y) {
                    break;
                }
        }
        
        if (this.open) {
            if (i === 0) { return this.connections[2]; }
            if (i === 2) { return this.connections[0]; }
        } else {
            if (i === 0) { return this.connections[1]; }
            if (i === 1) { return this.connections[0]; }
        }
    };
    
    this.createNew = function() {
        grid.heldComponent = new Switch2(grid, this.x, this.y, this.direction);
    };
};
Switch2.prototype = Object.create(Component.prototype);

/*******************************************************
 *      Component draw function
********************************************************/

Battery.prototype.drawImage = function(blocked) {
    var g = grid.gap;
    if (this.isHighlighted) {
        stroke(HIGHLIGHT);
        strokeWeight(5);
        rect(-2 * g + 2, 2 - g/2, g * 4 - 9, g - 4, 3);
    }
    
    stroke(30);
    strokeWeight(1);
    fill(160);
    rect(2 * g - 8, 1 - g/4, 4, (g - 4) / 2, 2);
    if (blocked) {
        fill(240, 20, 20, 220);
        stroke(255, 0, 0, 240);
    } else {
        fill(210, 133, 27);
    }
    rect(-2 * g + 2, 2 - g/2, g * 4 - 9, g - 4, 3);
    
    // Plus sign
    stroke(0);
    line(g - 1, 1, g + 5, 1);
    line(g + 2, -2, g + 2, 4);
};

Light.prototype.drawImage = function(blocked) {
    var r = grid.gap;
        
    if (this.isHighlighted) {
        stroke(HIGHLIGHT);
        strokeWeight(5);
        rect(-grid.gap - 5, -5, 2 * grid.gap + 10, 9, 10);
        ellipse(0, 0, r + 6, r + 6);
    }
    
    strokeWeight(1);
    if (blocked) {
        fill(240, 20, 20, 220);
        stroke(255, 0, 0, 240);
    } else {
        fill(120);
        stroke(50);
    }
    rect(-grid.gap - 5, -5, 2 * grid.gap + 10, 9, 10);
    ellipse(0, 0, r + 6, r + 6);
    
    if (this.power) {
        noStroke();
        fill(255, 255, 0, 80);
        ellipse(0, 0, r + 4, r + 4);
        ellipse(0, 0, r + 10, r + 10);
        stroke(50);
        fill(255, 255, 0);
        ellipse(0, 0, r, r);  
    } else if (!blocked){
        fill(250);
        ellipse(0, 0, r, r);   
    }
    
    stroke(0);
    var r2 = r * sin(45) / 2;
    line(-r2, -r2, r2, r2);
    line(-r2, r2, r2, -r2);
};

Switch.prototype.drawImage = function(blocked) {
    var g = grid.gap;
    var angle = 16;
        
    if (this.isHighlighted) {
        stroke(HIGHLIGHT);
        strokeWeight(5);
        noFill();
        rect(-g - 5, -5, 2 * g + 10, 9, 10);
    }
    
    var s1, s2;
    if (blocked) {
        s1 = s2 = color(255, 0, 0, 240);
    } else {
        s1 = color(120, 120, 120);
        s2 = color(50, 50, 50);
    }
    
    stroke(s1);
    strokeWeight(2);
    line(-grid.gap, 0, grid.gap, 0);
    
    strokeWeight(5);
    stroke(s2);
    if (this.open) {
        line(-g, 0, 2 * g * cos(angle) - g, -2 * g * sin(angle));
    } else {
        line(-g, 0, g, 0);
    }
    
};

Switch2.prototype.drawImage = function(blocked) {
    var g = grid.gap;
    var angle = 30;
        
    if (this.isHighlighted) {
        stroke(HIGHLIGHT);
        strokeWeight(5);
        noFill();
        rect(-grid.gap - 5, -5, 2 * g + 10, 9, 10);
    }
    
    if (blocked) {
       stroke(255, 0, 0, 240);
    } else {
        stroke(50, 50, 50);
    }
    
    strokeWeight(5);
    if (this.open) {
        line(-g, 0, g, g);
    } else {
        line(-g, 0, g, -g);
    }
    
};

/*******************************************************
 *      Wire (does not inherit from Component)
********************************************************/

var Wire = function(grid, x1, y1, x2, y2) {
    this.name = "Wire";
    this.connections = [];
    this.isObstruction = false;
    this.isHighlighted = false;
    this.positions = [];
    
    // Find positions between the first connection and x, y
    this.getPositions = function(x1, y1, x2, y2) {
        var positions = [];
            
        var dx = x2 - x1;
        var dy = y2 - y1;
        if (dx !== 0) { dx /= abs(dx); }
        if (dy !== 0) { dy /= abs(dy); }
        
        x1 += dx;
        y1 += dy;
        while (x1 !== x2 || y1 !== y2) {
            positions.push([x1, y1]);
            x1 += dx;
            y1 += dy;
        }
        
        return positions;
    };
    
    // Given a connection return the connection connected
    // to it through this component
    // Assume there are only two connections for now
    this.getConnected = function(cxn) {
        if (this.connections[0].x === cxn.x &&
            this.connections[0].y === cxn.y) {
                return this.connections[1];
        } else {
            return this.connections[0];
        }
    };
    
    this.fix = function(x, y) {
        if (x === undefined) {
            if (this.connections.length === 0) {
                var coord = grid.getMousePosition();
                x = coord[0];
                y = coord[1];
            } else {
                var coord = this.snapCoordinate();
                x = coord[0];
                y = coord[1];
            }
        }
        
        if (this.connections.length === 0) {
            grid.addConnection(this, x, y);
            return;
        }
        
        var x0 = this.connections[0].x;
        var y0 = this.connections[0].y;
        
        // If wire has no length then don't fix
        if (x === x0 && y === y0) { return; }
        
        // If object ends on object then don't fix
        // If object ends on connection check wire between
        // the two connections doesn't already exist
        var isObject = grid.allObjects[x + "," + y];
        if (isObject) {
            if (isObject.isObstruction) {
                return;
            } else if (isObject.name === 'connection') {
                for (var i = 0; i < isObject.components.length; i++) {
                    var c = isObject.components[i];
                    for (var j = 0; j < c.connections.length; j++) {
                        var cxn = c.connections[j];
                        if (cxn.x === x0 && cxn.y === y0) {
                            // Drawing a wire that already exists
                            // Remove wire from connection
                            removeObjectFromArray(this, this.connections[0].components);
                            this.connections = [];
                            return;
                        }
                    }
                }
            }
        }
        
        this.positions = this.getPositions(x0, y0, x, y);
        
        // If wire crosses an obstruction then don't end
        // Track connections which this wire is added over
        var connections = [];
        
        for (var i = 0; i < this.positions.length; i++) {
            var pos = this.positions[i];
            var isObject = grid.allObjects[pos[0] + "," + pos[1]];
            if (isObject) {
                if (isObject.isObstruction) {
                    return;
                } else if (isObject.name === 'connection') {
                    connections.push([isObject.x, isObject.y]);
                }
            }
        }
        
        // Wire goes over connections so we have to add multiple wires
        if (connections.length > 0) {
            connections.push([x, y]);
            x = connections[0][0];
            y = connections[0][1];
            this.positions = this.getPositions(x0, y0, x, y);
            grid.addConnection(this, x, y);
            
            for (var i = 1; i < connections.length; i++) {
                var x1 = connections[i - 1][0];
                var y1 = connections[i - 1][1];
                var x2 = connections[i][0];
                var y2 = connections[i][1];
                grid.addComponent('wire', x1, y1, x2, y2);
            }
        } else {
            grid.addConnection(this, x, y);
        }
        
        grid.addObject(this, this.positions);
        grid.components.push(this);
        
        if (this.connections.length === 2) {
            grid.toUpdate = true;
            
            if (grid.heldComponent && 
                grid.heldComponent.connections.length === 2) {
                if (mode1 === 'add') {
                    this.createNew();
                } else {
                    grid.heldComponent = false;
                }
            }
        }
    };
    
    this.createNew = function() {
        grid.heldComponent = new Wire(grid);
    };
    
    // Update position so it doesn't include [x, y]
    this.removePosition = function(x, y) {
        var index = false;
        for (var i = 0; i < this.positions.length; i++) {
            var position = this.positions[i];
            if (position[0] === x && position[1] === y) {
                    index = i;
                    break;
                }
        }
        
        if (index) {
            this.positions.splice(index, 1);
        }
    };
    
    // This should never be called, but just in case
    this.rotate = function() { };
    
    this.highlight = function() {
        this.isHighlighted = true;
        grid.highlighted.push(this);
    };
    
    this.isBlocked = function() {
        var x1 = this.connections[0].x;
        var y1 = this.connections[0].y;
        var coord = this.snapCoordinate();
        var positions = this.getPositions(x1, y1, coord[0], coord[1]);
        if (!grid.isClear(positions, true)) {
            return true;
        }
        if (!grid.isClear([coord], true)) {
            return true;
        }
        return false;
    };
    
    this.draw = function() {
        var blocked = false;
        if (this.connections.length === 0) {
            return;
        } else if (this.connections.length === 1) {
            blocked = this.isBlocked();
        }
        
        var x1 = grid.x + this.connections[0].x * grid.gap;
        var y1 = grid.y + this.connections[0].y * grid.gap;
        var x2, y2;
        
        if (this.connections.length === 2) {
            // Wire complete
            x2 = grid.x + this.connections[1].x * grid.gap;
            y2 = grid.y + this.connections[1].y * grid.gap;
        } else {
            // In the middle of dragging a wire
            // Snap to horizontal or vertical
            var coord = this.snapCoordinate();
            var angle = abs(atan2(mouseY - y1, mouseX - x1));
            x2 = grid.x + coord[0] * grid.gap;
            y2 = grid.y + coord[1] * grid.gap;
        }
        
        if (this.isHighlighted) {
            stroke(HIGHLIGHT);
            strokeWeight(6);
            line(x1, y1, x2, y2);
        }
        
        strokeWeight(2);
        stroke(0, 0, 0, 100);
        line(x1+1, y1+1, x2+1, y2+1);
        
        if (this.power) {
            stroke(240, 20, 20);   
        } else if (blocked) {
            stroke(255, 0, 0, 150);
        } else {
            stroke(232, 205, 136);
        }
        line(x1, y1, x2, y2);
    };
    
    this.snapCoordinate = function() {
        var x1 = grid.x + this.connections[0].x * grid.gap;
        var y1 = grid.y + this.connections[0].y * grid.gap;
        var x2, y2;
        
        var coord = grid.getMousePosition();
        var angle = abs(atan2(mouseY - y1, mouseX - x1));
        if (angle < 45 || angle > 135) {
            x2 = coord[0];
            y2 = this.connections[0].y;
        } else {
            x2 = this.connections[0].x;
            y2 = coord[1];
        }
        return [x2, y2];
    };
    
    // If (x1, y1) given, then fix once
    // If (x2, y2) given again
    if (x1 && y1) {
        this.fix(x1, y1);
        if (x2 && y2) {
            this.fix(x2, y2);
        }  
    }
};

/*******************************************************
 *      Board containing all the components
********************************************************/
var Grid = function(x, y, w, h, size) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.width = w * size;
    this.height = h * size;
    this.gap = size;
    this.toUpdate = false;
    
    this.fill = color(88, 190, 80);
    this.stroke = color(0, 75, 20);
    
    // List of objects, e.g. batteries and wires
    this.components = [];
    
    // List of points between components
    this.connections = [];
    
    // Mapping of coordinate to component or connection
    this.allObjects = {};
    
    this.highlighted = [];
    this.selected = false;
    this.heldComponent = false;
    
    this.draw = function() {
        fill(this.fill);
        stroke(this.stroke);
        strokeWeight(1);
        rect(this.x, this.y, this.width, this.height);
        
        // Draw crosses
        if (drawCrosses) {
            for (var x = this.gap; x < this.width; x += this.gap) {
            for (var y = this.gap; y < this.height; y += this.gap) {
                line(this.x + x - 1, this.y + y,
                     this.x + x + 1, this.y + y);
                line(this.x + x, this.y + y - 1,
                     this.x + x, this.y + y + 1);
            }
            }
        }

        for (var i = 0; i < this.components.length; i++) {
            this.components[i].draw();
        }
        
        for (var i = 0; i < this.connections.length; i++) {
            this.connections[i].draw();
        }
    };
    
    // Add an object to each of an array of positions
    // Used for quick mapping of coordinate to object
    this.addObject = function(obj, positions) {
        for (var i = 0; i < positions.length; i++) {
            var coord = positions[i].join(",");
            this.allObjects[coord] = obj;
        } 
    };
    
    // Add a new connection if there is nothing at (x, y)
    // Otherwise add object to existing connection
    this.addConnection = function(obj, x, y) {
        var currentObj = this.allObjects[x + "," + y];
        var cxn;
        
        if (currentObj && currentObj.name !== 'Wire') {
            if (currentObj.name === 'connection') {
                cxn = currentObj;
            } else {
                return;
            }
        } else {
            // Create a new connection
            cxn = new Connection(this, x, y);
            this.connections.push(cxn);
            this.addObject(cxn, [[x, y]]);
        }

        // Add connection to object and object to connection
        obj.connections.push(cxn);
        cxn.components.push(obj);
        
        if (currentObj && currentObj.name === 'Wire') {
            this.splitWireWithConnection(currentObj, cxn);
        }
    };
    
    // Delete existing wire, add new component and add 
    // two more wires
    this.splitWireWithConnection = function(wire, cxn) {
        var x = cxn.x;
        var y = cxn.y;
        var x1 = wire.connections[0].x;
        var y1 = wire.connections[0].y;
        var x2 = wire.connections[1].x;
        var y2 = wire.connections[1].y;
        
        wire.removePosition(x, y);
        this.removeComponent(wire, true);
        
        // Add new wires
        this.addComponent('wire', x, y, x1, y1);
        this.addComponent('wire', x, y, x2, y2);
    };
    
    this.addComponent = function(name, x, y, x2, y2) {
        var component;
        switch (name) {
            case 'battery':
                component = new Battery(this, x, y, x2);
                break;
            case 'light':
                component = new Light(this, x, y, x2);
                break;
            case 'switch':
                component = new Switch(this, x, y, x2);
                break;
            case 'switch2':
                component = new Switch2(this, x, y, x2);
                break;
            case 'wire':
                component = new Wire(this, x, y, x2, y2);
                break;
        }
        
        if (component !== false && component.name !== 'Wire') {
            component.fix();
        }
    };
    
    // Convert encoded string into components
    this.load = function(s) {
        var i = 0;
        
        while (i <= loadCircuit.length) {
            var direction;
            var component = loadCircuit.charAt(i);
            var x = getNumber(i + 1);
            var y = getNumber(i + 2);
            
            if (!x || !y) { break; }
    
            if (component === 'w') {
                var x2 = getNumber(i + 3);
                var y2 = getNumber(i + 4);
                if (x2 && y2) {
                    this.addComponent('wire', x, y, x2, y2);
                }
                i += 5;
            } else {
                var comp = letterToComponent[component];
                if (comp) {
                    var type = comp[0];
                    var direction = comp[1];
                    this.addComponent(type, x, y, direction);   
                }
                i += 3;
            }
        }
        this.heldComponent = false;
        this.toUpdate = true;
    };
    
    this.removeFromGrid = function(obj) {
        this.removeObjPointsFromGrid(obj);
        if (obj.name === 'connection') {
            removeObjectFromArray(obj, this.connections);
        } else {
            removeObjectFromArray(obj, this.components);
        }
    };
    
    // Clear allObjects hash at points where obj exists
    this.removeObjPointsFromGrid = function(obj) {
        if (obj.positions) {
            for (var i = 0; i < obj.positions.length; i++) {
                var pos = obj.positions[i];
                this.allObjects[pos[0] + "," + pos[1]] = undefined;
            }   
        } else {
            this.allObjects[obj.x + "," + obj.y] = undefined;
        }
    };
    
    this.removeComponent = function(component, keepConnections) {
        // Remove connections for which this is the only
        // component that uses it
        for (var i = 0; i < component.connections.length; i++) {
            var cxn = component.connections[i];
            if (cxn.components.length === 1 && !keepConnections) {
                i--;
                cxn.remove();
            } else {
                removeObjectFromArray(component, cxn.components);
            }
        }
        
        this.removeFromGrid(component);
        this.toUpdate = true;
    };
    
    // Remove a wire if we are currently drawing one
    this.cancelWire = function() {
        if (this.heldComponent.name === 'Wire' &&
            this.heldComponent.connections.length === 1) {
            this.heldComponent.connections[0].remove();
            this.heldComponent = new Wire(grid);
        }
    };
    
    // Make wires that run into one another a single wire
    this.simplifyWires = function() {
        for (var i = 0; i < this.connections.length; i++) {
            var cxn = this.connections[i];
            var comps = cxn.components;
            
            if (comps.length === 2) {
                var wire1 = comps[0];
                var wire2 = comps[1];
                
                if (wire1.name === 'Wire' && wire2.name === 'Wire') {
                    var x0 = cxn.x;
                    var y0 = cxn.y;
                    
                    var x1 = wire1.connections[0].x;
                    var y1 = wire1.connections[0].y;
                    if (x1 === x0 && y1 === y0) {
                        x1 = wire1.connections[1].x;
                        y1 = wire1.connections[1].y;
                    }
                    
                    var x2 = wire2.connections[0].x;
                    var y2 = wire2.connections[0].y;
                    if (x2 === x0 && y2 === y0) {
                        x2 = wire2.connections[1].x;
                        y2 = wire2.connections[1].y;
                    }
                    
                    if (x1 === x2 || y1 === y2) {
                        i--;
                        this.removeComponent(wire1, true);
                        this.removeComponent(wire2, true);
                        cxn.remove();
                        this.addComponent('wire', x1, y1, x2, y2);
                    }
                }
            }
        }
    };
    
    // Add a list of neighbouring connections to all connections
    // for easy traversal when checking power
    this.mapConnections = function() {
        for (var i = 0; i < this.connections.length; i++) {
            var cxn = this.connections[i];
            cxn.neighbours = [];
            
            for (var j = 0; j < cxn.components.length; j++) {
                var cxn2 = cxn.components[j].getConnected(cxn);
                if (cxn2) {
                    cxn.neighbours.push(cxn2);
                }
            }
        }
    };
    
    this.findBattery = function() {
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i].name === 'Battery') {
                return this.components[i];
            }
        }
        return false;
    };
    
    // See which components are powered
    this.checkPower = function() {
        var battery = this.findBattery();
        if (battery === false) { return; }
        
        // Reset power
        this.resetChecks(true);
        
        battery.power = true;
        battery.connections[1].power = true;
        
        this.toCheck = [battery.connections[0]];
        
        var count = 0;
        while(this.toCheck.length !== 0) {
            // Safety measure to avoid infinity loops
            if (count++ > 10) { break; }
            
            // Get next connection to test
            var cxn = this.toCheck.pop();
            cxn.checkPower(true);
            this.resetChecks();
        }
        
        this.powerComponents();
    };
    
    // Add power to any component with two powered conenctions
    this.powerComponents = function() {
        for (var i = 0; i < this.components.length; i++) {
            var comp = this.components[i];
            var poweredItems = 0;
            for (var j = 0; j < comp.connections.length; j++) {
                if (comp.connections[j].power) {
                    poweredItems++;
                }
            }
            if (poweredItems > 1) {
                comp.power = true;
            }
        }
    };
    
    // Reset variables using for checking power
    this.resetChecks = function(resetPower) {
        if (resetPower) {
            for (var i = 0; i < this.components.length; i++) {
                this.components[i].power = false;
            }
            for (var i = 0; i < this.connections.length; i++) {
                this.connections[i].power = false;
                this.connections[i].source = false;
                this.connections[i].powerChecked = false;
            }   
        } else {
            for (var i = 0; i < this.connections.length; i++) {
                this.connections[i].powerChecked = false;
            }   
        }
    };
    
    this.isClear = function(positions, allowWire) {
        for (var i = 0; i < positions.length; i++) {
            var coord = positions[i];
            var obj = grid.allObjects[coord[0] + "," + coord[1]];
            if (obj) {
                if (!allowWire || obj.isObstruction) {
                    return false;
                }
            }
        }
        return true;
    };
    
    this.deselect = function() {
        this.selected.isSelected = false;
        this.selected.isHighlighted = false;
        this.selected = false;
    };
    
    this.select = function(component) {
        this.selected = component;
        this.selected.isSelected = true;
        mode2 = this.selected.name;
    };
    
    // When mouse pressed select highlighted object
    this.makeSelection = function() {
        this.deselect();

        if (this.highlighted.length === 1) {
            this.select(this.highlighted[0]);
        } else if (this.highlighted.length > 1) {
            var cxn = this.highlighted[0];
            var selected = cxn.components[cxn.selectedComponent];
            if (selected.name === 'Wire') {
                this.liftWire(selected, cxn);
            }
        }
    };
    
    // When mouse released toggle selected component
    // if connection is highlighted
    this.selectConnection = function() {
        if (this.highlighted.length > 1) {
            var cxn = this.highlighted[0];
            cxn.toggleHighlight();
        }
    };
    
    // Lift up wire by given end
    // Actually delete wire and create a new one
    //  fixed at the  opposite end
    this.liftWire = function(wire, cxn) {
        this.deselect();
        this.unHighlightAll();
        
        var x, y;
        for (var i = 0; i < wire.connections.length; i++) {
            var c = wire.connections[i];
            if (c.x !== cxn.x || c.y !== cxn.y) {
                x = c.x;
                y = c.y;
                break;
            }
        }
        
        if (cxn.components.length === 1) {
            cxn.remove();
        }

        this.removeComponent(wire);
        this.heldComponent = new Wire(this, x, y);
    };
    
    this.isMouseOver = function() {
        return mouseX >= this.x && mouseX <= this.x + this.width &&
               mouseY >= this.y && mouseY <= this.y + this.height;
    };
    
    this.getMousePosition = function() {
        var x = round((mouseX - this.x) / this.gap);
        var y = round((mouseY - this.y) / this.gap);
        x = constrain(x, 1, this.w - 1);
        y = constrain(y, 1, this.h - 1);
        return [x, y];
    };
    
    // Un-highlight all components
    this.unHighlightAll = function() {
        for (var i = 0; i < this.highlighted.length; i++) {
            if (!this.highlighted[i].isSelected) {
                if (this.highlighted[i].isHighlighted) {
                    this.highlighted[i].isHighlighted = false;
                }
            }
        }
        this.highlighted = [];
    };
};

/*******************************************************
 *      GUI objects
********************************************************/
var buttons = [];

var Button = function(x, y, w, h, name, desc, style) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.name = name;
    this.description = desc;
    
    this.showing = true;
    this.selected = false;
    
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
    
    this.drawStyle1 = function() {
        if (!this.showing) { return; }
        
        var rectFill, textFill;
        if (this.mouseover || this.selected) {
            rectFill = color(40, 120, 250);
            textFill = color(10, 10, 10);
        } else {
            rectFill = color(180, 180, 180);
            textFill = color(40, 40, 40);
        }
        
        noStroke();
        fill(rectFill);
        rect(this.x, this.y, this.w, this.h, 5);
        
        fill(textFill);
        textFont(sansFont, 12);
        textAlign(CENTER, CENTER);
        text(this.name, this.x + this.w/2, this.y + this.h/2);
    };
    
    this.drawStyle2 = function() {
        if (!this.showing) { return; }
        
        if (this.mouseover || this.selected) {
            fill(10);
            stroke(10);
            strokeWeight(2);
            line(this.x, this.y + this.h,
                 this.x + this.w, this.y + this.h);
        } else {
            fill(120);
        }
        
        textFont(sansFont, 12);
        textAlign(CENTER, CENTER);
        text(this.name, this.x + this.w/2, this.y + this.h/2);
    };
    
    if (style) {
        this.draw = this.drawStyle2;
    } else {
        this.draw = this.drawStyle1;
    }
    
};

var deselectButtons = function(arr) {
    for (var i = 0; i < arr.length; i++) {
        arr[i].selected = false;
    }  
};

/*******************************************************
 *      Create GUI
********************************************************/
var createButtonSet = function(x, y, h, names, txt) {
    textFont(sansFont, 12);
    var buttons = [];

    for (var i = 0; i < names.length; i++) {
        var desc = txt.replace("#", names[i]);
        var w = textWidth(names[i]) + 6;
        var b = new Button(x, y, w, h, names[i], desc);
        buttons.push(b);
        x += w + 3;
    }
    return buttons;
};

var createButtons = function() {
    var y = 8;
    var h = 13;

    // Save and change mode buttons
    var addButton = new Button(52, y, 23, h, "Add",
                                "Add component mode", true);
    var editButton = new Button(84, y, 23, h, "Edit",
                                "Edit component mode", true);
    y -= 3;
    h += 4;
    var saveButton = new Button(355, y, 36, h, "Save",
                                "Save this circuit");
    
    // Buttons in add mode
    var x = 125;
    var addButtons = createButtonSet(x, y, h,
        ["Wire", "Light", "Switch", "Switch2"], "Add a #");
        
    // Buttons in edit mode
    var editButtons = createButtonSet(x, y, h,
        ["Delete", "Rotate", "Press"], "# component");
    
    // Groups of buttons
    var mainButtons = [saveButton, addButton, editButton];
    var addModeButtons = mainButtons.concat(addButtons);
    var editModeButtons = mainButtons.concat(editButtons);
    
    // Click functions
    saveButton.clickF = saveCircuit;

    // Add mode buttons
    addButtons[0].clickF = function() {
        deselectButtons(addButtons);
        addButtons[0].selected = true;
        mode2 = 'wire';
        if (grid) {
            grid.heldComponent = new Wire(grid);
        }
    };
    addButtons[1].clickF = function() {
        deselectButtons(addButtons);
        addButtons[1].selected = true;
        grid.heldComponent = new Light(grid, 0, 0, 0);
        mode2 = 'light';
    };
    addButtons[2].clickF = function() {
        deselectButtons(addButtons);
        addButtons[2].selected = true;
        grid.heldComponent = new Switch(grid, 0, 0, 0);
        mode2 = 'switch';
    };
    addButtons[3].clickF = function() {
        deselectButtons(addButtons);
        addButtons[3].selected = true;
        grid.heldComponent = new Switch2(grid, 0, 0, 0);
        mode2 = 'switch2';
    };
    
    // Delete buttons
    editButtons[0].clickF = function() {
        if (grid && grid.selected) {
            grid.removeComponent(grid.selected);
        }
    };
    // Rotate button
    editButtons[1].clickF = function() {
        if (grid && grid.selected) {
            grid.selected.rotate(1);
        }
    };
    // Press switch button
    editButtons[2].clickF = function() {
        if (grid && grid.selected) {
            grid.selected.click();
        }
    };
    
    // Switch mode buttons
    addButton.clickF = function() {
        addButton.selected = true;
        editButton.selected = false;
        buttons = addModeButtons;
        mode1 = 'add';
        
        // Deselect things
        if (grid && grid.selected) {
            grid.selected.isSelected = false;
            grid.selected.isHighlighted = false;
            grid.selected = false;
        }
        
        addButtons[0].clickF();
    };
    editButton.clickF = function() {
        addButton.selected = false;
        editButton.selected = true;
        buttons = editModeButtons;
        mode1 = 'edit';
        mode2 = 'none';
        editButtons[0].showing = false;
        editButtons[1].showing = false;
        editButtons[2].showing = false;
        grid.heldComponent = false;
    };
    
    addButton.clickF();
};
createButtons();

/*******************************************************
 *      Create components
********************************************************/
var gridX = 8;
var gridY = 26;
var gridWidth = floor((width - 2 * gridX) / _scale);
var gridHeight = floor((height - gridY - 20) / _scale);
gridX = (width - gridWidth * _scale) / 2;
grid = new Grid(gridX, gridY, gridWidth, gridHeight, _scale);

if (loadCircuit) {
    grid.load();
} else {
    grid.addComponent('battery', 8, 4, 0);
}
buttons[3].clickF();

/*******************************************************
 *      Draw functions
********************************************************/
// Handy for debugging
var writeConnections = function(x, y) {
    textAlign(LEFT, BASELINE);
    for (var i = 0; i < grid.connections.length; i++) {
        var c = grid.connections[i];
        var s = c.x + " " + c.y + ": ";
        if (c.components) {
            for (var j = 0; j < c.components.length; j++) {
                s += c.components[j].name + " ";
            }   
        } else {
            s += " no components: " + c.name;
        }
        text(s, x+100, y + i*20);
    }
    
    for (var i = 0; i < grid.components.length; i++) {
        text(grid.components[i].name, x, y+i*20);
    }
};

var drawInfo = function() {
    fill(0);
    textAlign(LEFT, BASELINE);
    var txt;
    
    // Is mouse over a button?
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].mouseover && buttons[i].showing) {
            txt = buttons[i].description;
        }
    }
    
    if (grid.isMouseOver()) {
        var coord = grid.getMousePosition();
        txt = "(" + coord[0] + ", " + coord[1] + ") ";
        
        if (mode1 === 'edit') {
            if (grid.selected) {
                txt += grid.selected.name + " selected.";
                if (grid.selected.name !== 'Wire') {
                    txt += " Click and drag to move.";   
                }
            } else if (grid.highlighted.length === 1) {
                var obj = grid.highlighted[0];
                txt += obj.name + ". Click to select.";
            } else if (grid.highlighted.length > 1) {
                txt += "Connection point. Click to toggle selected components.";
            } else {
                txt += "Click on a component to select it";
            }
        } else {
            if (mode2 !== 'wire' && mode2 !== 'cancel') {
                txt += "Click to add the " + mode2 + ". Use the arrow keys to rotate it.";
            } else {
                if (grid.heldComponent && grid.heldComponent.connections.length === 1) {
                    txt += "Click to add a wire or press q to cancel";
                } else {
                    txt += "Click and drag to add a wire";
                }
            }
        }
    }
    
    if (txt) {
        text(txt, 5, 395);   
    }
    textAlign(RIGHT, BASELINE);
    //writeConnections(100, 250);
};

var drawComponentInHand = function() {
    if (grid.heldComponent && grid.isMouseOver()) {
        grid.heldComponent.draw();
    }
};

var draw = function() {
    background(BACKGROUND);
    
    // GUI
    
    // Hide edit buttons
    // TODO: improve how this is done
    if (mode1 === 'edit') {
        buttons[3].showing = false;
        buttons[4].showing = false;
        buttons[5].showing = false;
        
        if (grid.selected) {
            if (grid.selected.name !== 'Battery') {
                buttons[3].showing = true;
            }
            if (grid.selected.name !== 'Wire') {
                buttons[4].showing = true;
            }
            if (grid.selected.name === 'Switch' ||
                grid.selected.name === 'STDP switch') {
                buttons[5].showing = true;
            }
        }
    }

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].draw();
    }
    fill(0, 0, 0);
    textAlign(LEFT, TOP);
    text("Mode:", 10, 7);
    
    if (grid.toUpdate && !(grid.heldComponent && grid.heldComponent.name === 'Wire' && grid.heldComponent.connections.length === 1)) {
        grid.toUpdate = false;
        grid.simplifyWires();
        grid.mapConnections();
        grid.checkPower();
    }
    
    grid.draw();
    drawInfo();
    drawComponentInHand();
};

/*******************************************************
 *      Event handling
********************************************************/
var mousePressed = function() {
    if (grid.isMouseOver()) {
        if (mode1 === 'edit') {
            grid.makeSelection();
        } else if (mode2 === 'wire') {
            // Start dragging wire
            if (grid.heldComponent.connections.length === 0) {
                grid.heldComponent.fix(); 
            }
        }
    } else {
        grid.cancelWire();
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].click();
        }   
    }
};

var mouseReleased = function() {
    if (grid.isMouseOver()) {
        if (mode2 === 'cancel') {
            // Ugly way to ensure that we don't
            // add a wire after cancelling one
            mode2 = 'wire';
            return;
        }
        
        if (grid.heldComponent) {
            grid.heldComponent.fix();
            grid.deselect();
        }
        
        if (mode1 === 'edit') {
            grid.selectConnection();
        }
    }
};

var mouseDragged = function() {
    // Drag component, which means delete it and make a new one
    if (grid.isMouseOver() && grid.selected && !grid.heldComponent) {
        if (grid.selected.name === 'Wire') {
            grid.deselect();
            grid.unHighlightAll();
        } else {
            grid.selected.createNew();
            grid.removeComponent(grid.selected);
        }
    }
};

var mouseMoved = function() {
    if (grid.isMouseOver()) {
        if (mode1 === 'edit') {
            grid.unHighlightAll();
            var coord = grid.getMousePosition().join(",");
            if (grid.allObjects[coord]) {
                grid.allObjects[coord].highlight();
            }
        }
    }
    
    for (var b in buttons) {
        buttons[b].highlight();
    }   
};

var keyPressed = function() {
    //println(keyCode);
    if (keyCode === 68) {
        if (grid.selected) {
            grid.removeComponent(grid.selected);
        }
    } else if (keyCode === 81) {
        grid.cancelWire();
        mode2 = 'cancel';
    } else if (keyCode === 83) {
        grid.checkPower();
    } else if (keyCode === 37 || keyCode === 39) {
        if (grid && grid.heldComponent) {
            grid.heldComponent.direction = (grid.heldComponent.direction + 42 - keyCode) % 4;
            grid.heldComponent.positions = grid.heldComponent.getPositions();
        }
    }
};