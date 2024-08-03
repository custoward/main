import React, { useEffect } from 'react';
import './DayList.css';

const DayList: React.FC = () => {
  const musicList = [
    'Composer1 - Title1',
    'Composer2 - Title2',
    'Composer3 - Title3',
    'Composer4 - Title4',
    'Composer5 - Title5',
    'Composer6 - Title6',
    'Composer7 - Title7',
    'Composer8 - Title8',
    'Composer9 - Title9',
  ];

  useEffect(() => {
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'black';
    const backButton = document.querySelector('.back-button');
    if (backButton) {
      (backButton as HTMLElement).style.color = 'black';
    }
  }, []);

  return (
    <div className="daylist-container">
      <header className="header">
        <button className="back-button" onClick={() => window.history.back()}>←</button>
        <div className="title">
          <h1>晝</h1>
          <p>1부, 여름 낮</p>
        </div>
      </header>
      <main className="music-list">
        {musicList.map((music, index) => (
          <p key={index} className="music-item">{music}</p>
        ))}
      </main>
      <footer className="footer">
        <p>인스타그램 바로가기</p>
      </footer>
    </div>
  );
};

export default DayList;