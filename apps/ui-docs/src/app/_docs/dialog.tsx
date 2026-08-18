import type { ConfirmOptions, ContentDialog, PickerDialog } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { ConfirmDemo } from '../../client/ui-test/docs/demos/dialog/confirm';
import { ContentPickerDemo } from '../../client/ui-test/docs/demos/dialog/content-picker';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { useConfirm } from '@hvy/ui';   // ConfirmProvider 가 앱을 감싸는 전제

const askConfirm = useConfirm();
const ok = await askConfirm({
  message: '선택한 2건을 삭제하시겠습니까?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  destructive: true,
});`;

/** 모달 3유형 문서 — 확인(알림형) · 콘텐츠 · 선택. 유형마다 규격이 다르다. */
export const dialogDoc: DocEntry = {
  slug: 'dialog',
  category: 'components',
  title: 'Dialog',
  description:
    '모달 3유형 — 확인(useConfirm, 폭 500 고정)·콘텐츠(보는 창)·선택(고르는 창)은 규격이 다르다. 확인 모달의 버튼 위계는 취소 outline-strong + 확인 primary(파괴적이면 outline-red)이고, 선택 모달만 Esc·딤 클릭을 받지 않는다 — 실수로 고른 것을 잃는 경로를 좁힌다. 브라우저 confirm()/alert() 는 금지다(no-native-dialog).',
  usage: USAGE,
  examples: [
    {
      id: 'confirm',
      title: '확인 모달 (useConfirm)',
      note: '결과를 await 로 받는다. 모달이 이미 열려 있으면 두 번째 요청은 거절된다 — 모달 위에 모달을 겹치지 않는다.',
      file: 'src/client/ui-test/docs/demos/dialog/confirm.tsx',
      Component: ConfirmDemo,
    },
    {
      id: 'content-picker',
      title: '콘텐츠 · 선택 모달',
      note: '선택 모달만 Esc·딤 클릭을 받지 않는다. 그리드가 든 선택 모달 실전 조합은 Examples 의 "선택 모달 → 폼 반영" 문서에 있다.',
      file: 'src/client/ui-test/docs/demos/dialog/content-picker.tsx',
      Component: ContentPickerDemo,
    },
  ],
  propsTables: [
    {
      title: 'useConfirm — ConfirmOptions',
      rows: definePropRows<ConfirmOptions>()([
        {
          name: 'message',
          type: 'ReactNode',
          required: true,
          description: '확인 문구.',
        },
        {
          name: 'confirmLabel',
          type: 'string',
          required: true,
          description: '확인 버튼 라벨 — "확인"이 아니라 동사(저장·삭제)를 쓴다.',
        },
        {
          name: 'cancelLabel',
          type: 'string',
          description: '취소 버튼 라벨. 생략하면 단일 버튼 알림이 된다.',
        },
        {
          name: 'destructive',
          type: 'boolean',
          description: '파괴적 실행 — 확인 버튼이 outline-red 가 된다.',
        },
      ]),
    },
    {
      title: 'ContentDialog',
      rows: definePropRows<ComponentProps<typeof ContentDialog>>()([
        {
          name: 'open',
          type: 'boolean',
          required: true,
          description: 'controlled 열림 상태.',
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          required: true,
          description: '열림 상태 변경 콜백.',
        },
        {
          name: 'title',
          type: 'ReactNode',
          required: true,
          description: '20px 제목 — 무엇을 보는 자리인지 알린다.',
        },
        {
          name: 'description',
          type: 'ReactNode',
          description: '제목 아래 보조 설명.',
        },
        {
          name: 'size',
          type: "'md' | 'lg' | 'xl' | 'full'",
          defaultValue: "'md'",
          description: '모달 폭 단계.',
        },
        {
          name: 'footer',
          type: 'ReactNode',
          description: '푸터 버튼 — 폭 220 고정(QA).',
        },
      ]),
    },
    {
      title: 'PickerDialog',
      rows: definePropRows<ComponentProps<typeof PickerDialog>>()([
        {
          name: 'open',
          type: 'boolean',
          required: true,
          description: 'controlled 열림 상태. Esc·딤 클릭으로는 닫히지 않는다.',
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          required: true,
          description: '열림 상태 변경 콜백 — 닫기는 버튼으로만.',
        },
        {
          name: 'title',
          type: 'ReactNode',
          required: true,
          description: '모달 제목.',
        },
        {
          name: 'footer',
          type: 'ReactNode',
          description: '닫기·등록 버튼 자리.',
        },
      ]),
    },
  ],
};
