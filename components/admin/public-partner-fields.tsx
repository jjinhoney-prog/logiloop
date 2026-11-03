'use client';
import {useState} from 'react';
import {partnerCategories} from '@/lib/partner-brand';
import {partnerServices,partnerTemperatures} from '@/lib/partner-profile';
import type {PublicPartner,PublicCenter} from '@/lib/public-partner';
const blank=():PublicCenter=>({province:'',district:'',temperatures:[],services:[],total:'',spare:'',availableAt:'',checkedAt:''});
export default function PublicPartnerFields({initial,error}:{initial?:PublicPartner;error?:string}){
 const [value,setValue]=useState<PublicPartner>(initial??{categories:[],temperatures:[],centers:[],photos:[]});
 function center(i:number,patch:Partial<PublicCenter>){setValue(v=>({...v,centers:v.centers.map((c,j)=>j===i?{...c,...patch}:c)}));}
 function choices(label:string,options:readonly string[],selected:string[],change:(v:string[])=>void){return <fieldset className="shipper-choice"><legend>{label}</legend><div className="shipper-options">{options.map(x=><label key={x} className="shipper-option"><input type="checkbox" checked={selected.includes(x)} onChange={e=>change(e.target.checked?[...selected,x]:selected.filter(y=>y!==x))}/><span>{x}</span></label>)}</div></fieldset>;}
 return <section className="public-partner-fields"><h2>공개할 업체 운영 조건</h2><p>업체가 공개를 허용한 내용만 입력하세요. 센터 상세 주소·연락처·내부 자료는 입력하지 않습니다.</p><input type="hidden" name="publicPartner" value={JSON.stringify(value)}/>
 {error&&<p role="alert" className="field-error">{error}</p>}
 {choices('공개 취급 품목',partnerCategories,value.categories,categories=>setValue(v=>({...v,categories})))}
 {choices('공개 지원 온도',partnerTemperatures,value.temperatures,temperatures=>setValue(v=>({...v,temperatures})))}
 {value.centers.map((c,i)=><fieldset key={i} className="panel"><legend>공개 센터 {i+1}</legend><div className="partner-grid">{([['province','센터 시·도'],['district','센터 권역 (동 단위까지)'],['total','보관 총능력 (단위 포함)'],['spare','현재 여유량 (단위 포함)'],['availableAt','수용 시작일·협의 조건'],['checkedAt','여유량 확인일']] as const).map(([key,label])=><label className="form-field" key={key}><span>{label}</span><input type={key==='checkedAt'?'date':'text'} maxLength={80} value={c[key]??''} onChange={e=>center(i,{[key]:e.target.value})}/></label>)}</div>
 {choices(`센터 ${i+1} 온도`,partnerTemperatures,c.temperatures,temperatures=>center(i,{temperatures}))}{choices(`센터 ${i+1} 작업`,partnerServices,c.services,services=>center(i,{services}))}
 <button type="button" className="text-button" onClick={()=>setValue(v=>({...v,centers:v.centers.filter((_,j)=>i!==j)}))}>센터 {i+1} 제거</button></fieldset>)}
 <button type="button" className="button button-outline" disabled={value.centers.length>=10} onClick={()=>setValue(v=>({...v,centers:[...v.centers,blank()]}))}>공개 센터 추가</button>
 <h3>업체 제공 사진</h3><p>업체가 로지루프 게시를 허용한 사진의 이미지 링크를 입력하세요. 사람·차량번호·화주 상표·상세 위치 노출 여부도 확인하세요.</p>
 {(value.photos??[]).map((photo,i)=><fieldset className="panel" key={i}><legend>공개 사진 {i+1}</legend><label className="form-field"><span>사진 {i+1} 이미지 URL</span><input type="url" value={photo.url} onChange={e=>setValue(v=>({...v,photos:v.photos?.map((p,j)=>i===j?{...p,url:e.target.value}:p)}))}/></label><label className="form-field"><span>사진 {i+1} 설명</span><input maxLength={100} value={photo.caption} onChange={e=>setValue(v=>({...v,photos:v.photos?.map((p,j)=>i===j?{...p,caption:e.target.value}:p)}))}/></label><label className="quote-confirm"><input type="checkbox" checked={photo.permissionConfirmed} onChange={e=>setValue(v=>({...v,photos:v.photos?.map((p,j)=>i===j?{...p,permissionConfirmed:e.target.checked}:p)}))}/>사진 {i+1}의 게시 허락과 공개 범위를 확인했습니다.</label><button type="button" className="text-button" onClick={()=>setValue(v=>({...v,photos:v.photos?.filter((_,j)=>i!==j)}))}>사진 {i+1} 제거</button></fieldset>)}
 <button type="button" className="button button-outline" disabled={(value.photos?.length??0)>=8} onClick={()=>setValue(v=>({...v,photos:[...(v.photos??[]),{url:'',caption:'',permissionConfirmed:false}]}))}>업체 제공 사진 추가</button>
 </section>;
}
