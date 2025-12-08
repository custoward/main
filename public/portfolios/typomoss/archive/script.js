const imageContainer = document.getElementById('imageContainer');
const captionBox = document.getElementById('captionBox');
const fallingBackground = document.getElementById('fallingBackground');
const animatedTitle = document.getElementById('animatedTitle');
const headerBackground = document.getElementById('headerBackground');

// SVG 파일 목록 (상위 폴더에서 가져옴)
const svgFiles = [
  'vector_sticker_1.svg',
  'vector_sticker_2.svg',
  'vector_sticker_3.svg',
  'vector_sticker_4.svg',
  'vector_sticker_5.svg',
  'vector_circle_1.svg',
  'vector_circle_2.svg',
  'vector_circle_3.svg'
];

// 타이틀 애니메이션 생성
const titleText = 'TYPO MOSS';
titleText.split('').forEach((char, index) => {
  const span = document.createElement('span');
  span.className = 'letter';
  span.textContent = char;
  // 각 글자마다 랜덤한 애니메이션 딜레이
  span.style.animationDelay = `${Math.random() * 5}s`;
  // 각 글자마다 약간 다른 애니메이션 시간
  span.style.animationDuration = `${4 + Math.random() * 2}s`;
  animatedTitle.appendChild(span);
});

// 떨어지는 SVG 생성
function createFallingSVG() {
  const svg = document.createElement('img');
  const randomSVG = svgFiles[Math.floor(Math.random() * svgFiles.length)];
  svg.src = `../${randomSVG}`;
  svg.className = 'falling-svg';
  
  // 랜덤 위치
  svg.style.left = `${Math.random() * 100}%`;
  
  // 랜덤 크기 (30-80px)
  const size = 30 + Math.random() * 50;
  svg.style.width = `${size}px`;
  svg.style.height = 'auto';
  
  // 랜덤 애니메이션 시간 (10-20초)
  const duration = 10 + Math.random() * 10;
  svg.style.animationDuration = `${duration}s`;
  
  // 딜레이 없음 - 화면 위에서 시작
  svg.style.animationDelay = '0s';
  
  fallingBackground.appendChild(svg);
  
  // 애니메이션 끝나면 제거하고 새로 생성
  setTimeout(() => {
    svg.remove();
    createFallingSVG();
  }, duration * 1000);
}

// 초기 SVG 15개를 시간차를 두고 생성 (한꺼번에 안 나오게)
for (let i = 0; i < 15; i++) {
  setTimeout(() => {
    createFallingSVG();
  }, i * 1000); // 1초 간격
}

// JSON 불러오기
fetch('imageData.json')
  .then(response => response.json())
  .then(imageData => {

    imageData.forEach(data => {
      const img = document.createElement('img');
      img.src = `image/${data.file}`;
      img.alt = data.title;

      // 마우스호버시 캡션 띄우기
      img.addEventListener('mouseenter', () => {
        captionBox.innerHTML = `<div style="font-size: 1.1em; font-weight: 600; margin-bottom: 4px; word-break: break-all;">${data.title}</div><div style="font-size: 0.9em; word-break: break-all;">${data.caption}</div>`;
        captionBox.style.display = 'block';
      });

      // 마우스가 움직일 때 위치 업데이트
      img.addEventListener('mousemove', (e) => {
        captionBox.style.left = `${e.clientX + 10}px`;
        captionBox.style.top = `${e.clientY + 10}px`;
      })

      img.addEventListener('mouseleave', () => {
        captionBox.style.display = 'none';
      });

      imageContainer.appendChild(img);
    });

  })
  .catch(error => console.error('JSON 불러오기 오류:', error));
