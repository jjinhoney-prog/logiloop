'use client';
import {useState} from 'react';
import type {OperatingRegion} from '@/lib/partner-regions';
export default function OperatingRegionFields({initial=[],error}:{initial?:OperatingRegion[];error?:string}) {
 const [regions,setRegions]=useState(initial);
 return <section className="partner-form-section"><h2>공개 운영 지역 · 최대 10곳</h2><p>업체가 등록한 운영 지역을 모두 표시합니다. 상세 주소 대신 동·권역만 입력하세요. 지역만으로 센터별 서비스 수용을 확정하지 않습니다.</p><input type="hidden" name="operatingRegions" value={JSON.stringify(regions)}/>
 {regions.map((region,i)=><div className="partner-region-row" key={i}><label className="form-field"><span>공개 시·도 {i+1}</span><input maxLength={20} value={region.province} onChange={e=>setRegions(rs=>rs.map((r,j)=>j===i?{...r,province:e.target.value}:r))}/></label><label className="form-field"><span>공개 권역 {i+1}</span><input maxLength={60} value={region.district} onChange={e=>setRegions(rs=>rs.map((r,j)=>j===i?{...r,district:e.target.value}:r))}/></label><button type="button" className="text-button partner-remove" aria-label={`공개 운영 지역 ${i+1} 삭제`} onClick={()=>setRegions(rs=>rs.filter((_,j)=>j!==i))}>삭제</button></div>)}
 <button type="button" className="button button-outline" disabled={regions.length>=10} onClick={()=>setRegions(rs=>[...rs,{province:'',district:''}])}>공개 운영 지역 추가</button>{error&&<p className="field-error" role="alert">{error}</p>}</section>;
}
