import React, { Component, useState, useEffect, useRef } from 'react';
import './App.css';
import { Link, Route, Switch } from 'react-router-dom';

import Canvas from "./canvas";



class App extends Component {
  render() {
    return (
      <div>
        <div className="title">Custoward</div>
        <div className="canvasProp"><Canvas></Canvas></div>
      </div>
    );
  }
}


export default App;