import React, { Component } from 'react'
import { Link } from 'react-router'
import { HiddenOnlyAuth, VisibleOnlyAuth } from './util/wrappers.js'

// Fonts
import './css/open-sans.css'
import './css/michroma.css'
import './css/barlow.css'

import './css/pure-min.css'
import './css/grids-responsive-min.css'
// import 'medium-editor/dist/css/medium-editor.css'
// import 'medium-editor/dist/css/themes/default.css'

import './App.css'

import userIcon from './img/User_font_awesome.svg'


class App extends Component {
  render() {
    const OnlyAuthLinks = VisibleOnlyAuth(() =>
      <span>
      </span>
    )

    const OnlyGuestLinks = HiddenOnlyAuth(() =>
      <span>
      </span>
    )

    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">

          <div className="logo-holder">
            <div className="logo">
              <div style={{'backgroundColor': '#ff5935', height: '8px'}}></div>
              <div style={{'backgroundColor': 'white', height: '6px'}}></div>
              <div style={{'backgroundColor': '#17799d', height: '9px'}}></div>
            </div>
          </div>

          <Link to="/" className="pure-menu-heading pure-menu-link"> Servésa </Link>

          <ul className="pure-menu-list navbar-right">
            <li className="pure-menu-item">
              <Link activeStyle={{ color: '#FF5934' }} to="/account" className="pure-menu-link">Account</Link>
           </li>
            <li className="pure-menu-item">
              <Link activeStyle={{ color: '#FF5934' }} to="/live" className="pure-menu-link">Live</Link>
           </li>
          </ul>
        </nav>

        <div className="container">
          {this.props.children}
        </div>


      </div>
    );
  }
}

export default App
