https://www.khanacademy.org/cs/wandering-planets/2156500698

/*********************************************************
 * Simulation of telescope on Earth looking at the night
 * sky (ignoring the rotation of the Earth).
 * 
 * Angles relative to vernal equinox (First Point of Aries).
 * 
 *   - Controls -
 * Spacebar: run/pause
 * Arrow keys to move telescope
 * 
 * The planet sizes are correct relative to one another,
 * but not relative to the orbit size.
 * The sun's size is not to scale.
*********************************************************/
var telescopeAngle = 160;

var speed = 1;          // Change in days per update
var resolution = 20;    // How accurate orbit speed is

// Position and size or sun
var sunX = 225;
var sunY = 165;
var sunR = 28;

var marsData = {
    name: "Mars",
    size: 10,
    colour: color(212, 95, 17),
    perihelion: 207,        // million km
    aperihelion: 249,       // million km
    peri_longitude: 336,    // degrees
    asc_longitude: 49.6,    // degrees
    inclination: 1.85,      // degrees
    year: 686.98,           // earth days
    mass: 0.64              // 10^24 kg
};

var earthData = {
    name: "Earth",
    size: 18,
    colour: color(61, 100, 255),
    perihelion: 147,        // million km
    aperihelion: 152,       // million km
    peri_longitude: 102,    // degrees
    asc_longitude: 348.7,   // degrees
    inclination: 0,         // degrees (by defintion)
    year: 365.25,           // earth days
    mass: 5.97              // 10^24 kg
};

var venusData = {
    name: "Venus",
    size: 16,
    colour: color(149, 175, 196),
    perihelion: 107,        // million km
    aperihelion: 109,       // million km
    peri_longitude: 131.5,  // degrees
    asc_longitude: 76.7,    // degrees
    inclination: 3.39,      // degrees
    year: 224.7,            // earth days
    mass: 4.87              // 10^24 kg
};

var mercuryData = {
    name: "Mercury",
    size: 8,
    colour: color(82, 171, 88),
    perihelion: 46,         // million km
    aperihelion: 69.8,      // million km
    peri_longitude: 77,     // degrees
    asc_longitude: 48.3,    // degrees
    inclination: 7.00,      // degrees
    year: 87.97 ,           // earth days
    mass: 0.33              // 10^24 kg
};

// At 6pm 28th August 2003, Earth and Mars in opposition
var _year = 2003;
var _day = 239.75;

// Angles from ellipse centres, not sun (angle from sun = 335.0)
var earthAngle = 335.6;
var marsAngle = 335.1;
var venusAngle = 170;       //approximately
var mercuryAngle = 320;     //approximately

var scalingFactor = 0.65;
var running = true;
var moveTelescope = false;

var Sun = function() {
    this.x = sunX;
    this.y = sunY;
    this.r = sunR;
    this.name = "Sun";
    this.mass = 330000;
    this.inclination = 0;
    
    this.update = function(t) {
    };
    
    this.draw = function() {
        noStroke();
        fill(255, 255, 0);
        ellipse(this.x, this.y, sunR, sunR);
        fill(255, 89, 0, 100);
        ellipse(this.x, this.y, sunR + 3, sunR + 3);
    };
    
    this.display = function(x, y, r) {
        var x = x || this.x;
        var y = y || this.y;
        var r = r || sunR;
        noStroke();
        fill(255, 255, 0);
        ellipse(x, y, r, r);
        fill(255, 89, 0, 100);
        ellipse(x, y, r + 3, r + 3);
    };
    
    this.drawCenter = function(){
        fill(255, 255, 255);
        ellipse(this.x, this.y, 2, 2);
    };
};

var Planet = function(data, angle) {
    this.name = data.name;
    this.year = data.year;
    this.r = data.size;
    
    // Distance from ellipse centre to sun
    var focusDist = scalingFactor * (data.aperihelion - data.perihelion) / 2;
    
    // Ellipse axes
    var major = scalingFactor * data.aperihelion - focusDist;
    var minor = sqrt(major * major - focusDist * focusDist);
    
    // Store these to save repeatedly calculating them
    var phi = data.peri_longitude;
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
        sign /= 2;
        var speed = 0;

        for (var d = 0; d < abs(days) * resolution; d++) {
            // Distance from sun
            var r = major * (1 - eccentricity * eccentricity) /
                            (1 + eccentricity * cos(this.angle));
            
            // Update angle around sun
            this.angle += sign * angleConstant / (r * r);
            speed += angleConstant / (r * r);
        }
        
        var r = major * (1 - eccentricity * eccentricity) /
                        (1 + eccentricity * cos(this.angle));
                        
        // Position based on non-rotated ellipse
        var x = r * cos(this.angle) + focusDist;
        var y = r * sin(this.angle);
        
        // Rotate based on ellipse rotation
        this.x = cx + x * cosPhi - y * sinPhi;
        this.y = cy - x * sinPhi - y * cosPhi;
        
        // Calculating position above/below plane of Earth's orbit
        var angle = atan2(this.y - sunY, this.x - sunX);
        angle = (360 - angle) % 360;
        var dAngle = (angle - data.asc_longitude + 540) % 360 - 180;
        this.inclination = sin(data.inclination * sin(dAngle));
    };
    this.update(0);
    
    this.display = function(x, y, r) {
        var x = x || this.x;
        var y = y || this.y;
        var r = r || data.size;
        noStroke();
        fill(data.colour);
        ellipse(x, y, r, r);
    };
};

/********************************************************
 *               Make planets here
*********************************************************/
var sun = new Sun();
var mars = new Planet(marsData, marsAngle);
var earth = new Planet(earthData, earthAngle);
var venus = new Planet(venusData, venusAngle);
var mercury = new Planet(mercuryData, mercuryAngle);
var bodies = [sun, mercury, venus, earth, mars];
var others = [sun, mercury, venus, mars];

var createRandomStars = function(n) {
    var stars = [];
    for (var i=0; i<n; i++) {
        var x = random() * 360;
        var y = random() * 400;
        var c = random() * 200 + 50;
        stars.push([x, y, c]);
    }
    return stars;
};
//var stars = createRandomStars(320);
var stars = [[2.10, 29.09, 191],[2.29, 59.15, 166],[2.35, -45.75, 54],[3.31, 15.18, 113],[4.86, -8.82, 68],[6.41, -77.26, 115],[6.55, -43.68, 52],[6.57, -42.31, 152],[9.24, 53.90, 62],[9.83, 30.86, 83],[10.13, 56.54, 169],[10.90, -17.99, 195],[12.27, 57.82, 73],[14.18, 60.72, 180],[14.19, 38.50, 55],[16.52, -46.72, 80],[17.10, -55.25, 52],[17.15, -10.18, 73],[17.43, 35.62, 193],[21.01, -8.18, 66],[21.45, 60.24, 127],[22.09, -43.32, 75],[22.81, -49.07, 52],[22.87, 15.35, 65],[24.43, -57.24, 586],[24.50, 48.63, 66],[26.02, -15.94, 71],[27.87, -10.33, 60],[28.27, 29.58, 75],[28.38, 19.29, 54],[28.60, 63.67, 78],[28.66, 20.81, 128],[28.99, -51.61, 62],[29.69, -61.57, 110],[30.00, -21.08, 50],[30.51, 2.76, 57],[30.86, 72.42, 52],[30.97, 42.33, 187],[31.79, 23.46, 200],[32.39, 34.99, 100],[34.13, -51.51, 68],[37.95, 89.26, 204],[40.83, 3.24, 68],[42.50, 27.26, 66],[42.67, 55.90, 59],[43.56, 52.76, 52],[44.11, -8.90, 54],[44.57, -40.30, 109],[45.57, 4.09, 138],[46.20, 53.51, 106],[46.29, 38.84, 80],[47.04, 40.96, 188],[47.37, 44.86, 58],[48.02, -28.99, 52],[49.88, -21.76, 62],[51.08, 49.86, 231],[51.20, 9.03, 66],[51.79, 9.73, 60],[53.24, -9.46, 60],[55.73, 47.79, 99],[55.81, -9.77, 69],[56.05, -64.81, 55],[56.08, 32.29, 56],[56.22, 24.11, 61],[56.30, 42.58, 59],[56.46, 24.37, 55],[56.81, -74.24, 84],[56.87, 24.11, 111],[57.29, 24.05, 65],[58.53, 31.88, 112],[59.46, 40.01, 107],[59.51, -13.51, 102],[59.74, 35.79, 51],[60.17, 12.49, 75],[60.79, 5.99, 53],[62.17, 47.71, 51],[63.50, -42.29, 55],[63.61, -62.47, 80],[64.47, -33.80, 68],[64.95, 15.63, 64],[65.73, 17.54, 59],[66.01, -34.02, 51],[67.14, 15.96, 56],[67.15, 19.18, 69],[67.17, 15.87, 76],[68.50, -55.05, 81],[68.89, -30.56, 57],[68.98, 16.51, 444],[69.08, -3.35, 52],[69.55, -14.30, 53],[72.46, 6.96, 88],[72.80, 5.61, 62],[73.56, 2.44, 61],[74.25, 33.17, 124],[75.49, 43.82, 98],[75.62, 41.08, 62],[76.37, -22.37, 88],[76.63, 41.23, 88],[76.96, -5.09, 116],[78.23, -16.21, 82],[78.63, -8.20, 706],[79.17, 46.00, 489],[79.40, -6.84, 66],[81.12, -2.40, 78],[81.28, 6.35, 257],[81.57, 28.61, 255],[82.06, -20.76, 114],[82.80, -35.47, 55],[83.00, -0.30, 168],[83.18, -17.82, 134],[83.41, -62.49, 59],[83.78, 9.93, 76],[83.86, -5.91, 119],[84.05, -1.20, 248],[84.41, 21.14, 102],[84.69, -2.60, 59],[84.91, -34.07, 127],[85.19, -1.94, 239],[86.12, -22.45, 67],[86.74, -14.82, 68],[86.82, -51.07, 55],[86.94, -9.67, 191],[87.74, -35.77, 92],[87.83, -20.88, 59],[87.87, 39.15, 51],[88.79, 7.41, 586],[89.10, -14.17, 61],[89.79, -42.82, 51],[89.88, 54.28, 61],[89.88, 44.95, 214],[89.93, 37.21, 127],[93.71, -6.27, 50],[93.72, 22.51, 81],[95.08, -30.06, 99],[95.53, -33.44, 55],[95.67, -17.96, 203],[95.74, 22.51, 109],[95.99, -52.70, 1230],[97.20, -7.03, 59],[99.17, -19.26, 51],[99.43, 16.40, 210],[99.44, -43.20, 89],[100.98, 25.13, 96],[101.29, -16.71, 2156],[101.32, 12.90, 78],[102.05, -61.94, 83],[102.46, -32.51, 71],[102.48, -50.61, 104],[103.20, 33.96, 66],[103.53, -24.18, 54],[104.66, -28.97, 283],[105.43, -27.93, 71],[105.76, -23.83, 99],[107.10, -26.39, 225],[107.19, -70.50, 58],[109.21, -67.96, 51],[109.29, -37.10, 122],[109.52, 16.54, 67],[110.03, 21.98, 69],[111.02, -29.30, 146],[111.43, 27.80, 58],[111.79, 8.29, 108],[112.31, -43.30, 84],[113.65, 31.89, 208],[114.71, -26.80, 57],[114.83, 5.23, 615],[115.31, -9.55, 52],[115.45, -72.61, 52],[115.95, -28.95, 52],[116.11, 24.40, 67],[116.31, -37.97, 65],[116.33, 28.03, 363],[117.32, -24.86, 79],[118.05, -40.58, 61],[119.19, -52.98, 73],[120.90, -40.00, 173],[121.89, -24.30, 113],[122.38, -47.34, 238],[124.13, 9.19, 69],[125.63, -59.51, 220],[126.42, -3.91, 53],[126.43, -66.14, 59],[127.57, 60.72, 78],[130.03, -35.31, 51],[130.07, -52.92, 66],[130.16, -46.65, 59],[130.90, -33.19, 62],[131.17, 18.15, 52],[131.18, -54.71, 197],[131.51, -46.04, 55],[131.69, 6.42, 77],[133.76, -60.64, 56],[133.85, 5.95, 93],[134.80, 48.04, 91],[135.91, 47.16, 67],[136.04, -47.10, 59],[137.00, -43.43, 171],[137.74, -58.97, 74],[137.82, -62.32, 51],[138.30, -69.72, 251],[138.59, 2.32, 54],[139.27, -59.28, 173],[139.71, 36.80, 57],[140.26, 34.39, 91],[140.53, -55.01, 144],[141.90, -8.66, 201],[142.81, -57.03, 90],[142.88, 63.06, 63],[143.22, 51.68, 89],[144.96, -1.14, 54],[145.29, 9.89, 70],[146.31, -62.51, 62],[146.46, 23.77, 102],[146.78, -65.07, 106],[147.75, 59.04, 58],[148.19, 26.01, 54],[149.22, -54.57, 70],[151.83, 16.76, 72],[152.09, 11.97, 312],[152.65, -12.35, 66],[153.43, -70.04, 82],[153.68, -42.12, 55],[154.17, 23.42, 74],[154.27, -61.33, 76],[154.27, 42.91, 73],[154.99, 19.84, 199],[155.58, 41.50, 96],[156.52, -16.84, 56],[156.97, -58.74, 57],[158.01, -61.69, 81],[158.20, 9.31, 56],[159.33, -48.23, 56],[160.74, -64.39, 120],[161.69, -49.42, 124],[162.41, -16.19, 93],[163.33, 34.22, 58],[163.37, -58.85, 58],[165.46, 56.38, 155],[165.93, 61.75, 228],[167.15, -58.98, 52],[167.42, 44.50, 100],[168.53, 20.52, 136],[168.56, 15.43, 80],[169.62, 33.09, 71],[169.84, -14.78, 68],[170.25, -54.49, 54],[172.85, 69.33, 57],[173.25, -31.86, 69],[173.95, -63.02, 93],[176.40, -66.73, 65],[176.51, 47.78, 62],[177.27, 14.57, 182],[177.67, 1.77, 66],[178.46, 53.69, 151],[182.09, -50.72, 134],[182.53, -22.62, 99],[182.91, -52.37, 51],[183.79, -58.75, 116],[183.86, 57.03, 81],[183.95, -17.54, 134],[184.98, -0.67, 54],[185.34, -60.40, 66],[186.65, -63.10, 469],[187.01, -50.23, 53],[187.47, -16.52, 104],[187.79, -57.11, 266],[188.12, -72.13, 56],[188.37, 69.79, 55],[188.60, -23.40, 127],[189.30, -69.14, 124],[189.43, -48.54, 55],[190.38, -48.96, 174],[190.42, -1.45, 73],[191.57, -68.11, 97],[191.93, -59.69, 336],[193.51, 55.96, 236],[193.90, 3.40, 76],[194.01, 38.32, 108],[195.54, 10.96, 111],[195.57, -71.55, 66],[199.73, -23.17, 101],[200.15, -36.71, 119],[200.98, 54.93, 168],[201.30, -11.16, 406],[202.76, -39.41, 54],[203.67, -0.60, 77],[204.97, -53.47, 164],[206.89, 49.31, 222],[207.38, -41.69, 75],[207.40, -42.47, 72],[208.67, 18.40, 125],[208.89, -47.29, 137],[209.57, -42.10, 56],[209.67, -44.80, 55],[210.96, -60.37, 524],[211.10, 64.38, 63],[211.59, -26.68, 83],[211.67, -36.37, 192],[213.92, 19.19, 857],[214.85, -46.06, 68],[217.96, 30.37, 67],[218.02, 38.31, 97],[218.88, -42.16, 159],[219.91, -60.84, 316],[219.92, -60.84, 794],[220.29, 13.73, 58],[220.48, -47.39, 162],[220.63, -64.97, 88],[220.76, -5.66, 54],[221.25, 27.07, 157],[221.56, 1.89, 60],[221.97, -79.04, 56],[222.68, 74.16, 191],[222.72, -16.04, 119],[224.63, -43.13, 125],[224.79, -42.10, 91],[225.49, 40.39, 71],[226.02, -25.28, 84],[226.28, -47.05, 53],[227.98, -48.74, 54],[228.07, -52.10, 75],[228.88, 33.32, 73],[229.25, -9.38, 131],[229.73, -68.68, 109],[230.18, 71.83, 100],[230.34, -40.65, 86],[230.45, -36.26, 67],[230.67, -44.69, 77],[231.23, 58.97, 82],[231.96, 29.11, 63],[233.67, 26.71, 172],[233.70, 10.54, 57],[233.79, -41.17, 115],[233.88, -14.79, 54],[234.26, -28.14, 66],[234.66, -29.78, 63],[235.69, 26.30, 57],[236.07, 6.43, 128],[236.55, 15.42, 64],[237.41, -3.43, 69],[237.70, 4.48, 61],[237.74, -33.63, 51],[238.79, -63.43, 112],[239.11, 15.66, 55],[239.22, -29.21, 55],[239.71, -26.11, 108],[240.03, -38.40, 75],[240.08, -22.62, 164],[241.36, -19.81, 136],[241.70, -20.67, 52],[243.59, -3.69, 121],[243.86, -63.69, 55],[244.58, -4.69, 85],[244.94, 46.31, 53],[245.30, -25.59, 107],[245.48, 19.15, 60],[246.00, 61.51, 120],[247.35, -26.43, 384],[247.56, 21.49, 116],[247.73, 1.98, 57],[248.36, -78.90, 54],[248.97, -28.22, 113],[249.29, -10.57, 138],[250.32, 31.60, 106],[250.72, 38.92, 72],[252.17, -69.03, 213],[252.45, -59.04, 59],[252.54, -34.29, 164],[252.97, -38.05, 100],[253.08, -38.02, 68],[253.65, -42.36, 65],[254.42, 9.38, 88],[254.66, -55.99, 92],[255.07, 30.93, 53],[257.20, 65.71, 89],[257.59, -15.73, 99],[258.04, -43.24, 80],[258.66, 14.39, 116],[258.76, 24.84, 91],[258.76, 36.81, 90],[260.50, -25.00, 83],[261.32, -55.53, 112],[261.35, -56.38, 81],[262.61, 52.30, 116],[262.69, -37.30, 123],[262.77, -60.68, 66],[262.96, -49.88, 112],[263.40, -37.10, 260],[263.73, 12.56, 189],[264.33, -43.00, 220],[264.40, -15.40, 69],[264.87, 46.01, 57],[265.62, -39.03, 153],[265.87, 4.57, 118],[266.43, -64.72, 66],[266.62, 27.72, 75],[266.90, -40.13, 101],[266.97, 2.71, 59],[267.46, -37.04, 88],[268.38, 56.87, 60],[269.06, 37.25, 55],[269.15, 51.49, 169],[269.44, 29.25, 62],[269.76, -9.77, 80],[270.16, 2.93, 52],[271.45, -30.42, 101],[271.66, -50.09, 64],[271.84, 9.56, 60],[271.89, 28.76, 56],[273.44, -21.06, 56],[274.41, -36.76, 93],[275.25, -29.83, 121],[275.26, 72.73, 67],[275.33, -2.90, 84],[275.92, 21.77, 55],[276.04, -34.38, 231],[276.74, -45.97, 71],[276.99, -25.42, 113],[278.80, -8.24, 55],[279.23, 38.78, 784],[281.41, -26.99, 89],[282.52, 33.36, 70],[283.82, -26.30, 193],[284.43, -21.11, 70],[284.74, 32.69, 84],[285.65, -29.88, 132],[286.17, -21.74, 59],[286.35, 13.86, 101],[286.56, -4.88, 74],[286.74, -27.67, 80],[287.44, -21.02, 109],[288.14, 67.66, 95],[289.28, 53.37, 57],[290.42, -17.85, 52],[290.66, -44.46, 51],[290.97, -40.62, 51],[291.37, 3.11, 78],[292.43, 51.73, 59],[292.68, 27.96, 97],[296.24, 45.13, 110],[296.56, 10.61, 121],[296.85, 18.53, 62],[297.04, 70.27, 56],[297.69, 8.87, 469],[298.12, 1.01, 55],[298.83, 6.41, 61],[299.08, 35.08, 54],[299.69, 19.49, 70],[300.15, -72.91, 51],[302.17, -66.18, 68],[302.83, -0.82, 85],[303.41, 46.74, 57],[303.87, 47.71, 51],[304.51, -12.54, 67],[305.25, -14.78, 97],[305.56, 40.26, 171],[306.41, -56.73, 208],[309.39, 14.60, 64],[309.39, -47.29, 93],[309.91, 15.91, 59],[310.36, 45.28, 336],[311.24, -66.20, 75],[311.32, 61.84, 74],[311.55, 33.97, 146],[311.92, -9.50, 58],[313.70, -58.45, 63],[314.29, 41.17, 52],[316.23, 43.93, 61],[318.23, 30.23, 86],[318.70, 38.04, 57],[318.96, 5.25, 53],[319.64, 62.59, 147],[321.67, -22.41, 59],[322.16, 70.56, 85],[322.89, -5.57, 107],[323.50, 45.59, 51],[325.02, -16.66, 62],[325.37, -77.39, 59],[326.05, 9.88, 154],[326.76, -16.13, 109],[328.48, -37.36, 100],[331.45, -0.32, 104],[331.75, 25.35, 59],[332.06, -46.96, 239],[332.55, 6.20, 69],[332.71, 58.20, 76],[334.63, -60.26, 109],[335.41, -1.39, 56],[337.21, -0.02, 64],[337.32, -43.50, 51],[337.82, 50.28, 59],[340.37, 10.83, 75],[340.67, -46.88, 191],[340.75, 30.22, 105],[341.63, 23.57, 51],[342.14, -51.32, 72],[342.42, 66.20, 71],[342.50, 24.60, 72],[343.15, -7.58, 60],[343.66, -15.82, 83],[344.41, -29.62, 358],[345.48, 42.33, 65],[345.94, 28.08, 147],[346.19, 15.21, 142],[347.36, -21.17, 62],[347.59, -45.25, 54],[349.29, 3.28, 62],[349.36, -58.24, 50],[350.74, -20.10, 51],[354.39, 46.46, 57],[354.84, 77.63, 86],[79.17, 46.01, 411],[113.65, 31.89, 111],[190.42, -1.45, 70],[200.98, 54.92, 52],[257.59, -15.73, 76]];

/********************************************************
 *               Telescope
*********************************************************/

var Telescope = function(base, angle) {
    this.fixedAngle = false;
    var t = 400;
    this.x = base.x;
    this.y = base.y;
    this.angle = base.angle + angle;
    
    this.update = function() {
        var theta;
        if (this.fixedAngle === false) {
            theta = atan2(base.y - sunY, base.x - sunX);
        } else {
            theta = this.fixedAngle;
        }
        this.x = base.x + base.r * cos(theta) / 2;
        this.y = base.y + base.r * sin(theta) / 2;
        this.angle = theta;   
    };
};

var telescope = new Telescope(earth, 0);
telescope.fixedAngle = 0;
/********************************************************
 *               Display functions
*********************************************************/
var sortByDist = function(a, b) {
    var distA = dist(a.x, a.y, telescope.x, telescope.y);
    var distB = dist(b.x, b.y, telescope.x, telescope.y);
    return distB - distA;
};

var drawTelescopeAngles = function() {
    fill(240);
    textSize(11);
    textAlign(CENTER, BASELINE);
    
    var angle = round(telescope.fixedAngle);     
    for (var i=0; i<360; i+=20) {
        var a = i - angle;
        if (a < -180) { a += 360; }
        if (a > 180) { a -= 360; }
        var x = 200 + a * width / telescopeAngle;
        text(i + "°", x, height - 4);
    }
};

var drawView =function () {
    fill(0);
    stroke(255);
    
    rect(-1, -1, width + 1, height + 1);

    // Stars
    strokeWeight(1);
    for (var i=0; i<stars.length; i++) {
        var s = stars[i];
        var x = (360 + s[0] - telescope.angle) % 360;
        if (x > 180) { x = x - 360; }
        
        if (x < telescopeAngle) {
            var px = round(200 + x * width / telescopeAngle);
            var py = height/2 + s[1] * height / 150;
            
            if (s[2] > 255) {
                stroke(min(150, (s[2] - 255) / 4));
                line(px - 1, py, px + 1, py);
                line(px, py - 1, px, py + 1);
                stroke(255);
            } else {
                stroke(s[2]);
            }
            point(px, py);
        }
    }
    
    noStroke();
    var tx = telescope.x;
    var ty = telescope.y;
    
    // Sort non-Earth bodies by distance from Earth
    var sorted = others.slice().sort(sortByDist);
    for (var i in sorted) {
        var body = sorted[i];
        var theta = atan2(ty - body.y, tx - body.x);
        var dTheta = (180 + telescope.angle - theta) % 360;
        if (dTheta > 180) { dTheta -= 360; } 
        var d = dist(body.x, body.y, tx, ty);
        var r = 100 * atan(body.r / d) / 180;
        
        if (abs(dTheta) <= telescopeAngle / 2 + r) {
            var x = width * (0.5 - dTheta / telescopeAngle);
            var y = height/2 + body.inclination * height / telescopeAngle;
            body.display(x, y, r);
        }
    }
    
    drawTelescopeAngles();
};

// Menu
var menu_x = 5;
var menu_y = 5;
var menu_w = 93;
var menu_h = bodies.length * 26;

var drawKey = function() {
    var x = menu_x;
    var y = menu_y;
    
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
    for (var i=0; i<others.length; i++) {
        others[i].display(x + 19, y + i*26 + 40);
        fill(255);
        text(others[i].name, x + 37, y + i*26 + 40);
    }
};

var draw = function() {    
    if (running) {
        for (var j = 0; j<speed; j++) {
            for (var i = 1; i < bodies.length; i++) {
                bodies[i].update(1);
            }
        }
        telescope.update();
    }
    
    if (moveTelescope) {
        if (mouseX < 100) {
            telescope.fixedAngle += (mouseX - 100) / 40;
            if (telescope.fixedAngle < 0) {
                telescope.fixedAngle += 360;
            } 
        } else if (mouseX > width - 100){
            telescope.fixedAngle += (mouseX - width + 100) / 40;
            if (telescope.fixedAngle > 360) {
                 telescope.fixedAngle -= 360;
            }
        }
    }
    
    background(0, 0, 0);
    drawView();
    drawKey();
    
    textAlign(LEFT, BASELINE);
    textSize(14);
    fill(255, 255, 255, 200);
    text("Sizes of planets and sun not to scale", 3, height - 18);
};

/********************************************************
 *               Event handling
*********************************************************/

var mouseClicked = function() {
    var angle = telescope.fixedAngle + (mouseX - 200) * telescopeAngle / 400;
    angle = (360 + angle) % 360;
    telescope.fixedAngle = angle;
};

var mouseOut = function() {
    moveTelescope = false;
};

var mouseOver = function() {
    moveTelescope = true;
};

var keyPressed = function() {
    // Spacebar toggles animation
    if (keyCode === 32) { running = !running; }
    //if (keyCode === 82) { telescope.fixedAngle = false; }
    if (keyCode === LEFT && telescope.fixedAngle !== false) {
        telescope.fixedAngle -= 2;
        if (telescope.fixedAngle < 0) {
            telescope.fixedAngle += 360;
        }
    }
    if (keyCode === RIGHT && telescope.fixedAngle !== false) {
        telescope.fixedAngle = (telescope.fixedAngle + 2) % 360;
    }
};