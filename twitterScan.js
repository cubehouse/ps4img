"use strict";

// libs
var Twitter = require('twitter');
var crypto  = require('crypto');
var mysql   = require('mysql');
var fs      = require('fs');
var http    = require('http');

// check the config file exists
if (!fs.existsSync("./config.js")) {
    console.log("Configuration file does not exist!");
    process.exit(0);
}

// load configuration file
var config  = require("./config");

// setup twitter/database objects
var twit = new Twitter(config.twitter);
var db = mysql.createConnection(config.db);

db.connect();

// TEST/DEBUG - search for PS4Share to gather random pics
twit.stream('statuses/filter', {track: "#PS4Share"}, function(stream) {
    stream.on('data', function(data) {
        parseTweet(data);
    });
});

// stream our home timeline to search for new pics
twit.stream('user', function(stream) {
    stream.on('data', function(data) {
        parseTweet(data);
    });
});

// get home timeline to make sure any downtime didn't miss any pics!
twit.getHomeTimeline(function(data) {
    var todo = [];
    for(var i=0; i<data.length; i++) {
        todo.push(data[i]);
    }

    var step = function() {
        var c = todo.shift();

        if (c) {
            parseTweet(c, function() {
                process.nextTick(step);
            });
        }
    };

    process.nextTick(step);
});



// === FUNCTIONS ===

function parseTweet(data, cb) {
    if (data.entities && data.entities.media) {
        // grab the user who shared this image
        //console.log(JSON.stringify(data, null, 2));
        var user_id = data.id;

        // loop through new images to build a todo list of new entries
        var todo = [];
        for(var i=0; i<data.entities.media.length; i++) {
            todo.push(data.entities.media[i]);
        }

        // if there are new entries, process them
        if (todo.length > 0) {
            var step = function() {
                var c = todo.shift();

                if (c) {
                    addImg(c, data, function() {
                        process.nextTick(step);
                    });
                } else {
                    if (cb) cb();
                }
            };

            process.nextTick(step);
        } else {
            if (cb) cb();
        }
    } else {
        if (cb) cb();
    }
}

function addImg(obj, data, cb) {
    // first check to see if this is a new image
    db.query("SELECT * FROM images WHERE twit_id = ?", [obj.id_str], function(err, rows) {
        // TODO - handle error
        if (err) {
            console.log("ERROR READING IMAGES ("+obj.id_str+") : " + err);
            return;
        }

        if (rows.length > 0) {
            // TODO - image already exists, add to user's gallery or something
            if (cb) cb();
        } else {
            // new image!

            // generate a new hash for this image
            var salt = randomString(15);
            var md5gen = crypto.createHash('md5');
            md5gen.update(obj.id_str + ":" + salt);
            var hash = md5gen.digest("hex");

            // grab file extension
            var ext = fileExt(obj.media_url);

            var dirs = [];
            var dest = config.storage_dir;
            dirs.push(dest);
            for(var i=0; i<config.sub_dirs; i++) {
                dest = dest + "/" + hash[i];
                dirs.push(dest);
            }

            dest = dest + "/" + hash + "." + ext;

            // make sure storage directory exists
            checkMakeDirs(dirs, function() {
                // download image locally
                downloadFile(obj.media_url+":large", dest, function() {
                    // insert into database
                    db.query("INSERT INTO images (`twit_id`, `tweet_id`, `url`, `nice_url`, `hash`, `salt`, `ext`) VALUES (?, ?, ?, ?, ?, ?, ?)", [
                        obj.id_str,
                        data.id_str,
                        obj.media_url,
                        obj.display_url,
                        hash,
                        salt,
                        ext,
                    ], function(err, result) {
                        console.log("Downloaded image "+obj.display_url+" to "+dest);
                        //db.query("INSERT INTO galleries (`image_id`, `user_id`) VALUES (?, ?)", [result.insertId, 1], function(err, result) {
                            if (cb) cb();
                        //});
                    });
                });
            });
        }
    });

}

function addImgToUser(image_id, user_id) {

}

function randomString(length) {
    if (!length) length = 32;

    var text = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < length; i++ ) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return text;
}

// http://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript
function fileExt(filename) {
    return filename.split('.').pop();
}

// http://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js
function downloadFile(source, dest, cb) {
    setTimeout(function() {
        var file = fs.createWriteStream(dest);
            var request = http.get(source, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close();
                if (cb) cb();
            });
        });
    }, 3000);
}

function checkMakeDir(dir, cb) {
    fs.exists(dir, function(e) {
        if (!e) {
            fs.mkdir(dir, 644, function() {
                return cb();
            });
        } else {
            return cb();
        }
    });
}

function checkMakeDirs(dirs, cb) {
    var step = function() {
        var c = dirs.shift();

        if (!c) {
            return cb();
        }

        checkMakeDir(c, function() {
            process.nextTick(step);
        });
    };

    process.nextTick(step);
}