# 공통코드 관리 페이지 구현

- 아래 api 문서를 사용하여 관리자의 공통코드 관리 페이지를 만들려고 해
- mui x data grid 사용해서 화면 구성
- 기본적인 crud 기능 구현
- 클래스가 코드를 포함하며,
- 재귀구조를 사용하여 `클래스 -> 코드 -> 클래스 -> 코드` 형태도 가능하여 ui 구성이 복잡할 수 있으나 잘 구현해야 함
- redux 사용할 필요 없음
- axiosClient 사용하여 서비스만 만들어서 구현
- 전체적으로 mui 를 사용하여 화면 구성
- `common-code.jsx` 사용


## API 문서

### 기본 정보

- **Base URL**: `/api/common-code/admin`
- **인증**: 관리자 인증 필요 (JWT)
- **Content-Type**: `application/json`

---

## 1. CommonClass (공통코드 클래스) 관리

공통코드 클래스는 코드들을 그룹핑하는 상위 개념입니다.

### 1.1 클래스 생성

```http
POST /api/common-code/admin/class
Content-Type: application/json

{
  "name": "USER_STATUS",
  "displayName": "사용자 상태",
  "description": "사용자 계정 상태 관리용 코드",
  "attribute1Name": "색상코드",
  "attribute2Name": "아이콘",
  "attribute3Name": "우선순위",
  "attribute4Name": null,
  "attribute5Name": null,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "name": "USER_STATUS",
  "displayName": "사용자 상태",
  "description": "사용자 계정 상태 관리용 코드",
  "attribute1Name": "색상코드",
  "attribute2Name": "아이콘",
  "attribute3Name": "우선순위",
  "attribute4Name": null,
  "attribute5Name": null,
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00",
  "createdBy": "admin",
  "updatedAt": "2024-01-15T10:30:00",
  "updatedBy": "admin"
}
```

### 1.2 클래스 수정

```http
PUT /api/common-code/admin/class/USER_STATUS
Content-Type: application/json

{
  "displayName": "회원 상태",
  "description": "회원 계정 상태 관리",
  "attribute1Name": "배경색",
  "attribute2Name": "아이콘명",
  "attribute3Name": "정렬순서",
  "isActive": true
}
```

### 1.3 클래스 삭제

```http
DELETE /api/common-code/admin/class/USER_STATUS
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "클래스가 성공적으로 삭제되었습니다"
}
```

### 1.4 클래스 상세 조회

```http
GET /api/common-code/admin/class/USER_STATUS
```

### 1.5 모든 클래스 조회

```http
GET /api/common-code/admin/class
```

**Response (200 OK):**
```json
[ {
  "name" : "JIRA_STATUS",
  "displayName" : "지라 상태 코드",
  "description" : "지라 상태 코드",
  "attribute1Name" : "statusCategory",
  "attribute2Name" : "sprintYn",
  "isActive" : true,
  "createdAt" : "2025-08-24T04:01:40",
  "createdBy" : "SYSTEM",
  "codes" : [ {
    "className" : "JIRA_STATUS",
    "code" : "해야 할 일(작업요청)",
    "name" : "해야 할 일(작업요청)",
    "description" : "해야 할 일(작업요청)",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "To Do"
    },
    "attribute1Value" : "To Do",
    "attribute2Value" : "N",
    "sort" : 1,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "작업예정(요청확인)",
    "name" : "작업예정(요청확인)",
    "description" : "작업예정(요청확인)",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "To Do"
    },
    "attribute1Value" : "To Do",
    "attribute2Value" : "N",
    "sort" : 2,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "중지(HOLDING)",
    "name" : "중지(HOLDING)",
    "description" : "중지(HOLDING)",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "To Do"
    },
    "attribute1Value" : "To Do",
    "attribute2Value" : "N",
    "sort" : 3,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "진행 불가(Reject)",
    "name" : "진행 불가(Reject)",
    "description" : "진행 불가(Reject)",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "To Do"
    },
    "attribute1Value" : "To Do",
    "attribute2Value" : "N",
    "sort" : 4,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "진행중",
    "name" : "진행중",
    "description" : "진행중",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "In Progress"
    },
    "attribute1Value" : "In Progress",
    "attribute2Value" : "N",
    "sort" : 20,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "QA요청",
    "name" : "QA요청",
    "description" : "QA요청",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "In Progress"
    },
    "attribute1Value" : "In Progress",
    "attribute2Value" : "N",
    "sort" : 50,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "취소",
    "name" : "취소",
    "description" : "취소",
    "attributes" : {
      "sprintYn" : "N",
      "statusCategory" : "Done"
    },
    "attribute1Value" : "Done",
    "attribute2Value" : "N",
    "sort" : 90,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "배포준비",
    "name" : "배포준비",
    "description" : "배포준비",
    "attributes" : {
      "sprintYn" : "Y",
      "statusCategory" : "Done"
    },
    "attribute1Value" : "Done",
    "attribute2Value" : "Y",
    "sort" : 99,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  }, {
    "className" : "JIRA_STATUS",
    "code" : "작업완료",
    "name" : "작업완료",
    "description" : "작업완료",
    "attributes" : {
      "sprintYn" : "Y",
      "statusCategory" : "Done"
    },
    "attribute1Value" : "Done",
    "attribute2Value" : "Y",
    "sort" : 100,
    "isActive" : true,
    "createdAt" : "2025-08-24T04:01:40",
    "createdBy" : "SYSTEM",
    "hasChildren" : false
  } ],
  "codeCount" : 9
} ]
```

---

## 2. CommonCode (공통코드) 관리

실제 코드값과 코드명을 관리하는 API입니다.

### 2.1 코드 생성

```http
POST /api/common-code/admin/code
Content-Type: application/json

{
  "className": "USER_STATUS",
  "code": "ACTIVE",
  "name": "활성",
  "description": "정상 활성화된 사용자",
  "attribute1Value": "#00FF00",
  "attribute2Value": "check-circle",
  "attribute3Value": "1",
  "attribute4Value": null,
  "attribute5Value": null,
  "childClassName": null,
  "sort": 10,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "className": "USER_STATUS",
  "code": "ACTIVE",
  "name": "활성",
  "description": "정상 활성화된 사용자",
  "attributes": {
    "색상코드": "#00FF00",
    "아이콘": "check-circle",
    "우선순위": "1"
  },
  "attribute1Value": "#00FF00",
  "attribute2Value": "check-circle",
  "attribute3Value": "1",
  "hasChildren": false,
  "sort": 10,
  "isActive": true,
  "createdAt": "2024-01-15T10:35:00",
  "createdBy": "admin"
}
```

### 2.2 코드 수정

```http
PUT /api/common-code/admin/code/USER_STATUS/ACTIVE
Content-Type: application/json

{
  "name": "활성화됨",
  "description": "정상적으로 활성화된 사용자 계정",
  "attribute1Value": "#00AA00",
  "attribute2Value": "check-circle-fill",
  "attribute3Value": "5",
  "sort": 5,
  "isActive": true
}
```

### 2.3 코드 삭제

```http
DELETE /api/common-code/admin/code/USER_STATUS/ACTIVE
```

### 2.4 배치 코드 생성

여러 코드를 한번에 생성할 때 사용합니다.

```http
POST /api/common-code/admin/class/USER_STATUS/codes/batch
Content-Type: application/json

[
  {
    "className": "USER_STATUS",
    "code": "ACTIVE",
    "name": "활성",
    "description": "정상 활성화된 사용자",
    "attribute1Value": "#00FF00",
    "attribute2Value": "check-circle",
    "sort": 10
  },
  {
    "className": "USER_STATUS",
    "code": "INACTIVE",
    "name": "비활성",
    "description": "비활성화된 사용자",
    "attribute1Value": "#FF0000",
    "attribute2Value": "x-circle",
    "sort": 20
  },
  {
    "className": "USER_STATUS",
    "code": "SUSPENDED",
    "name": "정지",
    "description": "일시 정지된 사용자",
    "attribute1Value": "#FFA500",
    "attribute2Value": "pause-circle",
    "sort": 30
  }
]
```

**Response (200 OK):**
```json
[
  {
    "className": "USER_STATUS",
    "code": "ACTIVE",
    "name": "활성",
    "attributes": {
      "색상코드": "#00FF00",
      "아이콘": "check-circle"
    },
    "sort": 10,
    "isActive": true
  },
  {
    "className": "USER_STATUS",
    "code": "INACTIVE",
    "name": "비활성",
    "attributes": {
      "색상코드": "#FF0000",
      "아이콘": "x-circle"
    },
    "sort": 20,
    "isActive": true
  }
]
```

---

## 3. 유틸리티 API

### 3.1 클래스명 중복 확인

```http
GET /api/common-code/admin/class/USER_STATUS/exists
```

**Response (200 OK):**
```json
{
  "exists": true
}
```

### 3.2 코드값 중복 확인

```http
GET /api/common-code/admin/code/USER_STATUS/ACTIVE/exists
```

**Response (200 OK):**
```json
{
  "exists": false
}
```

---

## 4. 프론트엔드 사용 예시

### 4.1 React - 코드 클래스 관리 컴포넌트

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommonClassManager = () => {
  const [classes, setClasses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    attribute1Name: '',
    attribute2Name: '',
    attribute3Name: ''
  });

  // 클래스 목록 조회
  const fetchClasses = async () => {
    try {
      const response = await axios.get('/api/common-code/admin/class');
      setClasses(response.data);
    } catch (error) {
      console.error('클래스 목록 조회 실패:', error);
    }
  };

  // 클래스 생성
  const createClass = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/common-code/admin/class', formData);
      alert('클래스가 생성되었습니다.');
      fetchClasses(); // 목록 새로고침
      setFormData({ // 폼 초기화
        name: '',
        displayName: '',
        description: '',
        attribute1Name: '',
        attribute2Name: '',
        attribute3Name: ''
      });
    } catch (error) {
      alert('클래스 생성 실패: ' + error.response.data.message);
    }
  };

  // 클래스 삭제
  const deleteClass = async (className) => {
    if (window.confirm(`${className} 클래스를 삭제하시겠습니까?`)) {
      try {
        await axios.delete(`/api/common-code/admin/class/${className}`);
        alert('클래스가 삭제되었습니다.');
        fetchClasses();
      } catch (error) {
        alert('클래스 삭제 실패: ' + error.response.data.message);
      }
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return (
    <div>
      <h2>공통코드 클래스 관리</h2>

      {/* 클래스 생성 폼 */}
      <form onSubmit={createClass}>
        <input
          type="text"
          placeholder="클래스명"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="표시명"
          value={formData.displayName}
          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
        />
        <input
          type="text"
          placeholder="설명"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />
        <button type="submit">클래스 생성</button>
      </form>

      {/* 클래스 목록 */}
      <table>
        <thead>
          <tr>
            <th>클래스명</th>
            <th>표시명</th>
            <th>설명</th>
            <th>활성화</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(cls => (
            <tr key={cls.name}>
              <td>{cls.name}</td>
              <td>{cls.displayName}</td>
              <td>{cls.description}</td>
              <td>{cls.isActive ? '활성' : '비활성'}</td>
              <td>
                <button onClick={() => deleteClass(cls.name)}>삭제</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CommonClassManager;
```

### 4.2 JavaScript - 공통코드 관리

```javascript
class CommonCodeAPI {
  constructor(baseURL = '/api/common-code/admin') {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    };
  }

  // 클래스 관련 메서드
  async createClass(classData) {
    const response = await fetch(`${this.baseURL}/class`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(classData)
    });
    return response.json();
  }

  async getAllClasses() {
    const response = await fetch(`${this.baseURL}/class`, {
      headers: this.headers
    });
    return response.json();
  }

  async deleteClass(className) {
    const response = await fetch(`${this.baseURL}/class/${className}`, {
      method: 'DELETE',
      headers: this.headers
    });
    return response.json();
  }

  // 코드 관련 메서드
  async createCode(codeData) {
    const response = await fetch(`${this.baseURL}/code`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(codeData)
    });
    return response.json();
  }

  async batchCreateCodes(className, codesArray) {
    const response = await fetch(`${this.baseURL}/class/${className}/codes/batch`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(codesArray)
    });
    return response.json();
  }

  async updateCode(className, code, updateData) {
    const response = await fetch(`${this.baseURL}/code/${className}/${code}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(updateData)
    });
    return response.json();
  }

  async deleteCode(className, code) {
    const response = await fetch(`${this.baseURL}/code/${className}/${code}`, {
      method: 'DELETE',
      headers: this.headers
    });
    return response.json();
  }

  // 유틸리티 메서드
  async checkClassExists(className) {
    const response = await fetch(`${this.baseURL}/class/${className}/exists`, {
      headers: this.headers
    });
    const result = await response.json();
    return result.exists;
  }

  async checkCodeExists(className, code) {
    const response = await fetch(`${this.baseURL}/code/${className}/${code}/exists`, {
      headers: this.headers
    });
    const result = await response.json();
    return result.exists;
  }
}

// 사용 예시
const api = new CommonCodeAPI();

// 클래스 생성 예시
api.createClass({
  name: 'BOARD_TYPE',
  displayName: '게시판 유형',
  description: '게시판 유형 분류',
  attribute1Name: '아이콘',
  attribute2Name: '색상'
}).then(result => {
  console.log('클래스 생성 완료:', result);
});

// 배치 코드 생성 예시
api.batchCreateCodes('BOARD_TYPE', [
  {
    className: 'BOARD_TYPE',
    code: 'NOTICE',
    name: '공지사항',
    attribute1Value: 'announcement',
    attribute2Value: '#FF5722',
    sort: 10
  },
  {
    className: 'BOARD_TYPE',
    code: 'FAQ',
    name: '자주묻는질문',
    attribute1Value: 'help_outline',
    attribute2Value: '#2196F3',
    sort: 20
  }
]).then(results => {
  console.log('배치 코드 생성 완료:', results);
});
```

---

## 5. 에러 응답 형식

API 호출 시 발생할 수 있는 에러 응답 형식입니다.

### 5.1 유효성 검증 실패 (400 Bad Request)

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "유효성 검증에 실패했습니다",
  "details": {
    "name": "클래스명은 필수입니다",
    "displayName": "표시명은 128자 이하여야 합니다"
  }
}
```

### 5.2 리소스 없음 (404 Not Found)

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 404,
  "error": "Not Found",
  "message": "해당 클래스를 찾을 수 없습니다: USER_STATUS"
}
```

### 5.3 중복 데이터 (409 Conflict)

```json
{
  "timestamp": "2024-01-15T10:30:00",
  "status": 409,
  "error": "Conflict",
  "message": "이미 존재하는 클래스명입니다: USER_STATUS"
}
```

---

## 6. 주요 필드 설명

### CommonClass 필드
- **name**: 클래스명 (PK, 최대 64자)
- **displayName**: 화면 표시용 이름 (최대 128자)
- **description**: 클래스 설명 (최대 512자)
- **attribute1Name~5Name**: 동적 속성 이름들 (각각 최대 64자)
- **isActive**: 활성화 여부 (boolean)

### CommonCode 필드
- **className**: 소속 클래스명 (최대 64자)
- **code**: 코드값 (최대 32자)
- **name**: 코드명 (최대 64자)
- **description**: 코드 설명 (최대 512자)
- **attribute1Value~5Value**: 동적 속성값들 (각각 최대 128자)
- **childClassName**: 하위 클래스명 (계층 구조용, 최대 64자)
- **sort**: 정렬순서 (정수, 기본값 0)
- **isActive**: 활성화 여부 (boolean)
