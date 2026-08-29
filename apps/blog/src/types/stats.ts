/** 관리자 대시보드 집계 응답 타입 — 백엔드 kr.hvy.blog.modules.stats 의 DTO 와 1:1 대응. */

// ── 콘텐츠 요약 (/api/stats/admin/summary) ────────────────────────────────

export interface PostSummary {
  totalPosts: number;
  publishedPosts: number;
  temporaryPosts: number;
  privatePosts: number;
  totalViews: number;
  /** 실제로 글이 달린 카테고리 수. 전체 카테고리 수(TaxonomySummary.totalCategories)와 다르다. */
  usedCategories: number;
  lastPublishedAt: string | null;
}

export interface TaxonomySummary {
  totalCategories: number;
  totalTags: number;
  usedTags: number;
  unusedTags: number;
  draftCount: number;
  fileCount: number;
  fileTotalSize: number;
}

export interface CategoryDistribution {
  categoryName: string;
  postCount: number;
}

export interface TagDistribution {
  tagName: string;
  postCount: number;
}

/** ⚠️ published_at 이 없어 작성일 기준이다. 화면 라벨도 "작성일 기준"으로 쓸 것. */
export interface MonthlyPostCount {
  month: string;
  postCount: number;
}

export interface StatsSummary {
  posts: PostSummary;
  taxonomy: TaxonomySummary;
  categoryDistribution: CategoryDistribution[];
  tagDistribution: TagDistribution[];
  monthlyPostCounts: MonthlyPostCount[];
}

// ── 트래픽 (/api/stats/admin/traffic) ─────────────────────────────────────

export interface DailyTraffic {
  date: string;
  requestCount: number;
  visitorCount: number;
  postViewCount: number;
}

export interface PopularPost {
  id: number;
  subject: string;
  categoryName: string | null;
  viewCount: number;
}

export interface RecentPopularPost {
  id: number;
  subject: string;
  categoryName: string | null;
  viewCount: number;
  visitorCount: number;
}

export interface RequestUriStat {
  uriPattern: string;
  requestCount: number;
  visitorCount: number;
  avgProcessTime: number;
}

export interface TrafficStats {
  timeZone: string;
  fromDate: string;
  toDate: string;
  dailyTrend: DailyTraffic[];
  todayVisitors: number;
  yesterdayVisitors: number;
  visitorDeltaPercent: number | null;
  todayRequests: number;
  yesterdayRequests: number;
  requestDeltaPercent: number | null;
  todayPostViews: number;
  yesterdayPostViews: number;
  postViewDeltaPercent: number | null;
  popularPostsAllTime: PopularPost[];
  popularPostsRecent: RecentPopularPost[];
  topRequestUris: RequestUriStat[];
  /**
   * 조회수 수집 개시 시각. null 이면 beacon 이 한 건도 안 들어온 것 —
   * "아무도 안 읽었다"와 "아직 측정을 안 한다"를 구분하는 유일한 근거다.
   */
  collectionStartedAt: string | null;
}

// ── 이상 징후 (/api/stats/admin/health) ───────────────────────────────────

export interface RecentError {
  id: string;
  createdAt: string;
  traceId: string | null;
  requestUri: string | null;
  controllerName: string | null;
  methodName: string | null;
  httpMethodType: string | null;
  remoteAddr: string | null;
  processTime: number | null;
  stackTraceHead: string | null;
}

export interface EndpointLatency {
  uriPattern: string;
  httpMethodType: string | null;
  requestCount: number;
  avgProcessTime: number;
  p95ProcessTime: number;
  maxProcessTime: number;
}

/**
 * ⚠️ SUCCESS/FAILURE 가 없는 것은 의도적이다.
 * AbstractScheduler 가 예외를 삼키고 ShedLock 은 실패해도 정상 해제되므로,
 * shedlock 은 "실행했다"만 말하고 "성공했다"는 말하지 않는다.
 */
export type SchedulerHealthState = 'RUNNING' | 'OK' | 'STALE' | 'NEVER_RUN' | 'DISABLED';

export interface SchedulerStatus {
  lockName: string;
  displayName: string;
  cronExpression: string | null;
  lockedAt: string | null;
  lockUntil: string | null;
  lockedBy: string | null;
  expectedIntervalSeconds: number | null;
  secondsSinceLockedAt: number | null;
  state: SchedulerHealthState;
}

export interface ExternalApiStat {
  uriPattern: string;
  httpMethodType: string | null;
  callCount: number;
  failureCount: number;
  avgProcessTime: number;
  lastCalledAt: string | null;
}

export interface HealthStats {
  windowFrom: string;
  windowTo: string;
  windowHours: number;
  recentRequestCount: number;
  recentErrorCount: number;
  recentErrorRate: number | null;
  previousRequestCount: number;
  previousErrorCount: number;
  previousErrorRate: number | null;
  errorCountDeltaPercent: number | null;
  recentErrors: RecentError[];
  slowEndpoints: EndpointLatency[];
  schedulers: SchedulerStatus[];
  externalApiFailures: ExternalApiStat[];
}

// ── 사이드 파이프라인 (/api/stats/admin/pipeline) ─────────────────────────

export interface HotDealSiteStat {
  /**
   * 게시판 행의 PK. 목록 key 는 반드시 이 값을 쓴다 —
   * siteCode 는 스크래퍼 종류라 고유하지 않다(뽐뿌 국내/해외가 같은 PPOMPPU 를 공유).
   */
  siteId: number;
  siteCode: string;
  siteName: string;
  enabled: boolean;
  scrapedCount: number;
  notifiedCount: number;
  lastScrapedAt: string | null;
}

export interface MemoStat {
  activeCount: number;
  deletedCount: number;
  recentCreatedCount: number;
  lastCreatedAt: string | null;
}

export interface JiraStat {
  issueCount: number;
  worklogCount: number;
  lastWorklogAt: string | null;
}

export interface PipelineStats {
  windowFrom: string;
  windowTo: string;
  windowHours: number;
  hotDealSites: HotDealSiteStat[];
  hotDealScrapedCount: number;
  hotDealNotifiedCount: number;
  hotDealNotifiedRatio: number | null;
  hotDealLastScrapedAt: string | null;
  enabledKeywordCount: number;
  memo: MemoStat;
  jira: JiraStat;
}
