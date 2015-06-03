/**
 * PlaylistsController
 *
 * @description :: Server-side logic for managing playlists
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var request = require('request');
var jwt = require('jwt-simple');
var qs = require('querystring');
var Youtube = require("youtube-api");

module.exports = {

	search: function (req, res) {
		var slug = encodeURIComponent(req.param('q'));
		var getPageToken = req.param('pageToken');

		if(getPageToken == 'null'){
			var pageToken = '';
		} else {
			var pageToken = '&pageToken='+ getPageToken;
		}

		if(slug == '1565asadewqrJyw68022aASDiikem_)i93'){
		    res.json().end();
		} else {
		var snippetApiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q='+ slug + pageToken +'&key='+ config.YOUTUBE_KEY;
		//var snippetApiUrl = 'http://gdata.youtube.com/feeds/api/videos?q='+ slug +'&alt=json';
		
		    // Step 2. Retrieve profile information about the current user.
		    /*request.get({ url: snippetApiUrl, json: true }, function(err, response, results) {
		    	res.json(results.feed.entry.splice(1,25));
		    });*/
		//var results = config.YOUTUBE;
			request.get({ url: snippetApiUrl, json: true }, function(err, response, results) {
				var purs = [];
				var count = 0;
				for (item in results.items){
					if(results.items[item].id.kind == 'youtube#video'){
						purs[count] = 'youtube$'+results.items[item].id.videoId;
						count++;
					}
				}
		    	res.json({results: results, items: purs}).end();
		    });
		}
		/* 
		var slug = req.param('q');
		if(slug == '1565asadewqrJyw68022aASDiikem_)i93'){
		    res.json();
		} else {
		//var snippetApiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q='+ slug +'&key='+ config.YOUTUBE_KEY;
		var snippetApiUrl = 'http://gdata.youtube.com/feeds/api/videos?q=' slug '&alt=json';
		    // Step 2. Retrieve profile information about the current user.
		    request.get({ url: snippetApiUrl, json: true }, function(err, response, results) {
		    	res.json(results.items);
		    });

		}
		*/
	},
	// YOUTUBE
	auth: function(req, res){
		var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		var snippetApiUrl = 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true';
		var params = {
		    code: req.body.code,
		    client_id: req.body.clientId,
		    client_secret: config.GOOGLE_SECRET,
		    redirect_uri: req.body.redirectUri,
		    grant_type: 'authorization_code'
		};
		// Step 1. Exchange authorization code for access token.
		request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
		    var accessToken = token.access_token;
		    var refreshToken = token.refresh_token;
		    var headers = { Authorization: 'Bearer ' + accessToken };

		    // Step 2. Retrieve profile information about the current user.
		    request.get({ url: snippetApiUrl, headers: headers, json: true }, function(err, response, channel) {
		    	var YoutubeID = channel.items[0].id;
		    	var YoutubeName = channel.items[0].snippet.title;
		    	var YoutubePicture = channel.items[0].snippet.thumbnails.default.url;

		    	if (req.headers.authorization) { 
          			var token = req.headers.authorization.split(' ')[1];
          			var payload = jwt.decode(token, config.TOKEN_SECRET);
          			var userId = payload.sub;

			        User.findOne({ id: userId }, function(err, user) {
			            if (!user) {
			              	return res.status(400).send({ message: 'User not found' });
			            }
			            user.youtubeRefreshToken = refreshToken;
			            user.save(function() {
				            var token = functions.createToken(user);
				            return res.send({ token: token });
			        	});
			        });
		    	} else {
		    		return res.status(403).send({ message: 'Invalid session' });
		    	}
		    });
		});
	},
	myPlaylists: function (req, res) {
			console.log(req.userId);
		User.findOne(req.userId, function(err, user){
			//console.log(user.googleToken);
		/*
			Youtube.authenticate({
			    type: "oauth",
			    token: user.googleToken
			});

			Youtube.channels.list({
	    		"part": "id",
	    		"mySubscribers": true,
	    		"maxResults": 50
			}, function (err, data) {
		    	console.log(err || data);
			});*/
		});
	}
};