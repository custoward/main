import React from 'react';
import CookieHeader from '../ccomponents/CookieHeader';
import CookieFooter from '../ccomponents/CookieFooter';
import './SetListDayPage.css';

const SetListDayPage: React.FC = () => {
  return (
    <>
      <CookieHeader />
      <main className="setlist-day-content">
        <h1>1부 곡 리스트</h1>
        <ul>
          <li>곡명 1 - 작곡가 1</li>
          <li>곡명 2 - 작곡가 2</li>
          <li>곡명 3 - 작곡가 3</li>
          <li>곡명 4 - 작곡가 4</li>
          <li>곡명 5 - 작곡가 5</li>
          <li>곡명 6 - 작곡가 6</li>
          <li>곡명 7 - 작곡가 7</li>
          <li>곡명 8 - 작곡가 8</li>
          <li>곡명 9 - 작곡가 9</li>
        </ul>
      </main>
      <CookieFooter />
    </>
  );
};

export default SetListDayPage;