'use client';
import {useState} from 'react';
import Link from 'next/link';
import type {PublicRequest} from '@/lib/public-requests';
import {partnerCategories} from '@/lib/partner-brand';
export default function RequestCatalog({items}:{items:PublicRequest[]}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState('');
 const results=items.filter(r=>(!category||r.snapshot.category===category)&&`${r.snapshot.title} ${r.snapshot.region} ${r.snapshot.services.join(' ')}`.includes(query.trim()));
 return <><div className="filter-panel"><label className="form-field"><span>화주 요청 검색</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="권역, 품목 또는 필요한 작업"/></label><label className="form-field"><span>요청 품목</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">전체 품목</option>{partnerCategories.map(x=><option key={x}>{x}</option>)}</select></label><button className="text-button" onClick={()=>{setQuery('');setCategory('');}}>검색 초기화</button></div><p role="status">모집 중인 공개 요청 {results.length}건 · 최근 등록 순</p>
 {results.length?<div className="request-list">{results.map(({id,snapshot:p,updatedAt})=><article className="request-row" key={id}><div><p>{p.region} · {p.category} · {p.temperature}</p><h2><Link href={`/requests/${id}`}>{p.title}</Link></h2><p>{p.services.join(' · ')}</p><p>평균 보관 {p.storage} / 월 출고 {p.outbound}</p><p className="muted small">모집 마감 {p.deadline} · 확인 {updatedAt.slice(0,10)}</p></div><Link className="button button-outline" href={`/requests/${id}`}>요청 상세·검토</Link></article>)}</div>:<section className="panel"><h2>현재 조건에 공개 모집 중인 요청이 없습니다</h2><p>비공개로 검토하는 요청은 이 목록에 표시하지 않습니다. 업체 정보를 남겨주시면 조건이 맞는 요청을 검토할 수 있습니다.</p><Link className="button button-yellow" href="/partnership">3PL 업체 등록</Link></section>}</>;
}
