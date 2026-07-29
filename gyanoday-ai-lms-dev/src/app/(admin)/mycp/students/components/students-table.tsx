'use client'

import { Edit, Globe, Languages, Mail, Phone, School, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Language, LANGUAGE_LABELS, User } from '@/types/users'

interface StudentsTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function StudentsTable({ users, onEdit, onDelete, isLoading }: StudentsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
        <Table className="admin-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="admin-table-header">Name</TableHead>
              <TableHead className="admin-table-header">Email</TableHead>
              <TableHead className="admin-table-header">Class</TableHead>
              <TableHead className="admin-table-header text-center">Status</TableHead>
              <TableHead className="admin-table-header text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i} className="admin-table-row">
                <TableCell className="admin-table-cell py-4" colSpan={5}>
                  <div className="h-6 w-full animate-shimmer rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-primary/20 rounded-2xl bg-white shadow-subtle">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">No students found.</p>
        <p className="text-sm">Add a student to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <Table className="admin-table">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="admin-table-header">Name</TableHead>
            <TableHead className="admin-table-header">Contact & Details</TableHead>
            <TableHead className="admin-table-header">Class & School</TableHead>
            <TableHead className="admin-table-header">Language</TableHead>
            <TableHead className="admin-table-header text-center">Status</TableHead>
            <TableHead className="admin-table-header text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="admin-table-row">
              <TableCell className="admin-table-cell py-4 font-semibold text-foreground">
                {user.name}
              </TableCell>
              <TableCell className="admin-table-cell py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Mail className="mr-1.5 h-3 w-3" /> {user.email}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Phone className="mr-1.5 h-3 w-3" /> {user.phone || 'N/A'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="admin-table-cell py-4">
                <div className="flex flex-col gap-1">
                  <div className="inline-flex items-center text-xs font-bold text-primary px-2 py-0.5 rounded">
                    {user.class?.name || 'No Class'}
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground">
                    <School className="mr-1 h-2.5 w-2.5" /> {user.school_name || 'N/A'}
                  </div>
                </div>
              </TableCell>
              <TableCell className="admin-table-cell py-4">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Languages className="mr-1.5 h-3 w-3" />{' '}
                  {LANGUAGE_LABELS[user.language as Language] ?? 'N/A'}
                </div>
              </TableCell>

              <TableCell className="admin-table-cell py-4 text-center">
                <div
                  className={cn(
                    'admin-badge',
                    !user.is_active && 'bg-red-50 text-red-600 border border-red-100'
                  )}
                >
                  <div
                    className={cn(
                      'mr-1.5 h-1.5 w-1.5 rounded-full',
                      user.is_active ? 'bg-primary' : 'bg-red-600'
                    )}
                  />
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
              </TableCell>
              <TableCell className="admin-table-cell py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(user)}
                    className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-xl transition-all"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(user.id)}
                    className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
