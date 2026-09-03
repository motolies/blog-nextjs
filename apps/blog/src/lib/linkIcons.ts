/**
 * 즐겨찾기/플랫폼 링크 아이콘 — 큐레이션 목록과 이름 → 컴포넌트 해석의 단일 진입점.
 *
 * 두 계층으로 나뉜다.
 *  1. **큐레이션 85개**(아래 `LINK_ICON_GROUPS`): named import 로 정적 번들에 들어간다. 공개 홈이
 *     실제로 쓰는 아이콘은 여기 있으므로 홈 번들은 gzip 몇 KB 로 끝난다. 한글 keywords 가 붙어 있어
 *     "어떤 아이콘이 있는지 모르는 사람"도 배포·차트·로그 같은 말로 찾는다.
 *  2. **그 외 lucide 전체(1,700여 개)**: 피커가 `lucideMeta.json` 으로 목록을 보여주고, 렌더는
 *     `lazyLinkIcon.tsx` 가 이름 하나당 청크 하나를 지연 로드한다. 큐레이션에 없는 이름이 실제로
 *     화면에 나올 때만 그 아이콘의 청크(~0.5KB)가 내려온다.
 *
 * `import * as icons from 'lucide-react'` 는 여전히 금지다 — 그 한 줄이 1,702개 전부를 번들에
 * 싣는다(레포 전체에 그런 import 는 한 건도 없다). 전체 목록은 이름만 담은 JSON 으로, 코드는
 * per-icon 동적 import 로만 가져온다. **큐레이션이 곧 공개 홈의 성능 최적화다.**
 *
 * ⚠️ 브랜드 아이콘(Github/Gitlab/Slack/Figma 등 18종)은 넣지 않는다 — lucide 0.576.0 에서 전부
 *    `@deprecated Brand icons ... due to be removed` 다. 여기(정적 import)에 넣으면 메이저 업그레이드
 *    때 컴파일이 깨진다. 피커도 이들을 숨긴다. DB 에 이미 있는 값은 지연 경로로 렌더되다가 lucide 가
 *    제거하면 조용히 Link2 폴백이 된다. GitHub 링크에는 GitBranch/FolderGit2 를 쓴다.
 *
 * 아이콘을 추가할 때는 keywords 에 **한글 검색어**를 꼭 넣는다. 영어 이름·태그 검색은 전체 목록이
 * 이미 해 주므로, 이 목록의 존재 이유는 한글로 찾히는 것뿐이다.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Archive,
  BellRing,
  Blocks,
  BookOpen,
  Bot,
  Boxes,
  Braces,
  Bug,
  Cable,
  CalendarDays,
  ChartArea,
  ChartColumn,
  ChartLine,
  ChartPie,
  CircleAlert,
  ClipboardList,
  Cloud,
  CloudCog,
  Code,
  Cog,
  Container,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  Factory,
  FileClock,
  FileCode,
  FileText,
  Flame,
  FlaskConical,
  FolderCode,
  FolderGit2,
  Gauge,
  GitBranch,
  GitPullRequest,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Link2,
  ListChecks,
  Lock,
  Mail,
  MemoryStick,
  MessageSquare,
  MonitorCog,
  Network,
  NotebookText,
  Package,
  Plug,
  Puzzle,
  Radar,
  Rocket,
  Route,
  Router,
  Save,
  Scan,
  ScrollText,
  Search,
  Server,
  ServerCog,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Ship,
  SignalHigh,
  Siren,
  SquareTerminal,
  Star,
  Table2,
  Telescope,
  Terminal,
  TrendingUp,
  TriangleAlert,
  Users,
  Vault,
  Warehouse,
  Waypoints,
  Webhook,
  Wifi,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react';
import { getLazyLinkIcon } from './lazyLinkIcon';

export interface LinkIconEntry {
  /** DB(`attributes.icon`)에 저장되는 값 = lucide 컴포넌트 이름 그대로. 별칭 레이어를 두지 않는다. */
  readonly name: string;
  readonly icon: LucideIcon;
  /** 피커 검색어. 영어 이름으로는 안 걸리는 한글 표현을 담는다. */
  readonly keywords: string;
}

export interface LinkIconGroup {
  readonly title: string;
  readonly icons: readonly LinkIconEntry[];
}

export const LINK_ICON_GROUPS: readonly LinkIconGroup[] = [
  {
    title: '배포 · CI',
    icons: [
      { name: 'Rocket', icon: Rocket, keywords: '배포 발사 로켓 릴리스' },
      { name: 'Ship', icon: Ship, keywords: '배포 선박 아르고 argocd' },
      { name: 'Workflow', icon: Workflow, keywords: '워크플로 파이프라인 액션 actions' },
      { name: 'GitBranch', icon: GitBranch, keywords: '깃 브랜치 저장소 github' },
      { name: 'GitPullRequest', icon: GitPullRequest, keywords: '깃 풀리퀘스트 PR 머지' },
      { name: 'FolderGit2', icon: FolderGit2, keywords: '깃 저장소 리포 github gitlab' },
      { name: 'Container', icon: Container, keywords: '컨테이너 도커 docker' },
      { name: 'Boxes', icon: Boxes, keywords: '쿠버네티스 k8s 클러스터 상자' },
      { name: 'Package', icon: Package, keywords: '패키지 아티팩트 레지스트리 상자' },
      { name: 'Layers', icon: Layers, keywords: '레이어 계층 스택' },
      { name: 'Blocks', icon: Blocks, keywords: '블록 모듈 구성요소' },
    ],
  },
  {
    title: '관측 · 지표',
    icons: [
      { name: 'Activity', icon: Activity, keywords: '관측 모니터링 활동 그라파나 grafana' },
      { name: 'ChartLine', icon: ChartLine, keywords: '차트 선그래프 지표 그라파나 grafana' },
      { name: 'ChartArea', icon: ChartArea, keywords: '차트 영역그래프 지표' },
      { name: 'ChartColumn', icon: ChartColumn, keywords: '차트 막대그래프 통계' },
      { name: 'ChartPie', icon: ChartPie, keywords: '차트 원그래프 파이 비율' },
      { name: 'Gauge', icon: Gauge, keywords: '게이지 계기판 성능 대시보드' },
      { name: 'Radar', icon: Radar, keywords: '레이더 탐지 감시' },
      { name: 'TrendingUp', icon: TrendingUp, keywords: '추세 상승 트래픽 성장' },
      { name: 'Eye', icon: Eye, keywords: '관찰 조회수 감시' },
      { name: 'Telescope', icon: Telescope, keywords: '관측 망원경 탐색' },
    ],
  },
  {
    title: '알림 · 장애',
    icons: [
      { name: 'BellRing', icon: BellRing, keywords: '알림 벨 경보 알람' },
      { name: 'Siren', icon: Siren, keywords: '사이렌 긴급 온콜 장애' },
      { name: 'TriangleAlert', icon: TriangleAlert, keywords: '경고 주의 알럿' },
      { name: 'CircleAlert', icon: CircleAlert, keywords: '경고 오류 알럿' },
      { name: 'Flame', icon: Flame, keywords: '불 핫딜 급함 장애' },
      { name: 'Bug', icon: Bug, keywords: '버그 오류 센트리 sentry glitchtip' },
    ],
  },
  {
    title: '데이터 · 저장',
    icons: [
      { name: 'Database', icon: Database, keywords: '데이터베이스 DB 저장소' },
      { name: 'HardDrive', icon: HardDrive, keywords: '디스크 저장장치 스토리지' },
      { name: 'MemoryStick', icon: MemoryStick, keywords: '메모리 램 레디스 redis 캐시' },
      { name: 'Archive', icon: Archive, keywords: '보관 아카이브 백업' },
      { name: 'Table2', icon: Table2, keywords: '테이블 표 데이터' },
      { name: 'Save', icon: Save, keywords: '저장 백업 디스크' },
    ],
  },
  {
    title: '서버 · 인프라',
    icons: [
      { name: 'Server', icon: Server, keywords: '서버 호스트 인프라' },
      { name: 'ServerCog', icon: ServerCog, keywords: '서버 설정 운영 인프라' },
      { name: 'Cloud', icon: Cloud, keywords: '클라우드 AWS GCP' },
      { name: 'CloudCog', icon: CloudCog, keywords: '클라우드 설정 운영' },
      { name: 'Cpu', icon: Cpu, keywords: '시피유 프로세서 자원' },
      { name: 'MonitorCog', icon: MonitorCog, keywords: '모니터 관리 콘솔' },
      { name: 'Factory', icon: Factory, keywords: '공장 빌드 생산' },
      { name: 'Warehouse', icon: Warehouse, keywords: '창고 저장소 레지스트리' },
    ],
  },
  {
    title: '네트워크',
    icons: [
      { name: 'Network', icon: Network, keywords: '네트워크 망 연결' },
      { name: 'Router', icon: Router, keywords: '라우터 공유기 게이트웨이' },
      { name: 'Globe', icon: Globe, keywords: '지구 웹 도메인 사이트' },
      { name: 'Waypoints', icon: Waypoints, keywords: '경로 메시 서비스메시' },
      { name: 'Webhook', icon: Webhook, keywords: '웹훅 연동 후크' },
      { name: 'Wifi', icon: Wifi, keywords: '와이파이 무선 연결' },
      { name: 'SignalHigh', icon: SignalHigh, keywords: '신호 상태 연결' },
      { name: 'Cable', icon: Cable, keywords: '케이블 연결 회선' },
      { name: 'Route', icon: Route, keywords: '라우팅 경로 인그레스' },
    ],
  },
  {
    title: '보안',
    icons: [
      { name: 'ShieldCheck', icon: ShieldCheck, keywords: '보안 방패 인증 통과' },
      { name: 'ShieldAlert', icon: ShieldAlert, keywords: '보안 경고 취약점' },
      { name: 'KeyRound', icon: KeyRound, keywords: '키 열쇠 인증 시크릿' },
      { name: 'Lock', icon: Lock, keywords: '잠금 자물쇠 비밀' },
      { name: 'Vault', icon: Vault, keywords: '금고 볼트 vault 시크릿' },
      { name: 'Scan', icon: Scan, keywords: '스캔 검사 인증' },
    ],
  },
  {
    title: '로그 · 문서',
    icons: [
      { name: 'ScrollText', icon: ScrollText, keywords: '로그 두루마리 로키 loki' },
      { name: 'FileText', icon: FileText, keywords: '문서 파일 텍스트' },
      { name: 'FileClock', icon: FileClock, keywords: '이력 히스토리 로그 시간' },
      { name: 'BookOpen', icon: BookOpen, keywords: '문서 가이드 위키 책' },
      { name: 'NotebookText', icon: NotebookText, keywords: '노트 메모 기록' },
      { name: 'ClipboardList', icon: ClipboardList, keywords: '목록 클립보드 이슈 지라 jira' },
      { name: 'ListChecks', icon: ListChecks, keywords: '체크리스트 할일 작업' },
    ],
  },
  {
    title: '개발 · 도구',
    icons: [
      { name: 'Terminal', icon: Terminal, keywords: '터미널 콘솔 셸' },
      { name: 'SquareTerminal', icon: SquareTerminal, keywords: '터미널 콘솔 명령' },
      { name: 'Code', icon: Code, keywords: '코드 개발 소스' },
      { name: 'FileCode', icon: FileCode, keywords: '코드 파일 소스' },
      { name: 'FolderCode', icon: FolderCode, keywords: '코드 폴더 저장소' },
      { name: 'Braces', icon: Braces, keywords: '중괄호 JSON 설정' },
      { name: 'Wrench', icon: Wrench, keywords: '도구 설정 수리' },
      { name: 'FlaskConical', icon: FlaskConical, keywords: '실험 테스트 플라스크' },
      { name: 'Cog', icon: Cog, keywords: '설정 톱니 환경' },
      { name: 'Settings', icon: Settings, keywords: '설정 환경 옵션' },
      { name: 'Puzzle', icon: Puzzle, keywords: '플러그인 퍼즐 확장' },
      { name: 'Plug', icon: Plug, keywords: '연동 플러그 통합' },
    ],
  },
  {
    title: '협업 · 기타',
    icons: [
      { name: 'Users', icon: Users, keywords: '사용자 팀 계정 사람' },
      { name: 'MessageSquare', icon: MessageSquare, keywords: '메시지 채팅 슬랙 slack' },
      { name: 'Mail', icon: Mail, keywords: '메일 이메일 편지' },
      { name: 'CalendarDays', icon: CalendarDays, keywords: '달력 일정 캘린더' },
      { name: 'Bot', icon: Bot, keywords: '봇 자동화 AI' },
      { name: 'Search', icon: Search, keywords: '검색 찾기 돋보기' },
      { name: 'Star', icon: Star, keywords: '별 즐겨찾기 북마크' },
      { name: 'Zap', icon: Zap, keywords: '번개 빠름 트리거' },
      { name: 'Link2', icon: Link2, keywords: '링크 연결 URL' },
      { name: 'ExternalLink', icon: ExternalLink, keywords: '외부 링크 새창 이동' },
    ],
  },
];

/** 이름 → 컴포넌트 조회표. 그룹 목록에서 파생하므로 두 곳이 어긋날 일이 없다. */
const ICON_BY_NAME: ReadonlyMap<string, LucideIcon> = new Map(
  LINK_ICON_GROUPS.flatMap((group) => group.icons).map((entry) => [entry.name, entry.icon]),
);

/** 알 수 없는 이름을 만났을 때 대신 그릴 아이콘. "링크 모양"이 곧 오타 신호다. */
export const LINK_ICON_FALLBACK: LucideIcon = Link2;

/** 목록에 등록된 아이콘 이름 전체 — lucide 를 import 하지 않고 검증하려는 테스트를 위해 노출한다. */
export const LINK_ICON_NAMES: readonly string[] = LINK_ICON_GROUPS.flatMap((group) =>
  group.icons.map((entry) => entry.name),
);

/**
 * 저장된 아이콘 이름을 컴포넌트로 해석한다. **세 경우를 구분하는 것이 이 함수의 핵심이다.**
 *
 *  - 값 없음 → `null`. 호출부가 아이콘 자리를 아예 렌더하지 않는다.
 *    기존 공개 즐겨찾기(FAVORITE) 데이터에는 아이콘이 하나도 없다. 여기서 Link2 로 폴백하면
 *    공개 홈의 링크 20여 개가 전부 똑같은 링크 아이콘으로 도배돼 지금보다 나빠진다.
 *  - 큐레이션 이름 → 정적 컴포넌트(동기). 공개 홈이 쓰는 경로라 비용이 0 이다.
 *  - 그 외 이름 → 이름별 lazy 래퍼. lucide 에 있는 이름이면 그 아이콘의 청크를 가져오고, 없는
 *    이름(오타)은 로드 시점에 `LINK_ICON_FALLBACK` 으로 떨어진다. 관리 화면에서도 같은 함수를
 *    쓰므로 링크 모양이 보이면 곧 "이름이 잘못됐다"는 신호가 된다.
 *
 * 반환 타입은 그대로 `LucideIcon` 이라 호출부(LinkRow · PlatformFavoriteSection · LinkGroupCard ·
 * LinkNodeForm)는 어느 계층인지 몰라도 된다.
 */
export function resolveLinkIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return ICON_BY_NAME.get(name) ?? getLazyLinkIcon(name, LINK_ICON_FALLBACK);
}

/**
 * 큐레이션 검색 — 아이콘 이름과 한글 keywords 를 함께 본다. 빈 검색어는 전체를 그대로 돌려준다.
 * keywords 도 소문자로 비교한다 — 'DB' 처럼 대문자로 적힌 약어를 'db' 로 못 찾던 버그가 있었다.
 */
export function filterIconGroups(query: string): readonly LinkIconGroup[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return LINK_ICON_GROUPS;

  return LINK_ICON_GROUPS.map((group) => ({
    title: group.title,
    icons: group.icons.filter(
      (entry) =>
        entry.name.toLowerCase().includes(normalized) ||
        entry.keywords.toLowerCase().includes(normalized),
    ),
  })).filter((group) => group.icons.length > 0);
}
