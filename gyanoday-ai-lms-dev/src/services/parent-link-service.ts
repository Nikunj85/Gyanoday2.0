import {
  createParentStudentLink,
  deleteAdminParentLink,
  getAdminParentLinks,
  promoteUserToParent,
  searchParentCandidates,
  searchStudentCandidates,
} from '@/app/actions/admin-user-actions'
import { User } from '@/types/users'

export interface ParentLink {
  id: string
  parent_id: string
  student_id: string
  created_at: string
  parent: { id: string; name: string; email: string } | null
  student: { id: string; name: string; email: string; class?: { name: string } | null } | null
}

export const parentLinkService = {
  async searchParentUsers(search: string, limit = 20): Promise<User[]> {
    return searchParentCandidates(search, limit)
  },

  async searchStudentUsers(search: string, limit = 20): Promise<User[]> {
    return searchStudentCandidates(search, limit)
  },

  async promoteToParent(userId: string, studentId?: string) {
    return promoteUserToParent(userId, studentId)
  },

  async getAllLinks(): Promise<ParentLink[]> {
    return (await getAdminParentLinks()) as unknown as ParentLink[]
  },

  async createLink(parentId: string, studentId: string) {
    return createParentStudentLink(parentId, studentId)
  },

  async deleteLink(linkId: string) {
    return deleteAdminParentLink(linkId)
  },
}
