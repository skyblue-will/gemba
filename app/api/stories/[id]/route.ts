import { NextRequest, NextResponse } from 'next/server'
import { updateStory, updateStoryRoles } from '@/lib/queries'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { roleIds, ...updates } = await request.json()
  const story = await updateStory(id, updates)
  if (!story) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (roleIds && Array.isArray(roleIds)) {
    await updateStoryRoles(id, roleIds)
  }
  return NextResponse.json(story)
}
