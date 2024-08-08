import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SetListPageDay.css';
import { Helmet } from 'react-helmet-async';

const SetListDayPage: React.FC = () => {
  return (
    <>
      <Helmet>
      <title>용감한 쿠키 2024</title>
        <meta property="og:title" content="용감한 쿠키 2024" />
        <meta property="og:description" content="2024 정기 공연, 여름." />
        <link rel="icon" href="/faviconTwo.ico?v=2" sizes="16x16" />
        <meta property="og:site_name" content="davi-davi.com/bravecookie" />
      </Helmet>
      <CookieHeader />
      <main className="setlist-content-Day">
        <div className="title-container">
          <div className="title-left"></div>
          <div className="title-center">
            <a>1부, 여름의 낮</a>
          </div>
          <div className="title-right">
            <a href="/bravecookie/setlistnight" style={{ textDecoration: "none", color: "inherit" }}>2부 {'>'}</a>
          </div>
        </div>
        <ul>
          <li>너드커넥션 - Back in Time</li>
          <li>한로로 - 입춘</li>
          <li>The Volunteers - Summer</li>
          <li>Oasis - Champagne Supernova</li>
          <li>Green Day - American Idiot</li>
          <li>터치드 - 하이하이트</li>
          <li>나상현씨 밴드 - 각자의 밤</li>
          <li>쏜애플 - 피난</li>
          <li>동경사변 - 군청일화</li>
        </ul>
        <div className='in'> Interval (10min) </div>
      </main>
      <CookieFooter />
    </>
  );
};

export default SetListDayPage;