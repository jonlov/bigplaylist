/**
 * Player.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
	// connection: 'localDiskDb',
	attributes: {
		owner: {
			type: 'string',
			unique: true
		},
		url: {
			type: 'string',
			defaultsTo: null
		},
		next: {
			type: 'boolean',
			defaultsTo: 0
		},
		prev: {
			type: 'boolean',
			defaultsTo: 0
		}
	}
};