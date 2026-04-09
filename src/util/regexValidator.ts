interface LanguageFeature {
  name: string
  namedGroupPattern: RegExp
  namedGroupSyntax: string
  supportedFlags: string[]
  unsupported: string[]
}

interface FeaturePattern {
  pattern: RegExp
  name: string
  supportedIn: string[]
  example: string
}

interface DetectedFeature {
  name: string
  matches: { value: string; index: number }[]
  supportedIn: string[]
  example: string
}

interface CompatibilityWarning {
  type: string
  feature: string
  message: string
  severity: 'info' | 'warning' | 'error'
}

interface CompatibilityResult {
  isJsCompatible: boolean
  canRunInBrowser: boolean
  canConvert: boolean
  convertedPattern: string
  warnings: CompatibilityWarning[]
  detectedFeatures: DetectedFeature[]
}

interface MatchGroup {
  index: number
  value: string | null
  captured: boolean
}

interface MatchResult {
  fullMatch: string
  index: number
  endIndex: number
  groups: MatchGroup[]
  namedGroups: Record<string, string | null>
  hasNamedGroups: boolean
}

interface RegexTestResult {
  success: boolean
  matches: MatchResult[]
  matchCount?: number
  pattern?: string
  flags?: string
  error: string | null
}

interface HighlightSegment {
  text: string
  isMatch: boolean
  matchIndex?: number
  color?: string
  groups?: MatchGroup[]
  namedGroups?: Record<string, string | null>
}

interface SyntaxValidationResult {
  isValid: boolean
  errors?: string[]
  error?: string
}

interface NamedGroup {
  name: string
  fullMatch: string
  index: number
  position: number
}

interface SupportedLanguage {
  id: string
  name: string
  namedGroupSyntax: string
  supportedFlags: string[]
}

interface ExamplePattern {
  name: string
  pattern: string
  testString: string
}

const LANGUAGE_FEATURES: Record<string, LanguageFeature> = {
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

const FEATURE_PATTERNS: Record<string, FeaturePattern> = {
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

export const HIGHLIGHT_COLORS: string[] = [
  '#ffeb3b', // yellow
  '#4caf50', // green
  '#2196f3', // blue
  '#ff9800', // orange
  '#e91e63', // pink
  '#9c27b0', // purple
  '#00bcd4', // cyan
  '#8bc34a'  // light green
]

export const getSupportedLanguages = (): SupportedLanguage[] => {
  return Object.entries(LANGUAGE_FEATURES).map(([id, config]) => ({
    id,
    name: config.name,
    namedGroupSyntax: config.namedGroupSyntax,
    supportedFlags: config.supportedFlags
  }))
}

export const detectLanguageFeatures = (pattern: string): Record<string, DetectedFeature> => {
  if (!pattern) return {}

  const detected: Record<string, DetectedFeature> = {}

  Object.entries(FEATURE_PATTERNS).forEach(([featureKey, featureConfig]) => {
    const matches = [...pattern.matchAll(featureConfig.pattern)]
    if (matches.length > 0) {
      detected[featureKey] = {
        name: featureConfig.name,
        matches: matches.map(m => ({
          value: m[0],
          index: m.index!
        })),
        supportedIn: featureConfig.supportedIn,
        example: featureConfig.example
      }
    }
  })

  return detected
}

export const analyzeCompatibility = (pattern: string, targetLanguage: string): CompatibilityResult => {
  if (!pattern) {
    return {
      isJsCompatible: true,
      canRunInBrowser: true,
      canConvert: false,
      convertedPattern: '',
      warnings: [],
      detectedFeatures: []
    }
  }

  const detectedFeatures = detectLanguageFeatures(pattern)
  const warnings: CompatibilityWarning[] = []
  let canRunInBrowser = true
  let canConvert = false
  let convertedPattern = pattern

  const jsUnsupported = LANGUAGE_FEATURES.javascript.unsupported

  Object.entries(detectedFeatures).forEach(([featureKey, featureData]) => {
    if (featureKey === 'pythonNamedGroups') {
      warnings.push({
        type: 'conversion',
        feature: featureData.name,
        message: `${featureData.name}은 JavaScript 형식 (?<name>...)으로 변환되어 브라우저에서 실행됩니다.`,
        severity: 'info'
      })
      convertedPattern = convertPythonToJsPattern(pattern)
      canConvert = true
      return
    }

    if (!jsUnsupported.includes(featureKey)) {
      return
    }

    if (featureKey === 'inlineModifiers') {
      warnings.push({
        type: 'unsupported',
        feature: featureData.name,
        message: `${featureData.name}은 JavaScript에서 직접 실행되지 않습니다. 플래그로 대체하세요.`,
        severity: 'warning'
      })
      canRunInBrowser = false
      return
    }

    warnings.push({
      type: 'unsupported',
      feature: featureData.name,
      message: `${featureData.name}은 JavaScript에서 지원되지 않습니다. (${featureData.supportedIn.join(', ')}에서만 지원)`,
      severity: 'error'
    })
    canRunInBrowser = false
  })

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
    isJsCompatible: canRunInBrowser && !canConvert,
    canRunInBrowser,
    canConvert,
    convertedPattern,
    warnings,
    detectedFeatures: Object.values(detectedFeatures)
  }
}

export const convertPythonToJsPattern = (pattern: string): string => {
  if (!pattern) return ''

  return pattern.replace(/\(\?P<([a-zA-Z_][a-zA-Z0-9_]*)>/g, '(?<$1>')
}

export const parseNamedGroups = (pattern: string, language: string = 'javascript'): NamedGroup[] => {
  if (!pattern) return []

  const langConfig = LANGUAGE_FEATURES[language]
  if (!langConfig) return []

  const namedGroups: NamedGroup[] = []
  const regex = new RegExp(langConfig.namedGroupPattern.source, 'g')
  let match: RegExpExecArray | null

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

export const executeRegexTest = (pattern: string, testString: string, flags: Record<string, boolean> = { g: true }, language: string = 'javascript'): RegexTestResult => {
  if (!pattern) {
    return { success: false, matches: [], error: '패턴을 입력하세요.' }
  }

  try {
    let jsPattern = pattern
    if (language === 'python') {
      jsPattern = convertPythonToJsPattern(pattern)
    }

    const flagString = Object.entries(flags)
      .filter(([, enabled]) => enabled)
      .map(([flag]) => flag)
      .join('')

    const regex = new RegExp(jsPattern, flagString)

    const matches: MatchResult[] = []

    if (flags.g) {
      let match: RegExpExecArray | null
      while ((match = regex.exec(testString)) !== null) {
        matches.push(formatMatchResult(match))
        if (match[0] === '') {
          regex.lastIndex++
        }
      }
    } else {
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
      error: (e as Error).message
    }
  }
}

const formatMatchResult = (match: RegExpExecArray): MatchResult => {
  const groups: MatchGroup[] = []

  for (let i = 1; i < match.length; i++) {
    groups.push({
      index: i,
      value: match[i] !== undefined ? match[i] : null,
      captured: match[i] !== undefined
    })
  }

  const namedGroups: Record<string, string | null> = {}
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

export const getHighlightSegments = (testString: string, matches: MatchResult[]): HighlightSegment[] => {
  if (!testString || !matches || matches.length === 0) {
    return [{ text: testString || '', isMatch: false }]
  }

  const segments: HighlightSegment[] = []
  let lastIndex = 0

  const sortedMatches = [...matches].sort((a, b) => a.index - b.index)

  sortedMatches.forEach((match, matchIndex) => {
    if (match.index > lastIndex) {
      segments.push({
        text: testString.substring(lastIndex, match.index),
        isMatch: false
      })
    }

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

  if (lastIndex < testString.length) {
    segments.push({
      text: testString.substring(lastIndex),
      isMatch: false
    })
  }

  return segments
}

export const validateBasicSyntax = (pattern: string): SyntaxValidationResult => {
  if (!pattern) {
    return { isValid: false, error: '패턴을 입력하세요.' }
  }

  const errors: string[] = []

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

export const EXAMPLE_PATTERNS: ExamplePattern[] = [
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
