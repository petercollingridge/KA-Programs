https://www.khanacademy.org/cs/exploring-triangles/1264460092

/*******************************************************
 * Drag letters at the triangle vertices.
 * Click Options to select what properties are shown.
 * 
 * For more information, see the videos in this playlist:
 * https://www.khanacademy.org/math/geometry/triangle-properties
 * 
 * For example:
 * Calculating area using Heron's formula:
 * https://www.khanacademy.org/math/geometry/triangles/v/heron-s-formula
 * 
 * Angle bisectors and the incircle:
 * https://www.khanacademy.org/math/geometry/triangle-properties/angle_bisectors/v/incenter-and-incircles-of-a-triangle
 * 
 * Perpendicular bisectors and the circumcenter:
 * https://www.khanacademy.org/math/geometry/triangle-properties/perpendicular_bisectors/v/circumcenter-of-a-triangle
 * 
 * Altitudes and the orthocenter
 * https://www.khanacademy.org/math/geometry/triangle-properties/altitudes/v/proof---triangle-altitudes-are-concurrent--orthocenter
 * 
 * Medians and the centroid:
 * https://www.khanacademy.org/math/geometry/triangle-properties/medians_centroids/v/triangle-medians-and-centroids
 * 
 * The Euler line: 
 * https://www.khanacademy.org/math/geometry/triangle-properties/triangle_property_review/v/euler-line
 * 
 * Overview of all the properties:
 * https://www.khanacademy.org/math/geometry/triangle-properties/triangle_property_review/v/review-of-triangle-properties
 * 
 * Still to add:
 *  - 9-point circle ?
 ********************************************************/

// Colours
var colourAB = color(93, 90, 250);
var colourAC = color(245, 120, 255);
var colourBC = color(18, 196, 65);
var colourIncircle = color(25, 179, 164);
var colourCircumcircle = color(199, 182, 0);
var colourMedians = color(214, 30, 17);

// Initial vertices
var names  = ["A", "B", "C"];
var points = [{ x: 60, y: 350},
              { x: 100, y: 120},
              { x: 350, y: 240}];

// Display options
var checkboxes;
var optionsCol = 4;
var optionsHeight = 74;
var optionsY = 0;
var optionsDY = 0;
var options = [
    "Angles", "Lengths", "Area", "Coordinates",
    "Angle bisectors", "Perp. bisectors", "Altitudes", "Medians",
    "Incenter", "Circumcenter", "Orthocenter", "Centroid",
    "Incircle", "Circumcircle", "Euler's line", "Median triangles"];

// Slider
var sliderSize = 20;
var mouseOverSlider = -1;

// Given two lines in angle, point form, 
// return the coords of the intersection, assuming there is one
var findIntersection = function(angle1, point1, angle2, point2) {
    var grad1 = tan(angle1);
    var grad2 = tan(angle2);
    var intercept1 = point1.y - point1.x * grad1;
    var intercept2 = point2.y - point2.x * grad2;
    var grad = grad1 / grad2;
    var x = (intercept2 - intercept1) / (grad1 - grad2);
    var y = grad1 * x + intercept1;
    return { x: x, y: y };
};

// Find the shortest distance between a point and a line
// given in angle, point form.
var findPointLineDist = function(point1, point2, angle) {
    var grad = tan(angle);
	var d = abs(point1.y - point2.y + grad * (point2.x - point1.x));
	d /= sqrt(grad * grad + 1);
	return d;
};

var Triangle = function(pointA, pointB, pointC) {
    var arcSize = 60;
    var self = this;
    
    this.points = [pointA, pointB, pointC];
    this.colours = [colourAB, colourBC, colourAC];
    
    this.area = 0;
    
    this.lengths = [0, 0, 0];
    this.midLengths = [0, 0, 0];
    this.lineAngles = [0, 0, 0];
    this.angles = [0, 0, 0];
    
    this.midAngles = [0, 0, 0];
    this.angleBisectors = [0, 0, 0];
    this.perpBisectors = [0, 0, 0];
    this.altitudes = [0, 0, 0];
    
    this.incenter = {x: 0, y: 0};
    this.circumcenter = {x: 0, y: 0};
    this.centroid = {x: 0, y: 0};
    this.orthocenter = {x: 0, y: 0};
    this.inradius = 0;
    this.circumradius = 0;
    
    this.findLengths = function() {
    // For each side, find the length in pixels.
    // And the coordinates of the midpoint.
        
        for (var p=0; p<3; p++) {
            var p1 = self.points[p];
            var p2 = self.points[(p + 1) % 3];
            var dx = p1.x - p2.x;
            var dy = p1.y - p2.y;
            self.lengths[p] = sqrt(dx*dx + dy*dy);
            self.midLengths[p] = {x: (p1.x + p2.x) / 2,
                                  y: (p1.y + p2.y) / 2 };
        }
    };
    
    this.findArea = function() {
    // Use Heron's formula to find the area.
        var a = this.lengths[0];
        var b = this.lengths[1];
        var c = this.lengths[2];
        var s = (a + b + c) / 2;
        this.area = sqrt(s * (s-a) * (s-b) * (s-c));
    };
    
    this.findLineAngles = function() {
    // Find the angle of each side (0-360 degrees).
        var p1 = self.points[0];
        var p2 = self.points[1];
        var p3 = self.points[2];
        self.lineAngles = [
            atan2(p1.y - p2.y, p1.x - p2.x) + 180,
            atan2(p2.y - p3.y, p2.x - p3.x) + 180,
            atan2(p3.y - p1.y, p3.x - p1.x) + 180
        ];
    };
    
    this.findAngles = function() {
    // Find the angle between sides (0-180 degrees).
    // Also find absolute angle of angle bisectors.

        for (var p=0; p<3; p++) {
            var a1 = this.lineAngles[p];
            var a2 = (this.lineAngles[(p+2) % 3] + 180) % 360;
            
            var lowerAngle = 0;
            var angle = a1 - a2;
            
            if (angle > 180) {
                angle = 360 - angle;
                lowerAngle = 1;
            }
            if (angle < 0) {
                angle *= -1;
                lowerAngle = 1 - lowerAngle;
            }
            if (angle > 180) {
                angle = 360 - angle;
                lowerAngle = 1 - lowerAngle;
            }
            this.angles[p] = angle;
            lowerAngle = [a2, a1][lowerAngle];
            this.midAngles[p] = lowerAngle + angle / 2;
        }
    };
    
    this.findAngleBisectors = function() {
    // Find the coordinate where each angle bisector
    // intersects the opposite line.
        for (var p=0; p<3; p++) {
            var a1 = this.midAngles[p];
            var p1 = this.points[p];
            var a2 = this.lineAngles[(p+1) % 3];
            var p2 = this.points[(p+1) % 3];
            this.angleBisectors[p] = findIntersection(a1, p1, a2, p2);
        }
    };
    
    this.findPerpBisectors = function() {
    // Find the shortest distance between each perpendicular
    // bisects and either other line
    // Lots of repetitive work that could be removed
        
        for (var p=0; p<3; p++) {
            var a1 = this.lineAngles[p] + 90;
            var p1 = this.midLengths[p];
            var a2 = this.lineAngles[(p+1) % 3];
            var p2 = this.points[(p+1) % 3];
            var a3 = this.lineAngles[(p+2) % 3];
            var p3 = this.points[(p+2) % 3];

            var pb1 = findIntersection(a1, p1, a2, p2);
            var pb2 = findIntersection(a1, p1, a3, p3);
            var d1 = dist(p1.x, p1.y, pb1.x, pb1.y);
            var d2 = dist(p1.x, p1.y, pb2.x, pb2.y);
            
            if (d1 < d2) {
                this.perpBisectors[p] = pb1;
            } else {
                this.perpBisectors[p] = pb2;
            }
        }
    };
        
    this.findAltitudes = function() {
    // Find the line between each angle, perpendicular to
    // the opposite line.
        for (var p=0; p<3; p++) {
            var p1 = this.points[p];
            var p2 = this.points[(p+1) % 3];
            var a1 = this.lineAngles[(p+1) % 3];
            var d = findPointLineDist(p1, p2, a1);
            this.altitudes[p] = { x: p1.x - d * cos(a1 + 90),
                                  y: p1.y - d * sin(a1 + 90)};
        }
    };

    this.findIncenter = function() {
    // By finding the intersection of two angle bisectors.
        var a1 = this.midAngles[0];
        var p1 = this.points[0];
        var a2 = this.midAngles[1];
        var p2 = this.points[1];
        
        var c = findIntersection(a1, p1, a2, p2);
        this.incenter = c;
        this.inradius = findPointLineDist(c, self.points[0],
                                          self.lineAngles[0]);
    };
    
    this.findCircumcenter = function() {
    // By finding the intersection of two perp. bisectors.
        var p1 = this.midLengths[0];
        var a1 = this.lineAngles[0] + 90;
        var p2 = this.midLengths[1];
        var a2 = this.lineAngles[1] + 90;
        
        var c = findIntersection(a1, p1, a2, p2);
        this.circumcenter = c;
        this.circumradius = dist(c.x, c.y,
                            this.points[0].x, this.points[0].y);
    };
    
    this.findOrthocenter = function() {
    // By finding the intersection of two altitudes.
        var a1 = this.lineAngles[1] + 90;
        var p1 = this.altitudes[0];
        var a2 = this.lineAngles[2] + 90;
        var p2 = this.altitudes[1];
        this.orthocenter = findIntersection(a1, p1, a2, p2);
    };
    
    this.findCentroid = function() {
    // Find the center of mass by averging the coordinates
        var x = (this.points[0].x + this.points[1].x + 
                 this.points[2].x)/3;
        var y = (this.points[0].y + this.points[1].y + 
                 this.points[2].y)/3;
        this.centroid = { x: x, y: y };
    };
    
    this.update = function() {
        this.findLengths();
        this.findLineAngles();
        this.findArea();
        this.findAngles();
        this.findAngleBisectors();
        this.findAltitudes();
        this.findIncenter();
        this.findCircumcenter();
        this.findOrthocenter();
        this.findCentroid();
        this.findPerpBisectors();
    };
    
    this.update();
    
    this.drawTriangle = function() {
        strokeWeight(3);
        for (var p=0; p<3; p++) {
                stroke(this.colours[p]);
                var p1 = this.points[p];
                var p2 = this.points[(p + 1) % 3];
                line(p1.x, p1.y, p2.x, p2.y);
        }
    };
    
    this.drawCoordinates = function() {
        textSize(11);
        textAlign(CENTER, CENTER);
        fill(255, 255, 255);
        for (var p=0; p<3; p++) {
            var p1 = self.points[p];
            var coords = "(" + p1.x + ", " + p1.y + ")";
            var x = p1.x - 32 * cos(self.midAngles[p]);
            var y = p1.y - 32 * sin(self.midAngles[p]);
            text(coords, x, y);
        }
    };
    
    this.drawArea = function () {
        textSize(12);
        textAlign(CENTER, CENTER);
        fill(255, 255, 255);
        var areaText = "Area = " + round(self.area);
        text(areaText, self.centroid.x, self.centroid.y);
    };
    
    this.drawLengths = function() {
        textSize(11);
        textAlign(CENTER, BASELINE);
        
        for (var p=0; p<3; p++) {
            var p1 = self.points[p];
            var p2 = self.points[(p + 1) % 3];

            fill(self.colours[p]);
            translate(self.midLengths[p].x, 
                      self.midLengths[p].y);
            rotate(self.lineAngles[p]);
            text("" + round(10*self.lengths[p])/10, 0, -5);
            resetMatrix();
        }
    };
    
    this.drawAngles = function() {
        textAlign(CENTER, CENTER);
        stroke(255, 255, 255);
        strokeWeight(2);
        textSize(11);
        
        for (var p=0; p<3; p++) {
            var p1 = self.points[p];
        
            fill(80, 80, 80, 160);
            arc(p1.x, p1.y, arcSize, arcSize, 
                self.midAngles[p] - self.angles[p] / 2,
                self.midAngles[p] + self.angles[p] / 2);

            fill(255, 255, 255);
            var x = p1.x + 20 * cos(self.midAngles[p]);
            var y = p1.y + 20 * sin(self.midAngles[p]);
            text(round(self.angles[p]) + "°", x, y);
        }
    };
    
    this.drawMedians = function() {
        strokeWeight(1);
        for (var p=0; p<3; p++) {
            stroke(self.colours[p]);
            var p1 = self.midLengths[p];
            var p2 = self.points[(p + 2) % 3];
            line(p1.x, p1.y, p2.x, p2.y);
        }
    };
        
    this.drawAngleBisectors = function() {
        strokeWeight(1);
        for (var p=0; p<3; p++) {
            stroke(self.colours[(p + 1) % 3]);
            var p1 = self.points[p];
            var p2 = self.angleBisectors[p];
            line(p1.x, p1.y, p2.x, p2.y);
        }
    };
    
    this.drawPerpBisectors = function() {
        strokeWeight(1);
        for (var p=0; p<3; p++) {
            stroke(self.colours[p]);
            var p1 = self.midLengths[p];
            var p2 = self.perpBisectors[p];
            line(p1.x, p1.y, p2.x, p2.y);
        }
    };
    
    this.drawAltitudes = function() {
        strokeWeight(1);
        for (var p=0; p<3; p++) {
            stroke(self.colours[(p+1) % 3]);
            var p1 = self.points[p];
            var p2 = self.altitudes[p];
            line(p1.x, p1.y, p2.x, p2.y);
        }
    };
    
    this.drawCenter = function(point, colour) {
        var x = point.x;
        var y = point.y;
        stroke(colour);
        strokeWeight(1);
        line(x-3, y-3, x+3, y+3);
        line(x-3, y+3, x+3, y-3);
        
        if (checkboxes.Coordinates.selected) {
            fill(colour);
            textAlign(CENTER, BASELINE);
            textSize(11);
            var coords = "(" + round(x) + ", " + round(y) + ")";
            text(coords, x, y - 7);
        }
    };

    this.drawIncenter = function() {
        self.drawCenter(self.incenter, colourIncircle);
    };
    
    this.drawCircumcenter = function() {
        self.drawCenter(self.circumcenter, colourCircumcircle);
    };
    
    this.drawOrthocenter = function() {
        self.drawCenter(self.orthocenter, color(0, 245, 0));
    };
        
    this.drawCentroid = function() {
        self.drawCenter(self.centroid, colourMedians);
    };
    
    this.drawIncircle = function() {
        noFill();
        stroke(colourIncircle);
        strokeWeight(2);
        var r = 2 * self.inradius;
        ellipse(self.incenter.x, self.incenter.y, r, r);
    };
    
    this.drawCircumcircle = function() {
        noFill();
        stroke(colourCircumcircle);
        strokeWeight(2);
        var r = 2 * self.circumradius;
        ellipse(self.circumcenter.x, self.circumcenter.y, r, r);
    };
    
    this.drawEulersLine = function() {
        stroke(180, 180, 180);
        strokeWeight(1);
        var p1 = self.circumcenter;
        var p2 = self.orthocenter;
        line(p1.x, p1.y, p2.x, p2.y);
    };
    
    this.drawMedianTriangles = function() {
        stroke(colourMedians);
        strokeWeight(1);
        noFill();
        var p1 = self.midLengths[0];
        var p2 = self.midLengths[1];
        var p3 = self.midLengths[2];
        triangle(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
    };
    
    // Map checkbox names to draw functions
    var drawFunctions = [
        ["Lengths", this.drawLengths],
        ["Coordinates", this.drawCoordinates],
        ["Medians", this.drawMedians],
        ["Angle bisectors", this.drawAngleBisectors],
        ["Perp. bisectors", this.drawPerpBisectors],
        ["Altitudes", this.drawAltitudes],
        ["Euler's line", this.drawEulersLine],
        ["Incenter", this.drawIncenter],
        ["Circumcenter", this.drawCircumcenter],
        ["Orthocenter", this.drawOrthocenter],
        ["Centroid", this.drawCentroid],
        ["Incircle", this.drawIncircle],
        ["Circumcircle", this.drawCircumcircle],
        ["Median triangles", this.drawMedianTriangles],
        ["Angles", this.drawAngles],
        ["Area", this.drawArea]
    ];
    
    this.draw = function() {        
        this.drawTriangle();
        
        for (var i=0; i<drawFunctions.length; i++){
            var name = drawFunctions[i][0];
            if (checkboxes[name].selected) {
                drawFunctions[i][1]();
            }
        }
    };
};

var myTriangle = new Triangle(points[0], points[1], points[2]);

/****************************************************
 * User interface objects 
*****************************************************/

var Checkbox = function(name, x, y, selected) {
    this.name = name;
    this.x = x;
    this.y = y + 5;
    this.width = 80;
    this.selected = selected;
    
    this.draw = function(dy) {
        // Draw box
        if (this.selected || this.isMouseOver()) {
            fill(160, 160, 160);  
        } else {
            fill(30, 30, 30);   
        }
        
        var y = this.y + dy - 2;
        stroke(255, 255, 255);
        strokeWeight(1);
        rect(this.x, y-10, 10, 10);
        
        // Draw tick
        if (this.selected) {
            stroke(24, 24, 30);
            strokeWeight(2);
            line(this.x+2, y-4, this.x+5, y-1);
            line(this.x+5, y-1, this.x+9, y-8);
        }
        
        // Write label
        fill(255, 255, 255);
        textAlign(LEFT, BASELINE);
        textSize(11);
        text(this.name, this.x+15, y);
    };
    
    this.isMouseOver = function() {
        var y = this.y + optionsY - optionsHeight - 2;
        if (mouseY <= y && mouseY >= y-10 &&
            mouseX >= this.x && mouseX <= this.x + this.width) {
            return true;
        } else {
            return false;
        }
    };
    
    this.click = function() {
        if(this.isMouseOver()) {
            this.selected = !this.selected;
        }
    };
};

var makeCheckboxes = function() {
    var checkboxes = {};
    var x = 10;
    var y = 12;
    var maxWidth = 0;
    
    for (var i=0; i<options.length; i++) {
        var checkbox = new Checkbox(options[i], x, y, i<2);
        checkboxes[options[i]] = checkbox;
        var width = textWidth(options[i]);
        if (width > maxWidth) { maxWidth = width; }
        
        y += 16;
        if ((i+1) % optionsCol === 0) {
            for (var j=i - optionsCol; j<i; j++){
                checkboxes[options[j+1]].width = maxWidth + 12;
            }
            y = 12;
            x += maxWidth + 20;
            maxWidth = 0;
        }
    }
    return checkboxes;
};

checkboxes = makeCheckboxes();

var drawCheckboxes = function() {
    optionsY += optionsDY;
    if (optionsDY && (optionsY <= 0 || optionsY >= optionsHeight)) {
        optionsY = constrain(optionsY, 0, optionsHeight);
        optionsDY = 0;
    }
        
    // Draw options background
    fill(50, 50, 60, 220);
    stroke(150, 150, 150);
    strokeWeight(1);
    rect(-2, optionsY - optionsHeight-2, 404, optionsHeight);
    
    // Options tab name
    rect(5, optionsY - 2, 68, 19);
    textSize(13);
    fill(255, 255, 255);
    textAlign(LEFT, BASELINE);
    text("Options", 10, optionsY + 12);
    
    // Options arrow
    stroke(160, 160, 160);
    fill(80, 80, 80);
    translate(64, optionsY + 8);
    rotate(180 * optionsY / optionsHeight);
    triangle(-4, -4, 4, -4, 0, 5);
    resetMatrix();
    
    if (optionsY) {
        for (var option in checkboxes) {
            checkboxes[option].draw(optionsY-optionsHeight);
        }
    }
};

var drawSlider = function(slider, position) {
    var x = position.x;
    var y = position.y;
    if (mouseOverSlider === slider ||
        (mouseX >= x - sliderSize/2 &&
         mouseX <= x + sliderSize/2 &&
         mouseY >= y - sliderSize/2 &&
         mouseY <= y + sliderSize/2 &&
         mouseOverSlider === -1)) {
            fill(120, 120, 120, 220);
            stroke(240, 240, 240);
            strokeWeight(2); 
            mouseOverSlider = slider;
        } else {
            fill(20, 20, 20, 160);
            noStroke();
            if (!mouseIsPressed) {
                mouseOverSlider = -1;   
            }
        }
        
    ellipse(x, y, sliderSize, sliderSize);
    
    fill(255, 255, 255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(names[slider], x, y);
};

var draw = function() {
    background(0, 0, 0);
    myTriangle.draw();

    for (var i=0; i<3; i++) {
        drawSlider(i, myTriangle.points[i]);
    }
    
    drawCheckboxes();
};

var mouseDragged = function() {
    if (mouseOverSlider !== -1) {
        myTriangle.points[mouseOverSlider].x = mouseX;
        myTriangle.points[mouseOverSlider].y = mouseY;
        myTriangle.update();
    }
};

var mouseReleased = function() {
    mouseOverSlider = -1;
};

var mouseOut = function() {
    mouseOverSlider = -1;
};

var mouseClicked = function() {
    for (var option in checkboxes) {
        checkboxes[option].click();
    }
    if (mouseY < optionsY+20 && mouseY > optionsY && mouseX < 75) {
        optionsDY = optionsY ? -5 : 5;
    }
};