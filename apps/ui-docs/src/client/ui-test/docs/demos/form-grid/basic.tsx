'use client';

import {
  Button,
  Card,
  CardHeader,
  DatePicker,
  Field,
  FormGrid,
  Input,
  Select,
  showToast,
  Textarea,
  useFieldErrors,
} from '@hvy/ui';
import { Save } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

/**
 * 상세 폼 한 장 — 카드 + 격자 + `Field`(라벨 위) + 저장 검증.
 *
 * 격자에는 열 수가 없다. `dl-form-grid` 가 `auto-fit` 이라 카드 폭이 정하고,
 * 한 줄을 다 쓰는 칸만 `col-span-full` 로 표시한다 — 요약·본문처럼 값이 긴 칸이다.
 *
 * **입력 형식은 타이핑을 막지 않고 칸을 벗어날 때 정리한다.**
 * `onChange` 에서 문자를 걸러내면 controlled 입력의 커서가 문자열 끝으로 튀고
 * 한글 IME 조합 중 값이 깨진다. DatePicker 가 `normalizeDateText` 로 쓰는 규칙과
 * 같은 철학이고, 아래 순수 함수들이 그 패턴이다 — 앱은 함수만 가져가면 된다.
 *
 * 검증 규칙이 인라인인 이유: 실제 화면이라면 서버 검증과 같은 스키마를 공유하겠지만,
 * 이 데모에는 대응하는 계약이 없다 — 지어내지 않고 손 검증으로 둔다.
 */

const CATEGORY_OPTIONS = [
  { value: 'DEV', label: '개발' },
  { value: 'ESSAY', label: '에세이' },
  { value: 'REVIEW', label: '리뷰' },
];

/** 태그 개수 상한 — 목록 화면의 태그 열이 한 줄에 담아낼 수 있는 한계에서 왔다. */
const MAX_TAGS = 10;

/**
 * 첨부 용량이 허용하는 소수 자릿수. **단위를 아는 건 호출부의 몫이다** —
 * 용량 칸이 단위 목록과 단위별 자릿수를 들고 있으면 단위가 늘 때마다 칸을 고쳐야 한다.
 * 정수 KB 칸이라면 이 값을 넘기지 않으면 된다(기본값 0 = 정수만).
 */
const SIZE_DECIMALS = 2;

/**
 * 태그 문자열 정리 — 소문자화 · 앞뒤 공백 제거 · 빈 항목과 중복 제거.
 * 타이핑은 막지 않는다: 조합 중인 한글이 매 글자 잘려 나가면 태그를 아예 못 친다.
 */
function normalizeTags(text: string): string {
  const seen = new Set<string>();
  for (const raw of text.split(',')) {
    const tag = raw.trim().toLowerCase();
    if (tag !== '') seen.add(tag);
  }
  return [...seen].join(', ');
}

/** 개수와 길이만 본다 — 어떤 문자를 허용할지는 태그 사전(서버)의 몫이다. */
function isValidTags(text: string): boolean {
  const tags = normalizeTags(text)
    .split(',')
    .filter((tag) => tag.trim() !== '');
  return (
    tags.length >= 1 && tags.length <= MAX_TAGS && tags.every((tag) => tag.trim().length <= 20)
  );
}

/**
 * 전송값 — 콤마를 뺀 순수 숫자 문자열. 소수점이 여러 개면 첫 개만 남긴다.
 * 표시값(`1,234.5`)과 달리 이 값이 폼에 실려 나간다.
 */
function toSizeValue(text: string): string {
  const [whole = '', ...fraction] = text.replace(/[^0-9.]/g, '').split('.');
  return fraction.length > 0 ? `${whole}.${fraction.join('')}` : whole;
}

/** 표시용 정리 — 정수부에만 천단위 콤마를 붙인다. **소수부는 자르지 않는다.** */
function normalizeSize(text: string): string {
  const value = toSizeValue(text);
  if (value === '') return '';
  const [whole = '', fraction] = value.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/**
 * 용량 검사. `decimals` 를 주지 않으면 **정수만** 허용한다.
 *
 * 자릿수를 정규화가 아니라 여기서 보는 이유: **사용자가 친 값을 조용히 자르지 않기 위해서다.**
 * `1000.555` 를 `1000.55` 로 바꿔 저장하면 잘려나간 사실이 화면 어디에도 남지 않는다.
 * 그래서 값은 그대로 두고 오류 문구로 알린다 — 자르는 쪽이 편하지만, 편한 쪽이
 * 사용자가 모르는 사이에 데이터를 바꾸는 쪽이다.
 */
function isValidSize(text: string, decimals = 0): boolean {
  const value = toSizeValue(text);
  const size = Number(value);
  if (value === '' || !Number.isFinite(size) || size <= 0) return false;
  return (value.split('.')[1] ?? '').length <= decimals;
}

type FormState = {
  subject: string;
  tags: string;
  writtenAt: string;
  category: string;
  fileSize: string;
  summary: string;
  body: string;
};

/** 첨부 용량만 비워 둔다 — 저장을 한 번 누르면 오류 표시가 바로 보인다. */
const INITIAL: FormState = {
  subject: 'Next.js App Router 이행 메모',
  tags: 'nextjs, react, 회고',
  writtenAt: '2026-07-15',
  category: '',
  fileSize: '',
  summary: 'Pages Router 에서 App Router 로 옮기며 겪은 것들을 정리했다.',
  body: '',
};

type FieldName = 'subject' | 'tags' | 'writtenAt' | 'fileSize' | 'summary';

export function FormGridBasicDemo() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const errors = useFieldErrors<FieldName>();
  const formRef = useRef<HTMLFormElement>(null);

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /** 화면값에서 파생된 전송값. hidden 입력과 아래 미리보기가 같은 값을 쓴다. */
  const sizeValue = toSizeValue(form.fileSize);

  /**
   * 검증은 **실제 전송값**(FormData)을 읽는다 — 화면값만 통과하고 전송값은 깨지는
   * 상태를 만들지 않으려면 검사 대상이 실제로 나가는 값이어야 한다.
   */
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const read = (name: string) => String(data.get(name) ?? '').trim();

    const next: Partial<Record<FieldName, string>> = {};

    if (read('subject') === '') next.subject = '제목을 입력해 주세요';

    const tags = read('tags');
    if (tags === '') next.tags = '태그를 하나 이상 입력해 주세요';
    else if (!isValidTags(tags)) next.tags = `태그는 ${MAX_TAGS}개까지, 각 20자 이내입니다`;

    if (read('writtenAt') === '') next.writtenAt = '작성일을 선택해 주세요';

    // 콤마가 빠진 hidden 값이다 — 화면의 `1,234.5` 가 아니라 `1234.5` 를 본다.
    const fileSize = read('fileSize');
    if (fileSize === '') next.fileSize = '첨부 용량을 입력해 주세요';
    else if (!isValidSize(fileSize, SIZE_DECIMALS))
      next.fileSize = `0보다 큰 숫자, 소수점 ${SIZE_DECIMALS}자리까지 입력해 주세요`;

    if (read('summary') === '') next.summary = '요약을 입력해 주세요';

    // setAll 은 오류가 없을 때 true — 오류가 있으면 표시·포커스까지 끝났으니 여기서 멈춘다.
    if (!errors.setAll(next, formRef)) return;
    showToast('저장되었습니다');
  };

  const reset = () => {
    setForm(INITIAL);
    errors.clearAll();
  };

  return (
    <div className="flex flex-col gap-2">
      <form ref={formRef} onSubmit={submit}>
        <Card className="max-w-4xl">
          <CardHeader title="게시글 등록" />

          <FormGrid className="py-2.5">
            <Field {...errors.bind('subject')} label="제목" htmlFor="fg-subject" required>
              <Input
                id="fg-subject"
                name="subject"
                value={form.subject}
                onChange={(event) => set('subject', event.target.value)}
              />
            </Field>

            <Field
              {...errors.bind('tags')}
              label="태그"
              htmlFor="fg-tags"
              required
              help="쉼표로 구분 · 칸을 벗어날 때 소문자·중복 정리"
            >
              <Input
                id="fg-tags"
                name="tags"
                value={form.tags}
                onChange={(event) => set('tags', event.target.value)}
                onBlur={(event) => set('tags', normalizeTags(event.target.value))}
              />
            </Field>

            <Field {...errors.bind('writtenAt')} label="작성일" htmlFor="fg-date" required>
              <DatePicker
                id="fg-date"
                name="writtenAt"
                value={form.writtenAt}
                onValueChange={(value) => set('writtenAt', value)}
              />
            </Field>

            <Field label="카테고리" htmlFor="fg-category">
              <Select
                id="fg-category"
                name="category"
                placeholder="선택"
                options={CATEGORY_OPTIONS}
                value={form.category}
                onValueChange={(value) => set('category', value)}
              />
            </Field>

            <Field label="게시글 ID" htmlFor="fg-postNo">
              <Input id="fg-postNo" lock placeholder="자동 / 저장 시 발급" />
            </Field>

            <Field
              {...errors.bind('fileSize')}
              label="첨부 용량 (MB)"
              htmlFor="fg-size"
              required
              help={`0보다 큰 숫자 · 소수점 ${SIZE_DECIMALS}자리까지`}
            >
              {/* 표시용이라 name 이 없다 — 화면에는 콤마가 있고 전송값에는 없어야 한다.
                  Select 가 커스텀 트리거 뒤에 hidden 을 두는 것과 같은 구조다(select.tsx).
                  DatePicker 가 "입력 자신이 값을 들어 hidden 이 불필요하다"고 적은 것과는
                  반대 사례다 — 날짜는 표시값과 전송값이 같아서 그럴 수 있었다. */}
              <Input
                id="fg-size"
                inputMode="decimal"
                placeholder="0"
                value={form.fileSize}
                onChange={(event) => set('fileSize', event.target.value)}
                onBlur={(event) => set('fileSize', normalizeSize(event.target.value))}
              />
              <input type="hidden" name="fileSize" value={sizeValue} />
            </Field>

            <Field
              {...errors.bind('summary')}
              label="요약"
              htmlFor="fg-summary"
              required
              className="col-span-full"
            >
              <Input
                id="fg-summary"
                name="summary"
                value={form.summary}
                onChange={(event) => set('summary', event.target.value)}
              />
            </Field>

            <Field label="본문" htmlFor="fg-body" className="col-span-full">
              <Textarea
                id="fg-body"
                name="body"
                placeholder="마크다운으로 작성한다"
                value={form.body}
                onChange={(event) => set('body', event.target.value)}
              />
            </Field>
          </FormGrid>

          <div className="flex justify-end gap-1.5 border-t border-dl-divider py-2.5">
            <Button variant="outline-strong" onClick={reset}>
              취소
            </Button>
            <Button type="submit" variant="primary" icon={Save}>
              저장
            </Button>
          </div>
        </Card>
      </form>

      {/* 문서용 표시 — 폼이 실제로 실어 보내는 값이다. 콤마가 빠져 있어야 한다. */}
      <p className="text-dl-xs text-dl-fg-subtle">
        전송값:{' '}
        <code className="font-dl-mono">
          fileSize={sizeValue === '' ? '(비어 있음)' : sizeValue}
        </code>
      </p>
    </div>
  );
}
