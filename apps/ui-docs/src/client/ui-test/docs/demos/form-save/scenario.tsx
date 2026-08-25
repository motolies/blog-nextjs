'use client';

import {
  Button,
  DatePicker,
  Field,
  FormMode,
  Input,
  Select,
  showToast,
  Textarea,
  useConfirm,
  useFieldErrors,
} from '@hvy/ui';
import { Save } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

/**
 * 시나리오 2 — 폼 입력 · 검증 · 저장.
 *
 * 검증 포인트: 저장 시 못 채운 칸 **전부에 동시에** 오류 표시 · **첫 오류 칸으로 포커스 이동**
 * (setState 직후 aria-invalid 를 못 찾는 함정을 useFieldErrors 가 카운터로 처리한다) ·
 * 값을 채우면 그 칸의 오류만 즉시 해제 · confirm→toast 연쇄 ·
 * 저장 후 `FormMode('disabled')` 전환 — 이 폼은 **비제어(FormData)** 인데도 값이 보존된다.
 * disabled 모드는 컨트롤이 DOM 에 남기 때문이다(view 모드였다면 입력이 사라져 값이
 * 날아간다 — view↔edit 폼이 제어형이어야 하는 이유. field 문서의 3모드 데모 참조).
 *
 * 검증 규칙이 인라인인 이유: 실제 화면이라면 `packages/contracts` 의 zod 스키마(서버 검증과
 * 같은 것)를 쓰지만, 이 데모는 대응하는 계약이 없다 — 지어내지 않고 손 검증으로 둔다.
 */

const SERVICE_OPTIONS = [
  { value: 'DEV', label: '개발' },
  { value: 'ESSAY', label: '에세이' },
  { value: 'REVIEW', label: '리뷰' },
];

type FieldName = 'author' | 'writtenAt' | 'category';

export function FormSaveScenario() {
  const errors = useFieldErrors<FieldName>();
  const formRef = useRef<HTMLFormElement>(null);
  const askConfirm = useConfirm();
  const [saved, setSaved] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const author = String(data.get('author') ?? '').trim();
    const writtenAt = String(data.get('writtenAt') ?? '').trim();
    const category = String(data.get('category') ?? '').trim();

    const next: Partial<Record<FieldName, string>> = {};
    if (author === '') next.author = '작성자명을 입력해 주세요';
    if (writtenAt === '') next.writtenAt = '작성일을 입력해 주세요';
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(writtenAt))
      next.writtenAt = 'YYYY-MM-DD 형식으로 입력해 주세요';
    if (category === '') next.category = '카테고리를 선택해 주세요';

    // setAll 은 오류가 없을 때 true — 오류가 있으면 표시·포커스까지 끝났으니 여기서 멈춘다.
    if (!errors.setAll(next, formRef)) return;

    const ok = await askConfirm({
      message: '입력한 내용으로 저장하시겠습니까?',
      confirmLabel: '저장',
      cancelLabel: '취소',
    });
    if (!ok) return;

    setSaved(true);
    showToast('저장되었습니다 · 폼이 비활성화되었습니다');
  };

  return (
    <div className="w-full">
      <form ref={formRef} onSubmit={submit} className="flex flex-col gap-4">
        {/**
         * 저장 후 잠금은 폼 수준 상태라 FormMode 하나로 건다 — 예전에는 컨트롤마다
         * lock/disabled 를 손 배선했다(같은 삼항식 3번 + Select 만 다른 prop).
         * 버튼 줄은 FormMode 밖이지만, 안에 있어도 Button 은 모드를 소비하지 않아
         * "다시 편집"이 잠기지 않는다.
         */}
        <FormMode value={saved ? 'disabled' : 'edit'}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
            <Field {...errors.bind('author')} label="작성자명" htmlFor="fs-author" required>
              <Input id="fs-author" name="author" placeholder="작성자명 입력" />
            </Field>

            <Field {...errors.bind('writtenAt')} label="작성일" htmlFor="fs-writtenAt" required>
              <DatePicker id="fs-writtenAt" name="writtenAt" />
            </Field>

            <Field {...errors.bind('category')} label="카테고리" htmlFor="fs-category" required>
              <Select
                id="fs-category"
                name="category"
                placeholder="선택"
                options={SERVICE_OPTIONS}
              />
            </Field>

            <Field label="메모" htmlFor="fs-memo" help="선택 입력 — 검증하지 않는다">
              <Textarea id="fs-memo" name="memo" />
            </Field>
          </div>
        </FormMode>

        <div className="flex items-center gap-1.5">
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            disabled={saved}
            title={saved ? '이미 저장되어 잠겼습니다 — 다시 편집을 누르세요' : undefined}
          >
            저장
          </Button>
          {saved ? (
            <Button
              variant="outline-primary"
              onClick={() => {
                setSaved(false);
                errors.clearAll();
              }}
            >
              다시 편집
            </Button>
          ) : (
            <Button onClick={errors.clearAll}>오류 지우기</Button>
          )}
        </div>
      </form>
    </div>
  );
}
