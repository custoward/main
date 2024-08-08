import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SetListPageNight.css';
import { Helmet } from 'react-helmet-async';

const SetListNightPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>용감한쿠키 2024</title>
        <meta property="og:title" content="용감한쿠키 2024 여름 정기공연" />
        <meta property="og:description" content="여름의 낮, 여름의 밤" />
        <link rel="icon" href="/faviconTwo.ico?v=2" />
      </Helmet>
      <CookieHeader />
      <main className="setlist-content-night">
        <div className="title-container">
          <div className="title-left">
            <a href="/bravecookie/setlistday" style={{ textDecoration: "none", color: "inherit" }}>{'<'} 1부</a>
          </div>
          <div className="title-center">
            <a>2부, 여름의 밤</a>
          </div>
          <div className="title-right"></div>
        </div>
        <ul>
          <li>실리카겔 - Realize</li>
          <li>새소년 - 난춘</li>
          <li>Taylor Swift - Love Story</li>
          <li>실리카겔 - 연인</li>
          <li>실리카겔 - Ryudejakeiru</li>
          <li>Takahashi Yoko - 잔혹한 천사의 태제</li>
          <li>Red Hot Chili Peppers - By The Way</li>
          <li>실리카겔 - T + Tik Tak Tok</li>
        </ul>
      </main>
      <CookieFooter />
    </>
  );
};

export default SetListNightPage;