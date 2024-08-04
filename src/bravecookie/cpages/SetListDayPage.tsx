import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SetListDayPage.css';

const SetListDayPage: React.FC = () => {
  return (
    <>
      <CookieHeader />
      <main className="setlist-content">
        {/* 곡 리스트 페이지 내용 */}
      </main>
      <CookieFooter />
    </>
  );
};

export default SetListDayPage;