import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './EventPage.css';
import { Helmet } from 'react-helmet-async';

const EventPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>용감한쿠키 2024</title>
        <meta property="og:title" content="용감한쿠키 2024 여름 정기공연" />
        <meta property="og:description" content="여름의 낮, 여름의 밤" />
        <link rel="icon" href="/faviconTwo.ico?v=2" />
      </Helmet>
      <CookieHeader />
      <main className="event-content">
        <h1 className="event-title">EVENT!</h1>
        <div className="event-image">
          {/* 이벤트 이미지 삽입 */}
        </div>
        <p className="event-description">깜짝 이벤트.<br />2부 가운데 깜짝 이벤트가 있답니다.<br />재밌게 즐기고 선물도 받아가세요!</p>
      </main>
      <CookieFooter />
    </>
  );
};

export default EventPage;