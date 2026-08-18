'use client';

import {
  Button,
  Card,
  CardHeader,
  Field,
  FormGrid,
  IconButton,
  Input,
  Select,
  showToast,
  Textarea,
} from '@hvy/ui';
import { Save, Search } from 'lucide-react';
import type { FormEvent } from 'react';

/**
 * 섹션이 셋인 긴 폼 — **격자를 나누지 않고 카드를 나눈다.**
 *
 * `FormGrid` 에 섹션 API 가 없는 이유가 여기서 보인다. `dl-form-grid` 는 `auto-fit` 이라
 * 열 수를 **컨테이너 폭**이 정하는데, 폭을 카드가 아니라 **바깥 폼이 쥐므로**(`max-w-4xl`)
 * 세 카드가 같은 폭이 되고 세 격자가 같은 열 수를 뽑는다 — 창을 줄이면 셋이 **동시에**
 * 접힌다. 카드마다 폭을 따로 주면 이 정렬이 조용히 깨지고, 그때 화면은 한 폼이 아니라
 * "격자가 세 벌"처럼 읽힌다.
 *
 * 보내는 사람·받는 사람의 **필드 순서를 같게** 두었다. 열 격자가 같으니 이름·연락처·국가가
 * 두 카드에서 같은 세로선 위에 온다 — 좌우로 대조하며 읽는 폼이라 이게 값이다.
 *
 * `col-span-full` 은 세 가지 이유로만 쓴다:
 *   ① 값이 길다(주소) ② 한 칸에 컨트롤이 여럿이라 220px 트랙에 안 들어간다(박스규격)
 *   ③ 여러 줄이다(배송 요청사항).
 * 우편번호는 컨트롤이 둘(입력+검색)인데도 전폭이 **아니다** — 기준은 컨트롤 개수가 아니라
 * **최소 트랙 폭에 들어가는가**다.
 *
 * 상태를 두지 않는다. 이 예제가 증명하는 것은 배치이고, 배치는 값이 바뀌어도 변하지 않는다.
 * 값 배선·검증은 basic·form-save 예제가 갖는다 — 같은 것을 두 예제가 보여주면 어느 쪽이
 * 정본인지 흐려진다. 칸마다 `name` 이 있어 저장은 `FormData` 로 값을 그대로 읽는다.
 */

const COUNTRY_OPTIONS = [
  { value: 'KR', label: '대한민국' },
  { value: 'US', label: '미국' },
  { value: 'JP', label: '일본' },
  { value: 'CN', label: '중국' },
];

export function FormGridSectionsDemo() {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    showToast(`저장되었습니다 — ${[...data.keys()].length}개 항목`);
  };

  return (
    <form onSubmit={submit}>
      {/* 앱 셸 재현(app-shell 의 main 이 같은 값이다) — 흰 카드끼리는 배경이 갈려야
          세 덩어리로 읽힌다. 폭도 여기 한 곳에서만 정한다. */}
      <div className="flex max-w-4xl flex-col gap-dl-gutter rounded-dl-container bg-dl-canvas p-dl-gutter">
        <Card>
          <CardHeader title="보내는 사람" />
          {/* Card 가 py-2.5, CardHeader 가 mb-3 을 이미 갖는다 — 격자에 여백을 덧대지 않는다. */}
          <FormGrid>
            <Field label="보내는 분" htmlFor="fgs-sender-name" required>
              <Input id="fgs-sender-name" name="senderName" defaultValue="김민준" />
            </Field>
            <Field label="연락처" htmlFor="fgs-sender-phone" required>
              <Input
                id="fgs-sender-phone"
                name="senderPhone"
                inputMode="numeric"
                defaultValue="010-1234-5678"
              />
            </Field>
            <Field label="국가" htmlFor="fgs-sender-country" required>
              <Select
                id="fgs-sender-country"
                name="senderCountry"
                placeholder="선택"
                options={COUNTRY_OPTIONS}
              />
            </Field>
            {/* 컨트롤이 둘인데 전폭이 아니다 — 짧은 입력 + 아이콘 버튼이라 한 트랙에 들어간다.
                `min-w-0` 이 없으면 dl-field 의 width:100% 가 트랙을 밀고 나간다.
                IconButton 기본 size 는 sm(36) 이라 입력(42)과 6px 어긋난다 — md 로 맞춘다. */}
            <Field label="우편번호" htmlFor="fgs-sender-zip">
              <div className="flex items-center gap-1.5">
                <Input
                  id="fgs-sender-zip"
                  name="senderZip"
                  className="min-w-0"
                  defaultValue="06234"
                />
                <IconButton icon={Search} label="우편번호 검색" size="md" />
              </div>
            </Field>
            {/* 값이 길어 한 줄을 다 쓴다 — 열 개수에 묶인 숫자가 아니라 col-span-full 이다. */}
            <Field label="주소" htmlFor="fgs-sender-addr" required className="col-span-full">
              <Input
                id="fgs-sender-addr"
                name="senderAddress"
                defaultValue="서울특별시 강남구 테헤란로 123, 4층"
              />
            </Field>
          </FormGrid>
        </Card>

        <Card>
          <CardHeader title="받는 사람" />
          <FormGrid>
            <Field label="받는 분" htmlFor="fgs-recv-name" required>
              <Input id="fgs-recv-name" name="receiverName" defaultValue="佐藤 健" />
            </Field>
            <Field label="연락처" htmlFor="fgs-recv-phone" required>
              <Input
                id="fgs-recv-phone"
                name="receiverPhone"
                inputMode="numeric"
                defaultValue="81-3-1234-5678"
              />
            </Field>
            <Field label="국가" htmlFor="fgs-recv-country" required>
              <Select
                id="fgs-recv-country"
                name="receiverCountry"
                placeholder="선택"
                options={COUNTRY_OPTIONS}
              />
            </Field>
            <Field label="우편번호" htmlFor="fgs-recv-zip">
              <Input id="fgs-recv-zip" name="receiverZip" defaultValue="100-0005" />
            </Field>
            <Field label="주소" htmlFor="fgs-recv-addr" required className="col-span-full">
              <Input
                id="fgs-recv-addr"
                name="receiverAddress"
                defaultValue="東京都千代田区丸の内1-9-1 グラントウキョウ 12F"
              />
            </Field>
            {/* 여러 줄이라 전폭이다 — 한 트랙(220px)이면 두세 단어마다 줄이 바뀐다. */}
            <Field label="배송 요청사항" htmlFor="fgs-recv-memo" className="col-span-full">
              <Textarea
                id="fgs-recv-memo"
                name="deliveryMemo"
                placeholder="부재 시 처리 방법 · 통관 참고사항"
              />
            </Field>
          </FormGrid>
        </Card>

        <Card>
          <CardHeader title="상품 정보" />
          <FormGrid>
            <Field label="품명" htmlFor="fgs-item-name" required>
              <Input id="fgs-item-name" name="itemName" defaultValue="무선 이어폰" />
            </Field>
            <Field label="HS코드" htmlFor="fgs-item-hs" help="6자리">
              <Input id="fgs-item-hs" name="hsCode" inputMode="numeric" defaultValue="851830" />
            </Field>
            <Field label="원산지" htmlFor="fgs-item-origin">
              <Select
                id="fgs-item-origin"
                name="originCountry"
                placeholder="선택"
                options={COUNTRY_OPTIONS}
              />
            </Field>
            <Field label="수량" htmlFor="fgs-item-qty" required>
              <Input id="fgs-item-qty" name="quantity" inputMode="numeric" defaultValue="2" />
            </Field>
            <Field label="중량(kg)" htmlFor="fgs-item-weight" required>
              <Input id="fgs-item-weight" name="weight" inputMode="decimal" defaultValue="0.68" />
            </Field>
            <Field label="신고가격(USD)" htmlFor="fgs-item-price" required>
              <Input
                id="fgs-item-price"
                name="declaredValue"
                inputMode="decimal"
                defaultValue="149.00"
              />
            </Field>
            {/* 한 칸에 컨트롤이 셋이라 전폭이다. 각 입력에 id 를 **직접** 준다 — 생략하면
                셋 다 Field 컨텍스트의 htmlFor 를 물려받아 id 가 중복된다(field.tsx 의
                `overrides.id ?? context.id`). 라벨이 붙지 않는 둘은 aria-label 로 이름을 준다. */}
            <Field
              label="박스규격"
              htmlFor="fgs-item-box-w"
              help="가로 × 세로 × 높이"
              className="col-span-full"
            >
              <div className="flex items-center gap-1.5">
                <Input id="fgs-item-box-w" name="boxWidth" className="min-w-0" defaultValue="30" />
                <span className="shrink-0 text-dl-fg-muted text-dl-sm">×</span>
                <Input
                  id="fgs-item-box-d"
                  name="boxDepth"
                  className="min-w-0"
                  aria-label="세로"
                  defaultValue="20"
                />
                <span className="shrink-0 text-dl-fg-muted text-dl-sm">×</span>
                <Input
                  id="fgs-item-box-h"
                  name="boxHeight"
                  className="min-w-0"
                  aria-label="높이"
                  defaultValue="12"
                />
                <span className="shrink-0 text-dl-fg-muted text-dl-sm">cm</span>
              </div>
            </Field>
          </FormGrid>
        </Card>

        {/* 저장 단위가 폼 전체 하나라서 어느 카드에도 속하지 않는다 — 카드 안에 넣으면
            "이 섹션만 저장"이라는 없는 기능을 암시한다. 카드가 하나뿐인 basic 예제가
            카드 안 하단(border-t)에 둘 수 있었던 것과 갈리는 지점이다. */}
        <div className="flex justify-end gap-1.5">
          <Button variant="outline-strong">취소</Button>
          <Button type="submit" variant="primary" icon={Save}>
            저장
          </Button>
        </div>
      </div>
    </form>
  );
}
