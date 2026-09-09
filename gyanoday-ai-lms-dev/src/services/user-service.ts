import {
  createAdminStudent,
  deleteAdminStudent,
  getAdminStudents,
  updateAdminStudent,
} from '@/app/actions/admin-user-actions'
import { User } from '@/types/users'

export const userService = {
  async getUsers(params: {
    page?: number
    pageSize?: number
    search?: string
    statusFilter?: boolean | null
    classFilter?: string | null
  }) {
    return getAdminStudents(params)
  },

  async createUser(newUser: Omit<User, 'id' | 'created_at'>) {
    return createAdminStudent(newUser)
  },

  async updateUser(id: string, updates: Partial<User>) {
    return updateAdminStudent(id, updates)
  },

  async deleteUser(id: string) {
    return deleteAdminStudent(id)
  },
}
