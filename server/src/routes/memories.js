// server/src/routes/memories.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 1. 이미지 저장 위치 및 파일명 정의
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 프로젝트 루트의 uploads 폴더에 저장
  },
  filename: (req, file, cb) => {
    // 파일명 중복 방지를 위해 타임스탬프와 랜덤 숫자를 조합
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 최대 파일 크기 5MB 제한
});

// 2. 추억 목록 조회
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { seniorId } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    
    const memories = await req.prisma.memory.findMany({
      where: { userId },
      include: {
        comments: {
          include: {
            author: {
              select: { id: true, name: true, role: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ memories });
  } catch (error) {
    console.error('추억 조회 에러:', error);
    res.status(500).json({ message: '추억 조회 실패' });
  }
});

// 3. 시니어 본인 추억 저장 (이미지 파일 처리 미들웨어 추가)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { category, content } = req.body;
    const imageUrl = req.file ? req.file.filename : null; // multer가 저장한 파일명 추출
    
    const memory = await req.prisma.memory.create({
      data: { 
        userId: req.userId, 
        category: category || '기타',
        content: content || '',
        imageUrl: imageUrl // DB에는 파일 이름만 저장
      },
      include: {
        comments: true
      }
    });
    
    res.json({ memory });
  } catch (error) {
    console.error('추억 저장 에러:', error);
    res.status(500).json({ message: '추억 저장 실패' });
  }
});

// 4. 보호자가 시니어의 추억에 추가 (이미지 파일 처리 미들웨어 추가)
router.post('/senior/:seniorId', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const seniorId = parseInt(req.params.seniorId);
    const { category, content } = req.body;
    const imageUrl = req.file ? req.file.filename : null;
    
    // 연결된 시니어인지 확인
    const connection = await req.prisma.connection.findFirst({
      where: {
        seniorId: seniorId,
        guardianId: req.userId,
        status: 'accepted'
      }
    });
    
    if (!connection) {
      return res.status(403).json({ message: '권한이 없습니다' });
    }
    
    const memory = await req.prisma.memory.create({
      data: { 
        userId: seniorId, 
        category: category || '기타',
        content: content || '',
        imageUrl: imageUrl
      },
      include: {
        comments: true
      }
    });
    
    res.json({ memory });
  } catch (error) {
    console.error('시니어 추억 저장 에러:', error);
    res.status(500).json({ message: '추억 저장 실패' });
  }
});

// 5. 댓글 추가
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const { content } = req.body;
    
    const memory = await req.prisma.memory.findUnique({
      where: { id: memoryId }
    });
    
    if (!memory) {
      return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
    }
    
    const comment = await req.prisma.memoryComment.create({
      data: {
        memoryId,
        authorId: req.userId,
        content
      },
      include: {
        author: {
          select: { id: true, name: true, role: true }
        }
      }
    });
    
    res.json({ comment });
  } catch (error) {
    console.error('댓글 추가 에러:', error);
    res.status(500).json({ message: '댓글 추가 실패' });
  }
});

// 6. 추억 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const memory = await req.prisma.memory.findUnique({
      where: { id: memoryId }
    });
    
    if (!memory) {
      return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
    }
    
    if (memory.userId !== req.userId) {
      const connection = await req.prisma.connection.findFirst({
        where: {
          seniorId: memory.userId,
          guardianId: req.userId,
          status: 'accepted'
        }
      });
      
      if (!connection) {
        return res.status(403).json({ message: '삭제 권한이 없습니다' });
      }
    }
    
    await req.prisma.memory.delete({ where: { id: memoryId } });
    res.json({ success: true });
  } catch (error) {
    console.error('추억 삭제 에러:', error);
    res.status(500).json({ message: '삭제 실패' });
  }
});

module.exports = router;