'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link2, Loader2, Search, Trash2, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { parentLinkService } from '@/services/parent-link-service'

export default function ParentsPage() {
  const queryClient = useQueryClient()

  const [studentSearch, setStudentSearch] = useState('')
  const [parentSearch, setParentSearch] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null)

  const { data: links, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['parent-links'],
    queryFn: () => parentLinkService.getAllLinks(),
  })

  const { data: studentResults, isLoading: isSearchingStudents } = useQuery({
    queryKey: ['user-search', 'student-picker', studentSearch],
    queryFn: () => parentLinkService.searchStudentUsers(studentSearch),
    enabled: studentSearch.length >= 2,
  })

  const { data: parentResults, isLoading: isSearchingParents } = useQuery({
    queryKey: ['user-search', 'parent-picker', parentSearch],
    queryFn: () => parentLinkService.searchParentUsers(parentSearch),
    enabled: parentSearch.length >= 2,
  })

  const selectedStudent = useMemo(
    () => studentResults?.find((u) => u.id === selectedStudentId),
    [studentResults, selectedStudentId]
  )
  const selectedParent = useMemo(
    () => parentResults?.find((u) => u.id === selectedParentId),
    [parentResults, selectedParentId]
  )

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedParentId || !selectedStudentId) return
      if (selectedParentId === selectedStudentId) {
        throw new Error('A parent account must be different from the student account.')
      }
      // Only real parent accounts can be linked. Student accounts are never
      // promoted here because doing so removes them from Student Management.
      await parentLinkService.createLink(selectedParentId, selectedStudentId)
    },
    onSuccess: () => {
      toast({ title: 'Linked successfully', description: 'The parent can now view this student.' })
      queryClient.invalidateQueries({ queryKey: ['parent-links'] })
      setSelectedParentId(null)
      setSelectedStudentId(null)
      setParentSearch('')
      setStudentSearch('')
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create link',
        description: error?.message?.includes('duplicate')
          ? 'This parent is already linked to this student.'
          : error.message,
        variant: 'destructive',
      })
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: (linkId: string) => parentLinkService.deleteLink(linkId),
    onSuccess: () => {
      toast({ title: 'Link removed' })
      queryClient.invalidateQueries({ queryKey: ['parent-links'] })
    },
    onError: (error: any) => {
      toast({ title: 'Failed to remove link', description: error.message, variant: 'destructive' })
    },
  })

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Parent Portal Access
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Link an existing parent account to a specific student. Parent and student must use
          separate accounts; a student account cannot be converted into a parent account.
        </p>
      </div>

      {/* Create a new link */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 mb-4">
          Link a Parent to a Student
        </h2>

        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-start">
          {/* Parent picker */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Parent</label>
            {selectedParent ? (
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800">{selectedParent.name}</p>
                  <p className="text-xs text-slate-500">{selectedParent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedParentId(null)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={parentSearch}
                  onChange={(e) => {
                    setParentSearch(e.target.value)
                  }}
                  placeholder="Search by name or email…"
                  className="pl-9"
                />
                {parentSearch.length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
                    {isSearchingParents ? (
                      <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                      </div>
                    ) : parentResults && parentResults.length > 0 ? (
                      parentResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedParentId(u.id)
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">
                            {u.email} · currently{' '}
                            <span className="font-semibold capitalize">{u.role}</span>
                          </p>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400">No matching accounts found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="hidden md:flex items-center justify-center h-10 mt-6">
            <Link2 className="h-5 w-5 text-slate-300" />
          </div>

          {/* Student picker */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Student</label>
            {selectedStudent ? (
              <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5">
                <div>
                  <p className="text-sm font-bold text-slate-800">{selectedStudent.name}</p>
                  <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={() => setSelectedStudentId(null)}
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
                  placeholder="Search by name or email…"
                  className="pl-9"
                />
                {studentSearch.length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg">
                    {isSearchingStudents ? (
                      <div className="p-3 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
                      </div>
                    ) : studentResults && studentResults.length > 0 ? (
                      studentResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setSelectedStudentId(u.id)}
                          className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-slate-400">No matching accounts found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={() => linkMutation.mutate()}
          disabled={!selectedParentId || !selectedStudentId || linkMutation.isPending}
          className="mt-5"
        >
          {linkMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          Create Link
        </Button>
      </div>

      {/* Existing links */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400 px-6 pt-6 pb-4">
          Existing Links
        </h2>

        {isLoadingLinks ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : !links || links.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-slate-400">No parent-student links yet.</p>
        ) : (
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
                    <p className="text-xs text-slate-400">{link.parent?.email}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="font-semibold text-slate-700">{link.student?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{link.student?.email}</p>
                  </td>
                  <td className="px-6 py-3 text-slate-500">{link.student?.class?.name || '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <button
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
        )}
      </div>
    </div>
  )
}
