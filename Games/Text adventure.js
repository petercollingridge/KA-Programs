https://www.khanacademy.org/cs/into-the-goblins-lair/6232995006513152

/******************************************************
 * Work in Progress
 *  - The general game framework is in place (though needs some tweaking)
 *  - But need to create the fill out the story
 *  - and add game elements / challenges
 * 
 * To play, click in the lower box and type a command
 * Type help for examples of commands
 * Use the left arrow as backspace
 * Use up and down arrows to get previous commands
 * 
 * To Do
 *  - Allow give function to work with a subject (e.g. a person)
 *  - Deal with plurals somehow
 *  - Have separate info and description
 *  - Scrolling
 *  - Add "go back" command
 *  - Command shortcuts e.g. n for north
 *  - Allow player to answer "climb what" style questions
 *  - Different colour to command parts
 *  - Add challenges!
 *  - Automate adding positions of places
********************************************************/

// Colours
var BACKGROUND = color(24, 24, 20);
var PROMPT = color(40, 40, 34);
var GREY = color(248, 248, 242);
var RED = color(250, 40, 110);
var BLUE = color(100, 216, 206);
var GREEN = color(130, 225, 45);
var ORANGE = color(250, 150, 30);
var YELLOW = color(230, 220, 115);

var lastCommand = 0;
var command = "> ";
var commands = [];
var outputs = [['description', "You have been walking across the moors for many hours, looking for adventure. Just as you were beginning to give up hope you spot a ramshackled village in the distance."]];

// Player properties
// TODO: put into a object
var health = 100;
var tasksCompleted = 0;

// Map words to existing commands
var synonyms = {
    walk: 'go',
    run: 'go',
    enter: 'go',
    exit: 'leave',
    get: 'take',
    grab: 'take',
    steal: 'take',
    pick: 'take',
    look: 'describe',
    see: 'describe',
    inspect: 'describe',
    put: 'drop',
    leave: 'drop',
    discard: 'drop',
    say: 'talk',
    speak: 'talk',
    chat: 'talk',
    stab: 'attack',
    slash: 'attack',
    cut: 'attack',
    chop: 'attack',
    kill: 'attack'
};

// Object you own mapped to their description and number
var inventory = [
    {
        synonyms: ["coin", "coins", "money", "copper"],
        desc: "A dull copper coin.",
        num: 8
    },
    {
        synonyms: ["sword", "weapon"],
        desc: "Your father's sword. It's huge - nearly as big as you."
    }
];

/*********************************************************
 *   Array functions
 * Functions for dealing with arrays of object whose names
 * are kept in the property synonyms
**********************************************************/

// If object in arr return its position other return false
// Only check the first name in the synonyms array
var getPositionInArray = function(obj, arr) {
    for (var i = 0; i < arr.length; i++) {
        if (obj === arr[i].synonyms[0]) {
            return i;
        }
    }
    return false;
};

var addObjectToArray = function(obj, arr) {
    var n = obj.num || 1;
    var index = getPositionInArray(obj, arr);
    if (index) {
        arr[index].num += n;
    } else {
        obj.canTake = true;
        obj.num = n;
        arr.push(obj);
    }
};

// Return an array of all the objects in a given array that have
// the given name or a synonym property containing that name
var findNamedObjectInArray = function(name, arr) {
    var results = [];

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].synonyms.indexOf(name) !== -1) {
            results.push(arr[i]);
        }
    }
    return results;
};

var describeInventory = function() {
    if (inventory.length === 0) {
        return "You don't have anything.";
    } else {
        var s = "You have ";
        for (var i = 0; i < inventory.length; i++) {
            if (inventory[i].num && inventory[i].num > 1) {
                s += inventory[i].num + "x ";
            }
            s += inventory[i].synonyms[0];
            if (i !== inventory.length - 1) {
                s += ", ";
            }
        }
        return s + ".";
    }
};

/*********************************************************
 *      - Person object -
 *  
 * People have a name, a description and an array of dialogue.
 * The dialogue lists what you say followed by their response.
**********************************************************/

var Person = function(name, synonyms, description, dialogue) {
    this.name = name;
    this.synonyms = synonyms;
    this.desc = description;
    this.dialogue = dialogue || [];
};

Person.prototype.talk = function() {
    if (this.dialogue.length > 0) {
        return ['dialogue', this.dialogue.shift()];
    } else if (this.repeat) {
        return ['dialogue', this.repeat];
    } else {
        return [true, "You have nothing to say to " + this.name];
    }
};

Person.prototype.give = function(obj) {
    return false;
};

/*******************************************************
 *  Generic Place object to determine what commands do
********************************************************/
var Place = function(description, neighbours, elements) {
    this.description = description;
    this.neighbours = neighbours || {};
    this.elements = elements || [];
    this.people = [];
};

/*******************************************************
 *  Key function dealing with commands
 * There should be no need to edit this
********************************************************/
Place.prototype.enterCommand = function() {
    // Split command into [verb, object]
    var parts = command.split(" ");
    
    // If object doesn't exist add a false one
    // Assume verb is first word and object is last word
    // Therefore accept commands like "talk to woman"
    if (parts.length < 3) { parts.push(false); }
    var verb = parts[1];
    var obj = parts[parts.length - 1];
    
    var shortCommand = verb;
    if (obj) {
        shortCommand += " " + obj;
    }

    var result = this.useCommand(verb, obj);
    if (result[0] === 'dialogue') {
        outputs.push(['correct command', shortCommand]);
        outputs.push(['dialogue 1', result[1][0]]);
        if (result[1][1]) {
            outputs.push(['dialogue 2', result[1][1]]);   
        }
    } else if (result[0]) {
        outputs.push(['correct command', shortCommand]);
        outputs.push(['description', result[1]]);
    } else {
        outputs.push(['incorrect command', shortCommand]); 
        outputs.push(['description', result[1]]);
    }
    
    commands.push("> " + shortCommand);
    command = "> ";
    lastCommand = 0;
};

// If command or an synonym exists then call it with the parameter
// Return true if command is understood
Place.prototype.useCommand = function(verb, obj) {
    if (this[verb]) {
        return this[verb](obj);
    } else if (synonyms[verb]) {
        return this[synonyms[verb]](obj);
    }
    return [false, "I don't understand that command."];
};

// Call command and output result without outputting command
Place.prototype.getResult = function(verb, obj) {
    var result = this.useCommand(verb, obj);
    outputs.push(['description', result[1]]);
};

/*********************************************************
 *      - Generic Place functions -
 *  
 * These determine which commands that can be called at
 * any place, but can be overridden.
 * 
 * Functions must return an array in which
 * the first value is whether the command was understood
 * the second value is string to output
**********************************************************/
var places, currentPlace;

Place.prototype.help = function() {
    return [true, "Type a command such as 'go north' or 'see inventory' (or just 'inv')."];
};

// inv is a shortcut to show the inventory
Place.prototype.inv = function() {
    return [true, describeInventory()];
};

// If object given then describe it, otherwise describe place
Place.prototype.describe = function(obj) {
    // Describe object or person
    if (obj) {
        
        // Describe the whole inventory
        if (obj === 'invent' || obj === 'inventory') {
            return[true, describeInventory()];
        }
        
        // Describe an object in the inventory, a person or an element in the place
        var target = findNamedObjectInArray(obj, inventory);
        target = target.concat(findNamedObjectInArray(obj, this.people));
        target = target.concat(findNamedObjectInArray(obj, this.elements));
        
        if (target.length === 1) {
            return[true, target[0].desc];
        } else if (target.length > 1) {
            return[true, "Can you be more specific?"];
        }
        return [false, "You can't see that."];
    } else {
        // Describe environment
        var desc = this.description;
     
        var elements = [];
        for (var i = 0; i < this.elements.length; i++) {
            var element = this.elements[i];
            if (element.canTake && !element.hidden){
                var n = element.num || 1;
                if (n > 1) {
                    elements.push(n + "x " + element.synonyms[0]);
                } else {
                    elements.push("a " + element.synonyms[0]);   
                }
            }
        }
        
        if (elements.length > 0) {
            desc += " You can see " + elements.join(", ") + ".";
        }
        
        return [true, desc];
    }
};

// Talk to someone
Place.prototype.talk = function(person) {
    if (!person) { return [false, "Talk to who?"]; }
    
    if (person === 'self') {
        return [true, "You talk to yourself."];
    } else {
        var target = findNamedObjectInArray(person, this.people);
        if (target.length === 1) {
            return target[0].talk();
        } else if (target.length > 1) {
            return [true, "Can you be more specific?"];
        }
        return [true, person + " isn't here."];   
    }
};

// Change place if possible
Place.prototype.go = function(direction) {
    if (!direction) { return [false, "Go where?"]; }
    
    var nextPlace = this.neighbours[direction];
    
    if (nextPlace) {
        if (places[nextPlace]) {
            currentPlace = places[nextPlace];
            return currentPlace.useCommand("describe");   
        } else {
            return [true, "You are unable to go there."];
        }
    }
    
    return [false, "You can't go " + direction + "."];
};

// Take an object
Place.prototype.take = function(obj) {
    if (!obj) { return [false, "Take what?"]; }
    
    var takeObj = findNamedObjectInArray(obj, this.elements);
    if (takeObj.length === 1) {
        if (takeObj[0].canTake) {
            addObjectToArray(takeObj[0], inventory);
            var index = getPositionInArray(obj, this.elements);
            this.elements.splice(index, 1);
            return [true, "You take the " + obj];
        } else {
            return [true, "You can't take the " + obj];
        }
    } else if (takeObj.length > 1) {
        return [true, "Can you be more specific"];
    }
    return [false, "You can't take that."];
};

Place.prototype.drop = function(obj) {
    if (!obj) { return [false, "Drop what?"]; }
    
    var dropObj = findNamedObjectInArray(obj, inventory);
    if (dropObj.length === 1) {
        addObjectToArray(dropObj[0], this.elements);
        var index = getPositionInArray(obj, inventory);
        inventory.splice(index, 1);
        return [true, "You drop the " + obj];
    }
    return [false, "You don't own that."];
};

// Take an object
Place.prototype.give = function(obj) {
    if (!obj) { return [false, "Give what?"]; }
    
    var giveObj = findNamedObjectInArray(obj, inventory);
    if (giveObj.length === 1) {
        if (this.people.length === 1) {
            if (this.people[0].give(obj)) {
                var index = getPositionInArray(obj, inventory);
                inventory.splice(index, 1);
                return [true, "You give the " + obj];
            } else {
                return [true, this.people[0].name + " doesn't want the " + obj];
            }
        } else {
            return [true, "There's no one to give that to."];
        }
    }
    return [false, "You don't own that."];
};

Place.prototype.attack = function(obj) {
    if (!obj) { return [false, "Attack who?"]; }
    return [true, "You can't attack that."];
};

Place.prototype.kiss = function(obj) {
    if (!obj) { return [false, "Kiss who?"]; }
    return [true, "It's probably better not to kiss that."];
};

Place.prototype.sit = function() {
    return [false, "There is nowhere to sit here."];
};

Place.prototype.dance = function() {
    return [true, "You do a little dance. You're weird."];
};

Place.prototype.sing = function() {
    return [true, "You sing a short song."];
};

/*********************************************************
 *      - Specific places (edit these) -
 * Places are area, rooms etc. where the player can be.
 * See below for examples
 * 
 * Create a new place with:
 *   var placeName = new Place("description", map, elements);
 * 
 * Map is an object that associates a direction 
 * with a place name, e.g.
 *      {north: 'placeA', east: 'placeB'}
 * 
 * Elements is an array of objects. Element objects should be in the form:
 *  {synonyms: [list, of, possible, names]
 *   desc: "description", 
 *   canTake: true,
 *   hidden: false,
 *   num: 1}
 * 
 * All elements should have a list of synonyms and a description and can have:
 *  canTake: true if the player can take it
 *  hidden: true if the player can't see it
 *  num: the number there (default 1)
 * 
 * Map and elements are optional
 * 
 * To define a command that can be given in a place with:
 *   placeName.commandName = function(object) {
 *      return [true, "Do commandName on object"];
 *   };
 * This function is called by typing commandName or
 * commandName object
**********************************************************/
var villageOutskirts = new Place("You are on the outskirts of a small village. It seems very quiet, but who knows, maybe there are opportunities for adventure here. The entrance to the village is north.",
    { north: 'villageEntrance',
      village: 'villageEntrance'});

villageOutskirts.enter = function() {
    return this.go("north");
};

var villageEntrance = new Place("You are at the start of the village. The village continues to the north. To the west is a blacksmith's. To the east, a small path leads to a cluster of house.",
    { south: 'villageOutskirts',
      north: 'villageCenter',
      east: 'villageHouses',
      west: 'villageBlacksmith' }
);

var villageBlacksmith = new Place("The blacksmith's seems to be closed. It is secured by a heavy lock.",
    { east: 'villageEntrance' },
    [
        {synonyms: ["lock"],
         desc: "The lock is very strong and well made, as you would expect from a blacksmith's."}
    ]
);

var villageCenter = new Place("You are standing at the center of the village. To the north is what looks like an apothecary. To the west is a tavern called 'The Golden Fleece'. To the east is the village green with a great oak at its center.",
    { north: 'villageApothecary',
      apothecary: 'villageApothecary',
      east: 'villageGreen',
      green: 'villageGreen',
      tree: 'villageGreen',
      oak: 'villageGreen',
      south: 'villageEntrance',
      west: 'villageTavern'}
);

var villageHouses = new Place("The path ends at five run-down houses. The sound of a woman crying comes from the house to the east.",
    { east: 'houseOfCryingWoman',
      west: 'villageEntrance'}
);

var villageFarm = new Place("At the edge of the village is a small area of farm land surrounded by a fence. The earth is heavily churned and there's not much growing. In the middle is a strange green scarecrow. To the north, the land rises sharply to a craggy mountainside.",
    { south: 'villageGreen', north: 'mountainSide'},
    [
        {synonyms: ["earth", "mud"], desc: "Picking through the earth, you see a long worm."},
        {synonyms: ["worm"], desc: "The worm wiggles back into the earth."},
        {synonyms: ["fence"], desc: "The fence has been damaged at one side."},
        {synonyms: ["scarecrow"],
         desc: "The scarecrow looks like a giant, muscly toad. Perhaps it was once alive, but definitely isn't any more."}
     ]
);

villageFarm.attack = function(obj) {
    if (!obj) { return [false, "Attack who?"]; }
    
    if (obj === 'scarecrow') {
        var scarecrow = findNamedObjectInArray('scarecrow', this.elements)[0];
        scarecrow.desc = "A splintered pole sticks out of the ground with two sinewy legs tied to it. The upper half of the scarecrow lies broken, on the ground";
        return [true, "Your blade swings and with a crunch of old bones, splits the ugly scarecrow in two."];
    }
    
    return [true, "You can't attack that."];
};

var villageGreen = new Place("A square of scraggly grass forms the village green. At its center is a huge oak tree with a poster pinned to it. To the south are a small group of houses. To the west is the center of the village. To the north is some farm land.",
    { north: 'villageFarm',
      west: 'villageCenter',
      south: 'villageHouses' },
    [
        {synonyms: ["grass"], desc: "The grass doesn't look very interesting."},
        {synonyms: ["oak", "tree"],
         desc: "The tree is huge and gnarled with many thick branches coming off at head height. It must be very old."},
        {synonyms: ["poster"], 
         desc: 'The poster says "The village council will pay one silver coin for every Goblin head delivered."',
         canTake: true }
    ]
);

villageGreen.climb = function(obj) {
    if (!obj) { return [false, "Climb what?"]; }
    
    if (obj === 'tree' || obj === 'oak') {
        currentPlace = places.villageOakTree;
        return currentPlace.useCommand("describe"); 
    }
    
    return [true, "You can't climb that."];
};

var villageOakTree = new Place("The oak tree is easy to climb. Close to the top you can look out at the village. It's not much to look at. In the north you see the mountains rising up, overshadowing the poor village.",
    { down: 'villageGreen', back: 'villageGreen' },
    [
        {synonyms: ["borer", "beetle", "bug"],
         desc: "There are little beetles crawling over some branches.", canTake: true, hidden: true}
    ]
);
    
villageOakTree.climb = function(obj) {
    return this.go(obj);
};

// Add places here so we can refer to them by name
places = {
    villageOutskirts: villageOutskirts,
    villageEntrance: villageEntrance,
    villageBlacksmith: villageBlacksmith,
    villageCenter: villageCenter,
    villageOakTree: villageOakTree,
    villageHouses: villageHouses,
    villageGreen: villageGreen,
    villageFarm: villageFarm,
};

// Create the apothecary place and person
var createApothecary = function() {
    var desc = "You enter a small wooden building. You can't see the ceiling for hanging plants and strange objects you have never seen before. Along the walls are book shelves, stuffed with books and glass jars of beans, berries and small creatures. At the centre of this jumble is an intelligent-looking woman who must be the apothecary.";
    
    // Objects
    var plant = { desc: "The plants on the ceiling are dried and and crips. There are leaves of every imaginable shape and colour." };
    
    var book = { desc: "You take a book from the book shelf. It is calld 'On the many and various uses of common meadow plants in the treatment of stomach ailments.'" };
    
    var apothecary = new Place(desc,
        { south: 'villageCenter' },
        { plant: plant, book: book });
    
    apothecary.leave = function() {
        return this.go("south");
    };
    
    // Woman who owns the apothecary
    var dialogue = [
["Hello", "Hello, can I help you?"],
["Actually, I was wondering if I could help you. I'm looking for adventure!", "I see... In that case you could help me collect some pinhole borers. I need them to make fleece rot tincture and I've run out."],
["OK, I could do that. How do I find them?", "They live on oak trees and they're dark, reddish brown."],
["I shan't fail you!"]
    ];
    
    var apothecaryWoman = new Person('the apothecary',
        ['apothecary', 'woman', 'lady', 'person', 'owner'],
        "The apothecary is a tall, slim woman with bright green eyes. She looks at you with a curious gaze and a slight smile.",
    dialogue);
    
    apothecaryWoman.repeat = ["Hello again, I've forgotten what you wanted.", "Pinhole borers. They're small beetles that attack oak trees."];
    apothecary.people = [apothecaryWoman];
    places.villageApothecary = apothecary;
};
createApothecary();


// Define starting place and call its description.
currentPlace = villageOutskirts;
currentPlace.getResult('describe');

/*****************************************************
 *  Global parameters
******************************************************/

// Display parameters
var myFont = createFont("monospace", 14);
var fontSize = 12;
var CURSORBLINK = 20;

var commandPromptX = 10;
var commandPromptY = 374;
var maxWidth = width - 2 * commandPromptX;

// Mapping keyCode to output
var LETTERS = "abcdefghijklmnopqrstuvwxyz";
var NUMBERS = {
    32: " ", 48: '0', 49: '1', 50: '2', 51: '3',
    52: '4', 53: '5', 54: '6', 55: '7', 56: '8',  57: '9'
};

/*****************************************************
 *  Draw functions
******************************************************/
var drawTopBar = function() {
    var h = 21;
    fill(PROMPT);
    stroke(60, 60, 56);
    rect(-1, -1, width + 2, h);
    
    fill(GREY);
    textFont(myFont, 14);
    textSize(12);
    textAlign(LEFT, BASELINE);
    
    var ty = h - 6;
    text("Health: " + health + "%", 8, ty);
    text("Items: " + inventory.length, 120, ty);
    text("Tasks Completed: " + tasksCompleted, 200, ty);
};

var drawCommandPrompt = function() {
    fill(PROMPT);
    stroke(60, 60, 56);
    rect(-1, commandPromptY, width + 2, height - commandPromptY);
    
    fill(GREY);
    textFont(myFont, 14);
    textSize(fontSize);
    textAlign(LEFT, BASELINE);
    
    var ty = commandPromptY + textAscent() + 8;
    text(command, commandPromptX, ty);
    
    if (focused && frameCount % CURSORBLINK < CURSORBLINK / 2) {
        stroke(GREY);
        var x = commandPromptX + textWidth(command) + 2;
        line(x, ty, x, ty - textAscent());
    }
};

var drawOldOutput = function() {
    textFont(myFont, 14);
    textSize(fontSize);
    textAlign(LEFT, BASELINE);
    
    var ty = commandPromptY - 8;
    var dy = 16;
    
    for (var i = outputs.length - 1; i >= 0; i--) {
        fill(GREY);
        var txt = outputs[i];
        var tx = commandPromptX;
        
        // Calculate how high we are after wrapping
        // Doesn't always work
        var predictedHeight = ceil(1.1 * textWidth(txt[1])/maxWidth);
        ty -= 16 * predictedHeight;

        if (txt[0] === 'description') {
            ty -= 8;
        } else if (txt[0] === 'correct command') {
            text("> ", tx, ty, maxWidth, 400);
            fill(BLUE);
            tx += textWidth("> ");
        } else if (txt[0] === 'incorrect command') {
            text("> ", tx, ty, maxWidth, 400);
            fill(RED);
            tx += textWidth("> ");
        } else if (txt[0] === 'dialogue 1') {
            fill(ORANGE);
        } else if (txt[0] === 'dialogue 2') {
            fill(YELLOW);
            ty -= 8; 
        }
        
        text(txt[1], tx, ty, maxWidth, 400);
        if (ty < 0) { break; }
    }
};

var draw =function() {
    background(BACKGROUND);
    drawOldOutput();
    drawTopBar();
    drawCommandPrompt();
};

/*****************************************************
 *  Event handling
******************************************************/
// Use up and down arrows to get previous commands
var getOldCommand = function() {
    var n = max(0, commands.length - lastCommand);
    if (n < commands.length) {
        command = commands[n];   
    } else {
        command = "> ";
    }
};

var keyPressed = function() {
    //println(keyCode);
    
    // Press enter
    if (keyCode === 10 && command.length > 2) {
        currentPlace.enterCommand();
    }
    
    // Text too long
    if (command.length > 40) {
        return;
    }
    
    if (keyCode > 64 && keyCode < 91) {
        command += LETTERS[keyCode - 65];
    } else if (keyCode in NUMBERS) {
        command += NUMBERS[keyCode];
    } else if (keyCode === 37 || keyCode === DELETE || keyCode === BACKSPACE) {
        // Left arrow used as backspace
        if (command.length > 2) {
            command = command.slice(0, command.length - 1);   
        }
    } else if (keyCode === 38) {
        lastCommand++;
        getOldCommand();
    } else if (keyCode === 40) {
        lastCommand--;
        getOldCommand();
    }
};
