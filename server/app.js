const express = require('express')
const app = express()
const sockets = require('./sockets.js')


// Express middleware
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const passport = require('passport');
const UserModel = require('./models/user')

var config = require('./config/environment');

// Connect to database
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const mongoConfig = {
  uri: process.env.MONGODB_URL_INT || 'mongodb://127.0.0.1:27017/cansense',
  options: {
    useMongoClient: true
  }
}
mongoose.connect(mongoConfig.uri, mongoConfig.options);
mongoose.connection.on('error', function(err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
	}
);

// seed database
if(process.env.SEED_DB_CLEAN === 'true'){
  require('./config/db_seed/seed_clean')
}


// Static built react app
app.use(express.static('build_webpack'))

app.use(cors({
  origin: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  exposedHeaders: ['x-auth-token']
}));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({limit: '1mb'}));
app.use(methodOverride());
app.use(helmet());
app.use(cookieParser());
app.use(morgan('dev', {
  skip: function (req, res) {
    // remove the frontend dev server's 'json' calls from the console output
    return req.originalUrl.indexOf('json') > 0
  }
}));

// start http server
var server = app.listen(8080, function () {
  console.log('App running on port 8080')
})

// start sockets and add io to response object
const io = sockets.startIo(server);
app.use(function(req, res, next){
  res.io = io;
  next();
})

// create a game and watch for it's transactions on the chain
// const eth = require('./ethereum/drizzleNode.js')
// eth.watchForContractTxn('test Address', 'ropsten')

// API ROUTING
require('./api')(app);
