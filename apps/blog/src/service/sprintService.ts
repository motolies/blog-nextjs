import axiosClient from './axiosClient'

const sprintService = {
    getSprintData: async (year: number) => {
        return await axiosClient.get(`/api/jira/admin/sprint/summary/${year}`)
    },

    getSprintDetail: async (sprintName: string, worker: string | null = null) => {
        const params = worker ? `?worker=${encodeURIComponent(worker)}` : ''
        return await axiosClient.get(`/api/jira/admin/sprint/${sprintName}${params}`)
    },

    getIssueWorklog: async (issueKey: string) => {
        return await axiosClient.get(`/api/jira/admin/sprint/issue/${issueKey}`)
    }
}

export default sprintService
