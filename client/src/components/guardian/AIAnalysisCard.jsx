// client/src/components/guardian/AIAnalysisCard.jsx
// 보호자용 AI 분석 결과 카드

import { useState, useEffect } from 'react';
import { useProactiveAI } from '../../hooks/useProactiveAI';
import { Brain, AlertTriangle, TrendingUp, TrendingDown, Clock, Heart } from 'lucide-react';

const AIAnalysisCard = ({ seniorId, seniorName }) => {
  const { fetchAnalysis } = useProactiveAI();
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [seniorId]);

  const loadAnalysis = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAnalysis(seniorId);
      setAnalysis(data);
    } catch (error) {
      console.error('분석 로드 오류:', error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-20 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!analysis) return null;

  const { emotion, activity, suggestedMessage } = analysis;

  const getRiskColor = (ratio) => {
    if (ratio >= 0.7) return 'text-red-600 bg-red-50';
    if (ratio >= 0.5) return 'text-orange-600 bg-orange-50';
    if (ratio >= 0.3) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getRiskLabel = (ratio) => {
    if (ratio >= 0.7) return '주의 필요';
    if (ratio >= 0.5) return '관심 필요';
    if (ratio >= 0.3) return '양호';
    return '좋음';
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-500" />
          AI 분석 결과
        </h3>
        <span className="text-sm text-gray-400">
          {seniorName}님
        </span>
      </div>

      {/* 위험도 표시 */}
      {emotion && (
        <div className={`rounded-xl p-4 mb-4 ${getRiskColor(emotion.negativeRatio)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {emotion.negativeRatio >= 0.5 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Heart className="w-5 h-5" />
              )}
              <span className="font-medium">
                정서 상태: {getRiskLabel(emotion.negativeRatio)}
              </span>
            </div>
            <span className="text-sm">
              부정 감정 {Math.round(emotion.negativeRatio * 100)}%
            </span>
          </div>
          
          {emotion.needsIntervention && (
            <p className="text-sm mt-2 opacity-80">
              최근 부정적인 감정이 자주 감지되고 있습니다.
              대화나 방문을 권장합니다.
            </p>
          )}
        </div>
      )}

      {/* 활동 현황 */}
      {activity && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">활동 현황</span>
          </div>
          
          {activity.isInactive ? (
            <div className="text-orange-600">
              <p className="font-medium">
                ⚠️ {activity.daysSinceActivity}일간 활동 없음
              </p>
              <p className="text-sm mt-1">
                어르신에게 연락해보시는 것을 권장합니다.
              </p>
            </div>
          ) : (
            <p className="text-gray-600">
              마지막 활동: {activity.daysSinceActivity === 0 
                ? '오늘' 
                : `${activity.daysSinceActivity}일 전`}
            </p>
          )}
        </div>
      )}

      {/* 감정 통계 */}
      {emotion && emotion.totalLogs > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            최근 {analysis.triggers?.NEGATIVE_EMOTION_STREAK?.days || 3}일간 감정 분석
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {emotion.dominantEmotion === 'happy' ? '😊' :
               emotion.dominantEmotion === 'sad' ? '😢' :
               emotion.dominantEmotion === 'angry' ? '😠' :
               emotion.dominantEmotion === 'fear' ? '😰' :
               emotion.dominantEmotion === 'neutral' ? '😐' : '😐'}
            </span>
            <div>
              <p className="font-medium">
                주요 감정: {
                  emotion.dominantEmotion === 'happy' ? '행복' :
                  emotion.dominantEmotion === 'sad' ? '슬픔' :
                  emotion.dominantEmotion === 'angry' ? '화남' :
                  emotion.dominantEmotion === 'fear' ? '불안' :
                  emotion.dominantEmotion === 'neutral' ? '평온' : '보통'
                }
              </p>
              <p className="text-sm text-gray-500">
                총 {emotion.totalLogs}회 분석
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI 추천 메시지 */}
      {suggestedMessage && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-500 mb-2">💡 AI 추천 메시지</p>
          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-indigo-800 text-sm">
              "{suggestedMessage.message}"
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            이 메시지로 대화를 시작해보세요
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisCard;
