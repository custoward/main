import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { Link, Route, Switch } from 'react-router-dom';


function App() {

  return (
    <div className="App">
      <header className="App-header">
        <Route path="/"> 
          <div>메인페이지</div>
        </Route>
        <Route path="/detail">
          <div>디테일페이지</div>
        </Route>
      </header>
    </div>
  );
}

export default App;
