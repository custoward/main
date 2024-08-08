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
        <title>용감한 쿠키 2024</title>
        <meta property="og:title" content="용감한 쿠키 2024" />
        <meta property="og:description" content="2024 정기 공연, 여름." />
        <meta property="og:site_name" content="davi-davi.com/bravecookie" />
        <meta property="og:image" content="/ogimage.ipg" />
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
              <p>2024 용감한 쿠키 정기공연</p>
              <div className="time">2024. 7. 17 7pm, 홍대 프리버드</div>
            </div>
            <div className="main-buttons">
              <a href="/braveCookie/setlistintro">Setlist / 곡 소개</a>
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