var theme = {
    background: "rgba(255,255,255,0.125)",
    text: "white",
    shadow: "rgba(0,0,0,0.25)",
    pageBackgroundColor: "rgb(20,20,20)",
    blackInversion: 1
}
var activeRepost = null;
var posting = false;

setTimeout(function() {
    try {
        document.getElementById("transitionStyle").innerHTML = "* {transition: 0.2s}";
    } catch {}
},100);

//https://stackoverflow.com/questions/11068240/what-is-the-most-efficient-way-to-parse-a-css-color-in-javascript

let memoize = function(factory, ctx) {
    var cache = {};
    return function(key) {
        if (!(key in cache)) {
            cache[key] = factory.call(ctx, key);
        }
        return cache[key];
    };
};

let colorToRGBA = (function() {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    var ctx = canvas.getContext('2d');

    return memoize(function(col) {
        ctx.clearRect(0, 0, 1, 1);
        // In order to detect invalid values,
        // we can't rely on col being in the same format as what fillStyle is computed as,
        // but we can ask it to implicitly compute a normalized value twice and compare.
        ctx.fillStyle = '#000';
        ctx.fillStyle = col;
        var computed = ctx.fillStyle;
        ctx.fillStyle = '#fff';
        ctx.fillStyle = col;
        if (computed !== ctx.fillStyle) {
            return; // invalid color
        }
        ctx.fillRect(0, 0, 1, 1);
        return [ ... ctx.getImageData(0, 0, 1, 1).data ];
    });
})();

function lerpColor(a,b,t) {
    return [lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]
}

function lerp(a,b,t) {
    return (b*t)+((1-t)*a);
}

setInterval(() => {
    if (localStorage.lightMode != "on") {
        window.theme = {
            background: "rgba(255,255,255,0.1)",
            text: "white",
            shadow: "rgba(0,0,0,0.2)",
            pageBackgroundColor: "rgb(8,8,8)",
            blackInversion: 1
        }
    } else {
        window.theme = {
            background: "white",
            text: "black",
            shadow: "rgba(0,0,0,0.2)",
            pageBackgroundColor: "rgb(245, 245, 245)",
            blackInversion: 0
        }
    }

    if (window.secretStyle) {
        window.secretStyle();
    }

    BuildlessElement.prototype.backgroundTheme = function (colorName) {
        setInterval(() => {
            this.element.style.backgroundColor = window.theme[colorName];
        }, 0);
        return this;
    }
    BuildlessElement.prototype.colorTheme = function (colorName) {
        setInterval(() => {
            this.element.style.color = window.theme[colorName];
        }, 0);
        return this;
    }
    BuildlessElement.prototype.shadowTheme = function (down, blur) {
        setInterval(() => {
            this.element.style.boxShadow = `0 ${down}px ${blur}px ${window.theme.shadow}`;
        }, 0);
        return this;
    }
}, 0);

function Greencore() { // if nightcore is weird music then this... is unrelated?
    window.theme = {
        background: "rgba(0,255,255,0.1)",
        text: "white",
        shadow: "rgba(0,0,0,0.05)",
        pageBackgroundColor: "rgb(0,64,60)",
        blackInversion: 1
    }
}
function Redcore() {
    window.theme = {
        background: "rgba(255,0,0,0.1)",
        text: "white",
        shadow: "rgba(0,0,0,0.05)",
        pageBackgroundColor: "rgb(32,0,0)",
        blackInversion: 1
    }
}
if (localStorage.token) {
    fetch(`/api/usernameoftoken?token=${localStorage.token}`).then(res => res.json()).then(res => {
        if (!res.username) {
            localStorage.removeItem('token');
        } else {
            localStorage.username = res.username;
        }
    });
}
function NoPostsView(bucket) {
    if (!bucket.cache) {
        bucket.img = element("img").src("noposts.svg");
        setInterval(()=>{
            bucket.img.filter(`invert(${theme.blackInversion})`);
        },0);
        bucket.cache = element("center").children(bucket.img, element("p").text("If our calculations are correct, there are precisely... zero posts."));
    }
    bucket.img.width(Math.min(innerWidth, innerHeight) / 2);
    return bucket.cache;
}
function ToggleTheme(bucket) {
    if (bucket.previousTheme != localStorage.lightMode) {
        bucket.previousTheme = localStorage.lightMode;
        bucket.cache = null;
    }
    if (!bucket.cache) {
        if (localStorage.lightMode == "on") {
            bucket.cache = element("img").src("sun.svg").display("inline").onclick(() => {
                localStorage.lightMode = null;
            });
        } else {
            bucket.cache = element("img").src("moon.svg").display("inline").filter("invert(1)").onclick(() => {
                localStorage.lightMode = "on";
            });
        }
    }
    return bucket.cache;
}
function SearchBar(bucket) {
    document.getElementById("searchstyle").innerHTML = `
        .search {
            transition : 0.2s;
        }
        .search:hover, .search:focus {
            box-shadow : 0 5px 8px ${theme.shadow};
            border-bottom : 4px solid rgb(64,128,255) !important;
        }
    `;
    if (!bucket.cache) {
        bucket.cache = element("input").fontSize(16).padding(8).paddingLeft(16).borderWidth(0).borderRadius("8px").class("search").placeholder("@username or #feed").backgroundTheme("background").onkeydown((e) => {
            if (e.keyCode == 13) {
                var text = bucket.cache.element.value;
                bucket.cache.element.value = "";
                if (text.startsWith("#")) {
                    window.location.hash = text.slice(1);
                } else {
                    window.location.hash = "user-" + text.slice(1);
                }
            }
        }).id("searchbar");
        if (innerWidth < 800) {
            bucket.cache.class("w100");
        }
    }
    if ((!bucket.cache.element.value.startsWith("@") && !bucket.cache.element.value.startsWith("#")) && bucket.cache.element.value.length != 0) {
        bucket.cache.element.value = "";
    }
    return bucket.cache;
}
function ClickCount(bucket) {
    if (!bucket.count) {
        bucket.count = 0
    }
    return element("button").text(bucket.count).fontSize(30).onclick(() => {
        bucket.count++;
    });
}
console.log("%cWhy are you here", "color:orange;font-size:50px;font-family:Inter;padding:10px;");
console.log("%cAre you here to get the precious?", "color:green;font-size:40px;font-family:Inter;padding:10px;");
console.log("%cBecause the map to the precious lied, and may be trying to hack you...", "color:green;font-size:25px;font-family:Inter;padding:10px;");
console.log("%ctl;dr dont paste random stuff in here unless you want your account to be stolen", "color:red;font-size:25px;font-family:Inter;padding:10px;");
console.log("%cand if you know what you're doing, happy hacking :D, and call the happyHacking function to disable certain precautions to protect script kiddies from getting viruses.", "color:yellow;font-size:15px;font-family:Inter;padding:10px;");
setInterval(() => { if (!localStorage.happyHacking) { debugger; } }, 0);
function happyHacking() { localStorage.happyHacking = true; }
function FeedButton(text, onclick,requiresConfirmation=false) {
    return element("FeedButtonContent").initialize({
        text:text,
        onclick:onclick,
        requiresConfirmation:requiresConfirmation
    });
}
function FeedButtonContent(bucket) {
    if (bucket.requiresConfirmation) {
        if (!bucket.clicks && bucket.clicks != 0) {
            bucket.clicks = 3;
        }
        var output = element("button").innerHTML(bucket.text + ` (${bucket.clicks}) ` + "<style>.whiteTx{color:white;}</style>").padding(18).paddingTop(7).paddingBottom(7).fontSize(18).transform("translateY(-5px)").borderRadius("10px").borderWidth(0).backgroundColor("red").class("whiteTx").marginLeft(20).onclick(()=>{
            bucket.clicks--;
            if (bucket.clicks == 0) {
                bucket.onclick();
            }
            setTimeout(()=>{
                bucket.clicks++;
            },500);
        }).display("inline");
        if (innerWidth < 800) {
            output.class("w100");
            output = element("div").children(element("br"), output);
        }
        return output;
    } else {
        var output = element("button").innerHTML(bucket.text + "<style>.whiteTx{color:white;}</style>").padding(18).paddingTop(7).paddingBottom(7).fontSize(18).transform("translateY(-5px)").borderRadius("10px").borderWidth(0).backgroundColor("rgb(64,128,255)").class("whiteTx").marginLeft(20).onclick(bucket.onclick).display("inline");
        if (innerWidth < 800) {
            output.class("w100");
            output = element("div").children(element("br"), output);
        }
        return output;
    }
}
function NotificationCounter(bucket) {
    if (!bucket.downloaded) {
        bucket.downloaded = true;
        setInterval(function() {
            try {
                if (posting || activeRepost || document.getElementById("searchbar").value != "") {
                    return;
                }
            } catch {}
            fetch(`/api/feed?name=notifications&token=${localStorage.token}`).then(res => res.text()).then(text => {
                try {
                    var stripped = JSON.parse(text);
                    delete stripped.blurb;
                    var strippedLocalStorage = JSON.parse(localStorage["feed_notifications"]);
                    delete strippedLocalStorage.blurb;
                    stripped = JSON.stringify(stripped);
                    strippedLocalStorage = JSON.stringify(strippedLocalStorage);
                    if (stripped != strippedLocalStorage) {
                        localStorage["feed_notifications"] = text;
                    }
                } catch {
                    localStorage["feed_notifications"] = text;
                }
            });
        },1000);
    }
    var notificationCount = JSON.parse(localStorage["feed_notifications"]).posts.length;
    if (notificationCount == 0) {
        return element("button").display("none");
    } else {
        return element("button").text(notificationCount).padding(7).paddingLeft(14).paddingRight(14).backgroundColor("red").colorTheme("pageBackgroundColor").fontWeight("bold").borderRadius("10px").cursor("pointer").onclick(()=>{
            window.location.hash = "notifications";
        }).borderWidth(0);
    }
}
function PingUser(bucket) {
    return element("span").text(bucket.content).fontWeight("bold").cursor("pointer").onclick(()=>{
        window.location.hash = "user-" + bucket.content.slice(1);
    });
}
function Feed(bucket) {
    var useMobileDesign = innerWidth < 800;
    if (!window.location.hash) {
        window.location.hash = "general";
    }
    if (bucket.feed != window.location.hash.slice(1)) {
        bucket.downloaded = false;
        bucket.feed = window.location.hash.slice(1);
    }
    if (!bucket.downloaded) {
        bucket.downloaded = true;
        setInterval(function() {
            try {
                if (posting || activeRepost || document.getElementById("searchbar").value != "") {
                    return;
                }
            } catch {}
            //yep, thats right... authenticated feeds. its kinda important if we want notifications to work :)
            fetch(`/api/feed?name=${bucket.feed}&token=${localStorage.token}`).then(res => res.text()).then(text => {
                try {
                    var stripped = JSON.parse(text);
                    delete stripped.blurb;
                    var strippedLocalStorage = JSON.parse(localStorage["feed_" + bucket.feed]);
                    delete strippedLocalStorage.blurb;
                    stripped = JSON.stringify(stripped);
                    strippedLocalStorage = JSON.stringify(strippedLocalStorage);
                    if (stripped != strippedLocalStorage) {
                        localStorage["feed_" + bucket.feed] = text;
                    }
                } catch {
                    localStorage["feed_" + bucket.feed] = text;
                }
            });
        },1000);
    }
    if (localStorage["feed_" + bucket.feed]) {
        var posts = JSON.parse(localStorage["feed_" + bucket.feed]).posts;
        var blurb = JSON.parse(localStorage["feed_" + bucket.feed]).blurb;
        var title = "#" + bucket.feed;
        if (bucket.feed == "feed") {
            title = "my feed";
        }
        if (bucket.feed.startsWith("user-")) {
            if (bucket.feed.slice(5) != localStorage.username) {
                title = `@${decodeURIComponent(bucket.feed.slice(5))}`;
            } else {
                title = "my profile";
            }
        }
        if (bucket.feed == "login") {
            title = "login/signup";
        }
        if (bucket.feed == "notifications") {
            title = "notifications";
        }
        document.title = "scriptegy hubs ▪ " + title;
        var list = element("div").children(element("h1").text(title).display("inline").marginRight(20).overflow("hidden").textOverflow("elipses").maxWidth(innerWidth * 0.5));

        document.getElementById("mainStyle").innerHTML = `
            body {
                background: ${theme.pageBackgroundColor};
                color: ${theme.text};
            }
            input {
                color: ${theme.text};
            }
        `;

        var followState = {following:false,admin:false,banned:false};
        try {
            followState = JSON.parse(localStorage["following_" + bucket.feed.slice(5)]);
        } catch {}
        
        DrawButton(bucket.feed,list,bucket);
        DrawDecoration(bucket.feed,list,useMobileDesign,posts,blurb);
        if (bucket.feed == "login") {
            DrawLoginFeed(posts,list);
        } else if (followState.banned && bucket.viewPostsOfBannedUser != bucket.feed.slice(5)) {
            list.children(element("h1").text(`@${bucket.feed.slice(5)} is banned.`),element("p").text("Proceed with caution."),element("button").text("View Posts").padding(7).paddingLeft(14).paddingRight(14).borderRadius("10px").backgroundColor("red").color("white").fontWeight("bold").onclick(()=>{
                bucket.viewPostsOfBannedUser = bucket.feed.slice(5);
            }));
        } else {
            DrawDefaultContents(posts,list);
        }


        return list;
    } else {
        setTimeout(100, function () {
            console.log("reloading...");
        });
        return element("p").text("downloading feed...");
    }
}
function DrawDefaultContents(posts,list) {
    if (posts.length == 0) {
        list.children(element("NoPostsView"));
    }
    for (var i = 0; i < posts.length; i++) {
        list.children(element("Post").initialize({ id: posts[i] }));
    }
    if (posts.length != 0) {
        list.children(element("p").text("this is the end of your feed, traveler.").textAlign("center").fontWeight("bold").color("grey"));
    }
}
function DrawLoginFeed(posts,list) {
    list.children(element("Login"));
}
function DrawDecoration(feed,list,useMobileDesign,posts,blurb) {
    var decoration = element("div");

    decoration.height(40);
    decoration.flexDirection("row");
    decoration.justifyContent("flex-start");
    decoration.alignItems("center");
    //decoration.alignContent("center");
    decoration.gap("20px");
    decoration.marginLeft("20px");

    decoration.display("inline-flex");

    decoration.children(element("style").text(".w100 {width:100%;}"));

    if (feed != "login") {
        if (!useMobileDesign) {
            decoration.children(element("ToggleTheme").display("inline"));
        }
    
        var searchBar = element("SearchBar").display("inline");    
        if (useMobileDesign) {
            decoration.children(element("br"), element("br"));
            searchBar.class("w100");
        }
        if (localStorage.token && !useMobileDesign) {
            decoration.children(element("UserView").initialize({
                username:localStorage.username,
                inline:true
            }).display("inline"));
        }
        if (feed != "notifications") {
            decoration.children(element("NotificationCounter"));
        }
        decoration.children(searchBar);
    }

    list.children(decoration);

    if (feed != "login") {
        list.children(element("p").text(blurb).fontStyle("italic"));
        if (feed != "feed") {
            list.children(element("p").text(JSON.parse(localStorage["feed_" + feed]).count + " posts"));
        }
    
        if (localStorage.token) {
            list.children(element("p").text("go to my feed").cursor("pointer").onclick(() => {
                window.location.hash = "feed";
            }));
        }
    } else {
        list.children(element("br"));
    }

    if (navigator.globalPrivacyControl && !localStorage.hideGpc) {
        list.children(element("p").innerHTML("✨You're using Global Privacy Control! This didn't do anything since we already protect your privacy, but good job! ✨<a onclick='localStorage.hideGpc = true's style='color:gray;text-decoration:underline;cursor:pointer;'>Dont show this again</a>"));
    }
    if (window.warpcore && !localStorage.hideWarpcore) {
        list.children(element("p").innerHTML("✨Fun fact, some of our friends helped develop warpcore (the browser you're using right now).✨ <a onclick='localStorage.hideWarpcore = true's style='color:gray;text-decoration:underline;cursor:pointer;'>Dont show this again</a>"))
    }

    list.children(element("br"));
    if (posting) {
        if (activeRepost) {
            list.children(element("p").text("remove repost").cursor("pointer").padding(10).paddingLeft(20).paddingRight(20).backgroundColor("red").borderRadius("5px").onclick(() => {
                activeRepost = null;
            }));
        }
        list.children(element("WritePost"));
    }
}
function DrawButton(feed,list,bucket) {
    if (bucket.feed == "notifications") {
        list.children(FeedButton("Clear Notifications", () => {
            fetch(`/api/clearnotifications?token=${localStorage.token}`)
            window.location.reload();
        }));
        list.children(FeedButton("Back", () => {
            window.history.back();
        }));
    } else if (bucket.feed != "login") {
        if (localStorage.token) {
            var followState = {following:false,admin:false,banned:false};
            try {
                followState = JSON.parse(localStorage["following_" + bucket.feed.slice(5)]);
            } catch {}
            if (feed.startsWith("user-")) {
                if (!bucket.fetchedFollowState) {
                    bucket.fetchedFollowState = true;
                    fetch(`/api/following?username=${bucket.feed.slice(5)}&me=${localStorage.username}`).then(res => res.text()).then(text => {
                        console.log(text);
                        localStorage["following_" + bucket.feed.slice(5)] = text;
                    })
                }
                if (followState.following) {
                    list.children(FeedButton("Unfollow", () => {
                        fetch(`/api/unfollow?username=${bucket.feed.slice(5)}&token=${localStorage.token}`)
                        window.location.reload();
                    }));
                } else {
                    list.children(FeedButton("Follow", () => {
                        fetch(`/api/follow?username=${bucket.feed.slice(5)}&token=${localStorage.token}`)
                        window.location.reload();
                    }));
                }
                if (followState.admin) {
                    if (followState.banned) {
                        list.children(FeedButton("Unban", () => {
                            fetch(`/api/unban?username=${bucket.feed.slice(5)}&token=${localStorage.token}`);
                            window.location.reload();
                        },true));
                    } else {
                        list.children(FeedButton("Ban", () => {
                            fetch(`/api/ban?username=${bucket.feed.slice(5)}&token=${localStorage.token}`);
                            window.location.reload();
                        },true));
                    }
                }
            } else if (feed != "personal") {
                list.children(FeedButton("Post", () => {
                    posting = !posting;
                    console.log("post!!!");
                }))
            }
        } else {
            list.children(FeedButton("Login", () => {
                window.location.hash = "login";
            }));
        }
    } else {
        list.children(FeedButton("Back", () => {
            window.history.back();
        }));
    }
}
function Login(bucket) {
    return element("div").children(
        //element("span").text("login/signup").textAlign("center").fontWeight("bold").fontSize("45px").colorTheme("text"),
        //element("span").text("did you expect us to not have one?").textAlign("center").fontWeight("bold").fontSize("15px").display("block").colorTheme("text"),
        element("input").padding(10).paddingLeft(15).fontSize(15).borderRadius("15px").display("block").shadowTheme(5, 5).borderWidth(0).id("username").class("w100").backgroundTheme("background").colorTheme("text").placeholder("username"),
        element("input").padding(10).paddingLeft(15).fontSize(15).borderRadius("15px").type("password").display("block").marginTop("10px").shadowTheme(5, 5).borderWidth(0).id("password").class("w100").backgroundTheme("background").colorTheme("text").placeholder("password"),
        element("input").padding(10).fontSize(15).borderRadius("15px").type("button").display("block").marginTop("10px").shadowTheme(5, 5).borderWidth(0).backgroundColor("rgb(64,128,255)").value(bucket.error || "Login").class("loginButton").onclick(() => {
            fetch(`/api/login?username=${document.getElementById("username").value}&password=${document.getElementById("password").value}`).then(res => res.json()).then(text => {
                if (text.error) {
                    bucket.error = text.error;
                    setTimeout(() => {
                        bucket.error = null;
                    }, 1000);
                }
                if (text.token) {
                    localStorage.token = text.token;
                    window.history.back();
                }
            });
        }),
        element("SignupButton"),
        element("style").text(`.loginButton { color:${theme.pageBackgroundColor};text-align:center;width:100%;font-weight:bold; } .w100 {width:100%} `),
        element('style').text(`
            body {
                background: ${theme.pageBackgroundColor};
                color: ${theme.text};
            }
            input[type="text"] {
                background: ${theme.background} !important;
            }
        `)
    ).maxWidth(300);
}

function lerp(a, b, t) {
    return (b * t) + (a * (1 - t));
}

function SignupButton(bucket) {
    if (bucket.clicksLeft == null) {
        bucket.clicksLeft = 3;
    }

    var t = (3 - bucket.clicksLeft) / 2;
    var r = lerp(64, 255, t);
    var g = lerp(128, 0, t);
    var b = lerp(255, 0, t);

    var signupText = "Signup";

    if (bucket.clicksLeft == 2) {
        signupText = "Click 2 more times!"
    }
    if (bucket.clicksLeft == 1) {
        signupText = "Click 1 more time!"
    }
    if (bucket.clicksLeft <= 0) {
        signupText = "Loading..."
    }
    if (bucket.error) {
        signupText = bucket.error;
    }

    return element("input").padding(10).fontSize(15).borderRadius("15px").type("button").display("block").marginTop("10px").borderWidth(0).backgroundColor(`rgb(${r},${g},${b})`).value(signupText).class("loginButton").shadowTheme(5, 5).onclick(
        () => {
            bucket.clicksLeft--;

            if (bucket.clicksLeft == 0) {
                fetch(`/api/signup?username=${document.getElementById("username").value}&password=${document.getElementById("password").value}`).then(res => res.json()).then(text => {
                    if (text.error) {
                        bucket.error = text.error;
                        setTimeout(() => {
                            bucket.error = null;
                        }, 1000);
                    }
                    if (text.token) {
                        localStorage.token = text.token;
                        window.history.back();
                    }
                });
            }

            setTimeout(() => {
                bucket.clicksLeft++;
            }, 500);
        }
    );
}

function ShortenNumber(num) {
    var number = num;
    if (number > 1000000000) {
        return ShortenToSingleDecimal(number / 1000000000) + "B";
    }
    if (number > 1000000) {
        return ShortenToSingleDecimal(number / 1000000) + "M";
    }
    if (number > 1000) {
        return ShortenToSingleDecimal(number / 1000) + "K";
    }
    return number;
}

function ShortenToSingleDecimal(num) {
    if (num.toString().split(".").length == 1) { return num; }
    var output = num;
    while (output.toString().split(".")[1].length > 1) {
        output = parseFloat(output.toString().slice(0, output.length));
    }
    return output;
}

function RainbowText(bucket) {
    var elm = element("span");

    for (var i = 0; i < bucket.content.length; i++) {
        elm.children(element("span").innerHTML(bucket.content[i]).color(hsl(((new Date().getTime() + (i * 100)) / 10) % 360,100,50)).fontSize(lerp(16,20,Math.sin((new Date().getTime() / 100)+(i*0.5)))));
    }

    return elm;
}

function Post(bucket) {
    if (!bucket.downloaded) {
        bucket.downloaded = true;
        fetch(`/api/post?id=${bucket.id}`).then(res => res.text()).then(json => {
            localStorage["post_" + bucket.id] = json;
        });
    }
    if (localStorage["post_" + bucket.id]) {
        var post = JSON.parse(localStorage["post_" + bucket.id]);
        var o = element("PostView").initialize({ username: post.username, text: post.text, img: "Disco_Logo.png", feed: post.feed, repost: post.repost, id: bucket.id });
        /*if (post.banned) {
            if (!bucket.visible) {
                return element("p").text("this post is from a banned user. click to show.").fontWeight("bold").onclick(()=>{
                    bucket.visible = true;
                }).cursor("pointer");
            }
        }*/
        return o;
        //return element("div").children(element("span").text(post.username).fontSize(18),element("div").innerHTML(post.text)).padding(25).margin(30).borderRadius("15px").boxShadow("0 10px 20px rgba(0,0,0,0.4)").backgroundColor("rgb(250,250,250)");
    } else {
        return element("p").text(`downloading post (${bucket.id})...`);
    }
}

function WritePost(bucket) {
    if (!bucket.cache) {
        var error = element("div").text("error goes here! :D").padding(10).paddingLeft(20).paddingRight(20).borderRadius("10px").display("none").backgroundColor("red").margin(15).colorTheme("pageBackgroundColor");
        bucket.cache = element("div").padding(10).paddingLeft(50).paddingTop(25).children(
            error,
            element("UserView").initialize({ username: localStorage.username, img: bucket.img }),
            element("p").contentEditable().fontSize(17).marginLeft(41).padding(50).backgroundColor("rgba(128,128,128,0.1)").borderRadius("15px").id("postInput"),
            element("button").text("Post").padding(18).paddingTop(7).paddingBottom(7).fontSize(18).margin(20).marginTop(0).marginBottom(0).transform("translateY(-5px)").borderRadius("10px").borderWidth(0).backgroundColor("rgb(64,128,255)").class("whiteTx").onclick(() => {
                fetch(`/api/writepost?token=${localStorage.token}&content=${encodeURIComponent(document.getElementById("postInput").innerHTML)}&feed=${window.location.hash.slice(1)}&repost=${activeRepost}`).then(res => res.json()).then((json) => {
                    if (json.success) {
                        window.location.reload();
                    } else {
                        bucket.error = json.error;
                    }
                });
            }), element("style").text(".whiteTx{color:white;}")
        ).shadowTheme(3, 15).borderRadius("10px").marginBottom(25).backgroundTheme("background")
        setInterval(() => {
            if (bucket.error) {
                error.display("block");
                error.text(bucket.error);
                error.fontWeight("bold");
            }
        }, 0);
    }
    return bucket.cache;
}

function PostView(bucket) {
    if (!bucket.cache) {
        var main = element("div").padding(10).paddingLeft(50).paddingTop(25).children(element("UserView").initialize({ username: bucket.username, img: bucket.img }), element("p").innerHTML(bucket.text).fontSize(17).marginLeft(41).overflow("hidden")).shadowTheme(3, 15).borderRadius("10px").marginBottom(25).backgroundTheme("background");
        if (bucket.repost) {
            main.children(element("Post").initialize({
                id: bucket.repost
            }));
        }
        if (bucket.feed != window.location.hash.slice(1)) {
            main.children(element("p").text(`from #${bucket.feed}`).onclick(() => {
                window.location.hash = bucket.feed;
            }).paddingLeft(41).fontStyle("italic"));
        }
        if (!bucket.repost) {
            main.children(element("p").text("repost").cursor("pointer").onclick(() => {
                activeRepost = bucket.id;
                posting = true;
            }).fontWeight("bold").marginLeft(41));
        }
        bucket.cache = main;
    }
    return bucket.cache;
}
function UserView(bucket) {
    if (!bucket.cache) {
        bucket.cache = element("div").children(element("img").src(`https://ui-avatars.com/api/?name=${encodeURIComponent(bucket.username)}`).height(30).borderRadius("500px"), element("span").text(bucket.username).marginLeft(10).fontSize(15).background("rgba(0,0,0,0.1)")).display("flex").justifyContent("flex-start").alignItems("center").cursor("pointer").onclick(() => {
            window.location.hash = "user-" + bucket.username;
        });
        if (bucket.inline) {
            bucket.cache.display("inline-flex");
        }
    }
    return bucket.cache;
}