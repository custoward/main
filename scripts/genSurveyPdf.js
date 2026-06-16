// The Chair Theory - "What is chair?" 설문지 PDF 생성기 (가로 A4, 벡터)
// 외부 의존성 없이 xref 오프셋을 계산해 유효한 PDF를 만든다.
// 디자인을 바꾸려면 content 문자열을 수정하고 다시 실행:  node scripts/genSurveyPdf.js
const fs = require('fs');
const path = require('path');

// 가로 A4: 842 x 595 (pt). PDF 좌표 원점은 좌하단.
const content = `q
2 w
60 478 m 782 478 l S
60 90 m 782 90 l S
Q
q
3 w
60 110 360 255 re S
Q
q
1 w
470 345 m 782 345 l S
470 303 m 782 303 l S
470 261 m 782 261 l S
470 219 m 782 219 l S
470 177 m 782 177 l S
470 135 m 782 135 l S
Q
BT
/F2 46 Tf
60 515 Td
(What is chair?) Tj
ET
BT
/F1 13 Tf
60 452 Td
(We encounter many different kinds of "chairs" every day.) Tj
0 -18 Td
(What makes something a chair?) Tj
0 -18 Td
(Draw your idea and tell us why.) Tj
ET
BT
/F2 20 Tf
60 384 Td
(1. Draw the chair you have in mind!) Tj
ET
BT
/F2 20 Tf
470 384 Td
(2. What's the reason?) Tj
ET
BT
/F1 11 Tf
60 64 Td
(Thank you for participating.) Tj
0 -16 Td
(Your idea becomes an important connection in this project.) Tj
ET
`;

const objects = [];
objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
objects.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
objects.push(
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`
);
objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream`);
objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);

let pdf = `%PDF-1.4\n`;
const offsets = [];
objects.forEach((obj, i) => {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
});

const xrefStart = Buffer.byteLength(pdf, 'latin1');
const count = objects.length + 1;
pdf += `xref\n0 ${count}\n`;
pdf += `0000000000 65535 f \n`;
offsets.forEach((off) => {
  pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
});
pdf += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

const outPath = path.join(__dirname, '..', 'public', 'the-chair-theory-survey.pdf');
fs.writeFileSync(outPath, Buffer.from(pdf, 'latin1'));
console.log('생성 완료:', outPath, `(${Buffer.byteLength(pdf, 'latin1')} bytes)`);
