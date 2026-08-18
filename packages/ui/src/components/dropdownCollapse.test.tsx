import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  scanDropdownMenu,
} from './dropdown-menu';
import { textOf } from './dropdownCollapse';

/**
 * 접힘 판정의 전 분기 — **렌더하지 않는다**(엘리먼트 생성만, node 환경).
 * vitest 환경이 node 라 화면은 못 보지만 이 판정은 렌더 전 트리만 보므로 전부 검증된다.
 * 화면 쪽(클릭 발화·포커스 유지·패널 잔존)은 `pnpm dev:docs` 수동 QA 가 맡는다.
 *
 * predicate 를 여기서 다시 적지 않고 `scanDropdownMenu`(실제 배선)를 통과시키는 이유:
 * 다시 적으면 `isItem` 을 Separator 로 잘못 연결하는 식의 **오배선을 못 잡는다**.
 */

/** 트리거 가지 — 여기 든 것은 세지 않아야 한다. */
const TRIGGER = (
  <DropdownMenuTrigger>
    <button type="button">검색 조건 추가</button>
  </DropdownMenuTrigger>
);

/** 실제 사용 형태 그대로 트리거 + 패널을 얹는다. */
function menu(content: ReactNode): ReactNode {
  return (
    <>
      {TRIGGER}
      <DropdownMenuContent>{content}</DropdownMenuContent>
    </>
  );
}

describe('아이템 개수 — 접힐 때와 안 접힐 때', () => {
  it('0개면 접지 않는다', () => {
    const result = scanDropdownMenu(menu(null));
    expect(result.itemCount).toBe(0);
    expect(result.sole).toBeNull();
  });

  it('2개면 접지 않는다', () => {
    const result = scanDropdownMenu(
      menu(
        <>
          <DropdownMenuItem>가</DropdownMenuItem>
          <DropdownMenuItem>나</DropdownMenuItem>
        </>,
      ),
    );
    expect(result.itemCount).toBe(2);
    expect(result.sole).toBeNull();
  });

  it('1개(직속)면 접는다', () => {
    const result = scanDropdownMenu(menu(<DropdownMenuItem>카테고리</DropdownMenuItem>));
    expect(result.itemCount).toBe(1);
    expect(result.sole).not.toBeNull();
  });

  it('map 으로 만든 1개도 접는다 — 배열은 평탄화된다', () => {
    const fields = ['카테고리'];
    const result = scanDropdownMenu(
      menu(fields.map((field) => <DropdownMenuItem key={field}>{field}</DropdownMenuItem>)),
    );
    expect(result.itemCount).toBe(1);
    expect(result.sole?.title).toBe('카테고리');
  });

  it('map 으로 만든 3개는 접지 않는다', () => {
    const fields = ['가', '나', '다'];
    const result = scanDropdownMenu(
      menu(fields.map((field) => <DropdownMenuItem key={field}>{field}</DropdownMenuItem>)),
    );
    expect(result.itemCount).toBe(3);
    expect(result.sole).toBeNull();
  });

  it('조건부로 지워진 아이템은 세지 않는다 — false·null 은 toArray 가 지운다', () => {
    const show = false;
    const result = scanDropdownMenu(
      menu(
        <>
          <DropdownMenuItem>카테고리</DropdownMenuItem>
          {show ? <DropdownMenuItem>상태</DropdownMenuItem> : null}
          {show && <DropdownMenuItem>기간</DropdownMenuItem>}
        </>,
      ),
    );
    expect(result.itemCount).toBe(1);
    expect(result.sole?.title).toBe('카테고리');
  });

  it('Fragment 안 2개를 1개로 오판하지 않는다 — toArray 는 Fragment 를 펴지 않는다', () => {
    const result = scanDropdownMenu(
      menu(
        <>
          <DropdownMenuItem>가</DropdownMenuItem>
          <DropdownMenuItem>나</DropdownMenuItem>
        </>,
      ),
    );
    expect(result.itemCount).toBe(2);
    expect(result.sole).toBeNull();
  });

  it('여러 겹(Fragment > div) 을 뚫고 1개를 찾아낸다', () => {
    const result = scanDropdownMenu(
      menu(
        <>
          <div className="overflow-y-auto">
            <DropdownMenuItem>카테고리</DropdownMenuItem>
          </div>
          <DropdownMenuSeparator />
        </>,
      ),
    );
    expect(result.itemCount).toBe(1);
    expect(result.sole?.title).toBe('카테고리');
  });

  it('임의 래퍼(스크롤 div) 안 1개도 찾아낸다', () => {
    const result = scanDropdownMenu(
      menu(
        <div className="overflow-y-auto">
          <DropdownMenuItem>카테고리</DropdownMenuItem>
        </div>,
      ),
    );
    expect(result.itemCount).toBe(1);
  });

  it('Separator 는 개수에 들지 않는다', () => {
    const result = scanDropdownMenu(
      menu(
        <>
          <DropdownMenuItem>카테고리</DropdownMenuItem>
          <DropdownMenuSeparator />
        </>,
      ),
    );
    expect(result.itemCount).toBe(1);
    expect(result.sole).not.toBeNull();
  });

  it('트리거 가지 안쪽은 훑지 않는다', () => {
    const result = scanDropdownMenu(
      <>
        <DropdownMenuTrigger>
          <button type="button">
            <DropdownMenuItem>트리거 안에 잘못 든 것</DropdownMenuItem>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>카테고리</DropdownMenuItem>
        </DropdownMenuContent>
      </>,
    );
    expect(result.itemCount).toBe(1);
    expect(result.sole?.title).toBe('카테고리');
  });

  it('컴포넌트가 렌더할 아이템은 보이지 않는다 — 안전 실패(메뉴 유지)', () => {
    function HiddenItems() {
      return <DropdownMenuItem>숨은 아이템</DropdownMenuItem>;
    }
    const result = scanDropdownMenu(menu(<HiddenItems />));
    expect(result.itemCount).toBe(0);
    expect(result.sole).toBeNull();
  });
});

describe('접지 않는 예외 — Label', () => {
  it('Label 이 있으면 아이템이 하나여도 접지 않는다 — 접으면 그 글자가 사라진다', () => {
    const result = scanDropdownMenu(
      menu(
        <>
          <DropdownMenuLabel>정렬</DropdownMenuLabel>
          <DropdownMenuItem>카테고리</DropdownMenuItem>
        </>,
      ),
    );
    expect(result.itemCount).toBe(1);
    expect(result.hasLabel).toBe(true);
    expect(result.sole).toBeNull();
  });
});

describe('발화 정보', () => {
  it('onSelect 를 같은 참조로 넘긴다', () => {
    const onSelect = () => {};
    const result = scanDropdownMenu(
      menu(<DropdownMenuItem onSelect={onSelect}>카테고리</DropdownMenuItem>),
    );
    expect(result.sole?.onSelect).toBe(onSelect);
  });

  it('disabled 아이템이면 disabled 가 true 다', () => {
    const result = scanDropdownMenu(menu(<DropdownMenuItem disabled>카테고리</DropdownMenuItem>));
    expect(result.sole?.disabled).toBe(true);
  });

  it('disabled 를 안 주면 false 다 — undefined 가 새어 나가지 않는다', () => {
    const result = scanDropdownMenu(menu(<DropdownMenuItem>카테고리</DropdownMenuItem>));
    expect(result.sole?.disabled).toBe(false);
  });

  it('중첩된 children 에서도 글자를 뽑아 title 로 쓴다', () => {
    const result = scanDropdownMenu(
      menu(
        <DropdownMenuItem>
          <span>
            <i />
            카테고리
          </span>
        </DropdownMenuItem>,
      ),
    );
    expect(result.sole?.title).toBe('카테고리');
  });

  it('아이콘뿐이면 title 이 undefined 다 — ui 는 문구를 지어내지 않는다', () => {
    const result = scanDropdownMenu(
      menu(
        <DropdownMenuItem>
          <i />
        </DropdownMenuItem>,
      ),
    );
    expect(result.sole).not.toBeNull();
    expect(result.sole?.title).toBeUndefined();
  });
});

describe('textOf', () => {
  it('숫자도 글자로 뽑는다', () => {
    expect(textOf(<span>{3}</span>)).toBe('3');
  });

  it('공백뿐이면 undefined 다', () => {
    expect(textOf(<span> </span>)).toBeUndefined();
  });

  it('깊이 상한을 넘겨도 던지지 않는다', () => {
    let deep: ReactNode = '바닥';
    for (let i = 0; i < 20; i += 1) deep = <span>{deep}</span>;
    expect(() => textOf(deep)).not.toThrow();
  });
});
