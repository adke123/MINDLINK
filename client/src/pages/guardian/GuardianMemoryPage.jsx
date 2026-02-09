// src/pages/guardian/GuardianMemoryPage.jsx
import { useState, useEffect, useRef } from 'react';
import { memoryAPI, connectionAPI } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { Plus, X, Image, MessageCircle, Send, Camera, Loader2 } from 'lucide-react';
// 1. 이미지 압축 라이브러리 임포트
import imageCompression from 'browser-image-compression';

const GuardianMemoryPage = () => {
  const { profile } = useAuthStore();
  const [seniors, setSeniors] = useState([]);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [memories, setMemories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: '가족', content: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [comment, setComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const fileInputRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const categories = ['가족', '여행', '음식', '취미', '친구', '기타'];
  const categoryEmojis = { '가족': '👨‍👩‍👧', '여행': '✈️', '음식': '🍜', '취미': '🎨', '친구': '👥', '기타': '📝' };

  useEffect(() => {
    loadConnections();
  }, []);

  useEffect(() => {
    if (selectedSenior) {
      loadMemories();
    }
  }, [selectedSenior]);

  const loadConnections = async () => {
    try {
      const data = await connectionAPI.getConnections();
      const seniorList = data?.connections?.filter(c => c.status === 'accepted').map(c => c.senior).filter(Boolean) || [];
      setSeniors(seniorList);
      if (seniorList.length > 0) setSelectedSenior(seniorList[0]);
    } catch (e) { 
      setSeniors([]);
    }
    setIsLoading(false);
  };

  const loadMemories = async () => {
    if (!selectedSenior) return;
    try {
      const data = await memoryAPI.getList(selectedSenior.id);
      setMemories(data?.memories || []);
    } catch (e) { 
      setMemories([]);
    }
  };

  const getImageUrl = (memory) => {
    if (!memory?.imageUrl) return null;
    return memory.imageUrl;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // 2. 이미지 압축 로직이 포함된 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim() && !selectedFile) {
      alert('내용이나 사진을 추가해주세요');
      return;
    }
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // 이미지 압축 처리
      if (selectedFile) {
        try {
          const options = {
            maxSizeMB: 1,            // 최대 1MB
            maxWidthOrHeight: 1280,   // 최대 가로/세로 1280px
            useWebWorker: true
          };
          const compressedFile = await imageCompression(selectedFile, options);
          formData.append('image', compressedFile);
        } catch (error) {
          console.error("압축 실패, 원본 전송:", error);
          formData.append('image', selectedFile);
        }
      }

      formData.append('title', form.category);
      formData.append('description', form.content);
      
      await memoryAPI.createForSenior(formData, selectedSenior.id);
      
      setForm({ category: '가족', content: '' });
      setPreviewImage(null);
      setSelectedFile(null);
      setShowForm(false);
      await loadMemories();
    } catch (e) { 
      alert('저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedMemory) return;
    setIsAddingComment(true);
    try {
      const result = await memoryAPI.addComment(selectedMemory.id, comment);
      const newCommentData = result.comment || {
        id: Date.now(),
        content: comment,
        author: { name: profile?.name || '보호자' },
        createdAt: new Date().toISOString()
      };
      setSelectedMemory({
        ...selectedMemory,
        comments: [...(selectedMemory.comments || []), newCommentData]
      });
      setMemories(memories.map(m => 
        m.id === selectedMemory.id 
          ? { ...m, comments: [...(m.comments || []), newCommentData] }
          : m
      ));
      setComment('');
    } catch (e) {
      alert('댓글 추가에 실패했습니다');
    }
    setIsAddingComment(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (seniors.length === 0) {
    return (
      <div className="text-center py-12">
        <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-bold mb-2">연결된 어르신이 없습니다</h2>
        <p className="text-gray-500">먼저 어르신과 연결해주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">🖼️ 추억 앨범</h1>
          <p className="text-gray-500">어르신의 소중한 추억</p>
        </div>
        <div className="flex items-center gap-2">
          {seniors.length > 1 && (
            <select value={selectedSenior?.id || ''} 
              onChange={(e) => setSelectedSenior(seniors.find(s => s.id === parseInt(e.target.value)))}
              className="px-4 py-2 border rounded-lg">
              {seniors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowForm(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl">
            <Plus className="w-5 h-5" /> 추억 추가
          </button>
        </div>
      </div>

      {/* 추억 작성 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedSenior?.name}님께 추억 남기기</h2>
              <button onClick={() => { setShowForm(false); setPreviewImage(null); setSelectedFile(null); }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1 text-sm ${form.category === cat ? 'bg-indigo-500 text-white' : 'bg-gray-100'}`}>
                      <span>{categoryEmojis[cat]}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">사진</label>
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
                {previewImage ? (
                  <div className="relative">
                    <img src={previewImage} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => { setPreviewImage(null); setSelectedFile(null); }}
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
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={3} className="w-full p-3 border rounded-xl" placeholder="어르신과 함께한 추억을 기록해주세요..." />
              </div>

              <button type="submit" disabled={isSaving}
                className="w-full py-3 bg-indigo-500 text-white font-bold rounded-xl disabled:opacity-50">
                {isSaving ? '압축 및 저장 중...' : '저장하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 추억 상세 모달 */}
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

      {/* 추억 목록 */}
      {memories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl">
          <Image className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">아직 기록된 추억이 없어요</p>
          <p className="text-sm text-gray-400 mt-1">첫 번째 추억을 남겨보세요!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {memories.map(memory => {
            const imgUrl = getImageUrl(memory);
            return (
              <button key={memory.id} onClick={() => setSelectedMemory(memory)}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition text-left">
                {imgUrl ? (
                  <div className="w-full h-40 bg-gray-100">
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" 
                      onError={(e) => { 
                        e.target.onerror = null;
                        e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100"><span class="text-5xl">${categoryEmojis[memory.title] || '📷'}</span></div>`;
                      }} />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <span className="text-5xl">{categoryEmojis[memory.title] || '📝'}</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                      {memory.title || '추억'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{memory.description || '사진'}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuardianMemoryPage;