import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { memoryAPI } from '../../lib/api';
import { Image, Plus, X, Loader2, MessageCircle, Send, Camera } from 'lucide-react';
// 1. 이미지 압축 라이브러리 임포트
import imageCompression from 'browser-image-compression';

const SeniorMemoryPage = () => {
  const { profile } = useAuthStore();
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [uploadData, setUploadData] = useState({ 
    file: null, 
    category: '가족',
    description: '' 
  });

  const categories = ['가족', '여행', '음식', '취미', '친구', '기타'];
  const categoryEmojis = { '가족': '👨‍👩‍👧', '여행': '✈️', '음식': '🍜', '취미': '🎨', '친구': '👥', '기타': '📝' };

  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    try {
      const data = await memoryAPI.getList();
      setMemories(data?.memories || []);
    } catch (error) {
      setMemories([]);
    }
    setIsLoading(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // 선택 시점에는 미리보기만 생성하고, 실제 압축은 업로드 버튼을 누를 때 진행합니다.
      setUploadData(prev => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // 2. 이미지 압축 및 업로드 핸들러 수정
  const handleUpload = async () => {
    if (!uploadData.file && !uploadData.description) {
      alert('사진이나 내용을 추가해주세요');
      return;
    }

    setIsSaving(true);
    const formData = new FormData();

    // 이미지 압축 로직 적용
    if (uploadData.file) {
      try {
        const options = {
          maxSizeMB: 1,            // 최대 용량 1MB
          maxWidthOrHeight: 1280,   // 가로/세로 최대 1280px
          useWebWorker: true,      // 별도 스레드에서 처리하여 UI 버벅임 방지
        };
        
        // 압축 수행
        const compressedFile = await imageCompression(uploadData.file, options);
        formData.append('image', compressedFile);
      } catch (error) {
        console.error("이미지 압축 실패:", error);
        // 압축 실패 시 원본이라도 전송 시도
        formData.append('image', uploadData.file);
      }
    }
    
    formData.append('title', uploadData.category || '추억');
    formData.append('description', uploadData.description || '');

    try {
      await memoryAPI.create(formData);
      await loadMemories();
      setShowUpload(false);
      setUploadData({ file: null, category: '가족', description: '' });
      setPreviewImage(null);
    } catch (error) {
      console.error("업로드 실패:", error);
      alert('업로드에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedMemory) return;
    setIsAddingComment(true);
    try {
      const result = await memoryAPI.addComment(selectedMemory.id, newComment);
      const comment = result.comment || {
        id: Date.now(),
        content: newComment,
        author: { name: profile?.name || '나' },
        createdAt: new Date().toISOString()
      };
      setSelectedMemory({
        ...selectedMemory,
        comments: [...(selectedMemory.comments || []), comment]
      });
      setMemories(memories.map(m => 
        m.id === selectedMemory.id ? { ...m, comments: [...(m.comments || []), comment] } : m
      ));
      setNewComment('');
    } catch (e) {
      alert('댓글 추가에 실패했습니다');
    }
    setIsAddingComment(false);
  };

  const getImageUrl = (memory) => {
    if (!memory?.imageUrl) return null;
    return memory.imageUrl;
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📸 추억 앨범</h2>
          <p className="text-gray-500">소중한 순간들</p>
        </div>
        <button onClick={() => setShowUpload(true)} 
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600">
          <Plus className="w-5 h-5" /> 추억 추가
        </button>
      </div>

      {memories.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">아직 추억이 없어요</p>
          <p className="text-sm text-gray-400 mb-4">소중한 순간을 기록해보세요</p>
          <button onClick={() => setShowUpload(true)} 
            className="px-6 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600">
            사진 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {memories.map(memory => {
            const imgUrl = getImageUrl(memory);
            return (
              <button key={memory.id} onClick={() => setSelectedMemory(memory)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition text-left">
                {imgUrl ? (
                  <div className="aspect-square bg-gray-100 relative">
                    <img src={imgUrl} alt={memory.title || '추억'} className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100"><span class="text-5xl">${categoryEmojis[memory.title] || '📷'}</span></div>`;
                      }} />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span className="text-5xl">{categoryEmojis[memory.title] || '📝'}</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                      {memory.title || '추억'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{memory.description || ''}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">📷 추억 남기기</h2>
              <button onClick={() => { setShowUpload(false); setPreviewImage(null); }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat} type="button" 
                      onClick={() => setUploadData(prev => ({ ...prev, category: cat }))}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1 text-sm ${
                        uploadData.category === cat ? 'bg-indigo-500 text-white' : 'bg-gray-100'
                      }`}>
                      <span>{categoryEmojis[cat]}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">사진</label>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} className="hidden" />
                {previewImage ? (
                  <div className="relative">
                    <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => { 
                      setPreviewImage(null); 
                      setUploadData(prev => ({ ...prev, file: null })); 
                    }}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-indigo-500">
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-500">사진 추가</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">내용</label>
                <textarea value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3} className="w-full p-3 border rounded-xl" 
                  placeholder="이 추억에 대한 이야기를 적어주세요..." />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => {
                setShowUpload(false);
                setPreviewImage(null);
                setUploadData({ file: null, category: '가족', description: '' });
              }} className="flex-1 py-3 bg-gray-100 rounded-xl">
                취소
              </button>
              <button onClick={handleUpload} disabled={isSaving}
                className="flex-1 py-3 bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50">
                {isSaving ? '압축 및 저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMemory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">{categoryEmojis[selectedMemory.title] || '📝'}</span>
                <span className="font-bold">{selectedMemory.title || '추억'}</span>
              </div>
              <button onClick={() => setSelectedMemory(null)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {getImageUrl(selectedMemory) && (
                <img src={getImageUrl(selectedMemory)} alt="Memory" className="w-full h-72 object-cover" />
              )}
              <div className="p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMemory.description}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {new Date(selectedMemory.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeniorMemoryPage;