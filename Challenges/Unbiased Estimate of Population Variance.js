https://www.khanacademy.org/cs/unbiased-estimate-of-population-variance/1169428428

/************************************************************
 * This program generates a population of random variables.
 * The top graph is the distribution of the population.
 * 
 * Watch a video about this simulation at:
 * https://www.khanacademy.org/math/probability/descriptive-statistics/variance_std_deviation/v/simulation-showing-bias-in-sample-variance
 * 
 * Click on the lower graphs to enlarge them.
 * Click again to return to the normal view.
 * If multiple dashed lines appear click anywhere.
 * 
 * The program continually samples the population with a 
 * sample size between 2 and 10.
 * The second graph shows sample mean vs. sample variance.
 * It shows that sample means further from the population mean
 * tend to have a smaller variance.
 * These samples tend to be smaller samples (more red).
 * 
 * The third graph shows sample variance as a function of
 * sample size. Sample variance is plotted as a percentage 
 * of population variance.
 * 
 * The variance of a sample of size 2 approaches 1/2 the 
 * population variance.
 * The variance of a sample of size 3 approaches 2/3 the 
 * population variance.
 * The variance of a sample of size 4 approaches 3/4 the 
 * population variance.
 * And so on
 * 
 * In summary, small samples are more likely to have a mean
 * that is far from the population mean. Samples with a mean
 * far from the population mean are more likely to have a low
 * variance.
*************************************************************/

frameRate(30);

// Population variables
var popMin = 1;
var popMax = 20;
var freqMax = 50;

// Sample variables
var sampleSizeMin = 2;  // Makes no sense to be <2
var sampleSizeMax = 10;
var sampleCount = 0;

// Display variables
var titleFont = createFont("Times", 16);
var labelFont = createFont("Arial", 10);
var scatterSize = 3;
var dashSize = 4;
var backgroundColour = color(245, 245, 255);

// Used to only refresh graphs when necessary
var refresh = true;
var mode = 'standard';
var modeSpeed = 50;
var modeN = modeSpeed;

// Graph locations
var popGraph = { x: 15, y: 50,
                 width: 369, height: 110,
                 xMin: popMin, xMax: popMax,
                 yMax: freqMax,
                 xlabel: "Value of random variable",
                 ylabel: "Counts",
                 stroke: color(0, 150, 0),
                 colour1: color(0, 150, 0, 80)
};
                 
var sampleGraph = { x: 218, y: 220,
                    width: 167, height: 165,
                    xMin: sampleSizeMin, xMax: sampleSizeMax,
                    yMax: 100,
                    xlabel: "Sample size",
                    ylabel: "Sample var / Pop. var (%)",
                    stroke: color(200, 200, 200),
                    colour1: color(250, 0, 0, 160),
                    colour2: color(0, 0, 250, 160)
};

var scatterGraph = { x: 15, y: 220,
                    width: 172, height: 165,
                    xMin: popMin, xMax: popMax,
                    yMax: (0.5*popMax) * (0.5*popMax),
                    xlabel: "Sample mean",
                    ylabel: "Sample variance",
                    colour1: color(250, 0, 0, 120),
                    colour2: color(0, 0, 250, 120)
};
                    
var borderBottom = 25;
var borderLeft = 25;     

// How many samples of each size have we taken
var sampleSizeCount = [];
// Total variance of samples for each sample size;
var sampleSizeVar = [];
// Variance of samples relative to population variance for each sample size;
var sampleSizeVarPercent = [];
// List of sample, sizes, means and variances
var sampleStats = [];

for (var i=sampleSizeMin; i<=sampleSizeMax; i++) {
    sampleSizeCount.push(0);
    sampleSizeVar.push(0);
    sampleSizeVarPercent.push(0);
}

popGraph.midX = popGraph.x + borderLeft + 
               (popGraph.width - borderLeft) / 2;
sampleGraph.midX = sampleGraph.x + borderLeft + 
                  (sampleGraph.width - borderLeft) / 2;
scatterGraph.midX = scatterGraph.x + borderLeft + 
                   (scatterGraph.width - borderLeft) / 2;

var newPopulation = function() {
    refresh = true;
    sampleCount = 0;
};

// Create a random distribution for N values
var createRandomPopulation = function(N) {
    newPopulation();
    var population = [];
    for (var i=0; i<N; i++) {
        population.push(floor(random() * freqMax));
    }
    return population;
};

var getPopulationStatistics = function(pop) {
    var size = 0;
    var mean = 0;
    var variance = 0;
    
    for (var i=0; i<pop.length; i++) {
        var x = i + popMin;
        size += pop[i];
        mean += pop[i] * x;
        variance += pop[i] * x * x;
    }
    
    mean /= size;
    variance /= size;
    variance -= mean * mean;
    
    return [size, mean, variance];
};

var getSampleStatistics = function(sample) {
    var mean = 0;
    var variance = 0;
    var sampleSize = sample.length;
    
    for (var i=0; i<sampleSize; i++) {
        mean += sample[i];
        variance += sample[i] * sample[i];
    }
    
    mean /= sampleSize;
    variance /= sampleSize;
    variance -= mean * mean;
    
    return [mean, variance];
};

// Take a random sample of a given size
var samplePopulation = function(population, pSize, sSize) {
    var sample = [];
    
    for (var i = 0; i < sSize; i++) {
        var x = floor(random() * pSize);
        for (var j = 0; j <= population.length; j++) {
            x -= population[j];
            if (x <=0) {
                sample.push(j + popMin);
                break;
            }
        }
    }
    
    return sample;
};

// Take a random sample of random size
var takeRandomSample = function(population, pSize, pVar) {
    var s = floor(random() * (sampleSizeMax - sampleSizeMin + 1));
    var sampleSize = s + sampleSizeMin;
    var sample = samplePopulation(population, pSize, sampleSize);
    
    var samStats = getSampleStatistics(sample);
    var mean = samStats[0];
    var variance = samStats[1];
    
    sampleSizeCount[s]++;
    sampleSizeVar[s] += variance;
    sampleSizeVarPercent[s] = (sampleSizeVar[s] / sampleSizeCount[s]) * 100 / pVar;
    sampleStats.push([sampleSize, mean, variance]);
    sampleCount++;
};

var population = createRandomPopulation(popMax - popMin + 1);
var popStats = getPopulationStatistics(population);
var popSize = popStats[0];
var popMean = popStats[1];
var popVar = popStats[2];

for (var i=0; i<100; i++) {
    takeRandomSample(population, popSize, popVar);
}

// Scale and translate image for current mode
var modeTransform = function() {
    var p  =  modeN / modeSpeed;
    resetMatrix();
    
    if (mode === "scatter") {
        translate(p * 2, -p * 342);
        scale(1 + 0.9 * p, 1 + 0.9 * p);
    } else if (mode === "sample-size") {
        translate(p * 2, -p * 342);
        translate(p * (-sampleGraph.x -164), 
                  p * (-sampleGraph.y + 218));
        scale(1 + 0.9 * p, 1 + 0.9 * p);
    }
    
    if (modeN < modeSpeed) {
        refresh = true;
        modeN++;
    }
};

var drawBarGraph = function(data, display, title) {
    var gx = display.x + borderLeft;
    var gy = display.y + display.height - borderBottom;
    var gw = display.width - borderLeft;
    var gh = display.height - borderBottom;
    var scaleX = (gw - 4) / (display.xMax - display.xMin + 1);
    var scaleY = gh / display.yMax;
    var i;
    
    modeTransform();
    fill(backgroundColour);
    noStroke();
    rect(display.x-10, display.y-10,
         display.width+12, display.height+12);
    
    // Gridlines
    stroke(220, 230, 220);
    strokeWeight(1);
    var dy = display.yMax / 5;
    for (i = dy; i <= display.yMax; i += dy) {
        line(gx-2, gy - i * scaleY, gx + gw, gy - i * scaleY);
    }
    
    // Colours for bars
    if (display.stroke !== undefined) {
        stroke(display.stroke);
    } else {
        noStroke();
    }
    
    // Draw bars
    for (i = 0; i <= data.length; i++) {
        var height = data[i] * scaleY;
        if (display.colour2 === undefined){
            fill(display.colour1);
        } else {
            var n = i / data.length;
            var c = lerpColor(display.colour1, display.colour2, n);
            fill(c);
        }
        rect(gx + 2 + i * scaleX, gy - height, scaleX, height);
    }
    
    // Axes
    stroke(10, 10, 20);
    strokeWeight(2);
    line(gx, gy+1, gx+gw, gy+1);
    
    // Axis labels
    fill(10, 10, 20);
    textFont(labelFont, 12);
    textAlign(CENTER, BASELINE);
    text(display.xlabel, gx + 0.5 * gw, gy+borderBottom);
    
    translate(gx - borderLeft, gy - gh/2);
    rotate(270);
    text(display.ylabel, 0, 0);
    resetMatrix();
    modeTransform();
    
    // Axis units
    textFont(labelFont, 10);
    for (i=0; i<data.length; i++) {
        text(i + display.xMin, gx + 2 + (i + 0.5) * scaleX,
            gy + borderBottom - 12);
    }
    
    textAlign(RIGHT, CENTER);
    for (i = 0; i <= display.yMax; i += dy) {
        text(i, gx - 4, gy - i * scaleY);
    }
};

var drawScatterGraph = function(data, display, update) {
    var gx = display.x + borderLeft;
    var gy = display.y + display.height - borderBottom;
    var gw = display.width - borderLeft;
    var gh = display.height - borderBottom;
    
    var scaleX = gw / (display.xMax - display.xMin);
    var scaleY = gh / display.yMax;
    var dy = display.yMax / 5;
    var i, n, c, x, y;  
    
    modeTransform();
    if (!update) {
        // Clear background
        noStroke();
        fill(backgroundColour);
        noStroke();
        rect(display.x-10, display.y-10,
             display.width+20, display.height+12);
        
        // Draw all data
        for (i=0; i<data.length; i++) {
            n = (data[i][0] - display.xMin) /
                    (display.xMax - display.xMin);
            c = lerpColor(display.colour1, display.colour2, n);
            fill(c);
            ellipse(gx + (data[i][1] - display.xMin) * scaleX,
                    gy - data[i][2] * scaleY,
                    scatterSize, scatterSize);
        }
        
        // Axis labels
        fill(10, 10, 20);
        textFont(labelFont, 12);
        textAlign(CENTER, BASELINE);
        text(display.xlabel, gx + 0.5 * gw, gy+borderBottom);
        
        translate(gx - borderLeft+4, gy - gh/2);
        rotate(270);
        text(display.ylabel, 0, 0);
        resetMatrix();
        modeTransform();
        
        // Axis units
        textFont(labelFont, 10);
        strokeWeight(1);
        for (i=1; i<popMax; i+=2) {
            x = gx + 2 + (i - 0.5) * scaleX + 2;
            text(i + display.xMin, x, gy + borderBottom - 12);
            line(x, gy, x, gy + 3);
        }
        
        textAlign(RIGHT, CENTER);
        for (i = 0; i <= display.yMax; i += dy) {
            y = gy - i * scaleY;
            text(i, gx - 4, y);
            line(gx, y, gx-3, y);
        }
    
    } else {
        i = data.length - 1;
        n = (data[i][0] - display.xMin) /
                    (display.xMax - display.xMin);
        c = lerpColor(display.colour1, display.colour2, n);
            fill(c);
            ellipse(gx + (data[i][1] - display.xMin) * scaleX,
                    gy - data[i][2] * scaleY,
                    scatterSize, scatterSize);
    }

    
    // Draw population values
    stroke(140, 140, 160);
    strokeWeight(1);
    
    // Mean of means
    x = gx + (popMean - display.xMin) * scaleX;
    for (i=0; i < gh; i += dashSize * 2) {
        line(x, gy - i, x, gy - i - dashSize);
    }
    
    // Mean of variance
    y = gy - popVar * scaleY;
    for (i=0; i < gw; i += dashSize * 2) {
        line(gx + i, y, gx + i + dashSize, y);
    } 
    
    // Axes
    stroke(10, 10, 20);
    strokeWeight(2);
    line(gx, gy+1, gx+gw, gy+1);
    line(gx, gy, gx, gy - gh+1);
};

var drawTitle =function(display, title, subtitle) {
    fill(backgroundColour);
    noStroke();
    rect(display.x, display.y-40, display.width+20, 35);
    
    fill(10, 10, 20);
    textFont(titleFont, 15);
    textAlign(CENTER, BASELINE);
    text(title, display.midX, display.y - 25);
    
    if (subtitle) {
        textFont(labelFont, 12);
        text(subtitle, display.midX, display.y -10);
    }
};

var draw = function() {

   takeRandomSample(population, popSize, popVar);
   drawScatterGraph(sampleStats,scatterGraph, true);

    // Only update display every 250 frames.
    if (frameCount % 250 === 0) { refresh = true; }

    if (refresh) {
        background(backgroundColour);
        drawBarGraph(population, popGraph);
        drawScatterGraph(sampleStats,scatterGraph, false);
        refresh = false;
    }
    
    drawBarGraph(sampleSizeVarPercent, sampleGraph);
 
    var statString = "N = " + popSize;
    statString += ", mean = " + round(10 * popMean) / 10;
    statString += ", variance = " + round(10 * popVar) / 10;

    drawTitle(scatterGraph, "Sample Statistics", 
                            "Lines indicate Pop. statistics");
    drawTitle(popGraph, "Population Distribution", statString);
    drawTitle(sampleGraph, "Sample Size vs. Variance",
                            sampleCount + " samples");
};

var mouseClicked = function(){
    if (mode === "scatter" || mode === "sample-size") {
        mode = "standard";
    } else {
        if (mouseX > scatterGraph.x &&
            mouseX < scatterGraph.x + scatterGraph.width &&
            mouseY > scatterGraph.y) {
                mode = "scatter";
                modeN = 0;
        }
        else if (mouseX > sampleGraph.x &&
                 mouseX < sampleGraph.x + scatterGraph.width &&
                 mouseY > sampleGraph.y) {
                    mode = "sample-size";
                    modeN = 0;
        }
    }
    refresh = true;
};

// By Peter Collingridge