/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var request = require('request');
var jwt = require('jwt-simple');
var qs = require('querystring');
var base64_decode = require('base64').decode;

module.exports = {
	// USER INFO 
	me: function(req, res) {
		User.getUser({objectId: req.userId['objectId']}, function(err, existingUser) {
			if (existingUser) {
				if(existingUser.picture) var picture = existingUser.picture;
				else var picture = '';
				
				var User = {'id': existingUser.id,
							'name': existingUser.name,
							'email': existingUser.email,
							'picture': picture};
				res.send({user: User});
			} else {
				return res.status(401).send({
					err: 'Unathorized.'
				});
			}
		});
	},
	// NORMAL LOGIN 
	login: function(req, res) {
		var all = req.body[0];
		var CSRF = req.headers['x-csrf-token'];

		var allDecoded = base64_decode(all).split('|');
		var emailSplit = base64_decode(allDecoded[0]).split('$');
		var passwordSplit = base64_decode(allDecoded[1]).split('$');

		var email = emailSplit[0];
		var password = passwordSplit[0];

		function validateEmail(email) {
			var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
			return re.test(email);
		}

		function login(username, password){
			User.login({
				username: username,
				password: password
			}, function(err, existingUser) {
				if (existingUser) {
					if(existingUser.picture) var picture = existingUser.picture;
					else var picture = '';

					var token = functions.createToken({'id': existingUser.id,
						                              'name': existingUser.name,
						                              'email': existingUser.email,
						                              'picture': picture});
					res.send({
						token: token
					});
				} else {
					return res.status(401).send({
						err: 'Wrong username or password.'
					});
				}
			});
		}

		if(validateEmail(email)){
			User.findUser({
				email: email
			}, function(err, existingEmail) {
				if (existingEmail) {
					var username = existingEmail[0].username;
					login(username, password);

				} else {
					return res.status(401).send({
						err: 'Wrong email.'
					});
				}
			});
		} else {
			login(email, password);

		}
	},
	// TWITTER
	twitter: function(req, res) {
		var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
		var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
		var authenticateUrl = 'https://api.twitter.com/oauth/authorize';

		if (!req.query.oauth_token || !req.query.oauth_verifier) {
			var requestTokenOauth = {
				consumer_key: config.TWITTER_KEY,
				consumer_secret: config.TWITTER_SECRET,
				callback: config.TWITTER_CALLBACK
			};

			// Step 1. Obtain request token for the authorization popup.
			request.post({
				url: requestTokenUrl,
				oauth: requestTokenOauth
			}, function(err, response, body) {
				var oauthToken = qs.parse(body);
				var params = qs.stringify({
					oauth_token: oauthToken.oauth_token
				});

				// Step 2. Redirect to the authorization screen.
				res.redirect(authenticateUrl + '?' + params);
			});
		} else {
			var accessTokenOauth = {
				consumer_key: config.TWITTER_KEY,
				consumer_secret: config.TWITTER_SECRET,
				token: req.query.oauth_token,
				verifier: req.query.oauth_verifier
			};

			// Step 3. Exchange oauth token and oauth verifier for access token.
			request.post({
				url: accessTokenUrl,
				oauth: accessTokenOauth
			}, function(err, response, profile) {
				profile = qs.parse(profile);

				// Step 4a. Link user accounts.
				if (req.headers.authorization) {
					User.findOne({
						twitter: profile.user_id
					}, function(err, existingUser) {
						if (existingUser) {
							return res.status(409).send({
								message: 'There is already a Twitter account that belongs to you'
							});
						}
						var token = req.headers.authorization.split(' ')[1];
						var payload = jwt.decode(token, config.TOKEN_SECRET);
						User.findById(payload.sub, function(err, user) {
							if (!user) {
								return res.status(400).send({
									message: 'User not found'
								});
							}
							user.twitter = profile.user_id;
							user.name = user.name || profile.screen_name;
							user.twitterToken = profile.oauth_token;
							user.twitterSecretToken = profile.oauth_token_secret;
							user.save(function(err) {
								res.send({
									token: functions.createToken(user)
								});
							});
						});
					});
				} else {
					// Step 4b. Create a new user account or return an existing one.
					User.findOne({
						twitter: profile.user_id
					}, function(err, existingUser) {
						if (existingUser) {
							var token = createToken(existingUser);
							return res.send({
								token: token
							});
						}
						var user = User.create({
							twitter: profile.user_id,
							name: profile.screen_name,
							twitterToken: profile.oauth_token,
							twitterSecretToken: profile.oauth_token_secret

						}).exec(function(err, user) {
							var token = functions.createToken(user);
							res.send({
								token: token
							});
						});
					});
				}
			});
		}
	},
	// GOOGLE
	google: function(req, res) {
		var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
		var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
		var params = {
			code: req.body.code,
			client_id: req.body.clientId,
			client_secret: config.GOOGLE_SECRET,
			redirect_uri: req.body.redirectUri,
			grant_type: 'authorization_code'
		};
		// Step 1. Exchange authorization code for access token.
		request.post(accessTokenUrl, {
			json: true,
			form: params
		}, function(err, response, token) {
			var accessToken = token.access_token;
			var headers = {
				Authorization: 'Bearer ' + accessToken
			};

			// Step 2. Retrieve profile information about the current user.
			request.get({
				url: peopleApiUrl,
				headers: headers,
				json: true
			}, function(err, response, profile) {

				// Step 3a. Link user accounts.
				if (req.headers.authorization) {
					User.findOne({
						google: profile.sub
					}, function(err, existingUser) {
						if (existingUser) {
							return res.status(409).send({
								message: 'There is already a Google account that belongs to you'
							});
						}
						var token = req.headers.authorization.split(' ')[1];
						var payload = jwt.decode(token, config.TOKEN_SECRET);
						User.findById(payload.sub, function(err, user) {
							if (!user) {
								return res.status(400).send({
									message: 'User not found'
								});
							}
							user.google = profile.sub;
							user.googleToken = accessToken;
							user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
							user.name = user.name || profile.name;
							user.email = user.email || profile.email;
							user.save(function() {
								var token = functions.createToken(user);
								res.send({
									token: token
								});
							});
						});
					});
				} else {
					// Step 3b. Create a new user account or return an existing one.
					User.findOne({
						google: profile.sub
					}, function(err, existingUser) {
						if (existingUser) {
							return res.send({
								token: functions.createToken(existingUser)
							});
						}
						User.create({
							google: profile.sub,
							googleToken: accessToken,
							youtubeRefreshToken: null,
							name: profile.name,
							picture: profile.picture.replace('sz=50', 'sz=200'),
							email: profile.email

						}).exec(function(err, user) {
							var token = functions.createToken(user);
							res.send({
								token: token
							});
						});

						/*var user = new User();
						user.google = profile.sub;
						user.picture = profile.picture.replace('sz=50', 'sz=200');
						user.displayName = profile.name;
						user.save(function(err) {
						  var token = functions.createToken(user);
						  res.send({ token: token });
						});*/
					});
				}
			});
		});
	}
};