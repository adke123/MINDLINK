const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// 1. Supabase 설정 (환경 변수 사용)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 2. multer 설정: 파일을 서버 디스크가 아닌 메모리(Buffer)에 임시 보관
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
});

// [목록 조회] 추억 목록 조회
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { seniorId } = req.query;
    const userId = seniorId ? parseInt(seniorId) : req.userId;
    
    const memories = await req.prisma.memory.findMany({
      where: { userId },
      include: {
        comments: {
          include: {
            author: { select: { id: true, name: true, role: true } }
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

// [저장] 시니어 본인 추억 저장
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { category, content } = req.body;
    let imageUrl = null;

    // 사진이 있을 경우 Supabase Storage에 업로드
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('memories') // Supabase에 만든 버킷 이름
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) throw error;

      // 공개적으로 접근 가능한 URL 가져오기
      const { data: publicUrlData } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName);
      
      imageUrl = publicUrlData.publicUrl;
    }

    const memory = await req.prisma.memory.create({
      data: { 
        userId: req.userId, 
        category: category || '기타',
        content: content || '',
        imageUrl: imageUrl 
      },
      include: { comments: true }
    });
    
    res.json({ memory });
  } catch (error) {
    console.error('Supabase 업로드 에러:', error);
    res.status(500).json({ message: '추억 저장 실패' });
  }
});

// [저장] 보호자가 시니어의 추억에 추가
router.post('/senior/:seniorId', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const seniorId = parseInt(req.params.seniorId);
    const { category, content } = req.body;
    let imageUrl = null;
    
    // 권한 확인
    const connection = await req.prisma.connection.findFirst({
      where: { seniorId, guardianId: req.userId, status: 'accepted' }
    });
    
    if (!connection) return res.status(403).json({ message: '권한이 없습니다' });

    // 사진 업로드 (시니어 본인 저장 로직과 동일)
    if (req.file) {
      const fileName = `${Date.now()}_${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('memories')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName);
      
      imageUrl = publicUrlData.publicUrl;
    }
    
    const memory = await req.prisma.memory.create({
      data: { 
        userId: seniorId, 
        category: category || '기타',
        content: content || '',
        imageUrl: imageUrl
      },
      include: { comments: true }
    });
    
    res.json({ memory });
  } catch (error) {
    console.error('보호자 업로드 에러:', error);
    res.status(500).json({ message: '추억 저장 실패' });
  }
});

// [댓글] 댓글 추가
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const { content } = req.body;
    
    const memory = await req.prisma.memory.findUnique({ where: { id: memoryId } });
    if (!memory) return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
    
    const comment = await req.prisma.memoryComment.create({
      data: { memoryId, authorId: req.userId, content },
      include: { author: { select: { id: true, name: true, role: true } } }
    });
    
    res.json({ comment });
  } catch (error) {
    res.status(500).json({ message: '댓글 추가 실패' });
  }
});

// [삭제] 추억 삭제
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const memory = await req.prisma.memory.findUnique({ where: { id: memoryId } });
    
    if (!memory) return res.status(404).json({ message: '추억을 찾을 수 없습니다' });
    
    // 권한 확인
    if (memory.userId !== req.userId) {
      const connection = await req.prisma.connection.findFirst({
        where: { seniorId: memory.userId, guardianId: req.userId, status: 'accepted' }
      });
      if (!connection) return res.status(403).json({ message: '삭제 권한이 없습니다' });
    }

    // Supabase Storage에서 실제 파일 삭제
    if (memory.imageUrl) {
      // URL에서 파일명만 추출합니다.
      const fileName = memory.imageUrl.split('/').pop();
      
      const { error: storageError } = await supabase.storage
        .from('memories')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage 파일 삭제 실패:', storageError);
        // 파일 삭제에 실패해도 DB 삭제는 진행할 수 있도록 에러만 기록합니다.
      }
    }
    
    // DB 데이터 삭제
    await req.prisma.memory.delete({ where: { id: memoryId } });
    res.json({ success: true });
  } catch (error) {
    console.error('삭제 에러:', error);
    res.status(500).json({ message: '삭제 실패' });
  }
});

module.exports = router;