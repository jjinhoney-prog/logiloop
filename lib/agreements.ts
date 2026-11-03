export const agreementKinds=['물류대행','플랫폼 제휴','컨설팅·자문'] as const;
export interface AgreementParty {company:string;representative:string;email:string}
export interface AgreementDocument {title:string;kind:string;body:string;parties:[AgreementParty,AgreementParty]}
export const emptyAgreement=():AgreementDocument=>({title:'',kind:'',body:'',parties:[{company:'',representative:'',email:''},{company:'',representative:'',email:''}]});
export function normalizeAgreement(input:unknown):AgreementDocument {
 const raw=input&&typeof input==='object'?input as Record<string,unknown>:{};
 const text=(v:unknown,max:number)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error('계약 제목·유형·본문·당사자를 확인하세요.');return v.trim();};
 const title=text(raw.title,150),kind=text(raw.kind,30),body=text(raw.body,30000);
 if(!agreementKinds.includes(kind as typeof agreementKinds[number])||!Array.isArray(raw.parties)||raw.parties.length!==2)throw new Error('계약 유형과 두 당사자를 지정하세요.');
 const parties=raw.parties.map(p=>{if(!p||typeof p!=='object')throw new Error('당사자를 확인하세요.');const party={company:text(p.company,100),representative:text(p.representative,100),email:text(p.email,150)};if(!/^\S+@\S+\.\S+$/.test(party.email))throw new Error('당사자 이메일을 확인하세요.');return party;}) as [AgreementParty,AgreementParty];
 if(parties[0].email.toLowerCase()===parties[1].email.toLowerCase())throw new Error('당사자별 다른 이메일을 지정하세요.');
 return {title,kind,body,parties};
}
