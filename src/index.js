import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, browserHistory } from 'react-router'
import { Provider } from 'react-redux'
import { syncHistoryWithStore } from 'react-router-redux'
import { UserIsAuthenticated } from './util/wrappers.js'


// Initialize web3 and set in Redux.
import getWeb3 from './util/web3/getWeb3'
getWeb3
  .then(() => { console.log('Web3 initialized!') })
  .catch(() => { console.log('Error in web3 initialization.') })

// Layouts
import App from './App'
import Page404 from  './errors/404'

import Home from './home/homeContainer'
import Account from './account/accountContainer'

import QuestionDetail from './question/detail/detailContainer'
import QuestionList from './question/list/listContainer'


// import TourneyCreate from './tourney/create/createTournamentContainer'
//
// <Route path="question/:tournamentId" component={QuestionDetail} />

// Redux Store
import store from './store'
const history = syncHistoryWithStore(browserHistory, store)

ReactDOM.render((
    <Provider store={store}>
      <Router history={history}>
        <Route path="/" component={App}>
          <IndexRoute component={Home} />

          <Route path="live" component={QuestionDetail} />
          <Route path="account" component={Account} />

          <Route path='*' exact={true} component={Page404} />
        </Route>
      </Router>
    </Provider>
  ),
  document.getElementById('root')
)
