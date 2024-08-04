import React, { useEffect, useState } from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './CookieHome.css';

const CookieHome: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setLoading(false);
      }, 1000); // fade-out duration
    }, 1000); // initial loading duration
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
     <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
        <h1 className="loading-title">夏</h1>
        <p className="loading-description">2024 용감한 쿠키 정기공연</p>
      </div>
      {!loading && (
        <>
          <CookieHeader />
          <main className="main-content">
            <div className="main-title">
              <h1>夏</h1>
              <p>2024 용감한 쿠키 정기공연</p>
            </div>
            <div className="main-buttons">
              <a href="/bravecookie/setlistintro">setlist/곡 소개</a>
              <a href="/bravecookie/event">이벤트</a>
              <a href="/bravecookie/session">세션소개</a>
            </div>
          </main>
          <CookieFooter />
        </>
      )}
    </>
  );
};

export default CookieHome;