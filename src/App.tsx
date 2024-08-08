import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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
          <Route exact path="/">
            <Helmet>
              <link rel="icon" href="/favicon.ico" />
            </Helmet>
            <HomePage />
          </Route>
          <Route path="/bravecookie">
            <Helmet>
              <title>Brave Cookie</title>
              <link rel="icon" href="/faviconTwo.ico" />
            </Helmet>
            <Switch>
              <Route path="/bravecookie" exact component={CookieHomePage} />
              <Route path="/bravecookie/setlistintro" component={SetListIntroPage} />
              <Route path="/bravecookie/setlistday" component={SetListDayPage} />
              <Route path="/bravecookie/setlistnight" component={SetListNightPage} />
              <Route path="/bravecookie/event" component={EventPage} />
              <Route path="/bravecookie/session" component={SessionPage} />
            </Switch>
          </Route>
        </Switch>
      </Router>
    );
  }
}

export default App;