/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	attributes: {
		email: {
			type: 'string',
			unique: true,
			lowercase: true 
		},
		picture: {
			type: 'string',
			url: true
		},
		name: 'string',
		password: 'string',
		googleToken: 'string',
		google: 'string',
		youtubeRefreshToken: 'string'
	}
};

