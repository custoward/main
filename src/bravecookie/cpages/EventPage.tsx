import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './EventPage.css';

const EventPage: React.FC = () => {
  return (
    <>
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