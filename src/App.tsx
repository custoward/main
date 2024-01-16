import React, { Component, useState, useEffect, useRef } from 'react';
import './App.css';
import { Link, Route, Switch } from 'react-router-dom';
import HomePage from './pages';


class App extends Component {  
  render() {
    return (
      <div>
        <HomePage/>
      </div>
    );
  }
}


export default App;