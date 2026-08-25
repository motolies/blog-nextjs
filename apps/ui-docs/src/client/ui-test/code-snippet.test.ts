import { describe, expect, it } from 'vitest';
import { expr, jsxTag } from './code-snippet';

/**
 * 코드 스니펫 규칙의 부패 방지 — Code 탭 전체가 이 함수에 매달려 있다.
 *
 * 여기가 틀리면 화면은 멀쩡한데 코드만 거짓말을 한다. 타입체커도 registry.test 도
 * 못 잡는 실패라 규칙 하나하나를 예시로 못박는다.
 */
describe('jsxTag — 값의 종류별 표기', () => {
  it('undefined · null · false 는 prop 째로 사라진다', () => {
    // 데모가 "기본값은 코드에 안 적는다"를 삼항으로 표현할 수 있는 근거다.
    expect(jsxTag('Button', { size: undefined, tone: null, busy: false })).toBe('<Button />');
  });

  it('true 는 이름만 남는다 (JSX 축약형)', () => {
    expect(jsxTag('Button', { busy: true })).toBe('<Button busy />');
  });

  it('문자열은 큰따옴표, 숫자는 중괄호', () => {
    expect(jsxTag('Input', { size: 'md', maxLength: 20 })).toBe(
      '<Input size="md" maxLength={20} />',
    );
  });

  it('값에 큰따옴표가 있으면 표현식으로 넘어간다', () => {
    expect(jsxTag('Input', { placeholder: '그는 "안녕"이라 했다' })).toBe(
      `<Input placeholder={'그는 "안녕"이라 했다'} />`,
    );
  });

  it('expr() 은 중괄호 표현식이 된다', () => {
    expect(jsxTag('Button', { icon: expr('Save') })).toBe('<Button icon={Save} />');
  });
});

describe('jsxTag — 태그 모양', () => {
  it('children 이 없으면 자기 닫기', () => {
    expect(jsxTag('Spinner', {})).toBe('<Spinner />');
  });

  it('children 이 있으면 여는 태그와 닫는 태그', () => {
    expect(jsxTag('Button', { variant: 'primary' }, '저장')).toBe(
      '<Button variant="primary">저장</Button>',
    );
  });

  it('prop 이 하나도 안 남으면 이름과 닫기 사이에 공백이 겹치지 않는다', () => {
    expect(jsxTag('Button', { busy: false }, '저장')).toBe('<Button>저장</Button>');
  });
});

describe('jsxTag — 줄바꿈', () => {
  it('72자를 넘으면 prop 당 한 줄로 편다', () => {
    const code = jsxTag('MultiSelect', {
      options: expr('TAG_OPTIONS'),
      placeholder: '태그를 고르세요',
      searchThreshold: 10,
      size: 'lg',
      clearable: true,
    });
    expect(code).toBe(
      [
        '<MultiSelect',
        '  options={TAG_OPTIONS}',
        '  placeholder="태그를 고르세요"',
        '  searchThreshold={10}',
        '  size="lg"',
        '  clearable',
        '/>',
      ].join('\n'),
    );
  });

  it('펼친 형태에서도 children 은 닫는 줄에 붙는다', () => {
    const code = jsxTag(
      'Button',
      { variant: 'outline-primary', size: 'xl', icon: expr('Save'), busy: true },
      '변경 사항 저장',
    );
    expect(code).toBe(
      [
        '<Button',
        '  variant="outline-primary"',
        '  size="xl"',
        '  icon={Save}',
        '  busy',
        '>변경 사항 저장</Button>',
      ].join('\n'),
    );
  });

  it('경계값 — 72자 이하는 한 줄로 남는다', () => {
    const code = jsxTag('Input', { size: 'md', placeholder: '제목' });
    expect(code.length).toBeLessThanOrEqual(72);
    expect(code).not.toContain('\n');
  });
});
