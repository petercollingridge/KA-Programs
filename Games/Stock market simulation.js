https://www.khanacademy.org/cs/stock-market-simulation/1982327104

/*******************************************************
 * How to play
 *  - The arrow button moves to the next day
 *  - The graph button shows stock trends
 *    - Click on the buttons to buy and sell stocks
 *  - The dollar button shows you your assests
 *    - You can also buy stocks here
 *  - The newspaper button gives you market statistics
 *  - The speech bubble button gives you predictions from
 *    analysts. Some are more accurate than others.
 * 
 * To Do
 *  - More analysist opinions
 *  - Make analysts less accurate
 *  - Analysts to predict trend changes
 *  - Show min, max, mean on graph
 *  - Add more news types
 *  - Only one story per stock type
 *  - Improve news page style
 *  - Dividends, interest, commision.
 * 
 * To Fix
 *  - When showing all, add quit button
 *  - Improve selecting and highlighting stocks
 *  - Refactor all the GUI to be nicer
 * 
 * 16/10/13 Add basic analyst trend-finding
 * 
 * 14/10/13 Add analysts and give them unhelpful comments
 * 
 * 21/9/13 Improve interface and start on news pages.
 * 
 * 7/9/13 Add portfolio page and trade options to get
 * playable game.
 * 
 * 6/9/13 Start game, create stocks and trends. Show
 * graph and stock data.
*******************************************************/

var initialValueMin = 200;
var initialValueMax = 1200;
var marketHistory = 365;
var cash = 100000;
var dayCount = 0;
var page = "Market";
var dailyNews = [];
var selectedNews = 0;

var monoFont = createFont("mono", 20);
var sansFont = createFont("sans", 20);
var impFont = createFont("Impact", 20);

var running = true;
var highlightedStock = false;
var selectedStock = false;
var tradeAmount = false;
var buttons, stocks;

var NEGCOL = color(160, 0, 0);

var analystNames = ["Ada", "Alan", "Alice", "Alonzo"];
var analystPics = [
    getImage("cute/CharacterHornGirl"),
    getImage("cute/CharacterCatGirl"),
    getImage("cute/CharacterPinkGirl"),
    getImage("cute/CharacterBoy")
];

var writePrice = function(price, sign) {
    var p = round(price);
    var txt = "" + p / 100;
    if (p % 100 === 0) { txt += '.00'; }
    else if (p % 10 === 0) { txt += '0'; }
    if (sign && p >= 0) { txt = "+" + txt; }
    
    return txt;
};

/*************************************************
 *    Objects
*************************************************/

// Function that changes over time
var Trend = function(timescale, stock) {
    this.initialise = function() {
        this.currentTime = 0;
        this.period = random(2 * timescale, 25 * timescale);
        var c = stock.value * sqrt(timescale) / (4 * this.period);
        this.scale = random(-c, c*1.05);
        this.noise = (random(5) + 1) * this.scale;
    };
    this.initialise();
    
    this.update = function() {
        var value = random(this.scale);
        value += (random() - 0.5) * this.noise;
        
        this.currentTime++;
        if (this.currentTime > this.period) {
            // Replace with new trend
            this.initialise();
        }
        return value;
    };
};

var Stock = function(name, tla, colour) {
    this.name = name;
    this.tla = tla;
    this.colour = colour;
    
    this.initialise = function() {
        this.value = random(initialValueMin, initialValueMax);
        this.values = [this.value];
        this.min = this.value;
        this.max = this.value;
        this.amount = 0;
        this.basis = 0;
        this.age = 0;
        this.trends = [new Trend(1, this),    // Short term
                       new Trend(4, this),    // Mid term
                       new Trend(16, this)];  // Long term
    };
    
    this.initialise();
    
    this.update = function() {
        this.age++;
        this.change = random(-20, 20);
        
        // Update based on trends
        for (var t in this.trends) {
            this.change += this.trends[t].update();
        }

        // Random jolt
        if (random() < 0.02) {
            this.change *= pow(2, random(-1, 1));
        }
        
        this.value += this.change;
        
        this.max = max(this.value, this.max);
        this.min = min(this.value, this.min);
        
        if (this.value < 0) {
            this.bankrupt();
        }
        
        // Record old values
        this.values.push(this.value);
        if (this.values.length > marketHistory) {
            this.values.shift();
        }
    };
    
    this.bankrupt = function() {
        this.change = 0;
        this.initialise();
    };
};

// Object containing all the stocks in the market
var Market = function() {
    this.name = "Market average";
    this.tla = "ALL";
    this.colour = color(0, 0, 0);
    this.stocks = [];
    this.values = [];
    this.change = 0;
    
    this.update = function() {
        var value = 0;
        
        for (var s in this.stocks) {
            this.stocks[s].update();
            value += this.stocks[s].value;
        }
        value /= this.stocks.length;
        
        if (!this.max || value > this.max) {
            this.max = value;
        }
        if (!this.min || value < this.min) {
            this.min = value;
        }
        
        this.change = value - this.value;
        this.value = value;
        this.values.push(value);
        if (this.values.length > marketHistory) {
            this.values.shift();
        }
    };
};

/*************************************************
 *    GUI Objects
*************************************************/

var Button = function(x, y, w, h, drawF, clickF, name) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.name = name;
    this.defaultCol = color(140, 140, 140);
    this.highlightCol = color(240, 240, 240);
    this.drawF = drawF;
    this.clickF = clickF;
    
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
                if (this.highlightOnClick) {
                    this.highlighted = true;
                }
                return true;
            }
        }
    };
    
    this.draw = function() {
        if (this.showing) {
            if (this.highlighted || this.mouseover) {
                fill(this.highlightCol);
            }
            else { fill(this.defaultCol); }
    
            noStroke();
            rect(this.x, this.y, this.w, this.h, 4);
            
            if (this.drawF) { this.drawF(this);}
        }
    };
};

var Slider = function(x, y, w, min_v, max_v, current_v) {
    this.x = x;
    this.y = y;
    this.width = w; 
    this.held = false;

    // Use when min and max (re)defined
    this.calibrate = function(min_v, max_v) {
        this.min = min_v;
        this.max = max_v;
        this.scale = (max_v - min_v) / w;
        this.val = current_v === undefined ? min_v : current_v;
        this.bx = this.x + (this.val - min_v) / this.scale;          
    };
    this.calibrate(min_v, max_v);

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

/*************************************************
 *    Create market objects
*************************************************/
stocks = [
    new Stock("Black Book Inc.", "BBI", color(0, 0, 0)),
    new Stock("Blue Electric Co.", "BEC", color(50, 30, 240)),
    new Stock("Green Food Mart", "GFM", color(20, 200, 20)),
    new Stock("Grey Phone Ltd", "GPL", color(120, 120, 120)),
    new Stock("Orange Juice Co.", "OJC", color(230, 128, 3)),
    new Stock("Purple Pharma Tech", "PPT", color(176, 0, 176)),
    new Stock("Red Apple Corp.", "RAC", color(240, 30, 50)),
    new Stock("Yellow Gas Giant", "YGG", color(192, 199, 2))
];

var market = new Market();
market.stocks = stocks;
var valueObjects = [market].concat(stocks);

var findMax = function(arr) {
    var m = arr[0];
    for (var i in arr) { m = max(m, arr[i]); }
    return m;
};

var findMin = function(arr) {
    var m = arr[0];
    for (var i in arr) { m = min(m, arr[i]); }
    return m;
};

var findAverage = function(arr) {
    var v = 0;
    for (var i in arr) { v += arr[i]; }
    return v / arr.length;
};

// Find the min or max for last n values in an array 
var findStatsOverTime = function(arr, n, f) {
    var length = arr.length;
    var start = max(0, length - n);
    var end = min(start + n, length);
    return f(arr.slice(start, end));
};

/*************************************************
 *    News and analysis
*************************************************/
var times = {week: 7, month: 30,  quarter: 120, year: 365 };

// Sort by 3rd value, the newsworthiness value
var sortNews = function(a, b) {
    return b[2] - a[2];
};

var findNews = function() {
    // Create a list of news stories in the form
    // [stock name, story, newsworthiness]
    var news = [];
    
    for (var s in valueObjects) {
        var stock = valueObjects[s];
        var currentValue = stock.value;
        var oldValue = stock.values[stock.values.length - 2];
        
        // Bankruptcies
        // Newsworth = 1000
        if (stock.age === 0) {
            news.push([stock.name, " bankrupt and replaced by a company with eaxctly the same name.", 1000]);
        }
        
        // Large value changes
        // Newsworth = 1000 * percentage change
        var percentChange = abs(stock.change) / oldValue;
        if (percentChange > 0.04) {
            if (stock.change > 0) {
                news.push([stock.name, " price jumps by " + round(percentChange * 100) + "%.", percentChange * 1000]);
            } else {
                news.push([stock.name, " price falls by " + round(percentChange * 100) + "%.", percentChange * 1000]);
            }
        }
        
        // Minimum and maximum values for various time frames
        // Newsworth = number of days
        var stockNews = false;
        for (var t in times) {
            var values = stock.values.slice(-times[t] - 1, -1);
            if (currentValue > findMax(values)) {
                stockNews = [stock.name, " hits the highest value in a " + t + ".", times[t]];
            } else if (currentValue < findMin(values)) {
                stockNews = [stock.name, " hits the lowest value in a " + t + ".", times[t]];
            }
            
            if (!stockNews) { break; }
        }
        if (stockNews) {
            news.push(stockNews);
        }
    }
    
    // Pick the top 3 most newsworthy stories
    var filteredNews = [];
    for (var i in news.sort(sortNews).slice(0, 3)) {
        filteredNews.push(news[i][0] + news[i][1]);
    }
    
    dailyNews.push(filteredNews);
    if (dailyNews.length > 7) {
        dailyNews.shift();
    }
};

/*************************************************
 *    Analysts comments
*************************************************/
var randFromArray = function(arr) {
    var n = floor(random(arr.length));
    return arr[n];
};

var analystComments = [];

// When analysts don't know what to say, they pick one
// item from here and one from dontKnow2
var dontKnowComments1 = [
    "I don't know why you're asking me, ",
    "Oh, I don't know! Why don't you just ",
    "Hmmmm, maybe ",
    "Don't look at me. You might as well ",
    "It's all just random. You'd be better off if you ",
    "There's no science in this you know; just "
];

var dontKnowComments2 = [
    "check your horoscope.",
    "look at your tea leaves.",
    "ask a chimp - they might know!",
    "stick a pin in the newspaper.",
    "flip a coin!",
    "work it out yourself."
];

var busyComments1 = [
    "Not now, ",
    "Go away, ",
    "Sorry I don't have any predictions, ",
    "Leave me alone - "
];

var busyComments2 = [
    "I'm washing my hair.",
    "it's my day off.",
    "I haven't finished my calculations.",
    "the dog ate my notes.",
    "I'm waiting to see if my algorithm ever finishes.",
    "I'm doing my maths homework",
    "I overslept.",
    "I'm busy chatting with Winston."
];

var otherComments = [
    "Zzzzzzzzzzzz",
    "One day all of this analysis will be done by computers.",
    "I can't get to the phone right now. Please leave a message after the beep.",
    "I don't know why I bother, you never listen to me anyway.",
    "Oh what's the point of it all.",
    "Don't listen to me - I'm not even real.",
    "The answer is 42.",
    "I predict a riot",
    "The young lion will overcome the older one, on the field of combat in a single battle; he will pierce his eyes through a golden cage.",
    "What? You want another prediction? Again!",
    "Why don't go outside for a while",
    "There's more to life than money you know",
    "Buy low, sell high.",
    "You will meet a tall, dark stranger."
];

var recommendComments = [
    "I recommend #n",
    "I've heard something good will happen at #n",
    "Put all your money in #n",
    "#n looks like a strong investment",
    "Why not try some #n",
    "You should paint the town #c",
    "#c is the n"+"ew black",
    "#c is in",
    "I'll be wearing #c"
];

var avoidComments = [
    "I would avoid #n",
    "I've heard something bad will happen at #n",
    "Get all your money out of #n",
    "#n looks like a poor investment",
    "Don't buy anything #c",
    "#c is out",
    "Fashion tip: #c is not a good look"
];

var findTrendAmount = function() {
    var target = randFromArray(stocks);
    var trend = randFromArray(target.trends);
    var colour = target.name.split(' ')[0];
    var comment;
    
    if (trend.scale > 0) {
        comment = randFromArray(recommendComments);
    } else {
        comment = randFromArray(avoidComments);
    }
    
    comment = comment.replace('#n', target.name);
    comment = comment.replace('#c', colour);
    
    // Add time information
    if (random() < 0.5) {
        if (trend.period < 6) {
            comment += " in the next few days";
        } else if (trend.period < 14) {
            comment += " in the next week or so";
        }  else if (trend.period < 29) {
            comment += " in the next few weeks";
        }   else if (trend.period < 90) {
            comment += " in the next few months";
        } else {
            comment += " in the long term";
        }
    }
    
    return comment + ".";
};

var findAnalysis = function() {
    analystComments = [];
    var s;
    
    for (var i in analystNames) {
        if (random() < 0.6) {
            s = findTrendAmount();
        } else if (random() < 0.75) {
            s = randFromArray(dontKnowComments1);
            s += randFromArray(dontKnowComments2);   
        } else if (random() < 0.9) {
            s = randFromArray(busyComments1);
            s += randFromArray(busyComments2);  
        } else {
            s = randFromArray(otherComments);
        }
        analystComments.push(s);
    }
};

// Generate a year's worth of data
for (var t=0; t<360; t++) {
    market.update();
    if (t > 350) {
        findNews();
    }
    if (t > 358) {
        findAnalysis();
    }
}

/*************************************************
 *    Button drawing functions
*************************************************/

var graphButton = function(self) {
    stroke(20);
    strokeWeight(2);
    line(self.x + 4, self.y + 4, self.x + 4, self.y + 13);
    line(self.x + 4, self.y + 14, self.x + 13, self.y + 14);
    strokeWeight(1);
    line(self.x + 5, self.y + 11, self.x + 8, self.y + 6);
    line(self.x + 8, self.y + 6, self.x + 11, self.y + 9);
    line(self.x + 11, self.y + 9, self.x + 14, self.y + 4);
};

var newsButton = function(self) {
    stroke(20);
    strokeWeight(1);
    noFill();
    rect(self.x + 3, self.y + 2, 11, 13);
    rect(self.x + 9, self.y + 7, 3, 4);
    line(self.x + 5, self.y + 7, self.x + 7, self.y + 7);
    line(self.x + 5, self.y + 9, self.x + 7, self.y + 9);
    line(self.x + 5, self.y + 11, self.x + 7, self.y + 11);
    line(self.x + 5, self.y + 13, self.x + 12, self.y + 13);
    
    strokeWeight(2);
    line(self.x + 6, self.y + 5, self.x + 11, self.y + 5);
};

var viewsButton = function(self) {
    stroke(20);
    strokeWeight(1);
    noFill();
    line(self.x + 4, self.y + 2, self.x + 13, self.y + 2);
    line(self.x + 3, self.y + 3, self.x + 3, self.y + 9);
    line(self.x + 14, self.y + 3, self.x + 14, self.y + 9);
    line(self.x + 4, self.y + 10, self.x + 6, self.y + 10);
    line(self.x + 10, self.y + 10, self.x + 13, self.y + 10);
    line(self.x + 7, self.y + 10, self.x + 5, self.y + 15);
    line(self.x + 11, self.y + 10, self.x + 5, self.y + 15);
};

var portfolioButton = function(self) {
    fill(20);
    textFont(impFont, 15);
    textAlign(CENTER, CENTER);
    text("$", self.x + self.w/2, self.y + self.h/2);
};

var nextButton = function(self) {
    fill(20);
    noStroke();
    triangle(self.x + 4, self.y + 3, self.x + 4, self.y + 15,
             self.x + 15, self.y + 9);
};

var buttonText = function(self) {
    fill(20);
    textFont(impFont, 15);
    textAlign(CENTER, CENTER);
    text(self.name, self.x + self.w/2, self.y + self.h/2);
};

/*************************************************
 *    Button click functions
*************************************************/

var nextDay = function(self) {
    dayCount++;
    market.update();
    findNews();
    findAnalysis();
};

var quitTrade = function() {
    selectedStock = false;
    buttons[5].showing = false;
    buttons[6].showing = false;
    tradeAmount = false;
    for (var s in valueObjects) {
        valueObjects[s].button.highlighted = false;
    }
};

var makeTrade = function() {
    var price = tradeAmount * selectedStock.value;
    cash -= price;
    if (tradeAmount > 0) {
        selectedStock.basis += price;   
    } else {
        selectedStock.basis *= (1 + tradeAmount/selectedStock.amount);
    }
    
    selectedStock.amount += tradeAmount;
    quitTrade();
};

var selectMarketPage = function() {
    page = "Market";
    // would like to remove this if I can make it work
    selectedStock = false;
    for (var s in valueObjects) {
        valueObjects[s].button.showing = true;
    }
    quitTrade();
};

var selectPortfolioPage = function() {
    page = "Portfolio";
    selectedStock = false;
    for (var s in market.stocks) {
        market.stocks[s].button.showing = true;
    }
    market.button.showing = false;
};

var selectNewsPage = function() {
    page = "News";
    for (var s in valueObjects) {
        valueObjects[s].button.showing = false;
    }
    quitTrade();
};

var selectAnalysisPage = function() {
    page = "Analysts' Opinions";
    for (var s in valueObjects) {
        valueObjects[s].button.showing = false;
    }
    quitTrade();
};

var createStockButtons = function() {
    var y = 40;
    
    for (var s in valueObjects) {
        var stock = valueObjects[s];
        var b = new Button(14, y, 35, 18, buttonText,
                           quitTrade, stock.tla);
        b.showing = true;
        b.defaultCol = color(200, 200, 200);
        b.highlightCol = color(100, 100, 100);
        b.highlightOnClick = true;
        buttons.push(b);
        stock.button = b;
        y += 20;
    }
};

/*************************************************
 *    Create GUI objects
*************************************************/

// All the buttons we'll ever need
var tradeButton = new Button(296, 340, 44, 20,
                    buttonText, makeTrade, "Trade");
var quitButton = new Button(344, 340, 36, 20,
                    buttonText, quitTrade, "Quit");
quitButton.highlightCol = color(250, 20, 20);
tradeButton.highlightCol = color(0, 168, 0);

buttons = [
    new Button(316, 3, 18, 18, graphButton, selectMarketPage),
    new Button(337, 3, 18, 18, portfolioButton, selectPortfolioPage),
    new Button(358, 3, 18, 18, newsButton, selectNewsPage),
    new Button(379, 3, 18, 18, viewsButton, selectAnalysisPage),
    new Button(3, 3, 18, 18, nextButton, nextDay),
    tradeButton,  
    quitButton
];
createStockButtons();

buttons[0].showing = true;
buttons[1].showing = true;
buttons[2].showing = true;
buttons[3].showing = true;
buttons[4].showing = true;

var graphDaySlider = new Slider(208, 244, 146, 8, 300, 300);
var tradeSlider = new Slider(150, 345, 100, 0, 1, 0);
var sliders = [graphDaySlider, tradeSlider];

/*************************************************
 *    Drawing functions
*************************************************/

var drawTopBar = function() {    
    fill(10);
    strokeWeight(1);
    stroke(200);
    rect(-1, -2, 402, 26);
    fill(240);
    
    textFont(sansFont, 11);
    textAlign(LEFT, TOP);
    text("Day: " + dayCount, 25, 5);
    
    textFont(impFont, 20);
    textAlign(CENTER, TOP);
    text(page, 200, 2);
};

var drawTicker = function() {
    var y = 380;
    
    fill(10);
    strokeWeight(1);
    stroke(200);
    rect(-1, y, 402, 22);
    
    noStroke();
    textFont(monoFont, 12);
    textAlign(LEFT, BASELINE);
    
    var dx = 110;
    var tickerWidth = dx * stocks.length;
    var x = tickerWidth - dx - (frameCount % tickerWidth);
    y += 16;
    
    for (var s in stocks) {
        var stk = stocks[s];
        
        if (round(stk.change) === 0) {
            fill(200);
            ellipse(x+80, y-5, 7, 7);
        } else if (stk.change >= 0) {
            fill(0, 145, 0);
            triangle(x+75, y-1, x+85, y-1, x+80, y-9);
        } else {
            fill(NEGCOL);
            triangle(x+75, y-9, x+85, y-9, x+80, y-1);
        }
        
        fill(200);
        text(stk.tla + ": " + writePrice(stk.change, true), x, y);
        x = (x + 2*dx) % tickerWidth - dx;
    }
};

var drawTradeOptions = function(x, y) {
    var x = 25;
    var y = 285;
    var days = graphDaySlider.val;
    var target = selectedStock || highlightedStock;
    
    strokeWeight(1);
    stroke(200);
    fill(250);
    rect(15, y-18, 370, 107, 4);
    
    // Stock details
    fill(20);
    textAlign(LEFT, BASELINE);
    textFont(sansFont, 12);
    var txt = target.name + " (" + target.tla + ")";
    txt += " trading at: $" + writePrice(target.value);
    txt += " (" + writePrice(target.change, true) + ").";
    text(txt, x, y);
    
    y += 22;
    text("Prices over the last " + days + " days:",x, y);
    y += 18;
    var value = findStatsOverTime(target.values, days, findMin);
    text("Min: $" + writePrice(value), x + 10, y);
    value = findStatsOverTime(target.values, days, findMax);
    text("Max: $" + writePrice(value), x + 110, y);
    value = findStatsOverTime(target.values, days, findAverage);
    text("Mean: $" + writePrice(value), x + 210, y);
    
    y += 24;
    if (target === market) { return; }
    
    if (selectedStock) {
        // Show options to buy and sell stock
        if (mouseIsPressed && highlightedStock &&
            highlightedStock !== selectedStock) {
            quitTrade();
        }

        tradeSlider.draw();
        fill(20);
        text("Stocks to trade:", x, y);
        text(tradeSlider.max, tradeSlider.x + tradeSlider.width + 12, y+55);
        textAlign(RIGHT, BASELINE);
        text(-selectedStock.amount, tradeSlider.x-8, y);
        
        textAlign(LEFT, BASELINE);
        tradeAmount = round(sliders[1].val);
        if (tradeAmount !== 0) {
            if (tradeAmount > 0) {
                txt = "Buy " + tradeAmount;
            } else {
                txt = "Sell " + abs(tradeAmount);
            }
            txt += " " + selectedStock.tla + " stocks for $";
            txt += writePrice(abs(tradeAmount) * selectedStock.value);
            text(txt, x, y+20);   
        }
        
    } else {
        var maxBuy = floor(cash / target.value);
        
        if (maxBuy > 0 || target.amount > 0) {
            txt = "Click to buy up to " + maxBuy + " stock";
            
            if (target.amount) {
                txt += " and sell up to " + target.amount + " stock.";
            } else {
                txt += ".";
            }
            
            text(txt, x, y);
            //text("Click for trade options.", x, y + 55);
            if (mouseIsPressed) {
                selectedStock = target;
                tradeSlider.calibrate(-target.amount, maxBuy);
                tradeButton.showing = true;
                quitButton.showing = true;
            }
        } else {
            text("You can't afford this stock", x, y);
        }
    }
};

var drawGraphLine = function(values, gx, gy, gw, gh, n, sx, sy) {    
    var x1 = gx + gw;
    var y1 = gy + gh - sy * values[values.length-1];
    
    for (var i=0; i <= min(values.length-1, n); i++) {
        var x2 = gx + gw - sx * i;
        var y2 = gy + gh - sy * values[values.length - 1 - i];
        line(x1, y1, x2, y2);
        x1 = x2;
        y1 = y2;
    }
};

var drawGraph = function() {
    buttons[0].highlighted = true;
    var gx = 68;
    var gy = 56;
    var gw = 300;
    var gh = 160;
    
    highlightedStock = false;
    for (var o in valueObjects) {
        if (valueObjects[o].button.highlighted) {
            highlightedStock = valueObjects[o];
            break;
        }
        if (valueObjects[o].button.mouseover) {
            highlightedStock = valueObjects[o];
        }
    }

    // Scaling x-axis
    fill(20);
    textFont(sansFont, 11);
    textAlign(LEFT, CENTER);
    var n = 4 * round(graphDaySlider.val / 4);
    var sx = gw / n;
    var txt = "Prices for last " + n + " days";
    text(txt, gx - 1, gy + gh + 26);
    graphDaySlider.draw();

    // Calculate y-axis scale
    var maxValue = 5;
    if (!highlightedStock) {
        // Find maximum value for all stocks over time period
        for (var s in stocks) {
            var m = findStatsOverTime(stocks[s].values, n, findMax);
            maxValue = max(maxValue, m);
        } 
    } else {
        maxValue = findStatsOverTime(highlightedStock.values, n, findMax);
    }
    
    maxValue = 200 * ceil(maxValue / 200);
    var sy = gh / maxValue;

    // Gridlines
    fill(20);
    textFont(sansFont, 9);
    stroke(215);
    strokeWeight(1);

    for (var i=0; i<=5; i++) {
        var y = gy + gh * (1 - i/5);
        var x = gx + gw * (1 - i/4);
        
        textAlign(LEFT, CENTER);
        text(round(maxValue/100 * i/5), gx + gw + 10, y);
        
        if (i < 5) {
            line(gx, y, gx + gw + 4, y);
            line(x, gy, x, gy + gh + 4);
            
            textAlign(CENTER, TOP);
            text(n*i/4, x, gy + gh + 5);   
        }
    }
    
    // Bottom axis
    stroke(20);
    strokeWeight(2);
    line(gx, gy + gh + 1, gx + gw + 4, gy + gh + 1);
    
    strokeWeight(1);
    if (!highlightedStock) {
        // Draw graph of all stocks
        for (var s in stocks) {
            stroke(stocks[s].colour);
            drawGraphLine(stocks[s].values, gx, gy, gw, gh, n, sx,sy);
        }
    } else {
        // Draw graph of highlighted stock
        stroke(highlightedStock.colour);
        drawGraphLine(highlightedStock.values, 
                      gx, gy, gw, gh, n, sx, sy);
    }

    if (highlightedStock) {
        drawTradeOptions();
    }
};

var writePrices = function() {
    var x = 10;
    var y = 208;
    var w = 380;
    
    fill(5);
    stroke(200);
    rect(x, y, w, stocks.length*20+5, 4);
    
    textFont(monoFont, 11);
    fill(217, 131, 3);
    
    var ty = y + 5;
    for (var s in stocks) {
        var stk = stocks[s];
        textAlign(LEFT, TOP);
        text(stk.name, x+8, ty);
        text(stk.tla, x+145, ty);
        
        textAlign(RIGHT, TOP);
        text(writePrice(stk.min), x+220, ty);
        text(writePrice(stk.max), x+270, ty);
        text(writePrice(stk.value), x+320, ty);
        text(writePrice(stk.change, true), x+370, ty);
        ty += 20;
    }
};

var drawPortfolio = function() {
    buttons[1].highlighted = true;
    var x = 15;
    var y = 53;
    var dx = 68;
    var dy = 20;
    
    fill(20);
    noStroke();
    textAlign(CENTER, BASELINE);
    textFont(impFont, 16);
    text("Amount", x + dx, y);
    text("Change", x + dx * 2, y);
    text("Basis", x + dx * 3, y);
    text("Value", x + dx * 4, y);
    text("Profit", x + dx * 5, y);
    
    textFont(sansFont, 11);
    y += 20;
    
    var assets = cash;
    highlightedStock = false;
    
    for (var s in stocks) {
        var stock = stocks[s];
        var value = 0;
        if (stock.amount) {
            value = stock.value * stock.amount;   
        }
        assets += value;
        
        if (mouseY >= y - 15 && mouseY < y + 4) {
            highlightedStock = stock;
            fill(220);
            rect(30, y-13, 360, dy-2);
        }
        if (selectedStock === stock) {
            fill(160);
            rect(30, y-13, 360, dy-2);
        } 
        
        fill(20);        
        textAlign(RIGHT, BASELINE);
        text(stock.amount, x + dx + 10, y);
        
        if (stock.amount) {
            text("$" + writePrice(stock.basis), x + dx * 3 + 20, y);
        } else {
            textAlign(CENTER, BASELINE);
            text("-", x + dx * 3, y);
        }
        
        if (stock.amount) {
            textAlign(RIGHT, BASELINE);
            text("$" + writePrice(value), x + dx * 4 + 20, y);
        } else {
            textAlign(CENTER, BASELINE);
            text("-", x + dx * 4, y);
        }
        
        if (stock.amount) {
            var profit = stock.amount * stock.value - stock.basis;
            if (profit < 0) { fill(NEGCOL); }
            text("$" + writePrice(profit), x + dx * 5 + 20, y);
        } else {
            textAlign(CENTER, BASELINE);
            text("-", x + dx * 5, y);
        }
        
        y += dy;
    }
    
    y += 6;
    fill(20);
    textAlign(LEFT, BASELINE);
    textFont(impFont, 15);
    text("Cash:", x, y);
    textAlign(RIGHT, BASELINE);
    textFont(sansFont, 12);
    text("$" + writePrice(cash), x + dx * 3 + 20, y);

    y += 20;
    textAlign(LEFT, BASELINE);
    textFont(impFont, 15);
    text("Total Assets:", x, y);
    textAlign(RIGHT, BASELINE);
    textFont(sansFont, 12);
    text("$" + writePrice(assets), x + dx * 3+20, y);
    
    if (selectedStock || highlightedStock) {
        drawTradeOptions();
    }
};

var drawNews = function() {
    buttons[2].highlighted = true;
    var tx = 25;
    var ty = 50;
    
    textAlign(LEFT, BASELINE);
    textFont(sansFont, 20);
    
    strokeWeight(1);
    stroke(200);
    
    for (var n = dailyNews.length-1; n >= 0; n--) {
        var news = dailyNews[n];        
        var nArticles;
        
        if (dailyNews.length - 1 - n === selectedNews) {
            nArticles = news.length;
        } else {
            nArticles = 1;
        }
        
        fill(255);
        rect(tx - 5, ty - 18, 405 - 2 * tx, 24 + nArticles * 18, 3);
        
        fill(20);
        textSize(15);
        text("Day: " + (dayCount - dailyNews.length + 1 + n), tx, ty);
        
        textSize(11);
        for (var i=0; i<nArticles; i++) {
            ty += 18;
            text(news[i], tx+5, ty);
        }
        ty += 26;
    }
};

var drawAnalysts = function() {
    buttons[3].highlighted = true;
    var x = 50;
    var tx = 110;
    var y = 40;
    var dy = (400 - y - 25) / analystNames.length;
    
    strokeWeight(1);
    stroke(200);
    textAlign(CENTER, CENTER);
    
    for (var i in analystNames) {
        fill(255);
        var ty = y + i * dy;
        rect(tx, ty, 380 - tx, dy - 10, 5);
        
        fill(20);
        textFont(impFont, 20);
        textSize(16);
        text(analystNames[i] + " says:", x, ty + 13);
        image(analystPics[i], x - 30, ty - 3, 50, 85);
        
        textFont(sansFont, 20);
        textSize(12);
        text(analystComments[i], tx + 5, ty + 5, 370 - tx, dy - 20);
    }
};

// Map mode to draw function
var drawFunctions = {
    "Market": drawGraph,
    "Portfolio": drawPortfolio,
    "News": drawNews,
    "Analysts' Opinions": drawAnalysts
};

var draw = function() {    
    background(240, 240, 255);
    drawFunctions[page]();
    
    drawTopBar();
    drawTicker();
    for (var b in buttons) {
        buttons[b].draw();
    }
};

/*************************************************
 *    Event handling
*************************************************/

var keyPressed = function() {
    if (keyCode === 32) {
        running = !running;
    }
};

var mouseMoved = function() {
    for (var b in buttons) {
        buttons[b].highlight();
    }
};

var mousePressed = function() {
    var clicked = false;
    for (var b in buttons) {
        if (buttons[b].click()) {
            clicked = buttons[b];
        }
    }
    
    // Un-highlight other buttons
    if (clicked) {
        for (var b in buttons) {
            if (buttons[b] !== clicked) {
                buttons[b].highlighted = false;
            }
        }
    }
    
    for (var s in sliders) {
        sliders[s].selected();
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