import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CookieHomePage from './bravecookie/cpages/CookieHome';
import SetListIntroPage from './bravecookie/cpages/SetListIntroPage';
import SetListDayPage from './bravecookie/cpages/SetListDayPage';
import SetListNightPage from './bravecookie/cpages/SetListNightPage';
import EventPage from './bravecookie/cpages/EventPage';
import SessionPage from './bravecookie/cpages/SessionPage';
import './App.css';

class App extends Component {
  render() {
    return (
      <Router>

        <Switch>
          <Route exact path="/" component={HomePage} />

          <Route path="/braveCookie" exact component={CookieHomePage} />
          <Route path="/braveCookie/setlistIntro" component={SetListIntroPage} />
          <Route path="/braveCookie/setlistDay" component={SetListDayPage} />
          <Route path="/braveCookie/setlistNight" component={SetListNightPage} />
          <Route path="/braveCookie/event" component={EventPage} />
          <Route path="/braveCookie/introduction" component={SessionPage} />

        </Switch>
      </Router>
    );
  }
}

export default App;