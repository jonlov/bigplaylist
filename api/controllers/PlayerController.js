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
	index: function(req, res) {
		var getVideo = req.param('video');
		var getPlaylist = req.param('playlist');

		if (getVideo == 'null') {
			var video = '';
		} else {
			var video = getVideo;
		}

		if (getPlaylist == 'null') {
			var playlist = '';
		} else {
			var playlist = 'listType=playlist&list=' + getPlaylist + '&';
		}

		var snippetApiUrl = 'https://www.youtube.com/embed/' + video + '?' + playlist + 'autoplay=1&modestbranding=1&autohide=1&enablejsapi=1&html5=1&origin=http://localhost:8000/';
		request.get({
			url: snippetApiUrl
		}, function(err, response, results) {
			//return res.send("Hi there!");
			var perra = 'function changeSpeed(){ vid = document.getElementsByClassName("video-stream html5-main-video")[0]; vid.playbackRate = 3.0; }'
			return res.send(results);
			//console.log(results);
			//res.json(results);
		});
	},
	sync: function(req, res) {
		if (req.isSocket) {
			function roomCount(room) {
				localCount = 1;
				if (room) {
					for (var id in room) {
						localCount++;
					}
				}
				return localCount;
			}

			var socket = req.socket;
			var io = sails.io;
			var userId = req.userId['objectId'];
			var roomClients = io.sockets.adapter.rooms[userId];

			var clientsTotal = roomCount(roomClients);
			var exist = false;

			if (clientsTotal == 1) {
				socket.join(userId);
			} else {
				var count = 1;
				for (client in roomClients) {
					if (client == socket.id) {
						exist = true;
					}
					count++;
					if (count == clientsTotal)
						if (!exist) {
							socket.join(userId);
							socket.broadcast.to(userId).emit('loggedIn', {id: socket.id});
						}
				}
			}

		} else {
			res.send(404).end();
		}
	}
};