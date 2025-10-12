import axiosClient from './axiosClient'

const COMMON_CODE_API_BASE = '/api/common-code/admin'

class CommonCodeService {
  // =============== CommonClass 관리 ===============

  /**
   * 모든 클래스 조회
   */
  async getAllClasses() {
    try {
      const response = await axiosClient.get(`${COMMON_CODE_API_BASE}/class`)
      return response.data
    } catch (error) {
      console.error('클래스 목록 조회 실패:', error)
      throw error
    }
  }

  /**
   * 클래스 상세 조회
   * @param {string} classCode - 클래스 코드
   */
  async getClassDetail(classCode) {
    try {
      const response = await axiosClient.get(`${COMMON_CODE_API_BASE}/class/${classCode}`)
      return response.data
    } catch (error) {
      console.error(`클래스 상세 조회 실패 [${classCode}]:`, error)
      throw error
    }
  }

  /**
   * 클래스 생성
   * @param {Object} classData - 클래스 데이터
   * @param {string} classData.name - 클래스명
   * @param {string} classData.displayName - 표시명
   * @param {string} classData.description - 설명
   * @param {string} classData.attribute1Name - 속성1 이름
   * @param {string} classData.attribute2Name - 속성2 이름
   * @param {string} classData.attribute3Name - 속성3 이름
   * @param {string} classData.attribute4Name - 속성4 이름
   * @param {string} classData.attribute5Name - 속성5 이름
   * @param {boolean} classData.isActive - 활성화 여부
   */
  async createClass(classData) {
    try {
      const response = await axiosClient.post(`${COMMON_CODE_API_BASE}/class`, classData)
      return response.data
    } catch (error) {
      console.error('클래스 생성 실패:', error)
      throw error
    }
  }

  /**
   * 클래스 수정
   * @param {string} classCode - 클래스 코드
   * @param {Object} updateData - 수정할 데이터
   */
  async updateClass(classCode, updateData) {
    try {
      const response = await axiosClient.put(`${COMMON_CODE_API_BASE}/class/${classCode}`, updateData)
      return response.data
    } catch (error) {
      console.error(`클래스 수정 실패 [${classCode}]:`, error)
      throw error
    }
  }

  /**
   * 클래스 삭제
   * @param {string} classCode - 클래스 코드
   */
  async deleteClass(classCode) {
    try {
      const response = await axiosClient.delete(`${COMMON_CODE_API_BASE}/class/${classCode}`)
      return response.data
    } catch (error) {
      console.error(`클래스 삭제 실패 [${classCode}]:`, error)
      throw error
    }
  }

  // =============== CommonCode 관리 ===============

  /**
   * 특정 클래스의 코드 목록 조회 (클래스 조회에서 codes 배열 추출)
   * @param {string} classCode - 클래스 코드
   */
  async getCodesByClassCode(classCode) {
    try {
      const classData = await this.getClassDetail(classCode)
      return classData.codes || []
    } catch (error) {
      console.error(`코드 목록 조회 실패 [${classCode}]:`, error)
      throw error
    }
  }

  /**
   * 코드 생성
   * @param {Object} codeData - 코드 데이터
   * @param {string} codeData.classCode - 클래스 코드
   * @param {string} codeData.code - 코드값
   * @param {string} codeData.name - 코드명
   * @param {string} codeData.description - 설명
   * @param {string} codeData.attribute1Value - 속성1 값
   * @param {string} codeData.attribute2Value - 속성2 값
   * @param {string} codeData.attribute3Value - 속성3 값
   * @param {string} codeData.attribute4Value - 속성4 값
   * @param {string} codeData.attribute5Value - 속성5 값
   * @param {string} codeData.childClassCode - 하위 클래스 코드
   * @param {number} codeData.sort - 정렬순서
   * @param {boolean} codeData.isActive - 활성화 여부
   */
  async createCode(codeData) {
    try {
      const response = await axiosClient.post(`${COMMON_CODE_API_BASE}/code`, codeData)
      return response.data
    } catch (error) {
      console.error('코드 생성 실패:', error)
      throw error
    }
  }

  /**
   * 코드 수정
   * @param {string} classCode - 클래스 코드
   * @param {string} code - 코드값
   * @param {Object} updateData - 수정할 데이터
   */
  async updateCode(classCode, code, updateData) {
    try {
      const response = await axiosClient.put(`${COMMON_CODE_API_BASE}/code/${classCode}/${code}`, updateData)
      return response.data
    } catch (error) {
      console.error(`코드 수정 실패 [${classCode}/${code}]:`, error)
      throw error
    }
  }

  /**
   * 코드 삭제
   * @param {string} classCode - 클래스 코드
   * @param {string} code - 코드값
   */
  async deleteCode(classCode, code) {
    try {
      const response = await axiosClient.delete(`${COMMON_CODE_API_BASE}/code/${classCode}/${code}`)
      return response.data
    } catch (error) {
      console.error(`코드 삭제 실패 [${classCode}/${code}]:`, error)
      throw error
    }
  }

  /**
   * 배치 코드 생성
   * @param {string} classCode - 클래스 코드
   * @param {Array} codesArray - 코드 배열
   */
  async batchCreateCodes(classCode, codesArray) {
    try {
      const response = await axiosClient.post(`${COMMON_CODE_API_BASE}/class/${classCode}/codes/batch`, codesArray)
      return response.data
    } catch (error) {
      console.error(`배치 코드 생성 실패 [${classCode}]:`, error)
      throw error
    }
  }

  // =============== 유틸리티 ===============

  /**
   * 클래스 코드 중복 확인
   * @param {string} classCode - 클래스 코드
   */
  async checkClassExists(classCode) {
    try {
      const response = await axiosClient.get(`${COMMON_CODE_API_BASE}/class/${classCode}/exists`)
      return response.data.exists
    } catch (error) {
      console.error(`클래스 코드 중복 확인 실패 [${classCode}]:`, error)
      throw error
    }
  }

  /**
   * 코드값 중복 확인
   * @param {string} classCode - 클래스 코드
   * @param {string} code - 코드값
   */
  async checkCodeExists(classCode, code) {
    try {
      const response = await axiosClient.get(`${COMMON_CODE_API_BASE}/code/${classCode}/${code}/exists`)
      return response.data.exists
    } catch (error) {
      console.error(`코드값 중복 확인 실패 [${classCode}/${code}]:`, error)
      throw error
    }
  }

  // =============== 트리 데이터 구성 헬퍼 ===============

  /**
   * 클래스와 코드를 트리 구조로 변환 (MUI TreeData 호환)
   * @param {Array} classes - 클래스 배열
   * @param {Object} codesByClass - 클래스별 코드 맵
   */
  buildTreeData(classes, codesByClass) {
    const treeData = []
    const processedClasses = new Set() // 순환 참조 방지

    // 최상위 클래스부터 시작 (다른 클래스에서 childClassCode로 참조되지 않는 클래스)
    const topLevelClasses = classes.filter(cls =>
        cls.isActive && !this.isChildClass(cls.code, codesByClass)
    )

    topLevelClasses.forEach(cls => {
      if (!processedClasses.has(cls.code)) {
        const classNode = this.createClassNode(cls, [cls.code])
        this.addCodeNodes(classNode, cls, codesByClass, classes, processedClasses)
        treeData.push(classNode)
      }
    })

    return treeData
  }

  /**
   * 해당 클래스가 다른 클래스의 하위 클래스인지 확인
   * @param {string} classCode - 클래스 코드
   * @param {Object} codesByClass - 클래스별 코드 맵
   */
  isChildClass(classCode, codesByClass) {
    return Object.values(codesByClass).some(codes =>
        codes.some(code => code.childClassCode === classCode)
    )
  }

  /**
   * 클래스 노드 생성
   * @param {Object} cls - 클래스 데이터
   * @param {Array} hierarchy - 계층 경로
   */
  createClassNode(cls, hierarchy) {
    return {
      id: `class_${cls.code}_${hierarchy.join('_')}`,
      type: 'class',
      code: cls.code,
      name: cls.name,
      displayName: cls.displayName,
      description: cls.description,
      isActive: cls.isActive,
      attribute1Name: cls.attribute1Name,
      attribute2Name: cls.attribute2Name,
      attribute3Name: cls.attribute3Name,
      attribute4Name: cls.attribute4Name,
      attribute5Name: cls.attribute5Name,
      createdAt: cls.createdAt,
      createdBy: cls.createdBy,
      updatedAt: cls.updatedAt,
      updatedBy: cls.updatedBy,
      hierarchy: [...hierarchy]
    }
  }

  /**
   * 코드 노드 생성
   * @param {Object} code - 코드 데이터
   * @param {Array} hierarchy - 계층 경로
   */
  createCodeNode(code, hierarchy) {
    return {
      id: `code_${code.classCode}_${code.code}_${hierarchy.join('_')}`,
      type: 'code',
      classCode: code.classCode,
      code: code.code,
      name: code.name,
      description: code.description,
      attribute1Value: code.attribute1Value,
      attribute2Value: code.attribute2Value,
      attribute3Value: code.attribute3Value,
      attribute4Value: code.attribute4Value,
      attribute5Value: code.attribute5Value,
      childClassCode: code.childClassCode,
      sort: code.sort,
      isActive: code.isActive,
      hasChildren: !!code.childClassCode,
      createdAt: code.createdAt,
      createdBy: code.createdBy,
      updatedAt: code.updatedAt,
      updatedBy: code.updatedBy,
      hierarchy: [...hierarchy]
    }
  }

  /**
   * 클래스에 코드 노드들 추가
   * @param {Object} classNode - 클래스 노드
   * @param {Object} cls - 클래스 데이터
   * @param {Object} codesByClass - 클래스별 코드 맵
   * @param {Array} allClasses - 전체 클래스 배열
   * @param {Set} processedClasses - 처리된 클래스 집합
   */
  addCodeNodes(classNode, cls, codesByClass, allClasses, processedClasses) {
    processedClasses.add(cls.code)

    const codes = codesByClass[cls.code] || []
    codes.sort((a, b) => (a.sort || 0) - (b.sort || 0)) // 정렬

    codes.forEach(code => {
      const codeHierarchy = [...classNode.hierarchy, `${code.code}(${code.name})`]
      const codeNode = this.createCodeNode(code, codeHierarchy)

      // 하위 클래스가 있으면 재귀적으로 추가
      if (code.childClassCode && codesByClass[code.childClassCode]) {
        const childClass = allClasses.find(c => c.code === code.childClassCode)
        if (childClass && !processedClasses.has(code.childClassCode)) {
          const childClassHierarchy = [...codeHierarchy, childClass.code]
          const childClassNode = this.createClassNode(childClass, childClassHierarchy)
          this.addCodeNodes(childClassNode, childClass, codesByClass, allClasses, processedClasses)
          codeNode.childClassCode = childClass.code
        }
      }

      if (!classNode.children) {
        classNode.children = []
      }
      classNode.children.push(codeNode)
    })
  }

  /**
   * 중첩된 트리 데이터를 플랫 배열로 변환 (MUI DataGrid 호환)
   * @param {Array} treeData - 중첩 트리 데이터
   * @returns {Array} 플랫 배열
   */
  flattenTreeData(treeData) {
    const flattened = []

    const flatten = (nodes) => {
      if (!Array.isArray(nodes)) {
        return
      }

      nodes.forEach(node => {
        // 현재 노드 추가
        const {children, ...nodeData} = node
        flattened.push(nodeData)

        // 자식 노드 재귀적으로 처리
        if (children && children.length > 0) {
          flatten(children)
        }
      })
    }

    flatten(treeData)
    return flattened
  }

  /**
   * 전체 트리 데이터 로드 (최적화된 버전)
   */
  async loadAllTreeData() {
    try {
      // 클래스 데이터 로드 (codes 배열 포함)
      const classes = await this.getAllClasses()

      // 클래스별 코드 맵 생성 (각 클래스의 codes 배열에서 추출)
      const codesByClass = {}
      classes.forEach(classItem => {
        if (classItem.codes && Array.isArray(classItem.codes)) {
          codesByClass[classItem.code] = classItem.codes
        }
      })

      // 트리 데이터 구성 후 플랫하게 변환
      const treeData = this.buildTreeData(classes, codesByClass)
      return this.flattenTreeData(treeData)
    } catch (error) {
      console.error('전체 트리 데이터 로드 실패:', error)
      throw error
    }
  }

  /**
   * 계층형 트리 데이터 로드 (HierarchicalTreeView용)
   * 백엔드에서 구성된 트리 구조를 그대로 반환
   * Class → Code → Class → Code 재귀 구조
   */
  async loadHierarchicalTree() {
    try {
      const response = await axiosClient.get(`${COMMON_CODE_API_BASE}/tree`)
      return this.transformTreeForUI(response.data)
    } catch (error) {
      console.error('계층형 트리 로드 실패:', error)
      throw error
    }
  }

  /**
   * 백엔드 트리 응답을 UI에 맞게 변환
   * - CLASS 노드: children에서 codes로 변환
   * - CODE 노드: children에서 childClass로 변환
   * @param {Array} treeData - 백엔드 트리 데이터
   * @returns {Array} UI용 트리 데이터
   */
  transformTreeForUI(treeData) {
    if (!treeData || !Array.isArray(treeData)) {
      return []
    }

    return treeData.map(node => {
      if (node.type === 'CLASS') {
        // CLASS 노드: children → codes로 변환
        const classNode = {
          ...node,
          codes: node.children ? this.transformTreeForUI(node.children) : []
        }
        delete classNode.children
        return classNode
      } else if (node.type === 'CODE') {
        // CODE 노드: children[0] → childClass로 변환
        const codeNode = {
          ...node,
          childClass: node.children && node.children.length > 0
            ? this.transformTreeForUI([node.children[0]])[0]
            : null
        }
        delete codeNode.children
        return codeNode
      }
      return node
    })
  }
}

const commonCodeService = new CommonCodeService()
export default commonCodeService
