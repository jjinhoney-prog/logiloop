export const externalStatuses=['서명 요청','일부 서명','완료','취소','거절','만료'] as const;
export interface ExternalAgreement {
 provider:'modusign';documentUrl:string;status:typeof externalStatuses[number];
 evidenceUrl:string;note:string;checkedAt:string;
 history:{status:string;note:string;checkedAt:string}[];
}
export function normalizeExternalAgreement(input:unknown, previous?:ExternalAgreement|null, now=new Date().toISOString()):ExternalAgreement {
 const raw=input&&typeof input==='object'?input as Record<string,unknown>:{};
 const text=(key:string,max:number)=>{const v=raw[key];if(typeof v!=='string'||v.length>max)throw new Error('모두싸인 연결 정보를 확인하세요.');return v.trim();};
 const documentUrl=text('documentUrl',1000),evidenceUrl=text('evidenceUrl',1000),note=text('note',1000),status=text('status',30);
 const url=new URL(documentUrl);
 if(url.protocol!=='https:'||url.hostname!=='app.modusign.co.kr'||url.username||url.password||url.port||url.pathname==='/')throw new Error('모두싸인 문서의 관리자용 https://app.modusign.co.kr/ 주소를 입력하세요.');
 if(!externalStatuses.some(s=>s===status)||note.length<5||raw.confirmed!==true)throw new Error('문서·당사자·상태 확인 기록과 확인 동의가 필요합니다.');
 if(previous&&previous.documentUrl!==documentUrl)throw new Error('연결된 문서를 교체할 수 없습니다. 새 계약 초안을 만드세요.');
 if(previous&&['완료','취소','거절','만료'].includes(previous.status))throw new Error('종료된 계약 기록은 유지하고 변경 계약은 새로 작성하세요.');
 if(previous?.status==='일부 서명'&&status==='서명 요청')throw new Error('서명 진행 상태를 이전으로 되돌릴 수 없습니다.');
 if(evidenceUrl){const u=new URL(evidenceUrl);if(u.protocol!=='https:'||u.username||u.password)throw new Error('완료 자료 보관 주소는 HTTPS여야 합니다.');}
 if(status==='완료'&&!evidenceUrl)throw new Error('완료 계약서·감사추적 자료를 보관한 비공개 폴더 주소를 입력하세요.');
 return {provider:'modusign',documentUrl,status:status as ExternalAgreement['status'],evidenceUrl,note,checkedAt:now,history:[...(previous?.history??[]),{status,note,checkedAt:now}]};
}
