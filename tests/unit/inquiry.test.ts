import { describe, expect, test } from 'vitest';
import { inquirySummary, summaryFileName } from '@/lib/inquiry-summary';
import { parseConsultationParams } from '@/lib/search-params';
import type { InquiryData } from '@/lib/types';

const data: InquiryData = {
  tier: 2, help: '', item: '생활용품', volume: '아직 모름', region: '부산', regionDetail: '', timing: '아직 모름',
  temperature: '상온', company: '예시 회사', name: '홍길동', phone: '010-0000-0000', note: '', consent: true, source: '직접 방문',
};

describe('inquirySummary', () => {
  test('matches the prototype text for a consultation', () => {
    expect(inquirySummary(data, [{ name: 'A창고' }, { name: 'B파트너' }])).toBe(
      '물류거점 상담 준비서\n※ 보관용 사본 · 이 파일 자체로는 접수되지 않습니다.\n\n회사: 예시 회사\n담당자: 홍길동\n연락처: 010-0000-0000\n필요한 도움: 조건 비교\n품목: 생활용품\n대략적 물량: 아직 모름\n지역: 부산\n희망 시점: 아직 모름\n온도: 상온\n검토 후보: A창고, B파트너\n추가 요청: 없음\n유입경로: 직접 방문\n\n상담 등급과 업무 범위·비용은 담당자 확인 후 결정합니다.',
    );
  });
  test('partnership uses participation type, fallbacks and region detail', () => {
    const text = inquirySummary({ ...data, help: '물류사 서비스 소개', item: '', regionDetail: '녹산', note: '야간 작업' }, [], true);
    expect(text).toContain('파트너 참여 준비서');
    expect(text).toContain('참여 유형: 물류사 서비스 소개');
    expect(text).toContain('품목: 미입력');
    expect(text).toContain('지역: 부산 · 녹산');
    expect(text).toContain('검토 후보: 미정');
    expect(text).toContain('추가 요청: 야간 작업');
  });
  test('file names', () => {
    expect(summaryFileName()).toBe('로지루프_상담_준비서.txt');
    expect(summaryFileName(true)).toBe('로지루프_파트너_준비서.txt');
  });
});

describe('parseConsultationParams', () => {
  test('defaults to tier 1 without targets', () => {
    expect(parseConsultationParams({})).toEqual({ tier: 1, targets: [] });
  });
  test('rejects tiers outside 1-3', () => {
    expect(parseConsultationParams({ tier: '4' }).tier).toBe(1);
    expect(parseConsultationParams({ tier: 'abc' }).tier).toBe(1);
    expect(parseConsultationParams({ tier: '3' }).tier).toBe(3);
  });
  test('candidates are split and capped at three, taking precedence over target', () => {
    expect(parseConsultationParams({ candidates: 'a,b,c,d', target: 'z' }).targets).toEqual(['a', 'b', 'c']);
  });
  test('single target is used when no candidates', () => {
    expect(parseConsultationParams({ target: 'busan-01' }).targets).toEqual(['busan-01']);
  });
  test('array values are ignored', () => {
    expect(parseConsultationParams({ target: ['a', 'b'] }).targets).toEqual([]);
  });
});
