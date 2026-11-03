'use client';

import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clipboard, Download, FileCheck2, Info, Send } from 'lucide-react';
import { useToast } from '@/components/providers/toast';
import { PageHeading } from '@/components/ui';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { costRanges } from '@/lib/lead';
import { inquiryTemperatureOptions as temperatureOptions, partnerTypes, regionOptions, sourceOptions, timingOptions } from '@/lib/data';
import { inquirySummary, summaryFileName } from '@/lib/inquiry-summary';
import { validateInquiry } from '@/lib/logic';
import type { InquiryData, InquiryErrors, Listing, TierId } from '@/lib/types';
import { costNotice, disclosureOptions, requestSituations, responseNotice, unsureSituation } from '@/lib/service-content';
import { leaseNoteRemaining, leaseReviewFields, leaseReviewNote, leaseVatOptions, rentReviewTitle, type LeaseReview } from '@/lib/lease-review';
import { homeVisitContext, trackHomeAction } from '@/lib/funnel-client';
import { formatInquiryVolume, storageUnits, outboundUnits, quantityLimit } from '@/lib/inquiry-volume';
import { FormGuide } from './form-guide';

const stepLabels = ['요청 상황', '기본 조건', '요청 내용 확인'];

type TextKey = 'company' | 'name' | 'phone' | 'item';
type SubmitState = 'idle' | 'sending' | 'sent';

export default function InquiryForm({
  initialTier = 1,
  initialContext,
  targetItems = [],
  partnership = false,
  stored = false,
}: {
  initialTier?: TierId;
  initialContext?: Partial<Pick<InquiryData, 'help' | 'region' | 'regionDetail' | 'temperature' | 'note'>>;
  /** 서버에서 공개 매물만 골라 넘긴 검토 후보 */
  targetItems?: Pick<Listing, 'id' | 'name'>[];
  partnership?: boolean;
  /** DB 저장 여부. 안내 문구를 실제 처리 방식과 맞춘다 */
  stored?: boolean;
}) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [doneOpen, setDoneOpen] = useState(false);
  const [disclosure, setDisclosure] = useState(disclosureOptions[0]);
  const [leaseReview, setLeaseReview] = useState<LeaseReview>({});
  const [detailsOpen, setDetailsOpen] = useState(Boolean(partnership || initialContext?.note || (initialContext?.temperature && initialContext.temperature !== '아직 모름')));
  const [website, setWebsite] = useState(''); // 허니팟
  const notify = useToast();
  const submitLabel = partnership ? '파트너 신청하기' : '물류 요청하기';
  const replyNotice = partnership ? '담당자가 남겨주신 연락처로 연락드립니다. 등록·정보 공개 일정은 시설과 서비스 확인 후 협의합니다.' : responseNotice;
  // 입력값은 ‘신청하기’ 전까지 이 컴포넌트 메모리에만 있다. 신청 시 /api/inquiry로 전송된다.
  const [data, setData] = useState<InquiryData>({
    tier: initialTier,
    help: partnership ? (partnerTypes.some(([title]) => title === initialContext?.help) ? initialContext!.help! : '물류사 서비스 소개') : initialContext?.help || (initialTier === 3 ? unsureSituation.title : ''),
    item: '',
    volume: '아직 모름',
    ...(!partnership ? { storageQuantity: '', storageUnit: '팔레트', outboundQuantity: '', outboundUnit: '주문건' } : {}),
    region: initialContext?.region || '아직 모름',
    regionDetail: initialContext?.regionDetail || '',
    timing: '아직 모름',
    temperature: initialContext?.temperature || '아직 모름',
    company: '',
    name: '',
    phone: '',
    note: initialContext?.note || '',
    consent: false,
    source: '직접 방문',
  });
  const [costRange, setCostRange] = useState('');
  const rentReview = !partnership && data.help === rentReviewTitle;
  const noteLimit = rentReview ? leaseNoteRemaining(leaseReview) : partnership ? 1850 : 2000;

  function field<K extends keyof InquiryData>(key: K, value: InquiryData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function next(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!partnership && !data.help) setData((prev) => ({ ...prev, help: unsureSituation.title }));
      if (!partnership) trackHomeAction('request_started', 'form');
      setStep(2);
      return;
    }
    const found = validateInquiry({ ...data, item: data.item.trim() || '미정' }, partnership);
    if (data.note.length > noteLimit) found.note = `추가 내용은 ${noteLimit}자 이내로 줄여주세요. 현재 임차 조건은 별도로 전달됩니다.`;
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      if (firstInvalid === 'note' || (rentReview && (firstInvalid === 'storageQuantity' || firstInvalid === 'outboundQuantity'))) {
        setDetailsOpen(true);
        requestAnimationFrame(() => document.getElementById(firstInvalid)?.focus());
      } else document.getElementById(firstInvalid)?.focus();
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const submittedData = { ...data, volume: formatInquiryVolume(data), item: data.item.trim() || '미정', note: partnership ? `정보 공개 희망: ${disclosure}\n${data.note}`.trim() : data.note };
  const summary = () => inquirySummary(rentReview ? { ...submittedData, note: leaseReviewNote(leaseReview, data.note) } : submittedData, targetItems, partnership);

  function download() {
    const url = URL.createObjectURL(new Blob([summary()], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = summaryFileName(partnership);
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submit() {
    if (submitState !== 'idle') return;
    setSubmitState('sending');
    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...submittedData, ...(!partnership ? { funnel: homeVisitContext() } : {}), ...(rentReview ? { leaseReview } : {}), ...(!partnership && costRange ? { costRange } : {}), partnership, targets: targetItems.map((i) => i.id), website }),
      });
      const result = (await response.json().catch(() => null)) as { ok: boolean; error?: string } | null;
      if (!response.ok || !result?.ok) throw new Error(result?.error || '접수하지 못했습니다.');
      setSubmitState('sent');
      setDoneOpen(true);
    } catch (err) {
      setSubmitState('idle');
      const reason = err instanceof Error && err.message !== 'Failed to fetch' ? err.message : '네트워크 연결을 확인해 주세요.';
      notify(`${reason} 준비서를 내려받아 보관해 주세요.`);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary());
      notify('준비서 내용을 복사했습니다.');
    } catch {
      notify('복사할 수 없습니다. 준비서 다운로드를 이용해 주세요.');
    }
  }

  const input = (key: TextKey, label: string, placeholder: string, extra: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="form-field" key={key}>
      <span>
        {label}
        {key !== 'item' && <b> *</b>}
      </span>
      <input
        id={key}
        value={data[key]}
        onChange={(e) => field(key, e.target.value)}
        placeholder={placeholder}
        maxLength={extra.maxLength || 100}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-error` : undefined}
        {...extra}
      />
      {errors[key] && (
        <small className="field-error" id={`${key}-error`}>
          {errors[key]}
        </small>
      )}
    </label>
  );

  const leaseInput = ({ key, label, placeholder, maxLength }: (typeof leaseReviewFields)[number]) => (
    <label className="form-field" key={key}><span>{label}</span><input value={leaseReview[key] || ''} onChange={(e) => setLeaseReview((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} maxLength={maxLength} /></label>
  );

  const volumeInputs = (
    <div className="form-grid inquiry-volumes" role="group" aria-label="보관과 월 출고 조건">
      {([
        ['storageQuantity', 'storageUnit', '보관 규모', storageUnits],
        ['outboundQuantity', 'outboundUnit', '월 출고량', outboundUnits],
      ] as const).map(([quantity, unit, label, units]) => (
        <div className="form-field" key={quantity}>
          <label htmlFor={quantity}>{label} (선택)</label>
          <input id={quantity} value={data[quantity] ?? ''} inputMode="decimal" maxLength={quantityLimit}
            placeholder="모르면 비워두세요" onChange={(e) => field(quantity, e.target.value)}
            aria-invalid={Boolean(errors[quantity])} aria-describedby={`${quantity}-hint${errors[quantity] ? ` ${quantity}-error` : ''}`} />
          <Select label={`${label} 단위`} value={data[unit] ?? units[0]} onChange={(value) => field(unit, value)} options={[...units]} />
          <small className="muted" id={`${quantity}-hint`}>{quantity === 'storageQuantity' ? '평균적으로 보관할 수량이나 면적입니다.' : '한 달 출고량입니다. 주문 건수와 박스 수를 구분해 주세요.'}</small>
          {errors[quantity] && <small className="field-error" id={`${quantity}-error`}>{errors[quantity]}</small>}
        </div>
      ))}
    </div>
  );

  return (
    <div className="page form-page">
      <PageHeading
        eyebrow={partnership ? 'GROW WITH LOGILOOP' : 'LET’S START WITH YOUR NEEDS'}
        title={partnership ? '시설과 서비스를 화주에게 연결하세요' : '필요한 물류 조건을 남겨주세요'}
        audience={partnership ? '물류사·3PL·창고주를 위한 파트너 참여' : '창고 확보·물류 위탁·운영방식을 검토하는 화주를 위해'}
        description={partnership ? '회사명·담당자·연락처부터 남겨주세요. 시설·서비스 정보는 담당자와 확인하고, 공개 범위를 협의한 뒤 조건이 맞는 화주 요청과의 연결을 검토합니다.' : '회사명·담당자·연락처는 필수입니다. 품목·물량·지역·온도·시점은 미정으로 시작할 수 있습니다.'}
      />
      {step === 1 && <div className="request-promises" aria-label="신청 전 안내">
        <div><strong>{partnership ? '참여 후 진행' : '받게 될 도움'}</strong><p>{partnership ? '정보 확인 → 공개 범위 협의 → 등록·화주 요청 검토' : '요구조건 요약 · 후보 검토 · 협의한 범위의 비교 자료'}</p></div>
        <div><strong>연락과 진행 일정</strong><p>{partnership ? '접수 확인 후 연락드립니다. 등록 일정은 정보 확인 후 협의합니다.' : '접수 확인 후 연락드립니다. 후보 안내 일정은 조건 확인 후 협의합니다.'}</p></div>
        <div><strong>{partnership ? '공개 범위와 비용' : '비용 안내'}</strong><p>{partnership ? '공개 범위를 협의하고 등록·홍보·거래 비용을 구분해 안내합니다.' : costNotice}</p></div>
      </div>}
      {targetItems.length > 0 && <div className="target-summary request-targets"><strong>함께 검토할 후보</strong>{targetItems.map((i) => <span key={i.id}>{i.name}</span>)}<Link href="/compare">비교함에서 다시 선택</Link></div>}
      <div className="form-layout">
        <div>
          <ol className="form-steps">
            {stepLabels.map((label, i) => (
              <li key={label} className={step >= i + 1 ? 'current' : ''} aria-current={step === i + 1 ? 'step' : undefined}>
                <span>{step > i + 1 ? <Check size={15} /> : `0${i + 1}`}</span>
                {partnership && i === 0 ? '참여 유형' : label}
              </li>
            ))}
          </ol>
          <div className="form-demo-message">
            <Info size={18} />
            <span>
              마지막 단계에서 ‘{submitLabel}’를 눌러야 접수됩니다. 요청 내용을 내려받아 보관할 수도 있습니다.
            </span>
          </div>
          {step < 3 ? (
            <form className="panel inquiry-panel" onSubmit={next} noValidate>
              <span className="eyebrow">STEP 0{step}</span>
              <h2>{step === 1 ? (partnership ? '어떤 파트너로 참여하시나요?' : '지금 필요한 도움을 골라주세요.') : '기본 조건을 알려주세요.'}</h2>
              {step === 1 ? (
                <>
                  <div className="help-options">
                    {partnership
                      ? partnerTypes.map(([text, description]) => (
                          <label key={text} className={data.help === text ? 'help-option checked' : 'help-option'}>
                            <input type="radio" name="help" checked={data.help === text} onChange={() => field('help', text)} />
                            <div>
                              <strong>{text}</strong>
                              <p>{description}</p>
                            </div>
                          </label>
                        ))
                      : requestSituations.map((situation) => (
                          <label key={situation.id} className={data.help === situation.title ? 'help-option checked' : 'help-option'}>
                            <input type="radio" name="situation" checked={data.help === situation.title} onChange={() => setData((prev) => ({ ...prev, help: situation.title, tier: situation.tier }))} />
                            <div><strong>{situation.title}</strong><p>{situation.description}</p></div>
                          </label>
                        ))}
                  </div>
                  <p className="muted small">{partnership ? '등록·홍보 범위와 거래 시 비용은 구분해 안내합니다.' : '선택이 어려우면 그대로 다음 단계로 진행하세요. 담당자가 필요한 업무 범위를 함께 정리합니다.'}</p>
                </>
              ) : (
                <>
                  <p className="muted small">핵심 조건만 남겨도 접수할 수 있습니다. 상세 조건은 선택 입력입니다.</p>
                  <div className="form-grid">
                    {input('company', '회사명', '예: ○○유통')}
                    {input('name', '담당자 이름', '이름', { autoComplete: 'name' })}
                    {input('phone', '연락처', '010-0000-0000', { type: 'tel', autoComplete: 'tel', maxLength: 20 })}
                    <div className="form-field"><span>{partnership ? '시설 소재지·서비스 지역' : '희망 지역 · 전국 시·도'}</span><Select label={partnership ? '시설 소재지·서비스 지역' : '희망 지역 · 전국 시·도'} value={data.region} onChange={(value) => field('region', value)} options={regionOptions} /></div>
                    {rentReview ? leaseReviewFields.filter(({ key }) => key === 'rent' || key === 'area').map(leaseInput) : <>
                      {input('item', partnership ? '취급 품목' : '보관·출고 품목', '예: 생활용품 / 비워두면 미정')}
                      {partnership ? <label className="form-field"><span>보관·처리 규모</span><input value={data.volume} onChange={(e) => field('volume', e.target.value)} placeholder="수량과 단위를 함께 적어주세요" maxLength={100} /></label> : volumeInputs}
                    </>}
                  </div>
                  <details className="inquiry-details" open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
                    <summary>상세 조건 더 입력하기 <span>선택 · 모르면 건너뛰어도 됩니다</span></summary>
                    <div className="inquiry-details-body">
                      <div className="form-grid">
                        {rentReview && input('item', '보관·출고 품목', '예: 생활용품 / 비워두면 미정')}
                        {rentReview && volumeInputs}
                        <label className="form-field"><span>{partnership ? '시설 주소·서비스 가능 지역 (선택)' : '세부 지역·복수 거점 (선택)'}</span><input value={data.regionDetail} onChange={(e) => field('regionDetail', e.target.value)} maxLength={150} placeholder="예: 경기 이천·용인 / 전국 검토" /></label>
                        <div className="form-field"><span>{partnership ? '수용 가능 시점' : '도입·입주 시점'}</span><Select label={partnership ? '수용 가능 시점' : '도입·입주 시점'} value={data.timing} onChange={(value) => field('timing', value)} options={timingOptions} /></div>
                        {!partnership && <div className="form-field"><span>현재 월 물류비 (선택)</span><Select label="현재 월 물류비" value={costRange || '선택 안 함'} onChange={(value) => setCostRange(value === '선택 안 함' ? '' : value)} options={['선택 안 함', ...costRanges]} /></div>}
                        <div className="form-field"><span>{partnership ? '운영 가능한 온도대' : '필요 온도대'}</span><Select label={partnership ? '운영 가능한 온도대' : '필요 온도대'} value={data.temperature} onChange={(value) => field('temperature', value)} options={temperatureOptions} /></div>
                      </div>
                      {rentReview && <fieldset className="lease-review-fields">
                        <legend>현재 임차 조건 상세</legend>
                        <p className="muted small">아는 항목만 입력하세요. 빈칸은 ‘확인 필요’로 전달합니다.</p>
                        <div className="form-grid">
                          {leaseReviewFields.filter(({ key }) => key !== 'rent' && key !== 'area').map(leaseInput)}
                          <div className="form-field"><span>금액의 VAT 기준</span><Select label="금액의 VAT 기준" value={leaseReview.vat || '확인 필요'} onChange={(vat) => setLeaseReview((prev) => ({ ...prev, vat }))} options={leaseVatOptions} /></div>
                        </div>
                        <p className="muted small">보증금은 월 비용과 구분합니다. 절감 가능 여부는 실제 후보 조건과 이전 비용 확인 후 안내하며, 현재 창고 유지가 유리할 수도 있습니다.</p>
                      </fieldset>}
                      {partnership && <div className="form-field"><span>정보 공개 희망 범위</span><Select label="정보 공개 희망 범위" value={disclosure} onChange={setDisclosure} options={disclosureOptions} /><small className="muted">시설·서비스 공개와 개별 화주에게 제공할 자료를 협의합니다.</small></div>}
                      <label className="form-field">
                        <span>{partnership ? '제공 가능한 작업·설비와 추가 안내' : '추가로 알려주실 내용'}</span>
                        <textarea id="note" value={data.note} onChange={(e) => field('note', e.target.value)} maxLength={noteLimit} aria-invalid={!!errors.note} aria-describedby={errors.note ? 'note-error' : undefined} rows={4} placeholder="차량, 포장·반품 작업, 계약 일정 등 필요한 조건을 적어주세요." />
                        {errors.note && <small className="field-error" id="note-error">{errors.note}</small>}
                      </label>
                      <div className="form-field"><span>로지루프를 알게 된 경로</span><Select label="로지루프를 알게 된 경로" value={data.source} onChange={(value) => field('source', value)} options={sourceOptions} /></div>
                    </div>
                  </details>
                  <div className="consent-block">
                    <label>
                      <input id="consent" type="checkbox" checked={data.consent} onChange={(e) => field('consent', e.target.checked)} aria-invalid={!!errors.consent} />
                      <span>
                        상담 회신을 위한 개인정보 수집·이용{stored ? ', 상담 기록 저장(Supabase · 서울 리전)' : ''}과 메일 발송 서비스(Resend, 미국)로의 국외 이전에 동의합니다. <b>(필수)</b>
                      </span>
                    </label>
                    <p>
                      {stored ? '입력 정보는 상담 기록으로 저장되며 상담 종결 후 1년 뒤 파기합니다.' : '입력 정보는 신청 시 로지루프 담당자 메일로만 전달되며 서버에 저장하지 않습니다.'} 동의하지 않으면 신청할 수 없으며, 준비서 다운로드는 가능합니다.{' '}
                      <Link href="/privacy">개인정보 안내</Link>
                    </p>
                    {errors.consent && <small className="field-error">{errors.consent}</small>}
                  </div>
                </>
              )}
              <div className="form-actions">
                {step === 2 ? (
                  <button type="button" className="button button-outline" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} />
                    이전
                  </button>
                ) : (
                  <span className="muted small">01 / 03</span>
                )}
                <button className="button button-dark" type="submit">
                  {step === 1 ? '기본 조건 입력' : '요청 내용 확인'}
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
          ) : (
            <section className="panel prepared-panel">
              <span className="prepared-icon">
                <FileCheck2 size={32} />
              </span>
              <div className="eyebrow">{submitState === 'sent' ? 'SUBMITTED · 접수 완료' : 'READY TO SUBMIT · 신청 전'}</div>
              <h2>{submitState === 'sent' ? '신청이 접수되었습니다.' : '요청 내용을 확인해 주세요.'}</h2>
              <p>
                {submitState === 'sent' ? '담당자가 확인 후 연락드립니다.' : '아직 접수되지 않았습니다.'}
                <br />
                {submitState === 'sent' ? '준비서는 내려받아 보관하실 수 있습니다.' : `내용을 확인한 뒤 ‘${submitLabel}’를 눌러 주세요.`}
              </p>
              <pre>{summary()}</pre>
              <div className="form-actions">
                <button className="button button-outline" onClick={() => setStep(2)} disabled={submitState !== 'idle'}>
                  <ArrowLeft size={16} />
                  수정
                </button>
                <button className="button button-outline" onClick={copy}>
                  <Clipboard size={16} />
                  복사
                </button>
                <button className="button button-outline" onClick={download}>
                  <Download size={16} />
                  준비서 다운로드
                </button>
                <button className="button button-dark" onClick={submit} disabled={submitState !== 'idle'} aria-busy={submitState === 'sending'}>
                  <Send size={16} />
                  {submitState === 'sending' ? '전송 중…' : submitState === 'sent' ? '신청 완료' : submitLabel}
                </button>
              </div>
              <div className="hp-field" aria-hidden="true">
                <label>
                  웹사이트
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </label>
              </div>
            </section>
          )}
        </div>
        <FormGuide partnership={partnership} rentReview={rentReview} />
      </div>
      <Modal open={doneOpen} onClose={() => setDoneOpen(false)} title="접수되었습니다.">
        <p>{replyNotice}</p>
      </Modal>
    </div>
  );
}
