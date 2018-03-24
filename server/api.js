/**
 * Main application routes
 */
const gameController = require('./controllers/game')
const analyticsController = require('./controllers/analytics')

const testContract = require('./models/contract')
const Contract = require('mongoose').model('Contract')

module.exports = function(app) {

  // client config
  app.get('/api/config', (req, res)=> {
    res.json({test: 'test'})
  });

  // Game
  // app.get('/api/list', gameController.listGames)

  app.post('/api/game/next', gameController.nextPhase)
  app.post('/api/game', gameController.createGame)


  app.post('/api/contract', (req, res) => {

    return Contract.initContract('local','')
      .then(contract => {
        res.send(contract)
      })
      .catch(error => {
        console.log(error)
        res.status(500).json({error: error.message})
      })

  })





  app.post('/api/question', gameController.createQuestion)

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
