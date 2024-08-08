import React from 'react';
import './Menu.css';

const Menu: React.FC<{ closeMenu: () => void }> = ({ closeMenu }) => {
  return (
    <div className="menu-overlay">
      <div className="menu-overlay-left" onClick={closeMenu}></div>
      <div className="menu-content">
        <div className="menu-header">
          <div className="menu-close" onClick={closeMenu}>×</div>
        </div>
        <div className="menu-body">
          <div className="menu-title">夏</div>
          <div className="menu-subtitle">2024 용감한 쿠키 정기공연</div>
          <div className="menu-links">
            <a href="/braveCookie/setlistintro">Setlist / 곡 소개</a>
            <a href="/braveCookie/event">이벤트</a>
            <a href="/braveCookie/introduction">세션소개</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;