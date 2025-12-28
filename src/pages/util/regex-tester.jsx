import React, {useCallback, useMemo, useState} from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import {useSnackbar} from 'notistack'
import {useRouter} from 'next/router'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ClearIcon from '@mui/icons-material/Clear'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  analyzeCompatibility,
  executeRegexTest,
  EXAMPLE_PATTERNS,
  getHighlightSegments,
  getSupportedLanguages,
  HIGHLIGHT_COLORS,
  parseNamedGroups,
  validateBasicSyntax
} from '../../util/regexValidator'

function TabPanel({children, value, index, ...other}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`regex-tabpanel-${index}`}
      aria-labelledby={`regex-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{p: 3}}>{children}</Box>}
    </div>
  )
}

export default function RegexTester() {
  const {enqueueSnackbar} = useSnackbar()
  const router = useRouter()

  // 지원 언어 목록
  const languages = useMemo(() => getSupportedLanguages(), [])

  // 탭/언어 상태
  const [tabValue, setTabValue] = useState(0)
  const language = languages[tabValue]?.id || 'javascript'

  // 입력 상태
  const [pattern, setPattern] = useState('')
  const [testString, setTestString] = useState('')
  const [flags, setFlags] = useState({g: true, i: false, m: false, s: false})

  // 결과 상태
  const [result, setResult] = useState(null)
  const [compatibility, setCompatibility] = useState(null)
  const [syntaxError, setSyntaxError] = useState(null)

  // 탭 변경 핸들러
  const handleTabChange = useCallback((e, newValue) => {
    setTabValue(newValue)
    setResult(null)
    setCompatibility(null)
  }, [])

  // 테스트 실행 핸들러
  const handleTest = useCallback(() => {
    const syntaxResult = validateBasicSyntax(pattern)
    if (!syntaxResult.isValid) {
      setSyntaxError(syntaxResult.errors.join(', '))
      setResult(null)
      setCompatibility(null)
      enqueueSnackbar('정규식 문법 오류가 있습니다.', {variant: 'error'})
      return
    }
    setSyntaxError(null)

    const compatResult = analyzeCompatibility(pattern, language)
    setCompatibility(compatResult)

    if (compatResult.isJsCompatible || compatResult.canConvert) {
      const patternToTest = compatResult.canConvert ? compatResult.convertedPattern : pattern
      const testResult = executeRegexTest(patternToTest, testString, flags, language)

      if (testResult.success) {
        setResult(testResult)
        enqueueSnackbar(`${testResult.matchCount}개의 매치를 찾았습니다.`, {variant: 'success'})
      } else {
        setResult(null)
        setSyntaxError(testResult.error)
        enqueueSnackbar(`정규식 오류: ${testResult.error}`, {variant: 'error'})
      }
    } else {
      setResult(null)
      enqueueSnackbar('이 패턴은 JavaScript에서 실행할 수 없습니다.', {variant: 'warning'})
    }
  }, [pattern, testString, language, flags, enqueueSnackbar])

  // 초기화 핸들러
  const handleClear = useCallback(() => {
    setPattern('')
    setTestString('')
    setResult(null)
    setCompatibility(null)
    setSyntaxError(null)
    setFlags({g: true, i: false, m: false, s: false})
    enqueueSnackbar('초기화되었습니다.', {variant: 'info'})
  }, [enqueueSnackbar])

  // 예제 로드 핸들러
  const handleLoadExample = useCallback((example) => {
    setPattern(example.pattern)
    setTestString(example.testString)
    setResult(null)
    setCompatibility(null)
    setSyntaxError(null)
    enqueueSnackbar(`"${example.name}" 예제를 로드했습니다.`, {variant: 'info'})
  }, [enqueueSnackbar])

  // 복사 핸들러
  const handleCopy = useCallback((text, label) => {
    navigator.clipboard.writeText(text)
    enqueueSnackbar(`${label} 복사됨`, {variant: 'success'})
  }, [enqueueSnackbar])

  // 하이라이트 세그먼트 계산
  const highlightSegments = useMemo(() => {
    if (!result || !result.matches || result.matches.length === 0) {
      return [{text: testString || '', isMatch: false}]
    }
    return getHighlightSegments(testString, result.matches)
  }, [testString, result])

  // Named Groups 파싱
  const namedGroups = useMemo(() => {
    return parseNamedGroups(pattern, language)
  }, [pattern, language])

  // 플래그 토글 핸들러
  const handleFlagChange = useCallback((flag) => (e) => {
    setFlags(prev => ({...prev, [flag]: e.target.checked}))
  }, [])

  return (
    <Box sx={{p: 2}}>
      {/* 헤더 */}
      <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
        <IconButton onClick={() => router.push('/util')} sx={{mr: 1}}>
          <ArrowBackIcon/>
        </IconButton>
        <Typography variant="h4" sx={{fontWeight: 'bold', flex: 1}}>
          정규식 테스터
        </Typography>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon/>}
          onClick={handleTest}
          disabled={!pattern}
          sx={{mr: 1}}
        >
          테스트
        </Button>
        <Button
          variant="outlined"
          startIcon={<ClearIcon/>}
          onClick={handleClear}
        >
          초기화
        </Button>
      </Box>

      {/* 언어 탭 */}
      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{borderBottom: 1, borderColor: 'divider'}}
        >
          {languages.map((lang, idx) => (
            <Tab
              key={lang.id}
              label={
                <Box>
                  {lang.name}
                  <Typography variant="caption" display="block" color="text.secondary">
                    {lang.namedGroupSyntax}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>

        {languages.map((lang, idx) => (
          <TabPanel key={lang.id} value={tabValue} index={idx}>
            <Grid container spacing={3}>
              {/* 왼쪽: 입력 */}
              <Grid item xs={12} md={5}>
                <Stack spacing={3}>
                  {/* 정규식 패턴 입력 */}
                  <Box>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                      <Typography variant="subtitle2" sx={{flex: 1}}>
                        정규식 패턴
                      </Typography>
                      {pattern && (
                        <IconButton size="small" onClick={() => handleCopy(pattern, '패턴')}>
                          <ContentCopyIcon fontSize="small"/>
                        </IconButton>
                      )}
                    </Box>
                    <TextField
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      multiline
                      rows={3}
                      fullWidth
                      placeholder={`예: ${lang.namedGroupSyntax.replace('name', 'year')}\\d{4}`}
                      error={!!syntaxError}
                      helperText={syntaxError || ''}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'D2Coding, monospace'
                        }
                      }}
                    />
                  </Box>

                  {/* 플래그 선택 */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      플래그
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <FormControlLabel
                        control={<Switch checked={flags.g} onChange={handleFlagChange('g')} size="small"/>}
                        label="g (global)"
                      />
                      <FormControlLabel
                        control={<Switch checked={flags.i} onChange={handleFlagChange('i')} size="small"/>}
                        label="i (ignore case)"
                      />
                      <FormControlLabel
                        control={<Switch checked={flags.m} onChange={handleFlagChange('m')} size="small"/>}
                        label="m (multiline)"
                      />
                      <FormControlLabel
                        control={<Switch checked={flags.s} onChange={handleFlagChange('s')} size="small"/>}
                        label="s (dotAll)"
                      />
                    </Stack>
                  </Box>

                  {/* 테스트 문자열 입력 */}
                  <Box>
                    <Box sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                      <Typography variant="subtitle2" sx={{flex: 1}}>
                        테스트 문자열
                      </Typography>
                      {testString && (
                        <IconButton size="small" onClick={() => handleCopy(testString, '테스트 문자열')}>
                          <ContentCopyIcon fontSize="small"/>
                        </IconButton>
                      )}
                    </Box>
                    <TextField
                      value={testString}
                      onChange={(e) => setTestString(e.target.value)}
                      multiline
                      rows={6}
                      fullWidth
                      placeholder="테스트할 문자열을 입력하세요"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontFamily: 'D2Coding, monospace'
                        }
                      }}
                    />
                  </Box>

                  {/* 예제 패턴 */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      예제 패턴
                    </Typography>
                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                      {EXAMPLE_PATTERNS.map((example, idx) => (
                        <Chip
                          key={idx}
                          label={example.name}
                          size="small"
                          onClick={() => handleLoadExample(example)}
                          sx={{cursor: 'pointer'}}
                        />
                      ))}
                    </Box>
                  </Box>
                </Stack>
              </Grid>

              {/* 오른쪽: 결과 */}
              <Grid item xs={12} md={7}>
                {/* 호환성 경고 */}
                {compatibility?.warnings?.length > 0 && (
                  <Box sx={{mb: 2}}>
                    {compatibility.warnings.map((warn, idx) => (
                      <Alert
                        key={idx}
                        severity={warn.severity === 'error' ? 'error' : warn.severity === 'warning' ? 'warning' : 'info'}
                        sx={{mb: 1}}
                      >
                        <Typography variant="body2">
                          <strong>{warn.feature}:</strong> {warn.message}
                        </Typography>
                      </Alert>
                    ))}
                  </Box>
                )}

                {/* 매칭 결과 하이라이트 */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                    <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                      매칭 결과
                      {result && (
                        <Chip
                          label={`${result.matchCount}개`}
                          size="small"
                          color={result.matchCount > 0 ? 'success' : 'default'}
                          sx={{ml: 1}}
                        />
                      )}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        fontFamily: 'D2Coding, monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        bgcolor: 'grey.50',
                        minHeight: 80
                      }}
                    >
                      {highlightSegments.map((segment, idx) => (
                        segment.isMatch ? (
                          <Box
                            key={idx}
                            component="span"
                            sx={{
                              backgroundColor: segment.color,
                              padding: '2px 4px',
                              borderRadius: '3px',
                              fontWeight: 'bold'
                            }}
                            title={`Match ${segment.matchIndex + 1}`}
                          >
                            {segment.text}
                          </Box>
                        ) : (
                          <span key={idx}>{segment.text}</span>
                        )
                      ))}
                      {!testString && (
                        <Typography color="text.secondary" variant="body2">
                          테스트 문자열을 입력하세요
                        </Typography>
                      )}
                    </Paper>
                  </AccordionDetails>
                </Accordion>

                {/* 매치 상세 정보 */}
                {result && result.matches && result.matches.length > 0 && (
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                      <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>매치 상세</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {result.matches.map((match, matchIdx) => (
                          <ListItem
                            key={matchIdx}
                            sx={{bgcolor: 'grey.50', borderRadius: 1, mb: 1}}
                          >
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    label={`#${matchIdx + 1}`}
                                    size="small"
                                    sx={{
                                      bgcolor: HIGHLIGHT_COLORS[matchIdx % HIGHLIGHT_COLORS.length],
                                      fontWeight: 'bold'
                                    }}
                                  />
                                  <Typography component="span" sx={{fontFamily: 'D2Coding, monospace'}}>
                                    "{match.fullMatch}"
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    (index: {match.index}~{match.endIndex})
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleCopy(match.fullMatch, '매치')}
                                  >
                                    <ContentCopyIcon fontSize="small"/>
                                  </IconButton>
                                </Stack>
                              }
                              secondaryTypographyProps={{component: 'div'}}
                              secondary={
                                <Box sx={{mt: 1}}>
                                  {match.groups.length > 0 && (
                                    <Box sx={{mb: 1}}>
                                      <Typography variant="caption" color="text.secondary">그룹:</Typography>
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mt: 0.5}}>
                                        {match.groups.map((group, gIdx) => (
                                          <Chip
                                            key={gIdx}
                                            label={`$${group.index}: ${group.captured ? `"${group.value}"` : '(미캡처)'}`}
                                            size="small"
                                            variant="outlined"
                                            color={group.captured ? 'primary' : 'default'}
                                          />
                                        ))}
                                      </Stack>
                                    </Box>
                                  )}
                                  {match.hasNamedGroups && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary">Named Groups:</Typography>
                                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{mt: 0.5}}>
                                        {Object.entries(match.namedGroups).map(([name, value]) => (
                                          <Chip
                                            key={name}
                                            label={`${name}: "${value}"`}
                                            size="small"
                                            color="secondary"
                                          />
                                        ))}
                                      </Stack>
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Named Groups 정의 */}
                {namedGroups.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                      <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>
                        Named Groups 정의
                        <Chip label={`${namedGroups.length}개`} size="small" color="secondary" sx={{ml: 1}}/>
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {namedGroups.map((group, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip label={`$${group.index + 1}`} size="small" variant="outlined"/>
                                  <Typography sx={{fontFamily: 'D2Coding, monospace', fontWeight: 'bold'}}>
                                    {group.name}
                                  </Typography>
                                </Stack>
                              }
                              secondary={`패턴 내 위치: ${group.position}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* 감지된 기능 */}
                {compatibility?.detectedFeatures?.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                      <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>감지된 특수 기능</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {compatibility.detectedFeatures.map((feature, idx) => (
                          <ListItem key={idx}>
                            <ListItemText
                              primary={feature.name}
                              secondary={
                                <Box>
                                  <Typography variant="caption" display="block">예시: {feature.example}</Typography>
                                  <Typography variant="caption" display="block">지원 언어: {feature.supportedIn.join(', ')}</Typography>
                                  <Stack direction="row" spacing={0.5} sx={{mt: 0.5}}>
                                    {feature.matches.map((m, mIdx) => (
                                      <Chip
                                        key={mIdx}
                                        label={m.value}
                                        size="small"
                                        color="warning"
                                        sx={{fontFamily: 'D2Coding, monospace'}}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* 초기 안내 */}
                {!result && !compatibility && (
                  <Paper variant="outlined" sx={{p: 3, mt: 2, textAlign: 'center'}}>
                    <Typography variant="body1" color="text.secondary">
                      정규식 패턴과 테스트 문자열을 입력한 후
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      <strong>테스트</strong> 버튼을 클릭하세요
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
          </TabPanel>
        ))}
      </Paper>
    </Box>
  )
}
