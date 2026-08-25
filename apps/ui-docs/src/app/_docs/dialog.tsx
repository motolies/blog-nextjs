import type {
  AlertOptions,
  ConfirmDialog,
  ConfirmOptions,
  ContentDialog,
  PickerDialog,
} from '@hvy/ui';
import type { ComponentProps } from 'react';
import { ConfirmDemo } from '../../client/ui-test/docs/demos/dialog/confirm';
import { DialogConfirmDirectDemo } from '../../client/ui-test/docs/demos/dialog/confirm-direct';
import { DialogContentScrollDemo } from '../../client/ui-test/docs/demos/dialog/content-scroll';
import { DialogPickerDemo } from '../../client/ui-test/docs/demos/dialog/picker';
import { DialogSizeMatrixDemo } from '../../client/ui-test/docs/demos/dialog/size-matrix';
import { DialogStackingDemo } from '../../client/ui-test/docs/demos/dialog/stacking';
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
      id: 'confirm-direct',
      title: 'ConfirmDialog 직접 사용 — 단일 버튼과 접근성 이름',
      note: 'Provider 없이 ConfirmDialog 를 직접 쓰는 경로다 — 이때만 cancelLabel 을 생략해 단일 버튼 알림을 만들 수 있다(useConfirm 은 provider 가 기본 취소 문구를 채워 늘 두 버튼이다). 검증 포인트 — ① 제목 줄이 없다: 무슨 알림인지는 본문 문장이 이미 말하고, 접근성 이름은 confirmLabel 이 sr-only Title 로 맡는다(스크린리더로 확인) ② 본문은 min-height 120 · 가운데 정렬 · 폭 500 고정이라 문장이 짧아도 창이 납작해지지 않는다 ③ 버튼이 폭을 반씩 나눠 가진다(flex-1) — 콘텐츠 모달의 220 고정과 다른 규격이다 ④ destructive 를 켜면 확인 버튼이 outline-red 가 되고 hover 에서 짙은 빨강으로 채워진다(공통 규칙에서 의도적으로 이탈하는 유일한 variant).',
      file: 'src/client/ui-test/docs/demos/dialog/confirm-direct.tsx',
      Component: DialogConfirmDirectDemo,
    },
    {
      id: 'size-matrix',
      title: '콘텐츠 모달 크기 — size 5 × height 3 전수',
      note: '15칸 표에서 아무 칸이나 눌러 그 조합을 연다(열림 상태가 하나뿐이라 구조적으로 겹칠 수 없다). 검증 포인트 — ① 폭과 높이는 직교한다: xl×auto(넓고 짧은 창)와 sm×full(좁고 긴 창)이 둘 다 성립해야 한다 ② auto 는 내용만큼, tall 은 80vh 고정, full 은 화면 가득이다 ③ 어느 조합이든 max-h-[calc(100vh-20px)] 를 넘지 않는다 — 브라우저 창을 세로로 줄여 가며 15칸을 훑어 볼 것 ④ size="full" 은 좌우 10px 만 남긴다: base 에 w-[92vw] 가 남아 있으면 1440 뷰포트에서 1325px 로 잘린다(실제로 났던 사고이자 이 예제가 지키는 회귀다) ⑤ 상단 테마를 compact 로 바꿔도 폭 단계가 무너지지 않는다.',
      file: 'src/client/ui-test/docs/demos/dialog/size-matrix.tsx',
      Component: DialogSizeMatrixDemo,
    },
    {
      id: 'content-scroll',
      title: '콘텐츠 모달 — 본문만 스크롤하는 3단 구조',
      note: '검증 포인트 — ① 본문이 길어도 헤더·푸터는 제자리에 남고 본문만 스크롤된다 ② 제목이 길면 잘리고(truncate) 닫기 버튼을 밀어내지 않는다 ③ description 을 주면 제목 아래 보조 줄이 생기고, 안 주면 Radix 경고를 막는 sr-only Description 이 대신 들어간다 — 콘솔에 Description 경고가 없어야 한다 ④ 푸터 버튼은 폭 220 고정이라 글자 수가 달라도 두 버튼 폭이 같다 ⑤ 헤더·본문·푸터가 모두 같은 흰 표면이다: 본문을 회색 캔버스로 두면 잠금 배경과 한 단 차이라 "비활성"으로 읽힌다 — 안쪽 카드는 배경색이 아니라 보더로 구분되는지 본다.',
      file: 'src/client/ui-test/docs/demos/dialog/content-scroll.tsx',
      Component: DialogContentScrollDemo,
    },
    {
      id: 'picker',
      title: '선택 모달 — 닫는 경로를 좁힌 창',
      note: '검증 포인트 — ① 몇 개 체크한 뒤 Esc 를 눌러도, 딤을 클릭해도 닫히지 않는다 — 체크해 둔 것을 잃는 경로를 헤더 × 와 푸터 닫기 둘로 좁힌 규격이다 ② 우하단을 끌어 창 크기를 바꿀 수 있고 min-width 아래로는 줄어들지 않는다 — 크기 축(size·height)이 없는 이유가 이 리사이즈다(드래그 이동까지 직접 만들면 포커스 트랩·키보드 이동을 다시 만들게 되어 Radix 를 쓰는 의미가 없어진다) ③ 폭 기본 1140 · 높이 80vh ④ Tab 을 계속 눌러 포커스가 창 밖으로 새지 않는지 본다 ⑤ 그리드가 든 실전 조합은 Examples 의 「선택 모달 → 폼 반영」에 있다.',
      file: 'src/client/ui-test/docs/demos/dialog/picker.tsx',
      Component: DialogPickerDemo,
    },
    {
      id: 'stacking',
      title: '겹침 금지 — 모달 위에 모달을 열면',
      note: '콘솔을 열고 확인하는 데모다. 검증 포인트 — ① 열린 모달 안에서 또 모달을 열면 개발 경고가 한 번 뜬다(warnOnce 라 같은 종류는 반복되지 않는다) ② 열린 모달을 리렌더시키는 버튼을 여러 번 눌러도 경고가 늘지 않는다 — 카운트를 렌더 중이 아니라 effect 에서 세기 때문이다. 오탐하는 경고는 곧 무시되는 경고이고, 그러면 진짜 겹침을 못 잡는다 ③ useConfirm 은 이미 열려 있으면 두 번째 요청을 경고 없이 거절한다 — 겹치기를 코드로 막는 쪽이다 ④ StrictMode 이중 마운트에서도 카운트가 균형을 유지한다(cleanup 이 짝을 맞춘다).',
      file: 'src/client/ui-test/docs/demos/dialog/stacking.tsx',
      Component: DialogStackingDemo,
    },
  ],
  propsTables: [
    {
      title: 'ConfirmDialog — 직접 사용',
      rows: definePropRows<ComponentProps<typeof ConfirmDialog>>()([
        {
          name: 'open',
          type: 'boolean',
          required: true,
          description: '열림 상태 — 이 프로젝트에서 모달의 진실은 URL 이다.',
        },
        {
          name: 'onOpenChange',
          type: '(open: boolean) => void',
          required: true,
          description: 'Esc·딤 클릭·닫기 버튼이 함께 부른다.',
        },
        {
          name: 'message',
          type: 'ReactNode',
          required: true,
          description: '본문 문장. 제목 줄이 없으므로 이 문장이 무슨 알림인지를 말한다.',
        },
        {
          name: 'confirmLabel',
          type: 'string',
          required: true,
          description: '확인 버튼 문구 — 동시에 sr-only Title 로 접근성 이름을 맡는다.',
        },
        {
          name: 'cancelLabel',
          type: 'string',
          description:
            '**없으면 단일 버튼 알림형**이 된다 — 직접 사용할 때만 가능한 형태다(useConfirm 은 provider 가 기본값을 채운다).',
        },
        {
          name: 'destructive',
          type: 'boolean',
          description: '확인 버튼이 outline-red 가 된다 — hover 에서 짙은 빨강으로 채워진다.',
        },
        {
          name: 'onConfirm',
          type: '() => void',
          required: true,
          description: '확인 클릭 — 닫기는 호출부가 onOpenChange 로 처리한다.',
        },
      ]),
    },
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
