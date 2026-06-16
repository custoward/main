// The Chair Theory - 플레이스홀더 설문지 PDF 생성기
// 외부 의존성 없이 xref 오프셋을 정확히 계산해 유효한 1페이지 A4 PDF를 만든다.
// 사용자는 public/the-chair-theory-survey.pdf 를 실제 양식으로 교체하면 된다.
const fs = require('fs');
const path = require('path');

const content = `BT
/F1 26 Tf
60 770 Td
(The Chair Theory) Tj
/F1 13 Tf
0 -34 Td
(Draw the chair you imagine - and write why.) Tj
0 -50 Td
(1. Your chair) Tj
ET
1 0 0 1 60 470 cm
0 0 475 210 re
S
1 0 0 1 -60 -470 cm
BT
/F1 13 Tf
60 440 Td
(2. Why this chair?) Tj
ET
1 0 0 1 60 250 cm
0 0 475 170 re
S
1 0 0 1 -60 -250 cm
BT
/F1 10 Tf
60 80 Td
(Placeholder form - replace public/the-chair-theory-survey.pdf with the real survey.) Tj
ET
`;

const objects = [];
objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
objects.push(`<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
objects.push(
  `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>`
);
objects.push(`<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream`);
objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

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
