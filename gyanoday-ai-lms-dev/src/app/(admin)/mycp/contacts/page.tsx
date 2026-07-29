'use client'

import { useQuery } from '@tanstack/react-query'
import debounce from 'lodash.debounce'
import { Filter, MessageCircle, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getContactRequestsAction } from '@/app/actions/contact-actions'
import { AdminSelect, SelectOption } from '@/components/common/admin-select'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'

import { ContactsTable } from './components/contacts-table'

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Debounce search
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearch(value), 300),
    []
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    debouncedSetSearch(value)
    setPage(1) // Reset to first page on search
  }

  // Fetch Contacts with TanStack Query via Server Action
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['admin-contacts', { page, pageSize, search: debouncedSearch }],
    queryFn: () =>
      getContactRequestsAction({
        page,
        pageSize,
        search: debouncedSearch,
      }),
    placeholderData: (previousData) => previousData,
  })

  // Normalize data from Server Action response
  const contacts = data?.data || []
  const totalItems = data?.total || 0
  const totalPages = Math.ceil(totalItems / pageSize)

  const pageSizeOptions: SelectOption[] = [
    { value: '10', label: '10' },
    { value: '20', label: '20' },
    { value: '50', label: '50' },
  ]

  return (
    <div className="min-h-full animate-fade-in px-4 md:px-8 py-6">
      <div className="mx-auto max-w-8xl">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-primary">Inquiries</h1>
              </div>
              <p className="text-muted-foreground ml-1">
                View and manage messages from students trying to contact Gyanoday support.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-border shadow-subtle">
            <div className="flex flex-1 items-center gap-4 w-full">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or message..."
                  value={search}
                  onChange={handleSearchChange}
                  className="admin-input pl-10 h-11"
                />
              </div>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 italic">
                <Filter className="w-3.5 h-3.5 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground font-medium">
                  Showing {contacts.length} of {totalItems} messages
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                Show:
              </span>
              <AdminSelect
                value={String(pageSize)}
                onValueChange={(v: string) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
                options={pageSizeOptions}
                className="w-20 h-9 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="relative">
            <ContactsTable contacts={contacts} isLoading={isLoading} />

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              isDisabled={isLoading || isPlaceholderData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
