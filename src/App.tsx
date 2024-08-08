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
              <meta
                name="Davi-Davi"
                content="Davi-Davi Design Team Portfolio"
              />
              <title>DAVI_DAVI</title>
            </Helmet>
            <HomePage />
          </Route>
          <Route path="/bravecookie">
            <Helmet>
              <title>Brave Cookie</title>
              <meta property="og:title" content="용감한쿠키 2024 여름 정기공연" />
              <meta property="og:description" content="여름의 낮, 여름의 밤" />
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