var DOMPurify = require('isomorphic-dompurify');
var chalk = require('chalk');
var bcrypt = require('bcrypt');
var express = require('express');
var figlet = require('figlet');
var fs = require('fs');
const secretKey = process.env.DB_KEY || "7x!A%D*G-JaNdRgUkXp2s5v8y/B?E(H+";
if (secretKey == "7x!A%D*G-JaNdRgUkXp2s5v8y/B?E(H+") {
    console.log(chalk.bgRed.black("WARNING") + " DATABASE IS USING DEFAULT ENCRYPTION KEY. THIS SHOULD NOT BE USED UNLESS IT IS A DEBUG BUILD. PLEASE SET ENV DB_KEY");
}
const Cryptr = require('cryptr');
const cryptr = new Cryptr(secretKey);

Math.clamp = function (value,min,max) {
    if (value < min) {
        return min;
    }
    if (value > max) {
        return max;
    }
    return value;
}

var database = {
    tokens: {
        exampleuser: 'exampletoken'
    },
    posts: {

    },
    feeds: {

    },
    users: {

    }
}

function tryDecryptDatabase() {
    try {
        database = JSON.parse(cryptr.decrypt(fs.readFileSync("database.json")));
    } catch(e) {
        console.log(chalk.bgBlue.white(figlet.textSync('Scriptegy   Hubs')));
        console.log("");
        console.log("It appears to be your first time using Scriptegy Hubs, so we could not load the database, since there is none.");
        console.log("But, for debugging purposes, we are going to print the error.");
        console.log(e);
    }
    if (!database.bannedUsers) {
        database.bannedUsers = ["banned","denis aos"];
    }
    try {
        database.users.scriptegy.admin = true;
    } catch {}
}

function banUser(token,usernameToBan) {
    var username = usernameOfToken(token);
    if (username && database.users[username].admin && !database.bannedUsers.includes(usernameToBan)) {
        database.bannedUsers.push(usernameToBan);
    }
}

function unbanUser(token,usernameToBan) {
    var username = usernameOfToken(token);
    if (username && database.users[username].admin) {
        var newBanList = [];
        for (var i in database.bannedUsers) {
            if (database.bannedUsers[i] != usernameToBan) {
                newBanList.push(database.bannedUsers[i]);
            }
        }
        database.bannedUsers = newBanList;
    }
}

function beginWatchDatabase() {
    var syncedDb = null;
    setInterval(() => {
        if (syncedDb != JSON.stringify(database)) {
            syncedDb = JSON.stringify(database);
            saveDb();
        }
    },1000);
}

function saveDb() {
    console.log(JSON.stringify(database));
    fs.writeFileSync("database.json",cryptr.encrypt(JSON.stringify(database)),() => {});
}

process.on('beforeExit', (code) => {
    saveDb();
 });

tryDecryptDatabase();
beginWatchDatabase();


const { faker } = require('@faker-js/faker');
const { resolveSoa } = require('dns');

function signup(username, password) {
    if (!database.users[username]) {
        database.users[username] = {
            username: username,
            hash: bcrypt.hashSync(password,8),
            followers: ["scriptegy"]
        };
        console.log(chalk.black(chalk.bgRed("IMPORTANT")) + " NEW USER CREATED!!!! " + username)
    } else {
        return { error: "User already exists."};
    }
    return login(username, password);
}

function login(username, password) {
    if (database.bannedUsers.includes(username)) {
        return { error: "You're banned!" };
    }
    if (!database.users[username]) {
        console.log(chalk.bgRed('FAIL') + " user " + username + " does not exist.");
        return { error: "User not found." };
    }
    if (!bcrypt.compareSync(password,database.users[username].hash)) {
        console.log(chalk.bgRed('FAIL') + " user " + username + " had a failed login.");
        return { error: "Password incorrect." };
    }
    database.tokens[username] = randomString(256);
    return { token : database.tokens[username] };
}

function formatPostContents(text) {
    var o = text;
    o = DOMPurify.sanitize(o);
    var tokens = extractTokens(o);
    for (var i in tokens) {
        if (tokens[i].startsWith("@")) {
            if (database.users[tokens[i].slice(1)]) {
                o = o.split(tokens[i]).join(`<PingUser>${tokens[i]}</PingUser>`);
            }
        }
    }
    //introducing... SHEEEEEESH
    for (var i = 0; i < o.length; i++) {
        o = o.split(`SH${"E".repeat(i)}SH`).join(`<RainbowText>SH${"E".repeat(i)}SH</RainbowText>`);
        o = o.split(`sh${"e".repeat(i)}sh`).join(`<RainbowText>SH${"E".repeat(i)}SH</RainbowText>`);
    }
    return o;
}

function post(token, text, feed, repost) {
    var username = usernameOfToken(token);
    if (username) {
        if (feed == "feed" || feed == "notifications" || feed.startsWith("user-")) {
            return {error:"Cannot directly post to a special feed."}
        }
        if (repost) {
            if (database.posts[repost].repost) {
                return {error:"Cannot repost a post that already is a repost."};
            }
            if (!database.posts[repost]) {
                return {error:"Cannot repost a post that doesn't exist!"};
            }
        }
        var id = randomString(16);
        var tx2 = formatPostContents(text);
        database.posts[id] = {
            username: username,
            text: tx2,
            feed: feed,
            repost: repost,
            ratings: {}
        };
        if (!database.feeds[feed]) {
            database.feeds[feed] = [];
            console.log(chalk.black(chalk.bgRed("IMPORTANT")) + " a new feed called " + feed + " has been created");
        }
        database.feeds[feed].push(id);
        if (!database.feeds["user-" + username]) {
            database.feeds["user-" + username] = [];
        }
        database.feeds["user-" + username].push(id);
        for (var i in database.users[username].followers) {
            if (!database.feeds["personal-" + database.users[username].followers[i]]) {
                database.feeds["personal-" + database.users[username].followers[i]] = [];
            }
            updateUser(database.users[username].followers[i]);
            database.users[database.users[username].followers[i]].personalFeed.push(id);
        }
        getTaggedUsers(database.posts[id].text,id);
        if (repost) {
            try {
                database.users[database.posts[repost].username].notifications.push(id);
            } catch {}
        }
        if (DOMPurify.sanitize(text) != text) {
            console.log(chalk.bgYellow.black("XSS") + " an attempted xss occured from user " + username + " in feed " + feed);
        } else {
            //console.log(chalk.black(chalk.bgBlue("NOTE")) + " new post in feed " + feed + " with id " + id);
        }
        return {success:true};
    } else {
        return {error:"You're not logged in (or you're banned)!"};
    }
    return {error:"Unknown error!"};
}

function getTaggedUsers(str,post) {
    var tokens = extractTokens(str);
    var usersAlreadyPinged = [];
    for (var i in tokens) {
        if (tokens[i].startsWith("@")) {
            var username = tokens[i].slice(1);
            if (!usersAlreadyPinged.includes(username)) {
                usersAlreadyPinged.push(username);
                try {
                    database.users[usersAlreadyPinged].notifications.push(post);
                } catch {}
            }
        }
    }
}

function extractTokens(str) {
    var delims = ["&gt;","&lt;", "<", ">", "'",'"',"`"];
    var tokens = [str];
    for (var i in delims) {
        var tokens2 = [];
        for (var x in tokens) {
            if (!tokens[x]) { continue; }
            if (!tokens[x].split) { continue; }
            var newTokens = tokens[x].split(delims[i]);
            for (var t in newTokens) {
                tokens2.push(newTokens[t]);
            }
        }
        tokens = tokens2;
    }
    return tokens;
}

function breakObjectPointer(obj) {
    return JSON.parse(JSON.stringify(obj)); //legacy method deleted properties.. still no idea why
}

function getFeedLatestPosts(feed,token) {
    var username = usernameOfToken(token);
    if (username) {
        updateUser(username);
    }
    if (feed == "notifications") {
        if (username) {
            return {posts: breakObjectPointer(database.users[username].notifications).reverse(), count: database.users[username].notifications.length, blurb: "its time to read what people think of you..."}
        }
    }
    if (feed == "feed") {
        if (username) {
            return {posts: breakObjectPointer(database.users[username].personalFeed).reverse(), count: database.users[username].personalFeed.length, blurb: "your personal source of s***posts"}
        }
    }
    if (!database.feeds[feed]) {
        database.feeds[feed] = [];
    }
    var maximum = 100;
    var output = [];
    for (var i = database.feeds[feed].length - 1; i >= 0 && i >= database.feeds[feed].length - maximum; i--) {
        output.push(database.feeds[feed][i]);
    }
    return {posts: output, count: database.feeds[feed].length, blurb: faker.company.catchPhrase() };
}

function randomString(length) {
    var output = '';
    var characters = '0123456789abcdef';

    for (var i = 0; i < length; i++) {
        output += characters[Math.round(Math.random() * (characters.length - 1))];
    }

    return output;
}

function usernameOfToken(token) {
    for (var username in database.tokens) {
        if (database.tokens[username] == token) {
            if (database.bannedUsers.includes(username)) {
                database.tokens[username] = null;
                return null;
            }
            return username;
        }
    }
    console.log(chalk.bgBlue.black('INFO') + " expired login.");
    return null;
}

function breakObjectPointerWithoutSideEffects(obj) {
    if (typeof obj != 'object') {
        return obj;
    }
    if (obj == null) {
        return null;
    }
    var newObject = {};
    for (var i in obj) {
        newObject[i] = breakObjectPointerWithoutSideEffects(obj[i]);
    }
    return newObject;
}

function getContentOfPost(id,token) {
    try {
        if (database.bannedUsers.includes(database.posts[id].username)) {
            return Object.assign(breakObjectPointerWithoutSideEffects(database.posts[id]),{banned:true});
        }
    } catch {}
    var output = breakObjectPointerWithoutSideEffects(database.posts[id] || {username:"unknown",text:"This post no longer exists."});
    output.score = 0;
    if (output.ratings == null) {
        output.ratings = {};
    }
    for (var i in output.ratings) {
        output.score += output.ratings[i];
    }
    console.log(usernameOfToken(token));
    output.myRating = output.ratings[usernameOfToken(token)];
    output.ratings = null;
    return output;
}

function ratePost(id,token,rating) {
    try {
        if (database.posts[id].ratings == null) {
            database.posts[id].ratings = {};
        }
        database.posts[id].ratings[usernameOfToken(token)] = Math.clamp(parseFloat(rating),-1,1);
    } catch(e) {
    }
    return {};
}

function updateUser(user) {
    if (!database.users[user].notifications) {
        database.users[user].notifications = [];
    }
    if (!database.users[user].personalFeed) {
        database.users[user].personalFeed = [];
    }
}

function clearNotifications(token) {
    var username = usernameOfToken(token);
    if (username) {
        updateUser(username);
        database.users[username].notifications = [];
    }
}

const app = express()
const port = 3000

app.use(express.static('static',{extensions: ['html']}));

app.get('/api/post', (req, res) => {
    res.send(getContentOfPost(req.query.id,req.query.token))
})

app.get('/api/feed', (req, res) => {
    res.send(getFeedLatestPosts(req.query.name,req.query.token))
})

app.get('/api/login', (req, res) => {
    res.send(login(req.query.username,req.query.password))
})

app.get('/api/signup', (req, res) => {
    res.send(signup(req.query.username,req.query.password))
})

app.get('/api/usernameoftoken', (req, res) => {
    res.send({username:usernameOfToken(req.query.token)});
});

app.get('/api/clearnotifications', (req, res) => {
    clearNotifications(req.query.token);
    res.status(200);
});

app.get('/api/ban', (req, res) => {
    banUser(req.query.token,req.query.username);
});
app.get('/api/unban', (req, res) => {
    unbanUser(req.query.token,req.query.username);
});
app.get('/api/ratePost', (req, res) => {
    ratePost(req.query.id,req.query.token,req.query.rating);
    res.send({success:true});
});

app.get('/api/writepost', (req, res) => {
    var repost = req.query.repost;
    if (repost == "undefined" || repost == "null") {
        repost = null;
    } 
    res.send(post(req.query.token,req.query.content,req.query.feed,repost));
});

app.get('/api/following', (req, res) => {
    try {
        res.send({
            following:database.users[req.query.username].followers.includes(req.query.me),
            admin:database.users[req.query.me].admin,
            banned:database.bannedUsers.includes(req.query.username)
        });
    } catch {
        res.send({following:false,admin:false,banned:false});
    }
});

app.get('/api/follow', (req, res) => {
    try {
        if (!database.users[req.query.username].followers.includes(usernameOfToken(req.query.token))) {
            database.users[req.query.username].followers.push(usernameOfToken(req.query.token));
        }
    } catch {}
    res.send({});
});

app.get('/api/unfollow', (req, res) => {
    try {
        database.users[req.query.username].followers.splice(database.users[req.query.username].followers.indexOf(usernameOfToken(req.query.token)),1);
    } catch {}
    res.send({});
});

app.get('/', (req, res) => {
    res.sendFile('static/index.html')
})

app.get('*', (req, res) => {
    res.send('<!DOCTYPE html><html><head><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet"><style>body{display:flex;justify-content:center;align-items:center;width:100vw;height:100vh;position:fixed;left:0;top:0;text-align:center;font-family:Inter}span{font-size:105px;font-weight:700;background:linear-gradient(90deg,red,#8000ff);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}p{font-size:15px;font-weight:500}</style></head><body><div><span>404</span><p>The page you tried to access doesnt exist. :/</p></div></body></html>');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})