var jwt = require('jwt-simple');

module.exports = function (req, res, next) {
	function handleError () {
		return res.status(401).send({
			error: 'Not authorized'
		});

	};

	if(!req.headers.authorization) return handleError();

	var token = req.headers.authorization.split(' ')[1];

	var payload = jwt.decode(token, config.TOKEN_SECRET);

	if(!payload.sub) return handleError();

	req.userId = {"__type": "Pointer",
                  "className": "_User",
                  "objectId": payload.sub};

	next();
};
