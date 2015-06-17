/**
 * WebSocket Server Settings
 * (sails.config.sockets)
 *
 * These settings provide transparent access to the options for Sails'
 * encapsulated WebSocket server, as well as some additional Sails-specific
 * configuration layered on top.
 *
 * For more information on sockets configuration, including advanced config options, see:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.sockets.html
 */
var jwt = require('jwt-simple');

module.exports.sockets = {


  /***************************************************************************
   *                                                                          *
   * Node.js (and consequently Sails.js) apps scale horizontally. It's a      *
   * powerful, efficient approach, but it involves a tiny bit of planning. At *
   * scale, you'll want to be able to copy your app onto multiple Sails.js    *
   * servers and throw them behind a load balancer.                           *
   *                                                                          *
   * One of the big challenges of scaling an application is that these sorts  *
   * of clustered deployments cannot share memory, since they are on          *
   * physically different machines. On top of that, there is no guarantee     *
   * that a user will "stick" with the same server between requests (whether  *
   * HTTP or sockets), since the load balancer will route each request to the *
   * Sails server with the most available resources. However that means that  *
   * all room/pubsub/socket processing and shared memory has to be offloaded  *
   * to a shared, remote messaging queue (usually Redis)                      *
   *                                                                          *
   * Luckily, Socket.io (and consequently Sails.js) apps support Redis for    *
   * sockets by default. To enable a remote redis pubsub server, uncomment    *
   * the config below.                                                        *
   *                                                                          *
   * Worth mentioning is that, if `adapter` config is `redis`, but host/port  *
   * is left unset, Sails will try to connect to redis running on localhost   *
   * via port 6379                                                            *
   *                                                                          *
   ***************************************************************************/
  // adapter: 'memory',

  //
  // -OR-
  //

  // adapter: 'redis',
  // host: '127.0.0.1',
  // port: 6379,
  // db: 'sails',
  // pass: '<redis auth password>'



  /***************************************************************************
   *                                                                          *
   * Whether to expose a 'get /__getcookie' route with CORS support that sets *
   * a cookie (this is used by the sails.io.js socket client to get access to *
   * a 3rd party cookie and to enable sessions).                              *
   *                                                                          *
   * Warning: Currently in this scenario, CORS settings apply to interpreted  *
   * requests sent via a socket.io connection that used this cookie to        *
   * connect, even for non-browser clients! (e.g. iOS apps, toasters, node.js *
   * unit tests)                                                              *
   *                                                                          *
   ***************************************************************************/

  // grant3rdPartyCookie: true,



  /***************************************************************************
   *                                                                          *
   * `beforeConnect`                                                          *
   *                                                                          *
   * This custom beforeConnect function will be run each time BEFORE a new    *
   * socket is allowed to connect, when the initial socket.io handshake is    *
   * performed with the server.                                               *
   *                                                                          *
   * By default, when a socket tries to connect, Sails allows it, every time. *
   * (much in the same way any HTTP request is allowed to reach your routes.  *
   * If no valid cookie was sent, a temporary session will be created for the *
   * connecting socket.                                                       *
   *                                                                          *
   * If the cookie sent as part of the connetion request doesn't match any    *
   * known user session, a new user session is created for it.                *
   *                                                                          *
   * In most cases, the user would already have a cookie since they loaded    *
   * the socket.io client and the initial HTML pageyou're building.           *
   *                                                                          *
   * However, in the case of cross-domain requests, it is possible to receive *
   * a connection upgrade request WITHOUT A COOKIE (for certain transports)   *
   * In this case, there is no way to keep track of the requesting user       *
   * between requests, since there is no identifying information to link      *
   * him/her with a session. The sails.io.js client solves this by connecting *
   * to a CORS/jsonp endpoint first to get a 3rd party cookie(fortunately this*
   * works, even in Safari), then opening the connection.                     *
   *                                                                          *
   * You can also pass along a ?cookie query parameter to the upgrade url,    *
   * which Sails will use in the absense of a proper cookie e.g. (when        *
   * connecting from the client):                                             *
   * io.sails.connect('http://localhost:1337?cookie=smokeybear')              *
   *                                                                          *
   * Finally note that the user's cookie is NOT (and will never be) accessible*
   * from client-side javascript. Using HTTP-only cookies is crucial for your *
   * app's security.                                                          *
   *                                                                          *
   ***************************************************************************/
  beforeConnect: function(handshake, cb) {
    // `true` allows the connection
    // console.log(handshake);
    return cb(null, true);

    // (`false` would reject the connection)
  },


  /***************************************************************************
   *                                                                          *
   * This custom afterDisconnect function will be run each time a socket         *
   * disconnects                                                              *
   *                                                                          *
   ***************************************************************************/
  // afterDisconnect: function(session, socket, cb) {
  //   var rooms = socket.adapter.rooms;
  //   var socketFriends = socket.adapter.sids;
  //   var countFriends = 0;
  //   var count = 0;
  //   for(friend in socketFriends){
  //     countFriends++;
  //   }
  //   if(countFriends != 0){
  //     console.log(countFriends);
  //     for(room in rooms){
  //       if(countFriends == count){
  //         socket.broadcast.to(room).emit('loggedIn', {id: '-'+socket.id})
  //       }
  //       count++;
  //     }
  //   }
  //   // console.log(socket.adapter.rooms);
  //   // By default: do nothing.
  //   return cb();
  // },

  afterDisconnect: function(session, socket, cb) {
    var isLogged = socket.handshake.headers.cookie.indexOf(' me?el=');
    if (isLogged > -1) {
      var io = sails.io;

      //JWT with user id $ session $ device
      var userDataJWT = socket.handshake.headers.cookie.split(' me?el=')[1].split(';')[0];
      var userData = jwt.decode(userDataJWT, config.TOKEN_SECRET);
      var userId = userData.split('$')[0];
      var userSession = userData.split('$')[1];
      var userDevice = userData.split('$')[2];
      var roomClients = io.sockets.adapter.rooms[userId];

      // Session stuffs
      var cookieSession = socket.handshake.headers.cookie.split('sails.sid=')[1].split(';');
      var userSessionDecoded = jwt.decode(userSession, config.TOKEN_SECRET);

      // Comprobate that the session is valid and userId exist
      if (userId != undefined && userDevice != undefined && userSessionDecoded) {
        if (roomClients) {
          socket.broadcast.to(userId).emit('loggedOut', {
            id: socket.id,
            session: userSession,
            device: userDevice
          });
          return cb();
        }
        // var random = Math.round(Math.random() * 10);

        // setTimeout(function() {
        //   socket.broadcast.to(userId).emit('loggedOut', {
        //     id: socket.id,
        //     session: userSession,
        //     device: userDevice
        //   });
        // }, random);

      } else {
        return cb();

      }

    } else {
      return cb();

    }
  },

  /***************************************************************************
   *                                                                          *
   * `transports`                                                             *
   *                                                                          *
   * A array of allowed transport methods which the clients will try to use.  *
   * On server environments that don't support sticky sessions, the "polling" *
   * transport should be disabled.                                            *
   *                                                                          *
   ***************************************************************************/
  transports: [
    'xhr-polling',
    'websocket',
    'polling',
    'jsonp-polling',
    'htmlfile'
  ]



  // More configuration options for Sails+Socket.io:
  // http://sailsjs.org/#/documentation/reference/sails.config/sails.config.sockets.html

};