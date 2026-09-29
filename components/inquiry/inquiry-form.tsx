'use client';

import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Clipboard, Download, FileCheck2, Info } from 'lucide-react';
import { useToast } from '@/components/providers/toast';
import { PageHeading } from '@/components/ui';
import { findListing, regions, tiers } from '@/lib/data';
import { inquirySummary, summaryFileName } from '@/lib/inquiry-summary';
import { validateInquiry } from '@/lib/logic';
import type { InquiryData, InquiryErrors, Listing, TierId } from '@/lib/types';
import { FormGuide } from './form-guide';

const stepLabels = ['필요한 도움', '기본 조건', '준비서 확인'];
const partnerTypes = [
  ['물류사 서비스 소개', '취급 품목·온도·가용 처리량을 함께 정리합니다.'],
  ['창고·물류센터 임대 홍보', '공간·시설·임대 조건을 정리합니다.'],
] as const;
const regionOptions = ['아직 모름', ...regions.slice(1), '복수 지역 검토'];
const timingOptions = ['아직 모름', '1개월 이내', '3개월 이내', '6개월 이내', '6개월 이후'];
const temperatureOptions = ['아직 모름', '상온', '냉장', '냉동', '복수 온도대 · 별도 확인'];
const sourceOptions = ['직접 방문', '블로그', '유튜브', '네이버부동산', '거래처 소개', '기타'];

type TextKey = 'company' | 'name' | 'phone' | 'item';

export default function InquiryForm({ initialTier = 1, targets = [], partnership = false }: { initialTier?: TierId; targets?: string[]; partnership?: boolean }) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<InquiryErrors>({});
  const notify = useToast();
  // 입력값은 이 컴포넌트 메모리에만 존재한다. 서버 전송·저장 없음.
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
            <span>체험용 작성 화면입니다. 입력 내용은 서버에 전송·저장되지 않으며, 마지막에 상담 준비서를 내려받을 수 있습니다.</span>
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
                        실제 접수가 아닌 준비서 작성임을 확인했습니다. <b>(필수)</b>
                      </span>
                    </label>
                    <p>
                      입력 정보는 이 화면의 메모리에만 유지됩니다. 새로고침하면 사라지며, 다운로드한 파일에는 입력한 연락처가 포함됩니다. <Link href="/privacy">개인정보 안내</Link>
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
              <div className="eyebrow">READY TO REVIEW · 미전송</div>
              <h2>상담 준비서를 정리했습니다.</h2>
              <p>
                실제 상담 접수는 이루어지지 않았습니다.
                <br />
                아래 내용을 확인하고 파일로 보관하세요.
              </p>
              <pre>{summary()}</pre>
              <div className="form-actions">
                <button className="button button-outline" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} />
                  수정
                </button>
                <button className="button button-outline" onClick={copy}>
                  <Clipboard size={16} />
                  복사
                </button>
                <button className="button button-dark" onClick={download}>
                  <Download size={16} />
                  준비서 다운로드
                </button>
              </div>
            </section>
          )}
        </div>
        <FormGuide partnership={partnership} />
      </div>
    </div>
  );
}
