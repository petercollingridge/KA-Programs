https://www.khanacademy.org/computer-programming/hacker-puzzle-v2

/******************************************************
 * I'm attempting to make my hacker puzzle more 
 * functional and better coded. Also I hope to add
 * at least one more level.
 * 
 *      HOW TO PLAY
 * The game simulates a simple commandline interface.
 * Navigate by typing commands, then pressing enter.
 * 
 *      TIPS
 * Type help to get some suggestions.
 * Type cmd to get a list of possible commands
 * You can use alt to autocomplete file and folder names.
 * You can use the up and down arrows to browse your command history.
 * 
 * To Do:
 *  Create AddToTeams.exe
 *  Allow exes to be read
 *  Give exes clearance levels
 *  Allow programs to be run with parameters 
 *  Connection program
 *  Create sentinel.exe
 *  Scroll bar
 *  Secret bonus tasks
 *  Storyline elements
 * 
 *  r/w/x
 *  Piping into files
 *  Alias, sudo, chmod, rm, touch
 *  Allow commands separated by ;
 *  .bashrc
 *  Simple text editor
********************************************************/

/*****************************************************
 *  Functions for generating the world
******************************************************/

var randFromArray = function(arr) {
    return arr[floor(random() * arr.length)];
};

var clearanceNames = ['guest', 'user', 'admin', 'trusted', 'secure', 'special', 'secret']; 

/*****************************************************
 *  Keep track of what tasks the users has completed
******************************************************/

var taskManager = function() {
    this.count = 0;
    this.tasks = {};
    this.animation = 0;
    this.animationMax = 40;
};

taskManager.prototype.draw = function() {
    var tx = 8;
    var ty = height - 8;
    var txt = "Progress: ";

    textAlign(LEFT, BASELINE);
    textSize(13);
    fill(0);
    text(txt, tx, ty);
    
    tx += textWidth(txt);
    txt = this.count;
    text(txt, tx, ty);
    tx += textWidth(txt) / 2;
    
    if (this.animation > 0) {
        var d = (this.animationMax - this.animation);
        pushStyle();
        fill(0, 200, 0, 255 * this.animation / this.animationMax);
        textSize(13 + 0.5 * d);
        textAlign(CENTER, BASELINE);
        text("+1", tx, ty - d * 2);
        popStyle();
        this.animation--;
    }
};

taskManager.prototype.add = function(task) {
    if (!this.tasks[task]) {
        this.tasks[task] = true;
        this.count++;
        this.animation = this.animationMax;
    }
};

var tasks = new taskManager();

/*****************************************************
 *  Generic File object
 * Text files have canRead = true
 * Program files have canRun = true
******************************************************/

var File = function(name, clearance, parent, data) {
    this.name = name;
    this.clearance = clearance || 0;
    this.parent = parent;
    this.data = data || [];
    
    var txt = name.split(".");
    var n = txt.length;

    if (n > 0) {
        if (!txt[0]) {
            this.hidden = true;
            n--;
        }
        if (n > 0) {
            this.ext = txt[n - 1];
        }
    } else {
        this.ext = 'none';
    }

    this.canRead = true;
    
    if (this.ext === 'exe') {
        this.canRun = true;
        this.canRead = false;
        this.data.parent = this.parent;
    }
};

/*******************************************************
 *  Generic Folder object
 * Contains other files and folders
********************************************************/
var Folder = function(name, clearance, parent) {
    this.name = name;
    this.clearance = clearance;
    this.parent = parent;
    this.folders = {};
    this.files = {};
};

Folder.prototype.getPath = function() {
    if (this.parent) {
        return this.parent.getPath() + "/" + this.name;
    } else {
        return "";
    }
};

Folder.prototype.getFromPath = function(pathElements, clearance) {
    if (clearance !== undefined && this.clearance > clearance) {
        return [false, "PermissionError", this.name + ": you do not have read permission"];
    }
    
    if (pathElements.length === 0) {
        return [true, this];
    }

    var firstElement = pathElements.splice(0, 1)[0];
    
    if (firstElement === '..') {
        if (this.parent) {
            return this.parent.getFromPath(pathElements, clearance);

        } else {
            return [false, 'PathError', "Already at root"];
        }
    }
    
    var folder = this.folders[firstElement];
    if (folder) {
        return folder.getFromPath(pathElements, clearance);
    }
    
    var file = this.files[firstElement];
    if (file) {
        if (pathElements.length === 0) {
            return [true, file];
        } else {
            return [false, 'PathError', firstElement + ': Not a folder'];
        }
    } else {
        return [false, 'PathError', firstElement + ': Not a file or folder'];
    }
};

/*****************************************************
 *      Environment object
 * Environments are programs that runs on the
 * operating system.
 * They parse and respond to inputs,
 * and generate outputs.
 * 
 * Functions that don't start with an underscore
 * can be called via the terminal.
******************************************************/
var Environment = function(os) {
    this.os = os;
    this.helpString = ["Type a command and press enter."];
    this.prompt = "> ";
};

Environment.prototype._draw = function(x, y) {
    // Current input string
    
    var s1, s2;
    if (this.hideInput) {
        s1 = Array(this.os.inputBefore.length + 1).join("*");
        s2 = Array(this.os.inputAfter.length + 1).join("*");
    } else {
        s1 = this.os.inputBefore.join("");
        s2 = this.os.inputAfter.join("");
    }
    
    var str = this.prompt + s1;
    this._drawCursor(x + textWidth(str) + 1, y);
    text(str + s2, x, y);
};

Environment.prototype._drawCursor = function(x, y) {
    if (focused) {
        if (frameCount % this.os.blink < this.os.blink / 2) {
            noStroke();
            rect(x, y - textAscent() - 1, 7, textAscent() + 2);   
        }
    }
};

Environment.prototype._init = function() {
    // Nothing here - overridden by other programs
};

Environment.prototype._enter = function(str) {
    this.os.output(this.prompt + str);
    var parts = str.split(" ");
    this._run(parts[0], parts.splice(1));
};

Environment.prototype._input = function(value) {
    // To be overridden
};

Environment.prototype._run = function(functionName, parameters) {
    // Strip out underscores, so we can hide object functions
    functionName = functionName.replace('_', '');
    
    // Check whether function exists and if so run with parameters
    var f = this[functionName];
    
    if (f && typeof(f) === 'function') {
        f(this, parameters);
    } else {
        this.os.raiseError("CommandError", functionName + ": command not found");
    }
};

Environment.prototype.help = function(self) {
    self.os.outputArray(self.helpString);
};

/*****************************************************
 *      Input Environment object
 * This represents a simple program that gets a
 * series of inputs, which it saves in this.data.
 * At the end the _end function is called.
 * A series of prompts should be saved in this.states.
******************************************************/

var InputEnv = function(os) {
    this.os = os;
    this.states = [];
};

InputEnv.prototype = Object.create(Environment.prototype);

InputEnv.prototype._init = function() {
    this.inputs = [];
    this.currentState = 0;
    this._getState();
};

InputEnv.prototype._getState = function() {
    if (this.currentState >= this.states.length) {
        this._end();
        return;
    }
    
    this.state = this.states[this.currentState];
    
    if (!this.state) {
        this.os.raiseError("FatalError", "Input program has no states");
        this.os.run('explorer');
    }
    
    if (this.state.prompt) {
        this.prompt = this.state.prompt + ": ";
    } else {
        this.prompt = "> ";
    }
    
    this.hideInput = this.state.password;
};

InputEnv.prototype._enter = function(str) {
    if (this.hideInput) {
        this.os.output(this.prompt + Array(str.length + 1).join("*"));    
    } else {
        this.os.output(this.prompt + str);
    }
    
    this.inputs.push(str);
    
    if (this.state.func) {
        var func = this[this.state.func];
        if (func) {
            func(this);   
        } else {
            this.os.raiseError("ProgramError", "No function " + this.state.func);
        }
    }
    
    this.currentState++;
    this._getState();
};

InputEnv.prototype._end = function() {
    // Called after all input received.
    // Should be overridden.
    this.os.run('explorer');
};

/*****************************************************
 *  Functions for build various programs
******************************************************/

// Create a program show starting info and runs the login program
var buildInfoEnv = function(os) {
    var env = new Environment(os);
    
    env.helpString = [
        "Type a command then enter",
        "Commands:",
        "  login:           login into server",
        "  login [name]:    login into server as name"
    ];

    env._init = function() {
        this._run('info');
    };

    env.info = function(self) {
        self.os.outputArray([
            " -------------------------------------------- ",
            "            Welcome to InCompiTech          ",
            "        In Computer Technology We Trust     ",
            " ",
            "   Type help for help and login to login  ",
            "   First-time users can login as guest    ",
            " -------------------------------------------- "]);
    };
    
    env.login = function(self, username) {
        self.os.run('login', username);
    };

    return env;
};

// Create a program that deals with people logging into their accounts
var buildLoginEnv = function(os) {
    var env = new InputEnv(os);
    
    env.states = [
        { prompt: 'username', func: '_checkUsername' },
        { prompt: 'password', password: true },
    ];
    
    env._init = function(username) {
        this.inputs = [];
        if (username && username.length > 0) {
            username = username.join(" ");
            if (username === 'guest') {
                this._loginSucess('guest', 0);
            }
            this.inputs.push(username);
            this.currentState = 1;
        } else {
            this.currentState = 0;
        }
        this._getState();
    };
    
    env._end = function() {
        var username = this.inputs[0];
        var person = this.os.users[username];
        
        if (person && this.inputs[1] === person[0]) {
            this._loginSucess(username, person[1]);
        } else {
            this.os.output("Incorrect password");
            this.os.run('info');
        }
    };
    
    env._checkUsername = function(self) {
        if (self.inputs[0] === 'guest') {
            self._loginSucess('guest', 0);
        }
    };
    
    env._loginSucess = function(username, clearance) {
        var s = "Logged in as " + username;
        if (username !== 'guest') {
            s += " (" + clearanceNames[clearance] + ")";
        }
        
        tasks.add('login ' + clearance);
        this.os.output(s);
        
        var data = {
            username: username,
            clearance: clearance
        };

        this.os.run('explorer', data);
    };
    
    return env;
};

// Program that functions as a file explorer with generic terminal functions
var buildExplorerEnv = function(os) {
    var env = new Environment(os);
    
    env.helpString = [
        " Type a command then enter",
        " Use up and down arrows to browse history",
        " Use alt to complete a file or folder name",
        " ",
        " Key Commands:",
        "  ls             list files and folders",
        "  cd <path>      change to folder <path>",
        "  cd ..          change to parent folder",
        "  read <path>    read file called <path>",
        "  run <path>     run file called <path>",
        "  exit           exit the server",
        "  man <cmd>      show manual for <cmd>",
        "  cmd            list all valid commands",
    ];
    
    env.synonyms = {
        list: 'ls',
        show: 'ls',
        dir: 'ls',
        cat: 'read',
        more: 'read',
        logout: 'exit'
    };
    
    env._init = function(data) {
        this.currentFolder = os.root;
        this.historyN = 0;
    
        if (data) {
            this.clearance = data.clearance;
            this.username = data.username;
            this.prompt = this.username + "@ICT > ";   
        } else {
            //this.clearance = 0;
        }
        
        // Get or set-up bash history
        var dest = this.os.getFolder(".bash_history");
        if (!dest[0]) {
            this.history = this.os.addFile(".bash_history");
        }
        
    };
    
    env._enter = function(str) {
        this.os.output(this.prompt + str);
        this.history.data.unshift(str);
        this.historyN = 0;
        
        var parts = str.split(/\s+/);
        var func = this.synonyms[parts[0]] || parts[0];
        
        this._run(func, parts.splice(1));
    };
    
    env._input = function(value) {
        if (value === 38) {
            env._browseHistory(1);
        } else if (value === 40) {
            env._browseHistory(-1);
        } else if (value === 18) {
            env._autoComplete();
        }
    };
    
    env._browseHistory = function(d) {
        env.historyN = constrain(env.historyN + d, 0, env.history.data.length - 1);
        this.os.setCmdString(env.history.data[env.historyN]);
    };
    
    env._autoComplete = function() {
        // Get final part of the command string
        var currentFolder = this.currentFolder;
        var cmd = this.os.getCmdString().split(" ");
        var last = cmd.splice(-1);
        
        // Join command string back together
        cmd.join(" ");
        cmd += cmd.length > 0 ? " " : "";
        
        // Test whether the last part is a path
        last = last[0].split("/");
        
        if (last.length > 1) {
            // Remove final element in path
            var last2 = last.splice(-1);
            var path = last.join("/");
            var dest = os.getFolder(path, currentFolder, this.clearance);
            if (!dest[0]) { return; }
            var currentFolder = dest[1];
            last = last2[0];
            cmd += path + "/";
        } else {
            last = last[0];
        }
        
        var n = last.length;
        if (n < 1) { return; }
        
        // Get an array of potential options
        var options = [];
        for (var folder in currentFolder.folders) {
            if (last === folder.slice(0, n)) {
                options.push(folder);
            }
        }
        
        for (var file in currentFolder.files) {
            if (last === file.slice(0, n)) {
                options.push(file);
            }
        }
        
        if (options.length === 1) {
            cmd += options[0];
            this.os.setCmdString(cmd);
        } else if (options.length > 1) {
            this.os.output(options.join(" "));
        }
    };
    
    // Commands used in Explorer below

    env.cd = function(self, parameters) {
        // Change directory
        var dest = self.os.getFolder(parameters[0], self.currentFolder, self.clearance);
        if (dest[0]) {
            if (dest[1].folders) {
                self.currentFolder = dest[1];
            } else {
                self.os.raiseError("PathError", dest[1].name + ": is not a folder");
            }
        } else {
            self.os.raiseError(dest[1], dest[2]);
        }
    };
    
    env.cmd = function(self) {
        var commands = [];
        for (var attr in self) {
            if (typeof(self[attr]) === 'function' && attr !== 'constructor' && attr.charAt(0) !== '_') {
                commands.push(attr);
            }
        }
        self.os.output(commands.join(", "));
    };
    
    env.exit = function(self) {
        // Logout of the server
        self.os.run('info');
    };
    
    env.echo = function(self, str) {
        self.os.output(str.join(" "));
    };
    
    env.ls = function(self, parameters) {
        var options = [];
        var paths = [];
        
        for (var i = 0; i < parameters.length; i++) {
            var p = parameters[i];
            if (p.length > 0 && p.charAt(0) === '-') {
                for (var j = 1; j < p.length; j++) {
                    options.push(p.charAt(j));
                }
            } else {
                paths.push(p);
            }
        }
        
        // Allow ls path to list in path
        var startFolder = self.currentFolder;
        if (paths.length > 0) {
            var dest = os.getFolder(paths[0], self.currentFolder);
            if (dest[0]) {
                startFolder = dest[1];
            } else {
                os.raiseError(dest[1], dest[2]);
                return;
            }
        }
        
        var files = { };
        if (options.indexOf('a') !== -1) {
            files = startFolder.files;
        } else {
            for (var file in startFolder.files) {
                var f = startFolder.files[file];
                if (!f.hidden) {
                    files[file] = f;
                }
            }
        }
        
        var folders = startFolder.folders;
        
        // List files and folders
        if (options.indexOf('l') !== -1) {
            self.os.output("  NAME                 TYPE     CLEARANCE");
            for (var folder in folders) {
                var s = " ";
                s += folder;
                s += Array(22 - folder.length).join(" ");
                s += "folder        ";
                s += folders[folder].clearance;
                self.os.output(s);
            }
            for (var file in files) {
                var s = " ";
                s += file;
                s += Array(22 - file.length).join(" ");
                s += files[file].ext === 'exe'? "script        " : "text          ";
                s += files[file].clearance;
                self.os.output(s);
            }
        } else {
            for (var folder in folders) {
                self.os.output(" " + folder);
            }
            for (var file in files) {
                self.os.output(" " + file);
            }
        }
    };
    
    env.man = function(self, parameters) {
        // Would be nice to bind these to the actual functions
        var manual = {
            cd: {
                desc: [
                    'change directory to <path>',
                    '<path> can be absolute (starting with /),',
                    'or relative',
                ],
                arg: 'path',
            },
            cmd: { desc: ['list all valid commands'] },
            exit: { desc: ['exit the server'] },
            echo: {
                desc: ['write arguments to output'],
                arg: '[string]'
            },
            ls: {
                desc: [
                    'list files and folders in current',
                    'folder unless a path is specified'
                ],
                arg: '[-al] [path]',
                options: {
                    '-a': 'include hidden files',
                    '-l': 'show file type and permissions'
                }
            },
            man: {
                desc: ['display manual for the command <name>'],
                arg: 'name'
            },
            mkdir: {
                desc: ['make a directory (folder) called <name>'],
                arg: 'name'
            },
            pwd: { desc: ['show path for current folder'] },
            read: {
                desc: ['show the contents of file <name>'],
                arg: 'name'
            },
            run: {
                desc: ['execute file <name>'],
                arg: 'name'
            },
            whoami: { desc: ['show current user and clearance'] },
        };
        
        if (parameters.length === 0) {
            self.os.output("What manual page do you want?");
            return;
        }
        
        for (var i = 0; i < parameters.length; i++) {
            var parameter = parameters[i];
            var cmd = manual[parameter];
            if (cmd) {
                var arg = cmd.arg;
                var desc = cmd.desc;
                var opt = cmd.options;
                
                self.os.output("USAGE");
                self.os.output("    " + parameter + " " + (arg ? arg : ""));
                self.os.output("DESCRIPTION");
                for (var i = 0; i < desc.length; i++) {
                    self.os.output("    " + desc[i]);
                }
                if (opt) {
                    self.os.output("OPTIONS");
                    for (var o in opt) {
                        self.os.output("    " + o + "  " + opt[o]);
                    }    
                }
                
            } else {
                self.os.raiseError("CommandError", parameter + ": manual not found");
            }
        }
    };
    
    env.mkdir = function(self, parameters) {
        if (parameters.length) {
            var name = parameters[0];
            self.os.addFolder(name, 0, self.currentFolder);    
        } else {
            os.raiseError("CommandError", "mkdir: requires a folder name");
        }
    };
    
    env.pwd = function(self) {
        var pwd = self.currentFolder.getPath() || "/";
        self.os.output(pwd);
    };
    
    env.read = function(self, parameters) {
        var dest = self.os.getFolder(parameters[0], self.currentFolder);
        
        // No file found, so raise error
        if (!dest[0]) { os.raiseError(dest[1], dest[2]); }
        
        var file = dest[1];
        if (file.folders) {
            self.os.raiseError("IOError", file.name + ": is a folder");
        } else if (file.canRead) {
            if (!self.clearance || self.clearance >= file.clearance) {
                for (var i = 0; i < file.data.length; i++) {
                    self.os.output(" " + file.data[i]);   
                }
            } else {
                self.os.raiseError("PermissionError", file.name + ": you do not have read permission");
            }
        } else {
            self.os.raiseError("IOError", file.name + ": cannot be read");
        }
    };
    
    env.run = function(self, parameters) {
        var dest = self.os.getFolder(parameters[0], self.currentFolder);
        
        // No file found, so raise error
        if (!dest[0]) {
            os.raiseError(dest[1], dest[2]);
            return;
        }
        
        var file = dest[1];
        
        if (!file.canRun) {
            self.os.raiseError("RunTimeError", file.name + ": cannot be run");
        } else if (!self.clearance || self.clearance >= file.clearance) {
            self.os.run(file.data);
        } else {
            self.os.raiseError("PermissionError", file.name + ": you do not have read permission");
        }
    };
    
    env.whoami = function(self) {
        var s = self.username || "root";
        if (self.clearance) {
            s += " (clearance: " + self.clearance + ")";
        }
        self.os.output(s);
    };
    
    return env;
};

// Program for createProfile.exe
var createProfileEnv = function(os) {
    var env = new InputEnv(os);
    
    env.states = [
        { prompt: 'first name' },
        { prompt: 'last name' },
        { prompt: 'password', password: true },
    ];

    env._end = function() {
        var user = this.os.addUser(this.inputs[0], this.inputs[1], this.inputs[2], 1);
        this.os.output(
            "Created " + clearanceNames[user[1]] + 
            " (level " + user[1] + " clearance) profile: " + user[0]
        );
        tasks.add('create profile ' + user[1]);
        this.os.run('explorer');
    };
    
    return env;
};

// Program for createProfile.exe
var addToGroupEnv = function(os) {
    var env = new InputEnv(os);
    
    env.states = [
        { prompt: 'first name' },
        { prompt: 'last name', func: '_getUser' }, 
        { prompt: 'group' }
    ];

    env._getUser = function(self) {
        var username = self.os.generateUsername(self.inputs[0], self.inputs[1]);
        var person = self.os.users[username];
        
        if (!person) {
            os.raiseError("ProgramError", "No user found with username " + username);
            self.os.run('explorer');
        } else {
            this.userClearance = clearanceNames[person[1]];
            os.output("Found user: " + username + " (" + this.userClearance + ")");
        }
    };

    env._end = function() {
        var name1 = this.inputs[0];
        var name2 = this.inputs[1];
        var team = this.inputs[2];
        var teamPath = "../groups/" + team;
        var dest = this.os.getFolder(teamPath, this.parent);
        
        if (!dest[0]) {
            // Failed to open path to group
            this.os.raiseError(dest[1], dest[2]);
            this.os.raiseError("ProgramError", "Unable to open " + teamPath);
            this.os.output("Check you have spelt the group name correctly or try updating the path in .addToGroup");
        } else {
            // Get personnel.txt file
            var dest = this.os.getFolder(teamPath + "/personnel.txt", this.parent);
            var personnel = dest[1];
            
            if (!dest[0]) {
                this.os.output("personnel.txt not found, creating one...");
                personnel = this.os.addFile(teamPath + "/personnel.txt", 1, [], this.parent);
            }
            personnel.data.push([this.userClearance + " " + name1 + " " + name2]);
            
            this.os.output(this.inputs[0] + " " + this.inputs[1] + 
                           " added to group " + this.inputs[2]);
        }
        this.os.run('explorer');
    };
    
    return env;
};

/*******************************************************
 *      Operating System
 * This is the outer wrapper for all the programs.
 * It consists of the terminal input/output control and
 * stores a directory of files and folders as a tree.
********************************************************/

var OperatingSystem = function() {
    // Display variables
    this.background = color(24, 24, 20);
    this.font = createFont("monospace", 13);
    this.textCol = color(230, 230, 230);
    
    // Terminal position and size
    this.x = 16;
    this.y = 16;
    this.promptY = this.y;
    this.width = width - 2 * this.x;
    this.height = height - this.y - 25;
    this.scrollY = 0;
    this.scrolling = false;
    this.blink = 40;
    
    // Map program names to program objects
    this.programs = {};
    this.currentProgram = false;
    
    // The current string to be inputed as two arrays
    // of characters before and after the cursor
    this.inputBefore = [];
    this.inputAfter = [];
    
    // So we can display what has been displayed
    this.outputs = [];
    
    // Tree of files and folders
    this.root = new Folder('~', 0);
    
    // Users: maps username to [password, clearance]
    this.users = { };
};

OperatingSystem.prototype.draw = function() {
    // Background
    background(200, 200, 200);
    fill(this.background);
    rect(5, 5, width - 10, height - 30, 10);
    
    // Previous outputs
    fill(this.textCol);
    textFont(this.font);
    textAlign(LEFT, BASELINE);
    
    var dy = max(0, this.promptY - this.height) - this.scrollY;
    for (var i = 0; i < this.outputs.length; i++) {
        var ty = this.outputs[i][0] - dy;
        text(this.outputs[i][1], this.x, ty, this.width, this.height);
        if (ty > height - 30) { break; }
    }
    
    if (this.currentProgram) {
        var y = this.promptY + textAscent() - dy;
        this.currentProgram._draw(this.x, y);
    }
};

OperatingSystem.prototype.keyPressed = function() {
    var inputLength = this.inputBefore.length + this.inputAfter.length;
    
    // Press enter
    if ((keyCode === ENTER || keyCode === RETURN) && inputLength > 0) {
        this.enter();
        return;
    }
    
    // Input too long, so prevent any more characters being added
    if (inputLength > 40) { return; }
    if ((keyCode > 48 && keyCode < 91) || (keyCode > 144 && keyCode < 223)) {
        // Add number or lowercase letter
        this.inputBefore.push(key.toString());
    } else if (keyCode === 32){
        this.inputBefore.push(" ");
    } else if (keyCode === DELETE || keyCode === BACKSPACE) {
        if (this.inputBefore.length > 0) {
            this.inputBefore.splice(this.inputBefore.length - 1, 1);
        }
    } else if (keyCode === LEFT) {
        if (this.inputBefore.length > 0) {
            var letter = this.inputBefore.pop();
            this.inputAfter.unshift(letter);
        }
    } else if (keyCode === RIGHT) {
        if (this.inputAfter.length > 0) {
            var letter = this.inputAfter.shift();
            this.inputBefore.push(letter);
        }
    } else if ([18, 38, 40].indexOf(keyCode) !== -1) {
        this.input(keyCode);
    }
    
};

OperatingSystem.prototype.scroll = function() {
    if (this.promptY) {
        var screenExtra = max(0, this.promptY - this.height);
        if (screenExtra === 0) { return; }
        
        var fraction = this.height / this.promptY;
        var barHeight = max(25, height * fraction);
        var scrollSpace = 388 - barHeight;
        
        var d = (pmouseY - mouseY) * screenExtra / scrollSpace;
        this.scrollY = constrain(this.scrollY + d, 0, max(0, this.promptY - this.height));  
    }
};

OperatingSystem.prototype.input = function(value) {
    if (this.currentProgram) {
        this.currentProgram._input(value);
    }
};

OperatingSystem.prototype.getCmdString = function() {
    return this.inputBefore.join("") + this.inputAfter.join("");
};

OperatingSystem.prototype.setCmdString = function(str) {
    str = str || "";
    this.inputBefore = str.split('');
    this.inputAfter = [];
};

OperatingSystem.prototype.enter = function() {
    if (this.currentProgram) {
        this.currentProgram._enter(this.getCmdString());
    }

    this.inputBefore = [];
    this.inputAfter = [];
};

OperatingSystem.prototype.output = function(str) {
    this.outputs.push([this.promptY, str]);
    this.promptY += 16 * ceil(textWidth(str) / this.width);
};

OperatingSystem.prototype.outputArray = function(arr) {
    for (var i = 0; i < arr.length; i++) {
        this.output(arr[i]);   
    }
};

OperatingSystem.prototype.run = function(program, parameters) {
    if (program._init) {
        // Local program
        this.currentProgram = program;
        this.currentProgram._init(parameters);
    } else if (this.programs[program]) {
        // Program stored in bin
        this.currentProgram = this.programs[program];
        this.currentProgram._init(parameters);
    } else {
        this.raiseError("RunTimeError", program + " could not be found.");
    }
};

OperatingSystem.prototype.getFolder = function(path, parent, clearance) {
    // TODO make versions to distinguish between files and folders
    
    path = path || "~";
    
    var pathElements = path.split('/');
    if (pathElements[0] === '~' || pathElements[0] === '') {
        pathElements = pathElements.splice(1);
        parent = this.root;
    } else {
        parent = parent || this.root;
    }
    
    return parent.getFromPath(pathElements, clearance);
};

OperatingSystem.prototype.getBaseFolder = function(path, clearance, parent) {
    // Given a path to a new folder or file, return the base folder
    // and file or folder name
    
    var parts = path.split('/');
    var name = parts.splice(-1)[0];
    var basepath = parts.join('/');
    
    var dest = this.getFolder(basepath, parent);
    if (dest[0]) {
        var folder = dest[1];
        if (folder.folders) {
            return [folder, name];
        } else {
            this.raiseError('PathError', folder.name + ": Not a folder");
            return false;
        }
    } else {
        this.raiseError(dest[1], dest[2]);
        return false;
    }
};

OperatingSystem.prototype.addFolder = function(path, clearance, parent) {
    var dest = this.getBaseFolder(path, clearance, parent);
    
    if (dest) {
        var folder = dest[0];
        var name = dest[1];
        if (folder.folders[name]) {
            this.raiseError('PathError', name + ": Already exists");
        } else {
            var newFolder = new Folder(name, clearance, folder);
            folder.folders[name] = newFolder;
            return newFolder;
        }
    }
};

OperatingSystem.prototype.addFile = function(path, clearance, data, parent) {
   var dest = this.getBaseFolder(path, clearance, parent);
    
    if (dest) {
        var folder = dest[0];
        var name = dest[1];
        if (folder.files[name]) {
            this.raiseError('PathError', name + ": Already exists");
        } else {
            var newFile = new File(name, clearance, folder, data);
            folder.files[name] = newFile;
            return newFile;
        }
    }
};

OperatingSystem.prototype.generateUsername = function(name1, name2) {
    // Generate a username from the first two letters of the first name
    // and the first three of the second name
    var username = name1.slice(0, 2) + name2.slice(0, 3);
    return username.toLowerCase();
};

OperatingSystem.prototype.addUser = function(name1, name2, password, clearance) {
    var username = this.generateUsername(name1, name2);
    var existing = this.users[username];
    if (existing) {
        clearance = existing[1];
    }
    this.users[username] = [password, clearance]; 
    return [username, clearance];
};

OperatingSystem.prototype.raiseError = function(error, details) {
    this.output('ERROR: ' + error);
    this.output(details);
};

/*****************************************************
 *  Setting up the computer
******************************************************/

// Create the people who use the computer
var setupPeople = function() {
    var firstNames = ["Sophia", "Isabella", "Emma", "Olivia", "Ava", "Emily", "Abigail", "Madison", "Mia", "Chloe", "Elizabeth", "Ella", "Addison", "Natalie", "Lily", "Grace", "Samantha", "Avery", "Sofia", "Aubrey", "Brooklyn", "Lillian", "Victoria", "Evelyn", "Hannah", "Alexis", "Charlotte", "Zoey", "Leah", "Amelia", "Zoe", "Hailey", "Layla", "Gabriella", "Nevaeh", "Kaylee", "Alyssa", "Anna", "Sarah", "Allison", "Savannah", "Ashley", "Audrey", "Taylor", "Brianna", "Aaliyah", "Riley", "Camila", "Khloe", "Claire", "Jacob", "Mason", "William", "Jayden", "Noah", "Michael", "Ethan", "Alexander", "Aiden", "Daniel", "Anthony", "Matthew", "Elijah", "Joshua", "Liam", "Andrew", "James", "David", "Benjamin", "Logan", "Christopher", "Joseph", "Jackson", "Gabriel", "Ryan", "Samuel", "John", "Nathan", "Lucas", "Christian", "Jonathan", "Caleb", "Dylan", "Landon", "Isaac", "Gavin", "Brayden", "Tyler", "Luke", "Evan", "Carter", "Nicholas", "Isaiah", "Owen", "Jack", "Jordan", "Brandon", "Wyatt", "Julian", "Aaron"];

    var surnames = ["Adams", "Allen", "Anderson", "Bailey", "Baker", "Bell", "Bennett", "Brown", "Butler", "Campbell", "Carter", "Chapman", "Clark", "Collins", "Cook", "Cooper", "Cox", "Davies", "Davis", "Edwards", "Ellis", "Evans", "Fox", "Graham", "Gray", "Green", "Griffiths", "Hall", "Harrison", "Hill", "Holmes", "Hughes", "Hunt", "Hunter", "Jackson", "James", "Johnson", "Jones", "Kelly", "Kennedy", "Khan", "King", "Knight", "Lee", "Lewis", "Lloyd", "Marshall", "Martin", "Mason", "Matthews", "Miller", "Mitchell", "Moore", "Morgan", "Morris", "Murphy", "Murray", "Owen", "Palmer", "Parker", "Patel", "Phillips", "Powell", "Price", "Reid", "Reynolds", "Richards", "Richardson", "Roberts", "Robinson", "Rogers", "Rose", "Russell", "Saunders", "Scott", "Shaw", "Simpson", "Smith", "Stevens", "Stewart", "Taylor", "Thomas", "Thomson", "Turner", "Walker", "Walsh", "Ward", "Watson", "White", "Wilkinson", "Williams", "Wilson", "Wood", "Wright", "Young"];
    
    var people = [];
    
    var generatePassword = function(n) {
        var chars = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
        var password = "";
        for (var i = 0; i < n; i++) {
            password += randFromArray(chars);
        }
        return password;
    };
    
    var createRandomPerson = function(clearance) {
        var name1 = randFromArray(firstNames);
        var name2 = randFromArray(surnames);
        
        return {
            firstName: name1,
            surname: name2,
            password: generatePassword(floor(random() * 5) + 8),
            clearance: clearance
        };
    };

    people.push(createRandomPerson(2));
    
    for (var i = 0; i < 5; i++) {
        people.push(createRandomPerson(1));
    }
    
    return people;
};
var people = setupPeople();

var setupComputer = function(os, people) {
    // Add programs
    os.programs.info = buildInfoEnv(os);
    os.programs.login = buildLoginEnv(os);
    os.programs.explorer = buildExplorerEnv(os);
    
    // Add folders
    os.addFolder('home', 0);
    os.addFolder('home/scripts', 0);
    os.addFolder('home/user', 0);
    os.addFolder('home/user/documents', 0);
    os.addFolder('home/groups', 1);
    os.addFolder('home/groups/special', 3);
    os.addFolder('home/groups/security', 3);
    os.addFolder('home/groups/procurement', 3);
    os.addFolder('home/groups/investment', 3);
    os.addFolder('home/groups/analysis', 3);
    os.addFolder('home/groups/marketing', 1);
    os.addFolder('admin', 2);
    os.addFolder('admin/documents', 1);
    os.addFolder('admin/security', 2);
    
    // Add files
    os.addFile('home/user/documents/passwords.txt', 0,
            ["Employees are reminded to change their passwords every eight weeks."]);
    os.addFile('admin/documents/todo.txt', 0,
            ["Prepare for Winston's visit", "Get hair cut", "Buy doughnuts", "Update security/sentinel.txt", "Find pictures for Operation Jökulhlaup presentation"]);
    os.addFile('admin/documents/success.txt', 2, ["Level one complete!"]);
    os.addFile('admin/security/success.txt', 3, ["Level two complete!"]);
    
    // Add programs
    os.addFile('home/scripts/createProfile.exe', 0, createProfileEnv(os));
    os.addFile('home/scripts/addToGroup.exe', 2, addToGroupEnv(os));

    // Add people to marketing
    var data = [];
    for (var i = 0; i < people.length; i++) {
        var person = people[i];
        var name1 = person.firstName;
        var name2 = person.surname;
        var clearance = person.clearance;
        var user = os.addUser(name1, name2, person.password, clearance);
        data.push([clearanceNames[user[1]] + " " + name1 + " " + name2]);
    }
    
    os.addFile('home/groups/marketing/personnel.txt', 1, data);
    os.addUser('Peter', 'Collingridge', 'abc', 0);
};

var os = new OperatingSystem();
setupComputer(os, people);

// Boot up
//os.run('info');
os.run('explorer');

/*****************************************************
 *  Main loop
******************************************************/

draw = function() {
    os.draw();
    
    // Mask upper and lower edge in case of overlap
    noStroke();
    fill(200);
    rect(0, 0, width, 5);
    rect(0, height - 25, width, 25);
    
    tasks.draw();
};

/*****************************************************
 *  Event handling
******************************************************/

keyPressed = function() {
    //println(keyCode);
    os.keyPressed();
};

mousePressed = function() {
    os.scrolling = true;
};

mouseOut = function() {
    os.scrolling = false;
};

mouseDragged = function () {
    os.scroll();
};
