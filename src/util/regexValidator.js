/**
 * 정규식 테스터 유틸리티
 * JavaScript, Java, C#, Python 정규식 패턴 검증 및 테스트
 */

/**
 * 지원 언어별 정규식 특성 정의
 */
const LANGUAGE_FEATURES = {
  javascript: {
    name: 'JavaScript',
    namedGroupPattern: /\(\?<([a-zA-Z_][a-zA-Z0-9_]*)>/g,
    namedGroupSyntax: '(?<name>...)',
    supportedFlags: ['g', 'i', 'm', 's', 'u', 'y'],
    unsupported: ['possessiveQuantifiers', 'atomicGroups', 'balancingGroups', 'inlineModifiers']
  },
  java: {
    name: 'Java',
    namedGroupPattern: /\(\?<([a-zA-Z_][a-zA-Z0-9_]*)>/g,
    namedGroupSyntax: '(?<name>...)',
    supportedFlags: ['i', 'm', 's', 'u', 'x', 'd'],
    unsupported: ['balancingGroups']
  },
  csharp: {
    name: 'C#',
    namedGroupPattern: /\(\?<([a-zA-Z_][a-zA-Z0-9_]*)>/g,
    namedGroupSyntax: '(?<name>...)',
    supportedFlags: ['i', 'm', 's', 'x', 'n'],
    unsupported: ['possessiveQuantifiers']
  },
  python: {
    name: 'Python',
    namedGroupPattern: /\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/g,
    namedGroupSyntax: '(?P<name>...)',
    supportedFlags: ['i', 'm', 's', 'x', 'a', 'L', 'u'],
    unsupported: ['possessiveQuantifiers', 'atomicGroups', 'balancingGroups']
  }
}

/**
 * 언어별 고유 기능 감지 패턴
 */
const FEATURE_PATTERNS = {
  possessiveQuantifiers: {
    pattern: /[*+?]\+/g,
    name: '소유 수량자 (Possessive Quantifiers)',
    supportedIn: ['java'],
    example: '*+, ++, ?+'
  },
  atomicGroups: {
    pattern: /\(\?>/g,
    name: '원자 그룹 (Atomic Groups)',
    supportedIn: ['java', 'csharp'],
    example: '(?>...)'
  },
  balancingGroups: {
    pattern: /\(\?<[a-zA-Z_][a-zA-Z0-9_]*-[a-zA-Z_][a-zA-Z0-9_]*>/g,
    name: '균형 그룹 (Balancing Groups)',
    supportedIn: ['csharp'],
    example: '(?<a-b>...)'
  },
  inlineModifiers: {
    pattern: /\(\?[imsx]+\)/g,
    name: '인라인 수정자 (Inline Modifiers)',
    supportedIn: ['java', 'csharp', 'python'],
    example: '(?i), (?m), (?s)'
  },
  pythonNamedGroups: {
    pattern: /\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/g,
    name: 'Python Named Groups',
    supportedIn: ['python'],
    example: '(?P<name>...)'
  }
}

/**
 * 매칭 결과 하이라이트 색상
 */
export const HIGHLIGHT_COLORS = [
  '#ffeb3b', // yellow
  '#4caf50', // green
  '#2196f3', // blue
  '#ff9800', // orange
  '#e91e63', // pink
  '#9c27b0', // purple
  '#00bcd4', // cyan
  '#8bc34a'  // light green
]

/**
 * 지원 언어 목록 반환
 *
 * @returns {Array} 언어 정보 배열
 *
 * @example
 * getSupportedLanguages()
 * // [{ id: 'javascript', name: 'JavaScript', namedGroupSyntax: '(?<name>...)' }, ...]
 */
export const getSupportedLanguages = () => {
  return Object.entries(LANGUAGE_FEATURES).map(([id, config]) => ({
    id,
    name: config.name,
    namedGroupSyntax: config.namedGroupSyntax,
    supportedFlags: config.supportedFlags
  }))
}

/**
 * 정규식 패턴에서 언어별 고유 기능 감지
 *
 * @param {string} pattern - 정규식 패턴
 * @returns {Object} 감지된 기능 목록
 *
 * @example
 * detectLanguageFeatures('(?<name>\\w+)+')
 * // { possessiveQuantifiers: [], atomicGroups: [], ... }
 */
export const detectLanguageFeatures = (pattern) => {
  if (!pattern) return {}

  const detected = {}

  Object.entries(FEATURE_PATTERNS).forEach(([featureKey, featureConfig]) => {
    const matches = [...pattern.matchAll(featureConfig.pattern)]
    if (matches.length > 0) {
      detected[featureKey] = {
        name: featureConfig.name,
        matches: matches.map(m => ({
          value: m[0],
          index: m.index
        })),
        supportedIn: featureConfig.supportedIn,
        example: featureConfig.example
      }
    }
  })

  return detected
}

/**
 * 정규식 패턴의 언어별 호환성 분석
 *
 * @param {string} pattern - 정규식 패턴
 * @param {string} targetLanguage - 대상 언어 ('javascript'|'java'|'csharp'|'python')
 * @returns {Object} 호환성 분석 결과
 *
 * @example
 * analyzeCompatibility('(?P<name>\\w+)', 'javascript')
 * // { isJsCompatible: false, warnings: [...], canConvert: true }
 */
export const analyzeCompatibility = (pattern, targetLanguage) => {
  if (!pattern) {
    return { isJsCompatible: true, warnings: [], detectedFeatures: [] }
  }

  const detectedFeatures = detectLanguageFeatures(pattern)
  const warnings = []
  let isJsCompatible = true
  let canConvert = true
  let convertedPattern = pattern

  // JavaScript 비호환 기능 검사
  const jsUnsupported = LANGUAGE_FEATURES.javascript.unsupported

  Object.entries(detectedFeatures).forEach(([featureKey, featureData]) => {
    if (jsUnsupported.includes(featureKey)) {
      if (featureKey === 'pythonNamedGroups') {
        // Python named groups는 JavaScript로 변환 가능
        warnings.push({
          type: 'conversion',
          feature: featureData.name,
          message: `${featureData.name}은 JavaScript 형식 (?<name>...)으로 변환됩니다.`,
          severity: 'info'
        })
        convertedPattern = convertPythonToJsPattern(pattern)
      } else if (featureKey === 'inlineModifiers') {
        // 인라인 수정자는 플래그로 대체 가능한 경우도 있음
        warnings.push({
          type: 'unsupported',
          feature: featureData.name,
          message: `${featureData.name}은 JavaScript에서 지원되지 않습니다. 플래그로 대체하세요.`,
          severity: 'warning'
        })
        isJsCompatible = false
        canConvert = false
      } else {
        warnings.push({
          type: 'unsupported',
          feature: featureData.name,
          message: `${featureData.name}은 JavaScript에서 지원되지 않습니다. (${featureData.supportedIn.join(', ')}에서만 지원)`,
          severity: 'error'
        })
        isJsCompatible = false
        canConvert = false
      }
    }
  })

  // 대상 언어에서 지원되지 않는 기능 검사
  if (targetLanguage !== 'javascript') {
    const targetUnsupported = LANGUAGE_FEATURES[targetLanguage]?.unsupported || []

    Object.entries(detectedFeatures).forEach(([featureKey, featureData]) => {
      if (targetUnsupported.includes(featureKey)) {
        warnings.push({
          type: 'target_unsupported',
          feature: featureData.name,
          message: `${featureData.name}은 ${LANGUAGE_FEATURES[targetLanguage]?.name || targetLanguage}에서 지원되지 않습니다.`,
          severity: 'warning'
        })
      }
    })
  }

  return {
    isJsCompatible,
    canConvert,
    convertedPattern,
    warnings,
    detectedFeatures: Object.values(detectedFeatures)
  }
}

/**
 * Python named group을 JavaScript 형식으로 변환
 *
 * @param {string} pattern - Python 정규식 패턴
 * @returns {string} JavaScript 호환 패턴
 *
 * @example
 * convertPythonToJsPattern('(?P<year>\\d{4})-(?P<month>\\d{2})')
 * // '(?<year>\\d{4})-(?<month>\\d{2})'
 */
export const convertPythonToJsPattern = (pattern) => {
  if (!pattern) return ''

  // (?P<name>...) -> (?<name>...)
  return pattern.replace(/\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/g, '(?<$1>')
}

/**
 * Named Group 파싱 (언어별)
 *
 * @param {string} pattern - 정규식 패턴
 * @param {string} language - 언어 ('javascript'|'java'|'csharp'|'python')
 * @returns {Array} Named group 목록
 *
 * @example
 * parseNamedGroups('(?<year>\\d{4})-(?<month>\\d{2})', 'javascript')
 * // [{ name: 'year', index: 0 }, { name: 'month', index: 1 }]
 */
export const parseNamedGroups = (pattern, language = 'javascript') => {
  if (!pattern) return []

  const langConfig = LANGUAGE_FEATURES[language]
  if (!langConfig) return []

  const namedGroups = []
  const regex = new RegExp(langConfig.namedGroupPattern.source, 'g')
  let match

  while ((match = regex.exec(pattern)) !== null) {
    namedGroups.push({
      name: match[1],
      fullMatch: match[0],
      index: namedGroups.length,
      position: match.index
    })
  }

  return namedGroups
}

/**
 * JavaScript 정규식으로 테스트 실행 (실제 매칭)
 *
 * @param {string} pattern - 정규식 패턴
 * @param {string} testString - 테스트 문자열
 * @param {Object} flags - 정규식 플래그 객체 { g: true, i: false, ... }
 * @param {string} language - 원본 언어 (변환이 필요한 경우)
 * @returns {Object} 매칭 결과
 *
 * @example
 * executeRegexTest('(\\d{4})-(\\d{2})-(\\d{2})', '2024-01-15', { g: true })
 * // { success: true, matches: [...], error: null }
 */
export const executeRegexTest = (pattern, testString, flags = { g: true }, language = 'javascript') => {
  if (!pattern) {
    return { success: false, matches: [], error: '패턴을 입력하세요.' }
  }

  try {
    // Python 패턴인 경우 JavaScript로 변환
    let jsPattern = pattern
    if (language === 'python') {
      jsPattern = convertPythonToJsPattern(pattern)
    }

    // 플래그 문자열 생성
    const flagString = Object.entries(flags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag)
      .join('')

    // 정규식 생성
    const regex = new RegExp(jsPattern, flagString)

    // 매칭 실행
    const matches = []

    if (flags.g) {
      // Global 플래그: 모든 매치 찾기
      let match
      while ((match = regex.exec(testString)) !== null) {
        matches.push(formatMatchResult(match))
        // 무한 루프 방지 (빈 문자열 매치 시)
        if (match[0] === '') {
          regex.lastIndex++
        }
      }
    } else {
      // Non-global: 첫 번째 매치만
      const match = regex.exec(testString)
      if (match) {
        matches.push(formatMatchResult(match))
      }
    }

    return {
      success: true,
      matches,
      matchCount: matches.length,
      pattern: jsPattern,
      flags: flagString,
      error: null
    }
  } catch (e) {
    return {
      success: false,
      matches: [],
      matchCount: 0,
      error: e.message
    }
  }
}

/**
 * 매치 결과를 구조화된 형식으로 변환
 *
 * @param {RegExpExecArray} match - 정규식 매치 결과
 * @returns {Object} 구조화된 매치 정보
 */
const formatMatchResult = (match) => {
  const groups = []

  // 인덱스 기반 그룹 (전체 매치 제외)
  for (let i = 1; i < match.length; i++) {
    groups.push({
      index: i,
      value: match[i] !== undefined ? match[i] : null,
      captured: match[i] !== undefined
    })
  }

  // Named groups
  const namedGroups = {}
  if (match.groups) {
    Object.entries(match.groups).forEach(([name, value]) => {
      namedGroups[name] = value !== undefined ? value : null
    })
  }

  return {
    fullMatch: match[0],
    index: match.index,
    endIndex: match.index + match[0].length,
    groups,
    namedGroups,
    hasNamedGroups: Object.keys(namedGroups).length > 0
  }
}

/**
 * 테스트 문자열에서 매치된 부분을 하이라이트 정보와 함께 반환
 *
 * @param {string} testString - 테스트 문자열
 * @param {Array} matches - 매치 결과 배열
 * @returns {Array} 하이라이트 세그먼트 배열
 *
 * @example
 * getHighlightSegments('2024-01-15', matches)
 * // [{ text: '2024-01-15', isMatch: true, matchIndex: 0, color: '#ffeb3b' }]
 */
export const getHighlightSegments = (testString, matches) => {
  if (!testString || !matches || matches.length === 0) {
    return [{ text: testString || '', isMatch: false }]
  }

  const segments = []
  let lastIndex = 0

  // 매치를 인덱스 순으로 정렬
  const sortedMatches = [...matches].sort((a, b) => a.index - b.index)

  sortedMatches.forEach((match, matchIndex) => {
    // 매치 이전의 텍스트
    if (match.index > lastIndex) {
      segments.push({
        text: testString.substring(lastIndex, match.index),
        isMatch: false
      })
    }

    // 매치된 텍스트
    segments.push({
      text: match.fullMatch,
      isMatch: true,
      matchIndex,
      color: HIGHLIGHT_COLORS[matchIndex % HIGHLIGHT_COLORS.length],
      groups: match.groups,
      namedGroups: match.namedGroups
    })

    lastIndex = match.endIndex
  })

  // 마지막 매치 이후의 텍스트
  if (lastIndex < testString.length) {
    segments.push({
      text: testString.substring(lastIndex),
      isMatch: false
    })
  }

  return segments
}

/**
 * 정규식 패턴의 기본 문법 유효성 검사
 *
 * @param {string} pattern - 정규식 패턴
 * @returns {Object} 유효성 검사 결과
 */
export const validateBasicSyntax = (pattern) => {
  if (!pattern) {
    return { isValid: false, error: '패턴을 입력하세요.' }
  }

  const errors = []

  // 괄호 짝 검사
  let parenCount = 0
  let bracketCount = 0
  let braceCount = 0
  let inCharClass = false
  let escaped = false

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = true
      continue
    }

    if (char === '[' && !inCharClass) {
      inCharClass = true
      bracketCount++
    } else if (char === ']' && inCharClass) {
      inCharClass = false
      bracketCount--
    } else if (!inCharClass) {
      if (char === '(') parenCount++
      else if (char === ')') parenCount--
      else if (char === '{') braceCount++
      else if (char === '}') braceCount--
    }
  }

  if (parenCount !== 0) {
    errors.push('괄호가 짝이 맞지 않습니다.')
  }
  if (bracketCount !== 0) {
    errors.push('대괄호가 짝이 맞지 않습니다.')
  }
  if (braceCount !== 0) {
    errors.push('중괄호가 짝이 맞지 않습니다.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 예제 정규식 패턴 목록
 */
export const EXAMPLE_PATTERNS = [
  {
    name: '이메일',
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    testString: 'user@example.com, test.email@domain.co.kr'
  },
  {
    name: '날짜 (Named Groups)',
    pattern: '(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})',
    testString: '2024-01-15, 2023-12-25'
  },
  {
    name: 'URL',
    pattern: 'https?://[\\w.-]+(?:/[\\w./-]*)?',
    testString: 'https://example.com/path, http://test.org'
  },
  {
    name: '전화번호 (한국)',
    pattern: '(?<area>0\\d{1,2})-(?<exchange>\\d{3,4})-(?<number>\\d{4})',
    testString: '02-1234-5678, 010-9876-5432'
  },
  {
    name: 'IPv4 주소',
    pattern: '(?<octet1>\\d{1,3})\\.(?<octet2>\\d{1,3})\\.(?<octet3>\\d{1,3})\\.(?<octet4>\\d{1,3})',
    testString: '192.168.0.1, 10.0.0.255'
  }
]
