/**
 * Main application routes
 */
const authController = require('./controllers/auth')
const userController = require('./controllers/user')
const gameController = require('./controllers/game')
const analyticsController = require('./controllers/analytics')

const passport = require('passport')
const jwt = require('jsonwebtoken')
const expressJwt = require('express-jwt')
var path = require('path');
//setup configuration for twitter login
var passportConfig = require('./config/passport');
passportConfig();

var getOne = function (req, res) {
  var user = req.user.toObject();

  delete user['twitterProvider'];
  delete user['__v'];

  res.json(user);
};


module.exports = function(app) {

  // client config
  app.get('/api/config', (req, res)=> {
    res.json({test: 'test'})
  });

  // Game
  app.get('/api/list', gameController.listGames)
  app.post('/api/game', gameController.createGame)

  // Analytics (not in use)
  app.post('/api/analytics/send', analyticsController.sendEvent);

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get((request, response)=>{
     response.status(404).send()
   });

  // All other routes should redirect to the index.html
  app.get('/*', function(req, res){
    res.sendFile('index.html', { root: './build_webpack'});
  });

};
