import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { withJsonGuard } from './mermaidRenderer';

/** React 가 <html> 에 다는 fiber 처럼, 따라가면 자기 자신으로 돌아오는 참조를 가진 객체를 만든다. */
function createCircular(): Record<string, unknown> {
  const node: Record<string, unknown> = {};
  node.fiber = { stateNode: node };
  return node;
}

describe('withJsonGuard', () => {
  it('task 동안에는 순환 참조 객체가 직렬화에서 빠지고, 끝나면 원래대로 돌아온다', async () => {
    const target = createCircular();
    expect(() => JSON.stringify([target])).toThrow();

    const during = await withJsonGuard(target, async () => JSON.stringify({ parents: [target] }));

    expect(during).toBe('{"parents":[null]}');
    expect(Object.hasOwn(target, 'toJSON')).toBe(false);
    expect(() => JSON.stringify([target])).toThrow();
  });

  it('가드는 열거되지 않아 target 을 순회하는 코드에 보이지 않는다', async () => {
    const target = createCircular();

    const keys = await withJsonGuard(target, async () => Object.keys(target));

    expect(keys).toEqual(['fiber']);
  });

  it('task 가 실패해도 가드를 걷어내고 오류를 그대로 던진다', async () => {
    const target = createCircular();

    await expect(
      withJsonGuard(target, async () => {
        throw new Error('렌더 실패');
      }),
    ).rejects.toThrow('렌더 실패');

    expect(Object.hasOwn(target, 'toJSON')).toBe(false);
  });

  it('겹쳐 실행되면 마지막 task 가 끝날 때까지 가드를 유지한다', async () => {
    const target = createCircular();
    let releaseFirst: () => void = () => undefined;
    const first = withJsonGuard(
      target,
      () =>
        new Promise<void>((resolve) => {
          releaseFirst = resolve;
        }),
    );

    // 나중에 시작한 task 가 먼저 끝나도, 아직 도는 첫 task 를 위해 가드가 남아 있어야 한다
    await withJsonGuard(target, async () => undefined);
    expect(JSON.stringify([target])).toBe('[null]');

    releaseFirst();
    await first;
    expect(Object.hasOwn(target, 'toJSON')).toBe(false);
  });
});

/**
 * 가드는 mermaid 상류 버그(mermaid-js/mermaid#5530)의 임시 우회다. 설치된 mermaid 에서 문제 코드가
 * 사라지면 이 테스트가 실패해, mermaid 를 올린 사람에게 가드를 걷어낼 때가 됐음을 알린다.
 */
describe('mermaid 상류 block 버그 감시', () => {
  it('문제 코드가 남아 있는 동안만 통과한다 — 실패하면 가드 제거를 검토한다', () => {
    const require = createRequire(import.meta.url);
    const chunkDir = path.join(
      path.dirname(require.resolve('mermaid/package.json')),
      'dist/chunks/mermaid.core',
    );
    const stillBroken = readdirSync(chunkDir)
      .filter((name) => /^blockDiagram-.*\.mjs$/.test(name))
      .some((name) =>
        readFileSync(path.join(chunkDir, name), 'utf8').includes('JSON.stringify(child.size)'),
      );

    expect(
      stillBroken,
      '설치된 mermaid 의 block 레이아웃에서 JSON.stringify(child.size) 를 찾지 못했다(상류 수정 또는 청크 구조 변경). ' +
        '가드를 뺀 채 /util/mermaid 의 Block 샘플이 렌더되는지 확인하고, 되면 mermaidRenderer.ts 의 ' +
        'TODO(mermaid-js/mermaid#5530) 안내대로 가드와 이 테스트 파일을 제거한다.',
    ).toBe(true);
  });
});
