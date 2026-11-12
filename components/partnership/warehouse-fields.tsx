'use client';

import { partnerProvinces } from '@/lib/partner-profile';
import {
  warehouseAreaUnits, warehouseDisclosures, warehouseFacilityTypes, warehouseLeaseScopes, warehouseReadiness, warehouseRoles, warehouseTemperatures,
  type WarehouseErrors, type WarehouseProfile,
} from '@/lib/warehouse-profile';

type Key = keyof WarehouseProfile;
type TextKey = Exclude<Key, 'temperatures'>;
type Props = { profile: WarehouseProfile; onChange: (profile: WarehouseProfile) => void; errors: WarehouseErrors; detailed?: boolean };

const LIMITS: Partial<Record<Key, number>> = { company: 100, name: 50, phone: 30, email: 254, district: 50, dong: 50, address: 200, areaValue: 12, floor: 50, height: 20, dock: 50, vehicle: 50, power: 40, buildingUse: 50, rent: 30, deposit: 20, maintenance: 30, availableAt: 60, minTerm: 60, introduction: 300, photoUrl: 500, documentUrl: 500, note: 2000 };

export function WarehouseFields({ profile, onChange, errors, detailed = false }: Props) {
  const set = <K extends Key>(key: K, value: WarehouseProfile[K]) => onChange({ ...profile, [key]: value });
  const error = (key: string) => errors[key] ? <small className="field-error" id={`warehouse-${key}-error`}>{errors[key]}</small> : null;
  const attrs = (key: string) => ({ id: `warehouse-${key}`, 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `warehouse-${key}-error` : undefined });
  function input(key: TextKey, label: string, placeholder: string, opts: { required?: boolean; type?: string; autoComplete?: string; inputMode?: 'numeric' | 'decimal' } = {}) {
    return <label className="form-field"><span>{label}{opts.required ? ' *' : ' · 선택'}</span><input {...attrs(key)} value={profile[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} required={opts.required} maxLength={LIMITS[key]} type={opts.type ?? 'text'} autoComplete={opts.autoComplete ?? 'off'} inputMode={opts.inputMode} />{error(key)}</label>;
  }
  function select(key: TextKey, label: string, options: readonly string[], placeholder?: string) {
    return <label className="form-field"><span>{label}{placeholder ? ' *' : ''}</span><select {...attrs(key)} value={profile[key]} onChange={e => set(key, e.target.value)}>{placeholder && <option value="">{placeholder}</option>}{options.map(o => <option key={o}>{o}</option>)}</select>{error(key)}</label>;
  }
  const readiness = warehouseReadiness(profile);
  return <>
    <section className="partner-form-section" aria-labelledby="warehouse-contact-title">
      <h2 id="warehouse-contact-title">등록자와 연락처</h2><p>연락처와 등록자 정보는 공개하지 않습니다. * 표시는 필수입니다.</p>
      <div className="form-grid">
        {select('role', '등록자 구분', warehouseRoles)}
        {input('company', '소유주·업체명', '예: (주)OO산업 / 개인 소유주는 성함', { required: true, autoComplete: 'organization' })}
        {input('name', '담당자', '이름 또는 성함', { required: true, autoComplete: 'name' })}
        {input('phone', '연락처', '010-0000-0000', { required: true, type: 'tel', autoComplete: 'tel' })}
        {input('email', '이메일', '자료를 받을 이메일', { type: 'email', autoComplete: 'email' })}
      </div>
    </section>
    <section className="partner-form-section" aria-labelledby="warehouse-location-title">
      <h2 id="warehouse-location-title">위치</h2><p>목록에는 시·군·구와 읍·면·동까지만 공개합니다. 번지·도로명 주소는 공개하지 않습니다.</p>
      <div className="form-grid">
        {select('province', '시·도', partnerProvinces, '선택해 주세요')}
        {input('district', '시·군·구', '예: 김해시 / 부산 강서구', { required: true })}
        {input('dong', '읍·면·동', '예: 주촌면 / 녹산동')}
        {detailed && input('address', '상세 주소 (비공개)', '현장 확인용 지번 또는 도로명 주소')}
      </div>
    </section>
    <section className="partner-form-section" aria-labelledby="warehouse-facility-title">
      <h2 id="warehouse-facility-title">시설</h2><p>임대 가능한 면적 기준으로 입력해 주세요.</p>
      <fieldset className="partner-choice-field" {...attrs('facilityType')} tabIndex={-1}><legend>시설 유형 *</legend><div className="partner-choices">{warehouseFacilityTypes.map(o => <label key={o}><input type="radio" name="warehouse-facility" checked={profile.facilityType === o} onChange={() => set('facilityType', o)} /><span>{o}</span></label>)}</div>{error('facilityType')}</fieldset>
      <fieldset className="partner-choice-field" {...attrs('temperatures')} tabIndex={-1}><legend>온도대 * <span>복수 선택</span></legend><div className="partner-choices">{warehouseTemperatures.map(o => <label key={o}><input type="checkbox" checked={profile.temperatures.includes(o)} onChange={e => set('temperatures', e.target.checked ? [...profile.temperatures, o] : profile.temperatures.filter(v => v !== o))} /><span>{o}</span></label>)}</div>{error('temperatures')}</fieldset>
      <div className="form-grid">
        <div className="warehouse-area-field">{input('areaValue', '임대 면적', '예: 1,000', { required: true, inputMode: 'decimal' })}<label className="form-field"><span>단위</span><select aria-label="면적 단위" value={profile.areaUnit} onChange={e => set('areaUnit', e.target.value)}>{warehouseAreaUnits.map(o => <option key={o}>{o}</option>)}</select></label></div>
        {select('leaseScope', '임대 범위', warehouseLeaseScopes)}
        {input('height', '층고', '예: 10m')}
        {input('power', '전력', '예: 300kW')}
        {detailed && <>
          {input('floor', '층', '예: 1층 / 지상 2층 중 1층')}
          {input('dock', '도크·접안', '예: 도크 4대 / 레벨러 2대')}
          {input('vehicle', '진입 가능 차량', '예: 40ft 트레일러')}
          {input('buildingUse', '건축물대장상 용도', '예: 창고시설 / 공장')}
        </>}
      </div>
    </section>
    <section className="partner-form-section" aria-labelledby="warehouse-terms-title">
      <h2 id="warehouse-terms-title">임대 조건</h2><p>공개 여부는 승인 전에 담당자와 확인합니다. 정해지지 않았다면 비워 두세요.</p>
      <div className="form-grid">
        {input('rent', '월 임대료', '예: 월 1,500만원 / 평당 2.5만원')}
        {input('deposit', '보증금', '예: 1억원')}
        {input('availableAt', '입주 가능 시점', '예: 즉시 / 2027년 3월')}
        {detailed && <>
          {input('maintenance', '관리비', '예: 별도 실비 / 평당 3천원')}
          {input('minTerm', '최소 계약 기간', '예: 2년 이상')}
        </>}
      </div>
    </section>
    <section className="partner-form-section" aria-labelledby="warehouse-intro-title">
      <h2 id="warehouse-intro-title">소개와 공개 범위</h2>
      <label className="form-field"><span>공간 소개 · 선택</span><textarea {...attrs('introduction')} value={profile.introduction} maxLength={300} rows={3} onChange={e => set('introduction', e.target.value)} placeholder="예: 신항 15분, 대형 차량 회차 가능. 식품·생활용품 보관에 적합합니다." /><small className="muted">승인되면 목록에 그대로 공개됩니다. 주소·연락처는 넣지 마세요.</small>{error('introduction')}</label>
      {input('photoUrl', '시설 사진 링크', 'https:// · 공유 앨범 주소', { type: 'url' })}
      {detailed && <>
        {input('documentUrl', '도면·건축물대장 등 자료 링크', 'https:// · 공유 문서 주소', { type: 'url' })}
        <details><summary>화주 소개 전 보완 체크리스트</summary>{readiness.length ? <ul>{readiness.map(v => <li key={v}>{v}</li>)}</ul> : <p>기본 항목이 입력되었습니다. 실제 조건은 담당자가 확인합니다.</p>}</details>
      </>}
      <label className="form-field"><span>공개 희망 범위</span><select value={profile.disclosure} onChange={e => set('disclosure', e.target.value)}>{warehouseDisclosures.map(d => <option key={d}>{d}</option>)}</select><small className="muted">선택만으로 공개되지 않습니다. 담당자 확인 후 공개합니다.</small></label>
      {detailed && <label className="form-field"><span>추가 안내 · 선택</span><textarea {...attrs('note')} value={profile.note} maxLength={2000} rows={4} onChange={e => set('note', e.target.value)} placeholder="임차 제한 업종, 현재 사용 현황, 확인이 필요한 조건을 알려주세요." />{error('note')}</label>}
    </section>
  </>;
}
