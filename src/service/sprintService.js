import axiosClient from './axiosClient'

const sprintService = {
    getSprintData: async (year) => {
        return await axiosClient.get(`/api/jira/admin/sprint/summary/${year}`)
    },

    getSprintDetail: async (sprintName, worker = null) => {
        const params = worker ? `?worker=${encodeURIComponent(worker)}` : ''
        return await axiosClient.get(`/api/jira/admin/sprint/${sprintName}${params}`)
    },

    getIssueWorklog: async (issueKey) => {
        return await axiosClient.get(`/api/jira/admin/sprint/issue/${issueKey}`)
    }
}

export default sprintService