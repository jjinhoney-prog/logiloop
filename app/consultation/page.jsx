import InquiryForm from '@/components/inquiry-form';
export const metadata={title:'상담 신청'};
export default async function Page({searchParams}){const params=await searchParams;const tier=[1,2,3].includes(Number(params.tier))?Number(params.tier):1;const targets=typeof params.candidates==='string'?params.candidates.split(',').slice(0,3):typeof params.target==='string'?[params.target]:[];return <InquiryForm initialTier={tier} targets={targets}/>}
