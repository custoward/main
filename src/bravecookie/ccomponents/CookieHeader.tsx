import React, { useState } from 'react';
import logo from '../source/logowhite.png'
import './CookieHeader.css';
import Menu from './Menu';

const CookieHeader: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="header">
      <div className="header-top">2024 용감한 쿠키 여름 정기공연</div>
      <div className="header-bottom">
        <a onClick={() => window.location.href = '/braveCookie'}>
          <img src={logo} width='30px' />
        </a>
        <div className="menu-icon" onClick={toggleMenu}>☰</div>
      </div>
      {menuOpen && <Menu closeMenu={toggleMenu} />}
    </header>
  );
};

export default CookieHeader;