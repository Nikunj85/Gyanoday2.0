'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, Trash2, UserPlus, Users, X } from 'lucide-react'
import { useState } from 'react'

import {
  createParentAndLinkToStudent,
  deleteAdminParentLink,
  getAdminParentLinks,
  searchStudentCandidates,
} from '@/app/actions/admin-user-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'

export default function ParentsPage() {
  const queryClient = useQueryClient()

  const [showAddParent, setShowAddParent] = useState(false)
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPassword, setParentPassword] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)

  const { data: links, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['parent-links'],
    queryFn: getAdminParentLinks,
  })

  const { data: studentResults, isLoading: isSearchingStudents } = useQuery({
    queryKey: ['parent-student-picker', studentSearch],
    queryFn: () => searchStudentCandidates(studentSearch),
    enabled: studentSearch.trim().length >= 2 && !selectedStudentId,
  })

  const selectedStudent = studentResults?.find((student) => student.id === selectedStudentId)

  const addParentMutation = useMutation({
    mutationFn: () => {
      if (!selectedStudentId) throw new Error('Please select a student.')
      return createParentAndLinkToStudent(
        parentName,
        parentEmail,
        parentPassword,
        selectedStudentId
      )
    },
    onSuccess: () => {
      toast({
        title: 'Parent added successfully',
        description: 'The parent can now log in and access the Parent Dashboard.',
      })
      queryClient.invalidateQueries({ queryKey: ['parent-links'] })
      resetForm()
      setShowAddParent(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Unable to add parent',
        description: error?.message || 'Something went wrong.',
        variant: 'destructive',
      })
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: deleteAdminParentLink,
    onSuccess: () => {
      toast({ title: 'Parent link removed' })
      queryClient.invalidateQueries({ queryKey: ['parent-links'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove link',
        description: error?.message || 'Something went wrong.',
        variant: 'destructive',
      })
    },
  })

  function resetForm() {
    setParentName('')
    setParentEmail('')
    setParentPassword('')
    setStudentSearch('')
    setSelectedStudentId(null)
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Parent Portal Access
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Add a parent directly and connect the parent to a student. No invitation email is
            required.
          </p>
        </div>

        <Button onClick={() => setShowAddParent(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Parent
        </Button>
      </div>

      {showAddParent && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Add Parent</h2>
              <p className="text-xs text-slate-400 mt-1">
                The admin creates the parent login directly.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowAddParent(false)
              }}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Parent Name
              </label>
              <Input
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Enter parent name"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Parent Email
              </label>
              <Input
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                type="email"
                placeholder="parent@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Parent Password
              </label>
              <Input
                value={parentPassword}
                onChange={(e) => setParentPassword(e.target.value)}
                type="password"
                placeholder="Minimum 8 characters"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Give this password to the parent so they can log in.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                Student
              </label>

              {selectedStudent ? (
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 min-h-10">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{selectedStudent.name}</p>
                    <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(null)
                      setStudentSearch('')
                    }}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student by name or email"
                    className="pl-9"
                  />

                  {studentSearch.trim().length >= 2 && (
                    <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
                      {isSearchingStudents ? (
                        <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Searching students…
                        </div>
                      ) : studentResults && studentResults.length > 0 ? (
                        studentResults.map((student) => (
                          <button
                            type="button"
                            key={student.id}
                            onClick={() => {
                              setSelectedStudentId(student.id)
                              setStudentSearch(student.name)
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                          >
                            <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                            <p className="text-xs text-slate-400">{student.email}</p>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-slate-400">No students found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                setShowAddParent(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => addParentMutation.mutate()}
              disabled={
                !parentName.trim() ||
                !parentEmail.trim() ||
                !parentPassword ||
                !selectedStudentId ||
                addParentMutation.isPending
              }
            >
              {addParentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add Parent
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 px-6 pt-6 pb-4">
          Existing Parent Links
        </h2>

        {isLoadingLinks ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : !links || links.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-slate-400">No parent-student links yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-6 py-3 font-semibold">Parent</th>
                  <th className="px-6 py-3 font-semibold">Student</th>
                  <th className="px-6 py-3 font-semibold">Class</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-t border-slate-50">
                    <td className="px-6 py-3">
                      <p className="font-semibold text-slate-700">{link.parent?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{link.parent?.email || '—'}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-semibold text-slate-700">{link.student?.name || '—'}</p>
                      <p className="text-xs text-slate-400">{link.student?.email || '—'}</p>
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {link.student?.class?.name || '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => unlinkMutation.mutate(link.id)}
                        disabled={unlinkMutation.isPending}
                        className="text-slate-300 hover:text-rose-500 transition-colors"
                        title="Remove link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
