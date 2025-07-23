// app.js
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import multer from 'multer';

const app = express();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// 1) 전체 아이템 조회
app.get('/api/items', async (req, res) => {
  const items = await prisma.item.findMany({ include: { shelf: true, level: true } });
  res.json(items);
});
//rksksksksk

// 2) 검색 → 위치 반환
app.get('/api/items/search', async (req, res) => {
  const { q } = req.query;
  const items = await prisma.item.findMany({
    where: { name: { contains: String(q), mode: 'insensitive' } },
    include: { shelf: true, level: true },
  });
  res.json(
    items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      arrivalDate: item.arrivalDate,
      remark: item.remark,
      location: item.shelf && item.level
        ? `${item.shelf.number}번 선반 ${item.level.number}층`
        : ''
    }))
  );
});

// 3) 아이템 추가
app.post('/api/items', async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const newItem = await prisma.item.create({
      data: {
        ...data,
        arrivalDate: new Date(data.arrivalDate),
      },
    });
    res.json(newItem);
  } catch (err) {
    console.error('POST /api/items Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4) 아이템 수정
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { id: _omit, ...data } = req.body;
    const updated = await prisma.item.update({
      where: { id: Number(id) },
      data: {
        ...data,
        arrivalDate: new Date(data.arrivalDate),
      },
    });
    res.json(updated);
  } catch (err) {
    console.error(`PUT /api/items/${req.params.id} Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// 5) 아이템 삭제
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.item.delete({ where: { id: Number(id) } });
  res.sendStatus(204);
});

// 6) 엑셀 내보내기
app.get('/api/export', async (req, res) => {
  const items = await prisma.item.findMany({ include: { shelf: true, level: true } });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Items');
  ws.addRow(['이름', '수량', '입고일', '비고', '위치']);
  items.forEach(item => {
    const location = item.shelf && item.level
      ? `${item.shelf.number}번 선반 ${item.level.number}층`
      : '';
    ws.addRow([
      item.name,
      item.quantity,
      item.arrivalDate ? item.arrivalDate.toISOString().slice(0, 10) : '',
      item.remark || '',
      location
    ]);
  });
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="items.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// 7) 엑셀 import
app.post('/api/import', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '엑셀 파일이 필요합니다.' });
  }
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(req.file.buffer);
    const ws = wb.worksheets[0];

    // 1) 헤더 맵핑
    const headerMap = {};
    ws.getRow(1).eachCell((cell, col) => {
      if (typeof cell.value === 'string') {
        headerMap[cell.value.trim()] = col;
      }
    });

    // 2) 필수 칼럼 검사
    const required = ['내역', '요청일', '공급업체명'];
    for (const h of required) {
      if (!headerMap[h]) {
        return res.status(400).json({ error: `칼럼 "${h}"이(가) 없습니다.` });
      }
    }
    // 수량 칼럼: '요청수량' 또는 '작지수량'
    const quantityCol = headerMap['요청수량'] || headerMap['작지수량'];
    if (!quantityCol) {
      return res
        .status(400)
        .json({ error: `칼럼 "요청수량" 또는 "작지수량" 중 하나가 필요합니다.` });
    }

    // 3) 데이터 추출
    const rows = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return;  // 헤더 스킵

      // 셀 값 가져오는 헬퍼
      const get = col => row.getCell(col).value;

      // 날짜 파싱
      const rawDate = get(headerMap['요청일']);
      let arrivalDate;
      if (typeof rawDate === 'number') {
        arrivalDate = new Date(Math.round((rawDate - 25569) * 86400000));
      } else if (rawDate instanceof Date) {
        arrivalDate = rawDate;
      } else {
        arrivalDate = new Date(String(rawDate));
      }

      rows.push({
        name:        String(get(headerMap['내역']) || '').trim(),
        arrivalDate,  // 파싱된 날짜
        remark:      String(get(headerMap['공급업체명']) || '').trim(),
        // ❗ 여기서 quantityCol 사용하기!
        quantity:    Number(get(quantityCol) || 0),
        shelfId:     null,
        levelId:     null
      });
    });

    // 4) DB 저장 (중복 스킵)
    const result = await prisma.item.createMany({
      data: rows,
      skipDuplicates: true
    });

    return res.json({ success: true, imported: result.count });
  } catch (err) {
    console.error('POST /api/import Error:', err);
    return res.status(500).json({ error: err.message });
  }
});


// 서버 기동
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
