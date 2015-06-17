/**
 * PlaylistsController
 *
 * @description :: Server-side logic for managing Playlists
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var fs = require('fs');
var ytdl = require('ytdl-core');
var async = require('async');
var q = require('q');


function arrayObjectIndexOf(myArray, searchTerm, property) {
	for (var i = 0, len = myArray.length; i < len; i++) {
		if (myArray[i][property] === searchTerm) return i;
	}
	return -1;
}

module.exports = {
	me: function(req, res) {
		Playlists.find({
			owner: req.userId
		}, function(err, playlists) {
			for (var i = 0; i < playlists.length; i++) {
				delete playlists[i].owner;
			};
			return res.send(playlists).end();
		});
	},
	create: function(req, res) {
		var title = req.body.title.toLowerCase();
		if (title)
			Playlists.findOne({
				title: title,
				owner: req.userId
			}, function(err, playlistExist) {
				if (playlistExist) {
					res.status(200).send('Exist.');
				} else {
					Playlists.create({
						title: title,
						owner: req.userId
					}).exec(function(err, playlist) {
						delete playlist.owner;
						res.status(200).send(playlist);
					});
				}

			});
		else
			res.status(200).send({
				err: 'Title is not valid.'
			});

	},
	delete: function(req, res) {
		var PLId = req.param('id');
		Playlists.find({
			owner: req.userId,
			objectId: PLId
		}, function(err, playlist) {
			if (playlist) {
				Playlists.destroy({
					objectId: PLId,
					owner: req.userId
				}, function(err) {
					res.status(200).send('Nice!');
				});
			} else {
				res.status(404).send({
					err: 'Not found!'
				});
			}
		});
	},
	reOrder: function(req, res) {
		if (!req.body) res.status(505).end();
		else {
			var NewItems = req.body.Items;
			var PLId = req.param('id');
			var itemsCount = 0;
			var count = 0;
			var purs = {};
			Playlists.findOne({
				objectId: PLId,
				owner: req.userId
			}, function(err, playlist) {
				var playlistItems = JSON.stringify(playlist.items);

				if (playlistItems == JSON.stringify(NewItems)) {
					res.status(200).send('The playlist is the same but it\'s ok!');
				} else {
					Playlists.update({
						objectId: PLId,
						owner: req.userId
					}, {
						items: NewItems
					}, function(err) {
						res.status(200).send('Nice!');
					});
				}
			});
		}
	},
	addOrDeleteItem: function(req, res) {
		if (!req.body.PLId || !req.body.item || !req.body.title) res.status(505).end();
		else {
			var ItemTitle = req.body.title;
			var Item = req.body.item;
			var PLId = req.body.PLId;

			Playlists.findOne({
				objectId: PLId,
				owner: req.userId
			}, function(err, playlist) {
				var Items = playlist.items;
				var index = arrayObjectIndexOf(Items, Item, 'id')

				if (index > -1) {
					Items.splice(index, 1);
					var sendRes = {
						deleted: ItemTitle + ' was deleted from ' + playlist.title
					}

				} else {
					Items.push({
						id: Item,
						title: ItemTitle
					});
					var sendRes = {
						added: ItemTitle + ' was added to ' + playlist.title
					}
				}

				if (!err) {
					Playlists.update({
						objectId: PLId
					}, {
						items: Items
					}, function(err) {
						if (err)
							res.send({
								err: err
							});
						else
							res.send(sendRes);
					});
				} else
					res.send({
						err: err
					});

			});
		}
	},
	prevItem: function(req, res) {
		var Item = req.param('item');
		var PLId = req.param('id');
		if (!Item || !PLId) res.status(505).end();
		else if (Item == 'null') {
			Playlists.findOne({
				objectId: PLId
			}, function(err, playlist) {
				var playlistItems = playlist.items;
				res.status(200).send(playlistItems[0]);
			});
		} else {
			var itemsNext = -1;
			var count = 0;
			var total = -1;
			Playlists.findOne({
				objectId: PLId
			}, function(err, playlist) {
				var playlistItems = playlist.items;
				var index = arrayObjectIndexOf(playlistItems, Item, 'id')
				var itemsNext = index - 1;
				if (!playlistItems[itemsNext]) res.status(200).send(playlistItems[0]);
				else res.status(200).send(playlistItems[itemsNext]);
			});
		}
	},
	nextItem: function(req, res) {
		var Item = req.param('item');
		var PLId = req.param('id');
		if (!Item || !PLId) res.status(505).end();
		else if (Item == 'null') {
			Playlists.findOne({
				objectId: PLId
			}, function(err, playlist) {
				var playlistItems = playlist.items;
				res.status(200).send(playlistItems[0]);
			});
		} else {
			Playlists.findOne({
				objectId: PLId
			}, function(err, playlist) {
				var playlistItems = playlist.items;
				var index = arrayObjectIndexOf(playlistItems, Item, 'id')
				var itemsNext = index + 1;
				if (!playlistItems[itemsNext]) res.status(200).send(playlistItems[0]);
				else res.status(200).send(playlistItems[itemsNext]);
			});
		}
	}
};