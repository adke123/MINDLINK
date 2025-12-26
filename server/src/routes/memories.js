const express = require('express');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 업로드 디렉토리 생성
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('이미지 파일만 업로드 가능합니다'));
  }
});

// 추억 목록 조회
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { seniorId } = req.query;
    let userId = seniorId ? parseInt(seniorId) : req.userId;
    
    if (typeof userId !== 'number' || isNaN(userId)) {
      return res.json({ memories: [] });
    }

    const memories = await req.prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // description에서 댓글 파싱
    const memoriesWithComments = memories.map(m => {
      let comments = [];
      let description = '';
      
      if (m.description) {
        try {
          const parsed = JSON.parse(m.description);
          if (parsed.comments) {
            comments = parsed.comments;
            description = parsed.text || '';
          } else {
            description = m.description;
          }
        } catch (e) {
          description = m.description;
        }
      }
      
      return { ...m, comments, description };
    });
    
    res.json({ memories: memoriesWithComments });
  } catch (error) {
    console.error('GET /memories error:', error.message);
    res.json({ memories: [] });
  }
});

// 추억 생성
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { seniorId } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    const { title, description } = req.body;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // description을 JSON 형태로 저장 (댓글 포함)
    const descriptionJson = JSON.stringify({
      text: description || '',
      comments: []
    });

    const memory = await req.prisma.memory.create({
      data: { 
        userId, 
        title: title || '추억',
        imageUrl: imageUrl,
        description: descriptionJson
      }
    });

    res.json({ memory: { ...memory, comments: [], description: description || '' } });
  } catch (error) {
    console.error('POST /memories error:', error.message);
    res.status(500).json({ message: '추억 저장 실패', error: error.message });
  }
});

// ★★★ 댓글 추가 ★★★
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const { content } = req.body;
    const userId = req.userId;
    
    // 사용자 정보 가져오기
    const user = await req.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true }
    });

    // 기존 메모리 가져오기
    const memory = await req.prisma.memory.findUnique({
      where: { id: memoryId }
    });

    if (!memory) {
      return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
    }

    // 기존 description 파싱
    let descData = { text: '', comments: [] };
    if (memory.description) {
      try {
        const parsed = JSON.parse(memory.description);
        if (parsed.comments) {
          descData = parsed;
        } else {
          descData.text = memory.description;
        }
      } catch (e) {
        descData.text = memory.description;
      }
    }

    // 새 댓글 추가
    const newComment = {
      id: Date.now(),
      content,
      author: { id: user.id, name: user.name },
      createdAt: new Date().toISOString()
    };
    descData.comments.push(newComment);

    // 업데이트
    await req.prisma.memory.update({
      where: { id: memoryId },
      data: { description: JSON.stringify(descData) }
    });

    res.json({ comment: newComment });
  } catch (error) {
    console.error('POST /memories/:id/comments error:', error.message);
    res.status(500).json({ message: '댓글 추가 실패' });
  }
});

// 추억 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const memory = await req.prisma.memory.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (memory?.imageUrl) {
      const filePath = path.join(__dirname, '../..', memory.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await req.prisma.memory.delete({ 
      where: { id: parseInt(req.params.id) } 
    });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE /memories error:', error.message);
    res.status(500).json({ message: '삭제 실패' });
  }
});

module.exports = router;
