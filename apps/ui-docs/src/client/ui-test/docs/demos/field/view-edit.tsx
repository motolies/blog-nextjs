'use client';

import {
  Badge,
  Button,
  Checkbox,
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  Field,
  type FieldMode,
  FormGrid,
  FormMode,
  Input,
  MultiSelect,
  NativeSelect,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Textarea,
} from '@hvy/ui';
import { type FormEvent, useState } from 'react';

/**
 * 3모드(edit·view·disabled) — `FormMode` 하나로 폼 전체를 전환한다.
 *
 * 검증 포인트:
 * · 모드를 토글해도 행 높이·격자 열이 튀지 않는다(VALUE_MIN_H_CLASS ↔ FIELD_SIZE_CLASS 파리티)
 * · view: Select 는 code('ko')가 아니라 라벨('한국어') · MultiSelect 는 쉼표 라벨 ·
 *   미선택 칸은 placeholder 가 아니라 **빈칸** · Checkbox/Switch 는 주입된 viewLabels ·
 *   password 는 값 길이와 무관한 고정 ******** · 표시값≠편집값 칸은 Field 의 view 가 덮는다(Badge) ·
 *   NativeSelect 는 view 미지원 — 콘솔 경고 후 편집 렌더를 유지한다(조회는 Select)
 * · disabled: 컨트롤이 남고 비활성 — 값이 FormData 에서 빠진다(네이티브 규약)
 * · 모드를 오가도 값이 남는다 — view 는 입력 DOM 을 없애므로 **이 폼은 제어형**이다.
 *   비제어가 허용되는 것은 disabled 전환뿐(폼 저장·검증 시나리오가 그 예다)
 * · 필드별 예외는 같은 prop — "관리 메모" 칸은 mode="edit" 로 조회 중에도 편집이 열려 있다
 * · [전송값 보기]로 모드별 FormData 차이를 실증한다: edit 전부 · disabled/view 제외
 *   (Switch 는 button 이라 어느 모드에서도 FormData 에 없다)
 *
 * 태그 옵션의 value 와 label 이 일부러 다르다(`a11y` ↔ `접근성`) — 대소문자만 다르면
 * "view 가 코드가 아니라 라벨을 그린다"가 눈에 보이지 않는다.
 */

const LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '일본어' },
  { value: 'en', label: '영어' },
];

const TAG_OPTIONS = [
  { value: 'a11y', label: '접근성' },
  { value: 'design-system', label: '디자인 시스템' },
  { value: 'performance', label: '성능' },
];

const MODES: readonly FieldMode[] = ['edit', 'view', 'disabled'];

export function FieldViewEditDemo() {
  const [mode, setMode] = useState<FieldMode>('edit');
  const [author, setAuthor] = useState('홍길동');
  const [password, setPassword] = useState('secret-1234');
  const [status, setStatus] = useState('발행');
  const [language, setLanguage] = useState('ko');
  const [series, setSeries] = useState(''); // 미선택 유지 — view 의 빈칸 규칙 확인용
  const [tags, setTags] = useState<readonly string[]>(['a11y', 'design-system']);
  const [writtenAt, setWrittenAt] = useState('2026-08-18');
  const [period, setPeriod] = useState({ start: '2026-08-01', end: '2026-08-18' });
  const [publishedAt, setPublishedAt] = useState('2026-08-18 09:30:00');
  const [summary, setSummary] = useState(
    'App Router 로 옮기며 겪은 것들.\n막혔던 지점과 해결 방법을 함께 적었다.',
  );
  const [note, setNote] = useState('편집자만 고치는 칸');
  const [toc, setToc] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [editor, setEditor] = useState('rich');
  const [submitted, setSubmitted] = useState('');

  const showFormData = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = [...new FormData(event.currentTarget).entries()]
      .map(([key, entry]) => `${key}=${String(entry)}`)
      .join(' · ');
    setSubmitted(entries === '' ? '(비어 있음)' : entries);
  };

  return (
    <form onSubmit={showFormData} className="flex w-full flex-col gap-4">
      {/* 모드 토글은 FormMode 밖이다 — 조작 UI 까지 잠그면 view 에서 빠져나올 수 없다. */}
      <div className="flex items-center gap-1.5">
        {MODES.map((entry) => (
          <Button
            key={entry}
            size="sm"
            variant={mode === entry ? 'primary' : 'outline-strong'}
            onClick={() => setMode(entry)}
          >
            {entry}
          </Button>
        ))}
      </div>

      <FormMode value={mode}>
        <FormGrid>
          <Field label="작성자" htmlFor="ve-author" required>
            <Input
              id="ve-author"
              name="author"
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
            />
          </Field>

          <Field label="비밀글 암호" htmlFor="ve-password">
            {/* view 에서 값 길이와 무관한 고정 ******** — 평문도 길이도 노출하지 않는다 */}
            <Input
              id="ve-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {/* 표시값 ≠ 편집값 — 컨트롤은 Badge 를 만들 수 없으니 호출부의 view 가 덮는다 */}
          <Field
            label="게시글 상태"
            htmlFor="ve-status"
            view={<Badge tone="success">{status}</Badge>}
          >
            <Input
              id="ve-status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          </Field>

          <Field label="언어" htmlFor="ve-language">
            <Select
              id="ve-language"
              name="language"
              placeholder="선택"
              options={LANGUAGE_OPTIONS}
              value={language}
              onValueChange={setLanguage}
            />
          </Field>

          <Field label="시리즈" htmlFor="ve-series" help="미선택 — view 에서 빈칸이어야 한다">
            <Select
              id="ve-series"
              name="series"
              placeholder="선택"
              options={[
                { value: 'S01', label: '디자인 시스템 만들기' },
                { value: 'S02', label: '주말의 알고리즘' },
              ]}
              value={series}
              onValueChange={setSeries}
            />
          </Field>

          <Field label="태그" htmlFor="ve-tags">
            <MultiSelect
              id="ve-tags"
              name="tags"
              placeholder="전체"
              options={TAG_OPTIONS}
              value={tags}
              onValueChange={setTags}
            />
          </Field>

          <Field label="작성일" htmlFor="ve-writtenAt">
            <DatePicker
              id="ve-writtenAt"
              name="writtenAt"
              value={writtenAt}
              onValueChange={setWrittenAt}
            />
          </Field>

          <Field label="조회 기간" htmlFor="ve-period" className="col-span-full">
            <DateRangePicker
              start={period.start}
              end={period.end}
              startName="periodStart"
              endName="periodEnd"
              onRangeChange={setPeriod}
            />
          </Field>

          <Field label="발행일시" htmlFor="ve-publishedAt">
            <DateTimePicker
              id="ve-publishedAt"
              name="publishedAt"
              value={publishedAt}
              onValueChange={setPublishedAt}
            />
          </Field>

          {/* NativeSelect 는 view 를 유도할 수 없다(라벨이 children 안) — 콘솔 경고 + 편집 렌더 유지 */}
          <Field label="정렬 기준 (NativeSelect)" htmlFor="ve-sort">
            <NativeSelect id="ve-sort" name="sort" defaultValue="date">
              <option value="date">작성일순</option>
              <option value="views">조회수순</option>
            </NativeSelect>
          </Field>

          <Field label="목차 표시" htmlFor="ve-toc">
            {/* 불리언 → 말 사전을 ui 는 모른다 — viewLabels 를 주입한다. 빼면 콘솔 경고가 뜬다 */}
            <Checkbox
              id="ve-toc"
              name="toc"
              checked={toc}
              onChange={(event) => setToc(event.target.checked)}
              viewLabels={{ on: '표시', off: '숨김' }}
            />
          </Field>

          <Field label="공개" htmlFor="ve-public">
            <Switch
              id="ve-public"
              label="공개"
              checked={isPublic}
              onCheckedChange={setIsPublic}
              viewLabels={{ on: '공개', off: '비공개' }}
            />
          </Field>

          <Field label="편집기" htmlFor="ve-editor">
            <RadioGroup
              id="ve-editor"
              name="editor"
              label="편집기"
              value={editor}
              onValueChange={setEditor}
            >
              <Radio value="rich">리치 텍스트</Radio>
              <Radio value="markdown">마크다운</Radio>
            </RadioGroup>
          </Field>

          {/* 필드별 예외 — 명시 mode 가 FormMode 를 이긴다. 조회 화면에서 이 칸만 편집 */}
          <Field
            label="관리 메모"
            htmlFor="ve-note"
            mode="edit"
            help="mode='edit' 고정 — 조회 중에도 편집"
          >
            <Input
              id="ve-note"
              name="note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>

          <Field label="요약" htmlFor="ve-summary" className="col-span-full">
            <Textarea
              id="ve-summary"
              name="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </Field>
        </FormGrid>
      </FormMode>

      <div className="flex items-center gap-1.5">
        <Button type="submit" variant="outline-primary">
          전송값 보기
        </Button>
      </div>
      {submitted === '' ? null : (
        // 문서용 표시 — 폼이 실제로 실어 보내는 값이다. view 는 전부, disabled 는 잠긴 칸이 빠져야 한다.
        <p className="text-dl-xs text-dl-fg-subtle">
          전송값: <code className="font-dl-mono">{submitted}</code>
        </p>
      )}
    </form>
  );
}
