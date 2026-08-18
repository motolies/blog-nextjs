/**
 * 문서에 실제로 등장하는 heading 레벨만 오름차순으로 압축해 0부터 시작하는 상대 depth로 변환한다.
 * - 최상위 레벨이 h1이든 h2든 항상 depth 0이 되어 좁은 사이드바에서 좌측 여백을 낭비하지 않는다.
 * - 중간 레벨을 건너뛴 글(h1 → h3)도 단계가 비지 않고 연속된 depth를 갖는다.
 * - maxDepth를 넘는 깊이는 클램프해 목차가 무한정 밀려나지 않게 한다.
 */
export function normalizeHeadingDepths(levels: number[], maxDepth: number): number[] {
    if (levels.length === 0) return []

    const rank = new Map<number, number>()
    Array.from(new Set(levels))
        .sort((a, b) => a - b)
        .forEach((level, index) => rank.set(level, index))

    return levels.map(level => Math.min(rank.get(level) ?? 0, maxDepth))
}
