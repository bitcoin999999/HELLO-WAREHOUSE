import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());

// 전체 아이템 조회
app.get('/api/items', async (req, res) => {
  const items = await prisma.item.findMany({ include: { shelf: true, level: true } });
  res.json(items);
});

// 검색 → 위치 반환
app.get('/api/items/search', async (req, res) => {
  const { q } = req.query;
  const items = await prisma.item.findMany({
    where: { name: { contains: String(q), mode: 'insensitive' } },
    include: { shelf: true, level: true },
  });
  res.json(items.map(item => ({
    id: item.id,
    name: item.name,
    location: `${item.shelf.number}번 선반 ${item.level.number}층`,
    quantity: item.quantity,
    arrivalDate: item.arrivalDate,
    remark: item.remark,
  })));
});

// 아이템 추가
app.post('/api/items', async (req, res) => {
  const data = req.body;
  const newItem = await prisma.item.create({ data });
  res.json(newItem);
});

// 아이템 수정
app.put('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const updated = await prisma.item.update({ where: { id: Number(id) }, data });
  res.json(updated);
});

// 아이템 삭제
app.delete('/api/items/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.item.delete({ where: { id: Number(id) } });
  res.sendStatus(204);
});

// 엑셀 내보내기
import ExcelJS from 'exceljs';
app.get('/api/export', async (req, res) => {
  const items = await prisma.item.findMany({ include: { shelf: true, level: true } });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Items');
  ws.addRow(['이름', '수량', '입고일', '비고', '위치']);
  items.forEach(i => {
    ws.addRow([i.name, i.quantity, i.arrivalDate.toISOString().slice(0,10), i.remark, `${i.shelf.number}번 선반 ${i.level.number}층`]);
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="items.xlsx"');
  await wb.xlsx.write(res);
  res.end();
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

