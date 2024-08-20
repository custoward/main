import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Designer from './pages/Designer';
import Contact from './pages/Contact';
import PortfolioMain from './pages/PortfolioMain';
import Product from './pages/Product';
import Graphic from './pages/Graphic';
// import CookieHomePage from './bravecookie/cpages/CookieHome';
// import SetListIntroPage from './bravecookie/cpages/SetListIntroPage';
// import SetListDayPage from './bravecookie/cpages/SetListDayPage';
// import SetListNightPage from './bravecookie/cpages/SetListNightPage';
// import EventPage from './bravecookie/cpages/EventPage';
// import SessionPage from './bravecookie/cpages/SessionPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route path="/designer" component={Designer} />
        <Route path="/contact" component={Contact} />
        <Route path="/portfolio" component={PortfolioMain} />
        <Route path="/portfolio/graphic" component={Graphic} />
        <Route path="/portfolio/product" component={Product} />
        {/* <Route path="/bravecookie" component={BraveCookieRoutes} /> */}
      </Switch>
    </Router>
  );
};

// const BraveCookieRoutes: React.FC = () => {
//   return (
//     <Switch>
//       <Route path="/bravecookie" exact component={CookieHomePage} />
//       <Route path="/bravecookie/setlistintro" component={SetListIntroPage} />
//       <Route path="/bravecookie/setlistday" component={SetListDayPage} />
//       <Route path="/bravecookie/setlistnight" component={SetListNightPage} />
//       <Route path="/bravecookie/event" component={EventPage} />
//       <Route path="/bravecookie/introduction" component={SessionPage} />
//     </Switch>
//   );
// };

export default App;