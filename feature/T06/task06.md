# 지라 스프린트 상세 추가 

- sprint.jsx 의 수정 
- 서머리 차트 또는 표에서 세부 내용을 추가로 조회할 수 있음 
    - 스프린트 명을 눌렀을 때 `GET /api/jira/admin/sprint/2025-SP-18{스프린트명}`
    - 스프린트 중에서 작업자 부분을 눌렀을 때 `GET /api/jira/admin/sprint/2025-SP-18?worker=안창규`
    - 를 조회하여 화면에 테이블 형태로 (mui x data grid) 서머리 테이블 아래에 표현한다

api 응답
```json
{
  "timestamp": "2025-09-18T16:20:58.526821",
  "path": "/api/jira/admin/sprint/2025-SP-18",
  "status": "SUCCESS",
  "data": [
    {
      "sprint": "2025-SP-18",
      "assignee": "나다",
      "issueKey": "PD-2078",
      "status": "작업완료",
      "summary": "무슨작업 하려고 한다",
      "startDate": "2025-09-10",
      "totalTimeHours": 2.00,
      "storyPoints": 0.20
    }
  ]
}
```
[{스프린트} - 작업자]

| 스프린트       | 작업자    | 이슈     | 상태 | 서머리      | 시작일        | 작업로그(sum(timeHours)) | 스토리포인트 | 
|------------|--------|--------|----|----------|------------|----------------------|--------|
| 2025-SP-18 | {작업자명} | PD-123 | 완료 | 무슨 작업 내용 | 2025-08-01 | 5                    | 0.4    |




- [{스프린트} - 작업자] 표에서 row 클릭시에는 작업로그를 표기 함
  - `GET /api/jira/admin/sprint/issue/PD-2030` 호출하여 아래 표 생성 

```json
{
    "timestamp": "2025-09-18T16:23:42.963047",
    "path": "/api/jira/admin/sprint/issue/PD-2030",
    "status": "SUCCESS",
    "data": [
        {
            "issueKey": "PD-2030",
            "author": "나다",
            "comment": "스테이징 테스트 및 자스퍼 세팅",
            "started": "2025-09-08T23:30:02.722",
            "timeHours": 8.00
        }
    ]
}

```

| 이슈     | 작업자    | 작업 코멘트 | 작업시작시간(started)  | 작업시간(timeHours) | 
|--------|--------|--------|------------------|-----------------|
| PD-123 | {작업자명} | db 연동  | 2025-08-01 08:00 | 5               |