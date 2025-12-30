const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 추억 목록 조회
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

// 추억 저장 (본인)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category, content, imageUrl } = req.body;
    
    const memory = await req.prisma.memory.create({
      data: { 
        userId: req.userId, 
        category: category || '기타',
        content: content || '',
        imageUrl: imageUrl || null
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

// 보호자가 시니어의 추억에 추가
router.post('/senior/:seniorId', authMiddleware, async (req, res) => {
  try {
    const seniorId = parseInt(req.params.seniorId);
    const { category, content, imageUrl } = req.body;
    
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
        userId: seniorId,  // 시니어의 ID로 저장
        category: category || '기타',
        content: content || '',
        imageUrl: imageUrl || null
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

// 댓글 추가
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const { content } = req.body;
    
    // 추억이 존재하는지 확인
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

// 추억 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    
    // 본인 추억인지 확인
    const memory = await req.prisma.memory.findUnique({
      where: { id: memoryId }
    });
    
    if (!memory) {
      return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
    }
    
    // 본인 추억이거나 연결된 보호자인지 확인
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
