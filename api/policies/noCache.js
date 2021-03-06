/**
 * Sets no-cache header in response.
 */
module.exports = function(req, res, next) {
	if (!req.isSocket) {
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.header('Expires', '-1');
		res.header('Pragma', 'no-cache');
	}
	next();
};