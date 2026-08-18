import type { AlertOptions, ConfirmOptions, ContentDialog, PickerDialog } from '@hvy/ui';
import type { ComponentProps } from 'react';
import { ConfirmDemo } from '../../client/ui-test/docs/demos/dialog/confirm';
import { ContentPickerDemo } from '../../client/ui-test/docs/demos/dialog/content-picker';
import { type DocEntry, definePropRows } from './types';

const USAGE = `import { useAlert, useConfirm } from '@hvy/ui';   // ConfirmProvider 가 앱을 감싸는 전제

const askConfirm = useConfirm();
const ok = await askConfirm({
  message: '선택한 2건을 삭제하시겠습니까?',
  confirmLabel: '삭제',
  cancelLabel: '취소',
  destructive: true,
});

// 취소가 없는 단일 버튼 알림은 useConfirm 으로 만들 수 없다 — 별도 훅이다.
// 반환 함수는 반드시 showAlert 로 받는다: alert 로 받으면 스코프를 보지 않는
// no-native-dialog 규칙이 지역 변수 호출까지 잡는다.
const showAlert = useAlert();
await showAlert({ message: '저장했습니다.', confirmLabel: '확인' });`;

/** 모달 3유형 문서 — 확인·알림 · 콘텐츠 · 선택. 유형마다 규격이 다르다. */
export const dialogDoc: DocEntry = {
  slug: 'dialog',
  category: 'components',
  title: 'Dialog',
  description:
    '모달 3유형 — 확인(폭 500 고정)·콘텐츠(보는 창)·선택(고르는 창)은 규격이 다르다. 확인 모달의 버튼 위계는 취소 outline-strong + 확인 primary 이고, 파괴적이면 확인이 outline-red 가 되어 hover 에서 짙은 빨강으로 채워진다. 확인창(useConfirm)과 알림창(useAlert)은 한 창을 공유하지만 API 가 갈린다 — 취소가 없는 단일 버튼은 useAlert 로만 만들 수 있다. 선택 모달만 Esc·딤 클릭을 받지 않는다 — 실수로 고른 것을 잃는 경로를 좁힌다. 브라우저 confirm()/alert() 는 금지다(no-native-dialog).',
  usage: USAGE,
  examples: [
    {
      id: 'confirm',
      title: '확인 · 알림 모달 (useConfirm · useAlert)',
      note: '확인은 결과를 await 로 받고(Promise<boolean>), 알림은 읽었다는 사실만 돌려준다(Promise<void>). 파괴적 실행 버튼에 마우스를 올려 삭제 버튼이 짙은 빨강으로 채워지는 것을 확인한다. 모달이 이미 열려 있으면 두 번째 요청은 거절된다 — 모달 위에 모달을 겹치지 않는다.',
      file: 'src/client/ui-test/docs/demos/dialog/confirm.tsx',
      Component: ConfirmDemo,
    },
    {
      id: 'content-picker',
      title: '콘텐츠 · 선택 모달',
      note: '콘텐츠 모달은 폭(size)과 높이(height)가 직교한 2축이라 조합을 눌러 확인한다 — 어느 조합이든 화면(100vh-20px)을 넘지 않는다. 선택 모달에는 크기 축이 없고(리사이즈가 정체성) Esc·딤 클릭도 받지 않는다. 그리드가 든 선택 모달 실전 조합은 Examples 의 "선택 모달 → 폼 반영" 문서에 있다.',
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
          description:
            '취소 버튼 라벨. 생략해도 단일 버튼이 되지 않는다 — 앱이 준 기본 취소 문구가 붙는다. 취소 없는 알림창은 useAlert() 다.',
        },
        {
          name: 'destructive',
          type: 'boolean',
          description:
            '파괴적 실행 — 확인 버튼이 outline-red 가 되고, hover 에서 danger-hover(짙은 빨강)로 채워진다.',
        },
      ]),
    },
    {
      title: 'useAlert — AlertOptions',
      rows: definePropRows<AlertOptions>()([
        {
          name: 'message',
          type: 'ReactNode',
          required: true,
          description: '알릴 문구. 결과는 Promise<void> — 읽었다는 사실만 돌아온다.',
        },
        {
          name: 'confirmLabel',
          type: 'string',
          required: true,
          description:
            '단 하나뿐인 버튼의 라벨. cancelLabel·destructive 는 받지 않는다 — 취소가 없다는 것이 이 API 의 정의다.',
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
          type: "'sm' | 'md' | 'lg' | 'xl' | 'full'",
          defaultValue: "'md'",
          description:
            '모달 폭 — sm/md/lg 는 max-w 단계, xl 이 QA 기본(1140), full 은 좌우 10px 만 남긴다.',
        },
        {
          name: 'height',
          type: "'auto' | 'tall' | 'full'",
          defaultValue: "'auto'",
          description:
            '모달 높이 — auto 는 내용만큼, tall 은 80vh 고정, full 은 화면 가득. 폭과 직교하고, 어느 조합이든 100vh-20px 를 넘지 않는다.',
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
          description: '모달 제목. 크기 축은 없다 — 리사이즈가 이 모달의 정체성이다.',
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
