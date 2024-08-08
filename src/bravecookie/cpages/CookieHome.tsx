import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
      <Helmet>
        <title>용감한쿠키 2024</title>
        <link rel="icon" href="/faviconTwo.ico?v=2" sizes="16x16" />
        </Helmet>
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
              <p>여름의 낮, 그리고, 밤</p>
            </div>
            <div className="main-buttons">
              <a href="/braveCookie/setlistintro">setlist/곡 소개</a>
              <a href="/braveCookie/event">이벤트</a>
              <a href="/braveCookie/introduction">세션소개</a>
            </div>
          </main>
          <CookieFooter />
        </>
      )}
    </>
  );
};

export default CookieHome;