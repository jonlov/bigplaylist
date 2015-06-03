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

module.exports = {
	me: function (req, res){
		Playlists.find({owner: req.userId}, function (err, playlists){
			var playlistJson = [];
			var num = 0;
			for(playlist in playlists){
				playlistJson.push({id: playlists[num].id, title: playlists[num].title});
				num++;
			}
			return res.send(playlistJson).end();
		});
	},
	create: function (req,res){
		User.findOne(req.userId, function (err, user){
			var title = req.body.title;

			Playlists.findOne({title: title}, function (err, playlistExist){
				if(playlistExist){
					res.status(200).send({err: 'The playlist '+title+' already exist.'});
				} else {
					Playlists.count({owner: req.userId},function (err, total){
						if(!err){
							Playlists.create({
								title: title,
								owner: req.userId
							}).exec(function(err, playlist) {
								res.send(playlist);
							});
						}
					});
				}
			});
		});
	},
	destroy: function (req,res){
		var PLId = req.param('id');
		Playlists.find({owner: req.userId, objectId: PLId}, function(err, playlist){
			if(playlist){
				Playlists.destroy({objectId: PLId}, function (err, res) {
					if(err)	return err;
					else return res;
					// res.status(200).end();
		        });
		        res.status(200).end();
			}
        });
	},
	mePlaylistItems: function (req, res){
		var PLId = req.param('id');
		Playlists.find({owner: req.userId, objectId: PLId}, function (err, playlist){
			if(playlist[0].Items){
				var playlistItems = [];
				// CONVERT JSON TO ARRAY
				for(i in playlist[0].Items) {
					playlistItems.push(playlist[0].Items[i])
				}
				res.send({id: playlist[0].id, title: playlist[0].title, items: playlistItems}).end();
				// var playlistItems = [];
				// // CONVERT JSON TO ARRAY
				// for(i in playlist.Items) {
				// 	playlistItems.push(playlist.Items[i])
				// }
				// var count = 0;
				// var id,source,url;
				// async.each(playlistItems, function (item, callback){ 
				// 	source = item.split('$');
				// 	id = source[1];
				// 	url = 'https://www.youtube.com/watch?v='+ id;
				// 	function doCall(urlToCall, callback) {
				// 	    ytdl.getInfo(urlToCall, function (err, info){
				// 			var title = encodeURIComponent(info.title);
				// 			var description = encodeURIComponent(info.description);
				// 			var author = encodeURIComponent(info.author);
				// 			var perra = '"id": "'+info.video_id+'", "thumbnail": "'+info.iurlmq+'", "title": "'+title+'", "description": "'+description+'", "author": "'+author+'", "views": "'+info.view_count+'"';
				// 	    	return callback(perra); // tell async that the iterator has completed
				// 		});
				// 	}
				// 	doCall(url, function(response){
				// 		var position = playlistItems.indexOf(item)+1;
				// 	    if(count==0) res.write('{"items":[');
				// 		count++;
				// 	    if(count!=playlistItems.length) res.write('{"position":"'+position+'",'+response+'},');
				// 	    else res.write('{"position":"'+position+'",'+response+'}');
				// 	    callback();
				// 	});
				// }, function(err) {
				//     res.write(']}');
				//     res.end();
				// }); 
			} else {
				res.send('').end();
			}
		});
	},
	prevItem: function (req,res){
		var Item = req.param('item');
		var PLId = req.param('id');
		if(!Item || !PLId) res.status(505).end();
		else if(Item == 'null') {
			Playlists.findOne({objectId: PLId}, function (err, playlist){
				var playlistItems = playlist.Items;
				res.status(200).send(playlistItems[0]);
			});
		} else {
			var itemsNext = -1;
			var count = 0;
			var total = -1;
			Playlists.findOne({objectId: PLId}, function (err, playlist){
				var playlistItems = playlist.Items;
				for(playlistItem in playlistItems){
					total++;
				}
				for(playlistItem in playlistItems){
					if(playlistItems[count].id==Item){
						itemsPrev=count-1;
					} 
					if(count==total){
						if(!playlistItems[itemsPrev]) res.status(200).send(playlistItems[0]);
						else res.status(200).send(playlistItems[itemsPrev]);
					}
					count++;
				}
			});
		}
	},
	nextItem: function (req,res){
		var Item = req.param('item');
		var PLId = req.param('id');
		if(!Item || !PLId) res.status(505).end();
		else if(Item == 'null') {
			Playlists.findOne({objectId: PLId}, function (err, playlist){
				var playlistItems = playlist.Items;
				res.status(200).send(playlistItems[0]);
			});
		} else {
			var itemsNext = -1;
			var count = 0;
			var total = -1;
			Playlists.findOne({objectId: PLId}, function (err, playlist){
				var playlistItems = playlist.Items;
				for(playlistItem in playlistItems){
					total++;
				}
				for(playlistItem in playlistItems){
					if(playlistItems[count].id==Item){
						itemsNext=count+1;
					} 
					if(count==total){
						if(!playlistItems[itemsNext]) res.status(200).send(playlistItems[0]);
						else res.status(200).send(playlistItems[itemsNext]);
					}
					count++;
				}
			});
		}
	},
	reorder: function (req,res){
		if(!req.body) res.status(505).end();
		else {
			var Items = req.body;
			var PLId = req.param('id');
			var itemsCount = 0;
			var count = 0;
			var purs = {};
			Playlists.findOne({objectId: PLId, owner: req.userId}, function (err, playlist){
				var playlistItems = playlist.Items;
				for(item in Items){
					for(playlistItem in playlistItems){
						if(item[itemsCount]==playlistItem[count]){
							purs[itemsCount]=Items[itemsCount];
						}
						count++;
					}
					itemsCount++;
					if(itemsCount==Items.length){
						Playlists.update({objectId: PLId, owner: req.userId}, {Items: purs},function(err) {
							res.status(200);
				        });
					}
				}
			});
		}
	},
	addItem: function (req,res){
		if(!req.body.PLId || !req.body.item || !req.body.title) res.status(505).end();
		else {
			var ItemTitle = req.body.title;
			var Item = req.body.item;
			var PLId = req.body.PLId;
			var ItemId = Item.split('$');
	    	var onlyNumbers = /^\d+$/.test(PLId);
			if(onlyNumbers==false) var PLIdSplit = PLId.split('$'); else var PLIdSplit = '';
			if(PLIdSplit[0]=='KsadjiW21'){
				var PLTitle = PLIdSplit[1];
				if(!PLTitle) res.send({errTitle: 'true'}).end();
				else {
					var purs = {};
					purs[0] = {'id':Item,'title':ItemTitle};
					Playlists.findOne({title: PLTitle, owner: req.userId},function (err, playlists){
						if(playlists){
							res.send({errHaveItem: PLTitle}).end();
						} else {
							Playlists.create({
								title: PLTitle,
								Items: purs,
								owner: req.userId
							}).exec(function(err, playlist) {
								res.send({playlistCreated: playlist}).end();							
							});
						}
					});
				}
			} else {
				Playlists.findOne({objectId: PLId, owner: req.userId}, function (err, playlist){
					if(playlist){
						var playlistItems = playlist.Items;
						var purs = {};
						var count = 0;
						var countPurs = -1;
						var itemExist = false;

						if(playlistItems){
							for ( items in playlistItems )	{
								if(playlistItems[count].id != Item){
									countPurs++;
							    	if(playlistItems.hasOwnProperty(items)) {
										purs[countPurs] = playlistItems[count];
								    }
								} else {
									itemExist = true;
								}
							    count++;
							}
							if(!itemExist){
								purs[countPurs+1] = {'id':Item,'title':req.body.title};
							}
							// playlist.Items = purs;
						} else {
							purs[count] = {'id':Item,'title':req.body.title};
						 	// playlist.Items = purs;
						}
						if(!err){
							Playlists.update({objectId: PLId, owner: req.userId}, {Items: purs}, function(err) {
								if(!itemExist) res.send({added: req.body.title, title: playlist.title+'.'}).end();
								else res.send({destroyed: req.body.title, title: playlist.title+'.'}).end();
					        });
						}
					}
				});
			}
		}
	},
	destroyItem: function (req,res){
		var PLId = req.param('id');
		var Item = req.param('itemId');
		var ItemId = Item.split('$');
		Playlists.findOne({objectId: PLId, owner: req.userId}, function (err, playlist){
			if(playlist){
				var playlistItems = playlist.Items;
				var purs = {};
				var count = 0;
				var countPurs = 0;

				if(playlistItems){
					for ( items in playlistItems )	{
						if(playlistItems[count].id != Item){
					    	if(playlistItems.hasOwnProperty(items)) {
								purs[countPurs] = playlistItems[count];
						    }
						    countPurs++;
						} else {
							var ItemTitle = playlistItems[count].title;
						}
					    count++;
					}	            
				} else {
					err = playlist.title;
				}
				if(!err){
					Playlists.update({objectId: PLId, owner: req.userId}, {Items: purs}, function(err) {
						res.status(200).send({destroyed: ItemTitle, title: playlist.title+'.'});
			        });
				} else {
					res.status(200).send({err1: err});
				}
			} else {
				res.status(200).send({err2: 'true'});
			}
		});
	}
};

