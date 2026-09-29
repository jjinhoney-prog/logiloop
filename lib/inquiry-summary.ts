import { tiers } from './data';
import type { InquiryData, Listing } from './types';

export function inquirySummary(data: InquiryData, targetItems: Pick<Listing, 'name'>[], partnership = false): string {
  const kind = partnership ? '파트너 참여' : '물류거점 상담';
  const help = partnership ? '참여 유형: ' + data.help : '필요한 도움: ' + tiers.find((t) => t.id === data.tier)?.name;
  return [
    `${kind} 준비서`,
    '※ 미전송 문서 · 실제 접수되지 않았습니다.',
    '',
    `회사: ${data.company}`,
    `담당자: ${data.name}`,
    `연락처: ${data.phone}`,
    help,
    `품목: ${data.item || '미입력'}`,
    `대략적 물량: ${data.volume}`,
    `지역: ${data.region}${data.regionDetail ? ' · ' + data.regionDetail : ''}`,
    `희망 시점: ${data.timing}`,
    `온도: ${data.temperature}`,
    `검토 후보: ${targetItems.map((i) => i.name).join(', ') || '미정'}`,
    `추가 요청: ${data.note || '없음'}`,
    `유입경로: ${data.source}`,
    '',
    '상담 등급과 업무 범위·비용은 담당자 확인 후 결정합니다.',
  ].join('\n');
}

export function summaryFileName(partnership = false) {
  return `로지루프_${partnership ? '파트너' : '상담'}_준비서.txt`;
}
