'use client';

import { startTransition, useActionState, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { saveListing, type ListingFormState } from '@/app/admin/actions';
import { listingTemperatures } from '@/lib/data';
import type { ListingInput } from '@/lib/listing-form';
import type { ListingType } from '@/lib/types';

const checkLabels = ['공급자 입력', '서류 확인', '현장 확인', '화주 조건 수용 확인'];

export function ListingForm({ initial }: { initial?: ListingInput }) {
  const editing = Boolean(initial);
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(saveListing, undefined);
  const [type, setType] = useState<ListingType>(initial?.type ?? 'warehouse');
  const errors = state?.fields ?? {};

  // 검증 실패 시 입력값이 지워지지 않도록 폼 자동 초기화 없이 액션을 호출한다.
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  const field = (name: keyof ListingInput, label: string, children: ReactNode, hint?: string) => (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && !errors[name] && <small className="muted">{hint}</small>}
      {errors[name] && (
        <small className="field-error" id={`${name}-error`}>
          {errors[name]}
        </small>
      )}
    </label>
  );

  const input = (name: keyof ListingInput, extra: InputHTMLAttributes<HTMLInputElement> = {}) => {
    const raw = initial?.[name];
    const defaultValue = Array.isArray(raw) ? raw.join(', ') : raw === undefined ? '' : String(raw);
    return <input id={name} name={name} defaultValue={defaultValue} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} {...extra} />;
  };

  return (
    <form className="panel listing-form" onSubmit={submit} noValidate>
      {editing && <input type="hidden" name="originalId" value={initial!.id} />}
      {state?.error && (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      )}
      <h2>기본 정보</h2>
      <div className="form-grid">
        {field('id', '매물 ID (URL)', input('id', { disabled: editing, placeholder: 'busan-02', maxLength: 48, autoComplete: 'off' }), editing ? '등록 후에는 바꿀 수 없습니다.' : '영문 소문자·숫자·하이픈. 공개 주소에 사용됩니다.')}
        {field(
          'type',
          '유형',
          <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value as ListingType)}>
            <option value="warehouse">창고·물류센터</option>
            <option value="partner">물류사·3PL</option>
          </select>,
        )}
        {field('name', '매물명', input('name', { maxLength: 80, placeholder: '예: 김해 진례 상온 창고' }), '번지·건물명 등 특정 가능한 정보는 넣지 마세요.')}
        {field(
          'temperature',
          '온도대',
          <select id="temperature" name="temperature" defaultValue={initial?.temperature ?? '상온'} aria-invalid={!!errors.temperature}>
            {listingTemperatures.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>,
        )}
        {field('region', '지역 (필터 기준)', input('region', { maxLength: 20, placeholder: '부산 · 김해 · 양산' }))}
        {field('province', '광역 시·도 (선택)', input('province', { maxLength: 20, placeholder: '경남' }), '김해·양산처럼 시·군을 지역으로 쓸 때 입력하면 광역 필터에도 잡힙니다.')}
        {field('district', '권역 (동 단위까지)', input('district', { maxLength: 60, placeholder: '진례면 · 제조 거점' }), '오프마켓 보호를 위해 번지·도로명 주소는 저장되지 않습니다.')}
        {field('sortOrder', '노출 순서', input('sortOrder', { type: 'number', min: 0, max: 9999, placeholder: '100' }), '작은 숫자가 먼저 보입니다.')}
      </div>

      <h2>조건</h2>
      <div className="form-grid">
        {type === 'warehouse' && field('area', '면적 (㎡)', input('area', { inputMode: 'numeric', placeholder: '990' }))}
        {field('capacity', '규모 표기', input('capacity', { maxLength: 60, placeholder: type === 'warehouse' ? '약 300평' : '물량별 확인' }))}
        {field('price', '비용 표기', input('price', { maxLength: 60, placeholder: '조건 협의' }))}
        {field('available', '입주·수용 일정', input('available', { maxLength: 60, placeholder: '입주일 확인 필요' }))}
        {type === 'warehouse' && field('height', '층고', input('height', { maxLength: 20, placeholder: '9m' }))}
        {type === 'warehouse' && field('power', '전력', input('power', { maxLength: 40, placeholder: '협의' }))}
        {field('tags', '태그 (쉼표로 구분, 최대 8개)', input('tags', { maxLength: 200, placeholder: '대형차 진입, 도크' }))}
        {field('status', '카드 확인 상태 문구', input('status', { maxLength: 40, placeholder: '서류 확인 대기' }))}
      </div>
      {field('service', '제공 서비스', input('service', { maxLength: 200, placeholder: '컨테이너 입고 · 파렛트 보관' }))}
      {field('suitability', '적합성을 검토할 화주', input('suitability', { maxLength: 300 }))}
      {field('limitation', '확인이 필요한 사항', input('limitation', { maxLength: 300 }))}

      <h2>확인 상태</h2>
      <div className="form-grid">
        {checkLabels.map((label, i) => (
          <label className="form-field" key={label}>
            <span>{label}</span>
            <input name={`check${i}`} defaultValue={initial?.checks[i] ?? ''} maxLength={40} placeholder="확인 대기" />
          </label>
        ))}
      </div>

      <h2>출처</h2>
      {field('sourceUrl', '지음부동산 매물 주소 (선택)', input('sourceUrl', { inputMode: 'url', maxLength: 100, placeholder: 'https://ziumrealty.com/item/view/10967' }), '입력하면 실매물로 표시되고 상세 화면에 지음부동산 매물 링크가 붙습니다. 비우면 ‘예시’로 표시됩니다.')}

      <h2>지도 좌표</h2>
      <p className="muted small">실제 위치가 아닌 권역 대표 좌표를 입력합니다. 거리 계산과 지도 표시에 사용됩니다.</p>
      <div className="form-grid">
        {field('lat', '위도', input('lat', { inputMode: 'decimal', placeholder: '35.2436' }))}
        {field('lng', '경도', input('lng', { inputMode: 'decimal', placeholder: '128.7489' }))}
      </div>

      <div className="form-actions">
        <Link className="button button-outline" href="/admin?tab=listings">
          <ArrowLeft size={16} />
          목록으로
        </Link>
        <button className="button button-dark" type="submit" disabled={pending} aria-busy={pending}>
          <Save size={16} />
          {pending ? '저장 중…' : editing ? '수정 저장' : '비공개로 등록'}
        </button>
      </div>
    </form>
  );
}
