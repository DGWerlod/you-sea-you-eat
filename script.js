var ctx = document.getElementById("ctx").getContext("2d");
var globalWidth = ctx.canvas.width;
var globalHeight = ctx.canvas.height-100;
var greenEaten = 0;
var redEaten = 0;
var points = 0;
var goals = [0,50,100,200,350,500,Infinity];
var speeds = [0,100,75,50,25,10,Infinity];
var spawnTime = 100;
var enemies = [];
var foods = [];
var bullets = [];
var bubbles = [];
var my_img = new Image();
var wpress = false;
var spress = false;
var spacepress = false;
var buttonCooldown = 0;
var doPercent = false;
var toDelete = false;
var gameOver = false;
var boss = {};
var bossSpawned = false;
var bossAlive = false;
var writeCounter = 0;
var written = "";
var numWritten = -1;
var speechBubble = new Image();
speechBubble.src = "http://i.imgur.com/5PIUVBu.png";

//my_img.src = "img.png";
//ctx.fillText("stufftowrite",x,y);
//ctx.fillRect(x,y,w,h);
//ctx.drawImage(img,x,y,w,h);
//X AND Y ARE THE CENTER OF SHAPES

class Entity {
    constructor(x,y,w,h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    updatePos() {
        this.x -= this.spdX;
    }
    draw() {
        ctx.drawImage(this.img,this.x,this.y,this.w,this.h);
    }
}

class Bubble extends Entity {
    constructor(x,y,w,h) {
        super(x,y,w,h);
        this.img = new Image();
        this.img.src = "http://i.imgur.com/FRdDfZh.png";
        this.spdX = Math.random()*2 + 1;
    }
}

class Enemy extends Entity {
    constructor(x,y,w,h) {
        super(x,y,w,h);
        this.img = new Image();
        this.img.src = "http://i.imgur.com/r38KnXb.png";
        this.spdX = Math.random()*2 + 1;
    }
}

class Player extends Entity {
    constructor(x,y,w,h,spdY) {
        super(x,y,w,h);
        this.spdY = spdY;
        this.img = new Image();
        this.img.src = "http://i.imgur.com/qA9Q67F.png";
    }
    updatePos() {
        if (wpress) {
            this.y -= this.spdY;
        } else if (spress) {
            this.y += this.spdY;
        }
        if (this.y < 0) { this.y = 0; }
        if (this.y + this.h > globalHeight) { this.y = globalHeight - this.h; }
    }
}

class Food extends Entity {
    constructor(x,y,w,h,src,oldspd) {
        super(x,y,w,h);
        this.points = 10;
        this.img = new Image();
        this.img.src = src;
        if (oldspd) {
            this.spdX = oldspd;
        } else {
            this.spdX = Math.random()*2 + 1;
        }
    }
}

class Bullet extends Entity {
    constructor(x,y,w,h) {
        super(x,y,w,h);
        this.spdX = -10;
        this.img = new Image();
        this.img.src = "http://i.imgur.com/pgW6x0y.png";
    }
}

var player = new Player(5,235,50,50,5);
player.level = 1;

//MOVE + SPACEBAR
document.onkeydown = function (event) {
    if (event.keyCode === 87) { //w
        wpress = true;
    } else if (event.keyCode === 83) { //s
        spress = true;
    }
};

//FOR SPACE
document.onkeypress = function (event) {
    if (event.keyCode === 32 && buttonCooldown <= 0 && spacepress === false) { //space
        spacepress = true;
        buttonCooldown = 25;
    }
    
    if (event.keyCode == 32 && event.target == document.body) {
        event.preventDefault();
    }
};

//MOVE VAR RESET
document.onkeyup = function (event) {
    if (event.keyCode === 87) { //w
        wpress = false;
    } else if (event.keyCode === 83) { //s
        spress = false;
    } else if(event.keyCode == 32){ //space
        spacepress = false;
    }
};

var testcollisionrect = function(a,b) {
    return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.h + a.y > b.y;
};

var spawnNew = function (w,h) {
    var choose = Math.random();
    var y = Math.random()*460 + 5;
    if (choose < 0.75) {
        enemies.push(new Enemy(globalWidth + 30,y,30,30));
    } else {
        foods.push(new Food(globalWidth + 30,y,30,30,"http://i.imgur.com/jMttPQZ.png"));
    }
    y = Math.random()*460 + 5;
    bubbles.push(new Bubble(globalWidth + 30,y,20,20));
};

var writePlot = function (towrite) {
    written = "> " + towrite;
    writeCounter = 300;
    numWritten ++;
};

var update = function () {
    //EMPTY SPACE
    ctx.clearRect(0,0,globalWidth,globalHeight);
    
    //DRAW CANVAS BG
    ctx.font = "30px Muli";
    ctx.fillStyle = "blue";
    ctx.fillRect(0,0,globalWidth,globalHeight);
    ctx.fillStyle = "black";
    ctx.fillRect(0,globalHeight,globalWidth,100);
    if (redEaten || greenEaten) {
        ctx.fillStyle = "red";
        ctx.fillRect(0,globalHeight,globalWidth,50);
        ctx.fillStyle = "green";
        ctx.fillRect(0,globalHeight,(greenEaten/(redEaten+greenEaten)) * globalWidth,50);
    } else {
        ctx.fillStyle = "grey";
        ctx.fillRect(0,globalHeight,globalWidth,50);
    }
    ctx.fillStyle = "yellow";
    ctx.fillRect(0,globalHeight + 50,(points/goals[player.level])*globalWidth,50);
    ctx.fillStyle = "white";
    if (player.level != 6 || bossAlive === false) {
        ctx.fillText("Lv. " + player.level,5,globalHeight + 85);
    } else {
        ctx.fillText("Boss Battle!",5,globalHeight + 85);
    }
    if (doPercent) {
        ctx.fillText("Morality (" + Math.round((greenEaten/(redEaten+greenEaten))*100) + "%)",5,globalHeight + 35);
    } else {
        ctx.fillText("Morality",5,globalHeight + 35);
    }
    
    //DECREASE SPAWNTIME
    if (spawnTime > 0) {
        spawnTime--;
    } else {
        spawnNew();
        spawnTime = speeds[player.level];
    }
    
    //POINTS SYSTEM
    if (points >= goals[player.level]) {
        player.level += 1;
        points = 0;
    }
    if (player.level === 6 && gameOver === false) {
        //document.getElementById("ctx").style.visibility = "hidden";
        doPercent = true;
        gameOver = true;
    }
    
    //UPDATEPOS AND UPDATE ENTITIES
    if(buttonCooldown > 0){
        buttonCooldown--;
    }
    for(var i in enemies) {
        enemies[i].updatePos();
        for (var ii in bullets) {
            if (testcollisionrect(enemies[i],bullets[ii])) {
                foods.push(new Food(enemies[i].x,enemies[i].y,enemies[i].w,enemies[i].h,"http://i.imgur.com/fx5qe9x.png",enemies[i].spdX));
                toDelete = true;
                delete bullets[ii];
            }
        }
        
        if (testcollisionrect(enemies[i],player)) {
            if (points >= 10) {
                points -= 10;
            }
            toDelete = 1;
            delete enemies[i];
        } else {
            enemies[i].draw();
        }
        
        if (toDelete) {
            delete enemies[i];
        }
        toDelete = false;
    }
    
    for(var j in foods) {
        foods[j].updatePos();
        if (testcollisionrect(foods[j],player)) {
            points += foods[j].points;
            if (foods[j].img.src === "http://i.imgur.com/fx5qe9x.png") {
                redEaten += 1;
            } else if (foods[j].img.src === "http://i.imgur.com/jMttPQZ.png") {
                greenEaten += 1;
            }
            delete foods[j];
        } else {
            foods[j].draw();
        }
    }
    
    for(var k in bullets) {
        bullets[k].updatePos();
        bullets[k].draw();
    }
    
    if (spacepress) {
        bullets.push(new Bullet((player.x+(player.w/2)-18),(player.y+(player.h/2)-4),36,8));
        spacepress = false;
    }
    
    for (var l in bubbles) {
        bubbles[l].updatePos();
        bubbles[l].draw();
    }
    
    if (greenEaten/(greenEaten+redEaten) > 0.45 && greenEaten/(greenEaten+redEaten) < 0.55) {
        if (player.level < 6) {
            player.img.src = "http://i.imgur.com/qA9Q67F.png";
        } else {
            player.img.src = "http://i.imgur.com/AR0kzEX.png";
        }
    } else if (greenEaten/(greenEaten+redEaten) < 0.45) {
        if (player.level < 6) {
            player.img.src = "http://i.imgur.com/7albtWG.png";
        } else {
            player.img.src = "http://i.imgur.com/5ECw0Ou.png";
        }
    }  else {
        if (player.level < 6) {
            player.img.src = "http://i.imgur.com/cRUprpW.png";
        } else {
            player.img.src = "http://i.imgur.com/p6Ns86H.png";
        }
    }
    
    if (player.level === 6 && bossSpawned === false) {
        if (greenEaten/(greenEaten+redEaten) < 0.45) {
            boss = new Enemy(418,178,144,144);
            boss.img = new Image();
            boss.img.src = "http://i.imgur.com/lEac9Y0.png";
            boss.hp = 10;
            bossAlive = true;
            bossSpawned = true;
        } else {
            gameWon = true;
        }
    }
    
    //CLEAR THINGS FOR LV 6
    if (player.level === 6) {
        foods = [];
        enemies = [];
    }
    
    for (var m in bullets) {
        if (testcollisionrect(boss,bullets[m])) {
            boss.hp -= 1;
            delete bullets[m];
        }
    }
    
    player.updatePos();
    player.draw();
    
    //BOSSKILL
    if (boss.hp <= 0 && bossAlive === true) {
        bossAlive = false;
        gameWon = true;
    }
    
    if (bossAlive) {
        boss.draw();
    }
    
    //EXTRA WRITE CUES
    if (numWritten === 0 && writeCounter === 0) {
        writePlot("Use W/S to move, and Space to fire a deadly bullet.");
    }
    if (numWritten === 1 && player.level === 6) {
        if (greenEaten/(greenEaten+redEaten) > 0.45 && greenEaten/(greenEaten+redEaten) < 0.55) {
            writePlot("You have taken an interesting path of equal parts.");
        } else if (greenEaten/(greenEaten+redEaten) < 0.45) {
            writePlot("ACCEPT YOUR FATE.  KILL THE SHARK.");
        } else {
            writePlot("You have chosen to make peace with the creatures.");
        }
    }
    if (numWritten === 2 && writeCounter === 0 && player.level != 7) {
        if (greenEaten/(greenEaten+redEaten) > 0.45 && greenEaten/(greenEaten+redEaten) < 0.55) {
            writePlot("You will live out the rest of your life ambiguously.");
        } else if (greenEaten/(greenEaten+redEaten) < 0.45) {
        } else {
            writePlot("You will be rewarded for your kindness forever.");
        }
    }
    if (numWritten === 3 && writeCounter === 0 && player.level != 7) {
        if (greenEaten/(greenEaten+redEaten) > 0.45 && greenEaten/(greenEaten+redEaten) < 0.55) {
            writePlot("Your new jellyfish body is okay, you guess.");
        } else if (greenEaten/(greenEaten+redEaten) < 0.45) {
        } else {
            writePlot("Your new body is very cute and happy - you love it!");
        }
    }
    if (numWritten === 4 && writeCounter === 0 && player.level != 7) {
        if (greenEaten/(greenEaten+redEaten) > 0.45) {
            writePlot("Thanks for playing!  Did you like your ending?");
        }
    }
    if (bossSpawned === true && bossAlive === false) {
        if (numWritten === 2) {
            writePlot("You have chosen to destroy most things in your path.");
        }
        if (numWritten === 3 && writeCounter === 0) {
            writePlot("You will live your life in eternal suffering.");
        }
        if (numWritten === 4 && writeCounter === 0) {
            writePlot("You will live your life in eternal suffering.");
        }
        if (numWritten === 5 && writeCounter === 0) {
            writePlot("Your new body is demonic - no one likes you anymore.");
        }
        if (numWritten === 6 && writeCounter === 0) {
            writePlot("Thanks for playing!  Did you like your ending?");
        }
    }
    
    //FINAL DRAW - SPEECH BUBBLES
    if (writeCounter) {
        writeCounter --;
        ctx.drawImage(speechBubble,15,15,570,50);
        ctx.fillStyle = "black";
        ctx.font = "20px Muli";
        ctx.fillText(written,25,47);
    }
    
};

setInterval(update,20);
writePlot("You may eat plants, or kill and devour living things.");