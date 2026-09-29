'use client';

import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clipboard, Download, FileCheck2, Info, Send } from 'lucide-react';
import { useToast } from '@/components/providers/toast';
import { PageHeading } from '@/components/ui';
import { Modal } from '@/components/ui/modal';
import { findListing, inquiryTemperatureOptions as temperatureOptions, partnerTypes, regionOptions, sourceOptions, tiers, timingOptions } from '@/lib/data';
import { inquirySummary, summaryFileName } from '@/lib/inquiry-summary';
import { validateInquiry } from '@/lib/logic';
import type { InquiryData, InquiryErrors, Listing, TierId } from '@/lib/types';
import { FormGuide } from './form-guide';

const stepLabels = ['필요한 도움', '기본 조건', '준비서 확인'];

type TextKey = 'company' | 'name' | 'phone' | 'item';
type SubmitState = 'idle' | 'sending' | 'sent';

export default function InquiryForm({ initialTier = 1, targets = [], partnership = false }: { initialTier?: TierId; targets?: string[]; partnership?: boolean }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [doneOpen, setDoneOpen] = useState(false);
  const [website, setWebsite] = useState(''); // 허니팟
  const notify = useToast();
  const submitLabel = partnership ? '파트너 신청하기' : '상담 신청하기';
  // 입력값은 ‘신청하기’ 전까지 이 컴포넌트 메모리에만 있다. 신청 시 /api/inquiry로 전송되며 서버에 저장하지 않는다.
  const [data, setData] = useState<InquiryData>({
    tier: initialTier,
    help: partnership ? '물류사 서비스 소개' : '',
    item: '',
    volume: '아직 모름',
    region: '아직 모름',
    regionDetail: '',
    timing: '아직 모름',
    temperature: '아직 모름',
    company: '',
    name: '',
    phone: '',
    note: '',
    consent: false,
    source: '직접 방문',
  });
  const targetItems = targets.map(findListing).filter((item): item is Listing => Boolean(item));

  function field<K extends keyof InquiryData>(key: K, value: InquiryData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function next(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    const found = validateInquiry(data, partnership);
    setErrors(found);
    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const summary = () => inquirySummary(data, targetItems, partnership);

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
        body: JSON.stringify({ ...data, partnership, targets: targetItems.map((i) => i.id), website }),
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
        {!(partnership && key === 'item') && <b> *</b>}
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

  return (
    <div className="page form-page">
      <PageHeading
        eyebrow={partnership ? 'GROW WITH LOGILOOP' : 'LET’S START WITH YOUR NEEDS'}
        title={partnership ? '파트너 참여' : '어떤 물류 고민이 있으신가요?'}
        description={partnership ? '전국의 물류사·창고 파트너와 함께 네트워크를 넓혀갑니다. 시설과 서비스를 알려주세요.' : '모르는 항목은 비워두셔도 괜찮습니다. 필요한 도움부터 선택해 주세요.'}
      />
      <div className="form-layout">
        <div>
          <ol className="form-steps">
            {stepLabels.map((label, i) => (
              <li key={label} className={step >= i + 1 ? 'current' : ''} aria-current={step === i + 1 ? 'step' : undefined}>
                <span>{step > i + 1 ? <Check size={15} /> : `0${i + 1}`}</span>
                {label}
              </li>
            ))}
          </ol>
          <div className="form-demo-message">
            <Info size={18} />
            <span>마지막 단계에서 ‘{partnership ? '파트너 신청하기' : '상담 신청하기'}’를 누르면 로지루프 담당자 메일로 전달됩니다. 입력 내용은 서버에 저장하지 않으며, 준비서를 내려받아 보관할 수도 있습니다.</span>
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
                      : tiers.map((tier) => (
                          <label key={tier.id} className={data.tier === tier.id ? 'help-option checked' : 'help-option'}>
                            <input type="radio" name="tier" checked={data.tier === tier.id} onChange={() => field('tier', tier.id)} />
                            <div>
                              <strong>
                                {tier.name}
                                <span>{tier.price}</span>
                              </strong>
                              <p>{tier.description}</p>
                            </div>
                          </label>
                        ))}
                  </div>
                  {targetItems.length > 0 && (
                    <div className="target-summary">
                      <strong>함께 검토할 후보</strong>
                      {targetItems.map((i) => (
                        <span key={i.id}>{i.name} · 예시</span>
                      ))}
                    </div>
                  )}
                  <p className="muted small">{partnership ? '무료 홍보 범위, 촬영 일정, 게시 채널과 거래 시 비용은 구분해 안내합니다.' : '선택한 도움을 기준으로 담당자가 상담 등급과 제공 범위를 확인합니다.'}</p>
                </>
              ) : (
                <>
                  <div className="form-grid">
                    {input('company', '회사명', '예: ○○유통')}
                    {input('name', '담당자 이름', '이름', { autoComplete: 'name' })}
                    {input('phone', '연락처', '010-0000-0000', { type: 'tel', autoComplete: 'tel', maxLength: 20 })}
                    {input('item', partnership ? '취급 품목' : '보관·출고 품목', '예: 생활용품, 자동차 부품, 아직 모름')}
                    <label className="form-field">
                      <span>대략적 물량</span>
                      <input value={data.volume} onChange={(e) => field('volume', e.target.value)} placeholder="예: 100PLT / 월 1,000건 / 아직 모름" maxLength={100} />
                    </label>
                    <label className="form-field">
                      <span>희망 지역 · 전국 시·도</span>
                      <select value={data.region} onChange={(e) => field('region', e.target.value)}>
                        {regionOptions.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>세부 지역·복수 거점 (선택)</span>
                      <input value={data.regionDetail} onChange={(e) => field('regionDetail', e.target.value)} maxLength={150} placeholder="예: 경기 이천·용인 / 인천과 부산 동시 검토" />
                    </label>
                    <label className="form-field">
                      <span>도입·입주 시점</span>
                      <select value={data.timing} onChange={(e) => field('timing', e.target.value)}>
                        {timingOptions.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>필요 온도대</span>
                      <select value={data.temperature} onChange={(e) => field('temperature', e.target.value)}>
                        {temperatureOptions.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label className="form-field">
                    <span>추가로 알려주실 내용</span>
                    <textarea value={data.note} onChange={(e) => field('note', e.target.value)} maxLength={2000} rows={4} placeholder="차량, 포장·반품 작업, 계약 일정 등 필요한 조건을 적어주세요." />
                  </label>
                  <label className="form-field">
                    <span>로지루프를 알게 된 경로</span>
                    <select value={data.source} onChange={(e) => field('source', e.target.value)}>
                      {sourceOptions.map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <div className="consent-block">
                    <label>
                      <input id="consent" type="checkbox" checked={data.consent} onChange={(e) => field('consent', e.target.checked)} aria-invalid={!!errors.consent} />
                      <span>
                        상담 회신을 위한 개인정보 수집·이용과 메일 발송 서비스(Resend, 미국)로의 국외 이전에 동의합니다. <b>(필수)</b>
                      </span>
                    </label>
                    <p>
                      입력 정보는 신청 시 로지루프 담당자 메일로만 전달되며 서버에 저장하지 않습니다. 동의하지 않으면 신청할 수 없으며, 준비서 다운로드는 가능합니다. <Link href="/privacy">개인정보 안내</Link>
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
                  {step === 1 ? '기본 조건 입력' : '준비서 확인'}
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
              <h2>{submitState === 'sent' ? '신청이 접수되었습니다.' : '상담 준비서를 정리했습니다.'}</h2>
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
        <FormGuide partnership={partnership} />
      </div>
      <Modal open={doneOpen} onClose={() => setDoneOpen(false)} title="접수되었습니다.">
        <p>영업일 기준 1일 내 연락드립니다.</p>
      </Modal>
    </div>
  );
}
