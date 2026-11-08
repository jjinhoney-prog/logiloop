'use client';

import { PartnerBrandFields, PartnerCapabilityFields } from './brand-fields';
import { PartnerMetricFields } from './metric-fields';
import { Plus, X } from 'lucide-react';
import { emptyCenter, partnerReadiness, partnerDisclosures, partnerProvinces, partnerServices, partnerTemperatures, type PartnerCenter, type PartnerErrors, type PartnerProfile } from '@/lib/partner-profile';

type Props = { profile: PartnerProfile; onChange: (profile: PartnerProfile) => void; errors: PartnerErrors; detailed?: boolean; onAssetBusyChange?: (busy: boolean) => void };
export function PartnerFields({ profile, onChange, errors, detailed = false, onAssetBusyChange }: Props) {
  const set = <K extends keyof PartnerProfile>(key: K, value: PartnerProfile[K]) => onChange({ ...profile, [key]: value });
  const error = (key: string) => errors[key] ? <small className="field-error" id={`partner-${key}-error`}>{errors[key]}</small> : null;
  const attrs = (key: string) => ({ id: `partner-${key}`, 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `partner-${key}-error` : undefined });
  function input(key: 'company' | 'name' | 'phone' | 'websiteUrl' | 'documentUrl' | 'quoteEmail' | 'quoteContact', label: string, placeholder: string, required = false) {
    return <label className="form-field"><span>{label}{required ? ' *' : ' · 선택'}</span><input {...attrs(key)} value={profile[key] ?? ''} onChange={e => set(key, e.target.value)} placeholder={placeholder} required={required} maxLength={key === 'quoteEmail' ? 254 : key.endsWith('Url') ? 500 : key === 'phone' ? 30 : key === 'name' ? 50 : 100} type={key === 'quoteEmail' ? 'email' : key === 'phone' ? 'tel' : key.endsWith('Url') ? 'url' : 'text'} autoComplete={key === 'company' ? 'organization' : key === 'name' ? 'name' : key === 'phone' ? 'tel' : 'url'} />{error(key)}</label>;
  }
  function choices(key: 'services' | 'temperatures', title: string, options: readonly string[]) {
    return <fieldset className="partner-choice-field" {...attrs(key)} tabIndex={-1}><legend>{title} * <span>복수 선택</span></legend><div className="partner-choices">{options.map(option => <label key={option}><input type="checkbox" checked={profile[key].includes(option)} onChange={e => set(key, e.target.checked ? [...profile[key], option] : profile[key].filter(v => v !== option))} /><span>{option}</span></label>)}</div>{error(key)}</fieldset>;
  }
  return <>
    <PartnerBrandFields profile={profile} onChange={onChange} errors={errors} onBusyChange={onAssetBusyChange}/>
    <section className="partner-form-section" aria-labelledby="partner-contact-title">
      <h2 id="partner-contact-title">업체와 연락처</h2><p>담당자 연락처는 공개하지 않습니다. * 표시는 필수입니다.</p>
      <div className="form-grid">{input('company', '업체명', '예: 로지루프 물류', true)}{input('name', '담당자', '이름 또는 성함', true)}{input('phone', '연락처', '010-0000-0000', true)}{input('websiteUrl', '홈페이지', 'https://')}{input('quoteEmail', '견적 수신 이메일', '견적 받을 이메일')}{input('quoteContact', '견적 담당자·연락 채널', '예: 운영팀 / 이메일 우선')}</div>
    </section>
    <section className="partner-form-section" aria-labelledby="partner-service-title">
      <h2 id="partner-service-title">운영 지역과 서비스</h2><p>센터 소재지를 입력해 주세요. 상세 주소는 접수 후 보완할 수 있습니다.</p>
      <fieldset className="partner-region-field" id="partner-regions" tabIndex={-1}><legend>운영 지역 * <span>최대 10곳</span></legend>{profile.regions.map((region, i) => <div className="partner-region-row" key={i}>
        <label className="form-field"><span>시·도 {i + 1}</span><select {...attrs(`regions.${i}.province`)} value={region.province} onChange={e => set('regions', profile.regions.map((r, index) => index === i ? { ...r, province: e.target.value } : r))}><option value="">선택해 주세요</option>{partnerProvinces.map(p => <option key={p}>{p}</option>)}</select>{error(`regions.${i}.province`)}</label>
        <label className="form-field"><span>시·군·구 {i + 1}</span><input {...attrs(`regions.${i}.district`)} value={region.district} maxLength={50} placeholder="예: 김해시 / 강서구" onChange={e => set('regions', profile.regions.map((r, index) => index === i ? { ...r, district: e.target.value } : r))} />{error(`regions.${i}.district`)}</label>
        {profile.regions.length > 1 && <button type="button" className="partner-remove" aria-label={`운영 지역 ${i + 1} 삭제`} onClick={() => set('regions', profile.regions.filter((_, index) => index !== i))}><X size={18} /></button>}
      </div>)}{error('regions')}<button className="text-button" type="button" disabled={profile.regions.length >= 10} onClick={() => set('regions', [...profile.regions, { province: '', district: '' }])}><Plus size={15} />운영 지역 추가</button></fieldset>
      {choices('services', '제공 서비스', partnerServices)}{choices('temperatures', '운영 온도대', partnerTemperatures)}
    </section>
    {detailed && <section className="partner-form-section" aria-labelledby="partner-centers-title">
      <h2 id="partner-centers-title">센터별 상세정보 <span className="muted small">선택</span></h2><p>센터별로 입력해 주세요. 전체 처리능력과 현재 여유 물량을 구분하면 후보 검토에 도움이 됩니다.</p>
      {profile.centers.map((center, i) => <fieldset className="partner-center" key={i}><legend>센터 {i + 1}</legend><div className="form-grid">{([
        ['name', '센터명 *', '예: 김해센터'], ['temperature', '센터 운영 온도', '예: 상온·냉장'], ['address', '주소 *', '도로명 주소'], ['area', '면적', '예: 3,300㎡ / 1,000평'], ['height', '층고', '예: 8m'], ['dock', '도크', '예: 접안 4대'], ['vehicle', '차량 진입', '예: 40ft 트레일러 진입 가능'], ['capacity', '전체 처리능력', '예: 보관 1,000PLT / 일 출고 3,000건'], ['spareCapacity', '현재 여유 물량', '예: 보관 200PLT / 일 출고 500건'], ['availableAt', '수용 가능 시점', '예: 즉시 / 2026년 12월'], ['dailyOutbound', '일 평균 출고량', '예: 3,000건/일'], ['peakOutbound', '일 최대 출고량', '예: 5,000건/일 · 인력 조건 기재'], ['equipment', '보관·작업 설비', '랙·지게차·컨베이어 등'], ['security', '보안·안전 관리', 'CCTV·출입통제·소방 관리'], ['capacityAsOf', '여유 물량 확인 기준일', 'YYYY-MM-DD'], ['items', '취급 품목', '예: 생활용품·식품'], ['operations', '작업·택배사·WMS', '예: 합포장 / 택배사 / 사용 중인 WMS'], ['photoUrl', '시설 사진 링크', 'https:// · 공유 앨범 주소'],
      ] as [keyof PartnerCenter, string, string][]).map(([key, label, placeholder]) => <label className="form-field" key={key}><span>{label}</span><input {...attrs(`centers.${i}.${key}`)} value={center[key] ?? ''} maxLength={key === 'operations' || key === 'photoUrl' ? 500 : 200} type={key === 'photoUrl' ? 'url' : 'text'} placeholder={placeholder} onChange={e => set('centers', profile.centers.map((c, index) => index === i ? { ...c, [key]: e.target.value } : c))} />{error(`centers.${i}.${key}`)}</label>)}</div>
        <button type="button" className="text-button" onClick={() => { if (Object.values(center).some(Boolean) && !window.confirm('입력한 센터 정보를 삭제할까요? 저장 전까지 다른 정보는 유지됩니다.')) return; set('centers', profile.centers.filter((_, index) => index !== i)); }}>센터 {i + 1} 삭제</button>
      </fieldset>)}{error('centers')}<button type="button" className="button button-outline" disabled={profile.centers.length >= 10} onClick={() => set('centers', [...profile.centers, emptyCenter()])}><Plus size={16} />센터 추가</button>
    </section>}
    <PartnerCapabilityFields profile={profile} onChange={onChange} errors={errors}/>
    {detailed && <PartnerMetricFields profile={profile} onChange={onChange} errors={errors}/>}
    <section className="partner-form-section" aria-labelledby="partner-material-title"><h2 id="partner-material-title">소개자료와 공개 범위</h2>
      {detailed && <><p>운영 지역 {profile.regions.length}곳 입력 · 상세 센터 {profile.centers.length}개 저장 대상</p><details><summary>견적 연결 전 보완 체크리스트</summary>{partnerReadiness(profile).length ? <ul>{partnerReadiness(profile).map(v=><li key={v}>{v}</li>)}</ul> : <p>기본 항목이 입력되었습니다. 자료 내용과 실제 수용 여부는 담당자가 확인합니다.</p>}</details>
      {(profile.materials ?? []).map((m,i)=><div className="form-grid" key={i}><label className="form-field"><span>자료 {i+1} 종류</span><input value={m.kind} maxLength={100} placeholder="회사소개서·시설 사진 등" onChange={e=>set('materials',profile.materials!.map((v,j)=>j===i?{...v,kind:e.target.value}:v))}/>{error(`materials.${i}.kind`)}</label><label className="form-field"><span>자료 {i+1} 링크</span><input type="url" value={m.url} maxLength={500} onChange={e=>set('materials',profile.materials!.map((v,j)=>j===i?{...v,url:e.target.value}:v))}/>{error(`materials.${i}.url`)}</label><label className="form-field"><span>자료 {i+1} 기준일</span><input type="date" value={m.updatedAt} onChange={e=>set('materials',profile.materials!.map((v,j)=>j===i?{...v,updatedAt:e.target.value}:v))}/></label><button type="button" className="text-button" onClick={()=>set('materials',profile.materials!.filter((_,j)=>j!==i))}>자료 {i+1} 삭제</button></div>)}<button type="button" className="button button-outline" disabled={(profile.materials?.length??0)>=10} onClick={()=>set('materials',[...(profile.materials??[]),{kind:'',url:'',updatedAt:''}])}>보완자료 추가</button></>}
      {input('documentUrl', '회사소개서 링크', 'https:// · 공유 문서 또는 파일 주소')}
      <label className="form-field"><span>공개 희망 범위</span><select value={profile.disclosure} onChange={e => set('disclosure', e.target.value)}>{partnerDisclosures.map(d => <option key={d}>{d}</option>)}</select><small className="muted">선택만으로 공개되지 않습니다. 확인 후 공개 범위를 협의합니다.</small></label>
      {detailed && <label className="form-field"><span>추가 안내 · 선택</span><textarea {...attrs('note')} value={profile.note} maxLength={2000} rows={4} onChange={e => set('note', e.target.value)} placeholder="최소 물량, 취급 제한, 추가 확인이 필요한 조건을 알려주세요." />{error('note')}</label>}
    </section>
  </>;
}
