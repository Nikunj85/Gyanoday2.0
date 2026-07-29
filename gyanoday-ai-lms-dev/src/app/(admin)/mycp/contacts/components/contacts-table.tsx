'use client'

import { format } from 'date-fns'
import { BookOpen, Calendar, Mail, MessageSquare, User } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ContactRequest } from '@/services/contact-server-service'

interface ContactsTableProps {
  contacts: ContactRequest[]
  isLoading: boolean
}

export function ContactsTable({ contacts, isLoading }: ContactsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
        <Table className="admin-table">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="admin-table-header">Student Name</TableHead>
              <TableHead className="admin-table-header">Contact Info</TableHead>
              <TableHead className="admin-table-header text-center">Class (Std)</TableHead>
              <TableHead className="admin-table-header">Message</TableHead>
              <TableHead className="admin-table-header text-right">Date</TableHead>
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

  if (contacts.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground border border-primary/20 rounded-2xl bg-white shadow-subtle">
        <div className="mx-auto w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium text-lg text-primary">No inquiries found.</p>
        <p className="text-sm">
          When students try to contact you, their messages will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden shadow-subtle">
      <Table className="admin-table">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="admin-table-header">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Student Name
              </div>
            </TableHead>
            <TableHead className="admin-table-header">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                Contact Info
              </div>
            </TableHead>
            <TableHead className="admin-table-header text-center">
              <div className="flex items-center gap-2 justify-center">
                <BookOpen className="w-3.5 h-3.5" />
                Class (Std)
              </div>
            </TableHead>
            <TableHead className="admin-table-header">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Message
              </div>
            </TableHead>
            <TableHead className="admin-table-header text-right">
              <div className="flex items-center gap-2 justify-end">
                <Calendar className="w-3.5 h-3.5" />
                Date
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="admin-table-row group">
              <TableCell className="admin-table-cell py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {contact.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="font-semibold text-foreground text-[14px]">
                    {contact.full_name}
                  </div>
                </div>
              </TableCell>
              <TableCell className="admin-table-cell py-4">
                <div className="text-muted-foreground text-xs font-medium">{contact.email}</div>
              </TableCell>
              <TableCell className="admin-table-cell py-4 text-center">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-secondary/30 text-primary text-[11px] font-bold border border-secondary/50">
                  {contact.std || 'N/A'}
                </div>
              </TableCell>
              <TableCell className="admin-table-cell py-4">
                <div className="max-w-xs text-xs text-foreground/70 line-clamp-2 leading-relaxed">
                  {contact.message}
                </div>
              </TableCell>
              <TableCell className="admin-table-cell py-4 text-right">
                <div className="text-[11px] font-bold text-foreground/80">
                  {format(new Date(contact.created_at), 'dd MMM yyyy')}
                  <div className="text-[10px] font-medium opacity-60">
                    {format(new Date(contact.created_at), 'hh:mm a')}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
