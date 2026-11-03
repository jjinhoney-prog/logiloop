'use client';
import { useState, useRef, useEffect } from 'react';
import { MAX_LOGO_DATA_LENGTH, partnerCategories, partnerInfoGroups } from '@/lib/partner-brand';
import type { PartnerErrors, PartnerProfile } from '@/lib/partner-profile';

export function PartnerBrandFields({profile,onChange,errors,onBusyChange}:{profile:PartnerProfile;onChange:(p:PartnerProfile)=>void;errors:PartnerErrors;onBusyChange?:(busy:boolean)=>void}) {
  const [uploadError,setUploadError]=useState('');const [busy,setBusy]=useState(false);const latest=useRef(profile);useEffect(()=>{latest.current=profile;},[profile]);
  async function upload(file?:File){if(!file)return;setUploadError('');setBusy(true);onBusyChange?.(true);
    try {
      if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('PNG·JPG·WebP 파일을 5MB 이하로 선택하세요.');
      const bitmap=await createImageBitmap(file);
      try {
        if(bitmap.width>12000||bitmap.height>12000)throw new Error('가로·세로 12,000px 이하 이미지를 선택하세요.');
        const scale=Math.min(1,320/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw new Error('이미지를 처리하지 못했습니다. 로고 URL을 입력하세요.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
        let data='';for(const quality of [0.9,0.75,0.55,0.35]){data=canvas.toDataURL('image/webp',quality);if(data.length<=MAX_LOGO_DATA_LENGTH)break;}
        if(data.length>MAX_LOGO_DATA_LENGTH)throw new Error('이미지를 충분히 줄이지 못했습니다. 단순한 로고 이미지를 선택하세요.');
        onChange({...latest.current,logoUrl:data});
      }finally{bitmap.close();}
    }catch(err){setUploadError(err instanceof DOMException ? '이미지 파일을 읽지 못했습니다. 다른 PNG·JPG·WebP 파일을 선택하세요.' : err instanceof Error?err.message:'파일을 읽지 못했습니다.');}finally{setBusy(false);onBusyChange?.(false);}
  }
  return <section className="partner-form-section"><h2>회사 로고와 소개</h2><p>공개 소개에 사용할 자료입니다. 공개 범위 확인 후 게시합니다.</p><div className="partner-brand-row"><div className="partner-logo-preview">{profile.logoUrl ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={profile.logoUrl} alt="등록할 회사 로고" referrerPolicy="no-referrer"/>
    </> : <span>회사 로고</span>}</div><div><label className="form-field"><span>로고 파일</span><input type="file" aria-label="로고 파일" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/><small>PNG·JPG·WebP, 최대 5MB. 표시용 크기로 줄여 저장합니다.</small></label>{profile.logoUrl&&<button type="button" className="text-button" onClick={()=>onChange({...profile,logoUrl:''})}>로고 제거</button>}{busy&&<p role="status">로고를 준비하는 중…</p>}</div></div>
    {uploadError&&<p role="alert" className="field-error">{uploadError}</p>}{errors.logoUrl&&<p role="alert" className="field-error">{errors.logoUrl}</p>}
    <details><summary>파일 대신 로고 URL 입력</summary><label className="form-field"><span>로고 이미지 URL</span><input type="url" value={profile.logoUrl?.startsWith('data:')?'':profile.logoUrl??''} maxLength={500} placeholder="https://" onChange={e=>onChange({...profile,logoUrl:e.target.value})}/></label></details>
    <label className="form-field"><span>회사 소개 · 최대 300자</span><textarea id="partner-introduction" value={profile.introduction??''} maxLength={300} rows={4} placeholder="주요 화물·운영 지역·강점과 확인 가능한 경험을 소개하세요." onChange={e=>onChange({...profile,introduction:e.target.value})}/>{errors.introduction&&<small className="field-error">{errors.introduction}</small>}</label>
    <fieldset className="partner-choice-field"><legend>주요 취급 품목 · 복수 선택</legend><div className="partner-choices">{partnerCategories.map(c=><label key={c}><input type="checkbox" checked={profile.categories?.includes(c)??false} onChange={e=>onChange({...profile,categories:e.target.checked?[...(profile.categories??[]),c]:(profile.categories??[]).filter(v=>v!==c)})}/><span>{c}</span></label>)}</div></fieldset>
  </section>;
}
export function PartnerCapabilityFields({profile,onChange,errors}:{profile:PartnerProfile;onChange:(p:PartnerProfile)=>void;errors:PartnerErrors}) {
  return <section className="partner-form-section"><h2>운영 역량과 견적 조건</h2><p>접수 후에도 보완할 수 있습니다. 미입력은 확인 필요로 표시하며, 입력만으로 검증된 실적으로 표시하지 않습니다.</p>{partnerInfoGroups.map(group=><details className="partner-capabilities" key={group.title}><summary>{group.title}</summary><div className="form-grid">{group.fields.map(([key,label,hint])=><label className="form-field" key={key}><span>{label}</span><textarea id={`partner-info-${key}`} value={profile.info?.[key]??''} maxLength={1000} rows={2} placeholder={hint} onChange={e=>onChange({...profile,info:{...profile.info,[key]:e.target.value}})}/>{errors[`info.${key}`]&&<small className="field-error">{errors[`info.${key}`]}</small>}</label>)}</div></details>)}</section>;
}
