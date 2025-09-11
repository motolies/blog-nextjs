import axiosClient from './axiosClient'

const sprintService = {
    getSprintData: async (year) => {
        return await axiosClient.get(`/api/jira/admin/sprint/${year}`)
    }
}

export default sprintService