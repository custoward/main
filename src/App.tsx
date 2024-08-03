import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BravecookieMain from './bravecookie/BravecookieMain';
import DayList from './pages/DayList';
import NightList from './pages/NightList';
import './App.css';

class App extends Component {  
  render() {
    return (
      <Router>
        <Switch>
          <Route exact path="/" component={HomePage} />
          <Route path="/bravecookie" component={BravecookieMain} />
          <Route path="/daylist" component={DayList} />
          <Route path="/nightlist" component={NightList} />
        </Switch>
      </Router>
    );
  }
}

export default App;