'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Save, GraduationCap } from 'lucide-react'
import { boardService, Board } from '@/services/board-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const load = async () => { try { setBoards(await boardService.getAll(true)) } catch (e: any) { toast({ title: 'Could not load boards', description: e.message, variant: 'destructive' }) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const add = async () => { if (!name.trim() || !code.trim()) { toast({ title: 'Board name and code are required', variant: 'destructive' }); return } setSaving(true); try { await boardService.create({ name, code }); setName(''); setCode(''); await load(); toast({ title: 'Board added successfully' }) } catch (e: any) { toast({ title: 'Could not add board', description: e.message, variant: 'destructive' }) } finally { setSaving(false) } }
  const toggle = async (board: Board) => { try { await boardService.update(board.id, { name: board.name, code: board.code, is_active: !board.is_active }); await load(); toast({ title: board.is_active ? 'Board deactivated' : 'Board activated' }) } catch (e: any) { toast({ title: 'Could not update board', description: e.message, variant: 'destructive' }) } }
  const remove = async (board: Board) => { if (!window.confirm(`Delete ${board.name}? Boards already assigned to records cannot be deleted.`)) return; try { await boardService.remove(board.id); await load(); toast({ title: 'Board deleted' }) } catch (e: any) { toast({ title: 'Could not delete board', description: e.message, variant: 'destructive' }) } }
  return <div className="mx-auto max-w-4xl space-y-6"><div><h1 className="text-3xl font-bold text-primary">Admin Settings</h1><p className="mt-2 text-muted-foreground">Manage the education boards available to students and learning content.</p></div><section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4"><div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/><h2 className="text-xl font-semibold">Education Boards</h2></div><div className="grid gap-4 md:grid-cols-[1fr_180px_auto] items-end"><div className="space-y-1"><Label htmlFor="board-name">Board name</Label><Input id="board-name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Gujarat Board (GSEB)" /></div><div className="space-y-1"><Label htmlFor="board-code">Code</Label><Input id="board-code" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="GSEB" /></div><Button onClick={add} disabled={saving}><Plus className="mr-2 h-4 w-4"/>Add board</Button></div><p className="text-xs text-muted-foreground">Boards marked inactive stay attached to existing records but are hidden from new selections.</p>{loading ? <p>Loading boards…</p> : <div className="divide-y rounded-xl border">{boards.map(board=><div key={board.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div><p className="font-semibold">{board.name}</p><p className="text-xs text-muted-foreground">Code: {board.code} · {board.is_active ? 'Active' : 'Inactive'}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>void toggle(board)}>{board.is_active ? 'Deactivate' : 'Activate'}</Button><Button variant="ghost" size="icon" onClick={()=>void remove(board)} aria-label={`Delete ${board.name}`}><Trash2 className="h-4 w-4"/></Button></div></div>)}</div>}</section></div>
}
