/**
 * Items.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
	connection: 'parse',
	attributes: {
		name: 'string',
		kindId: {
			type: 'string',
			unique: true
		},
		kind: {
			type: 'string',
			enum: ['yt', 'sc']
		}
	}
};