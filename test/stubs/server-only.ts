/**
 * 테스트용 `server-only` 스텁.
 *
 * 실제 `server-only` 는 서버 컴포넌트 밖에서 import 되면 throw 한다 — 그게 존재 이유다.
 * Vitest 는 Next 런타임이 아니므로 그대로 두면 서버 모듈을 단위 테스트할 수 없다.
 *
 * ⚠️ 이 스텁은 **테스트에서만** 적용된다(`vitest.config.ts` 의 alias).
 * 실제 빌드에서는 원본이 그대로 동작하므로 경계 방어(Layer 1)는 약해지지 않는다.
 */
export {};
