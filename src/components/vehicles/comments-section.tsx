'use client'

import * as React from 'react'
import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, Send, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { addVehicleComment } from '@/lib/actions/vehicles'
import { cn } from '@/lib/utils'

interface Comment {
  id: string
  content: string
  createdAt: Date
  user: {
    id: string
    name: string
  }
}

interface CommentsSectionProps {
  vehicleId: string
  comments: Comment[]
  className?: string
}

export function CommentsSection({
  vehicleId,
  comments,
  className,
}: CommentsSectionProps) {
  const t = useTranslations('vehicles')
  const tCommon = useTranslations('common')
  const [isPending, startTransition] = useTransition()
  const [newComment, setNewComment] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    startTransition(async () => {
      const result = await addVehicleComment(vehicleId, newComment.trim())

      if (result.success) {
        setNewComment('')
        toast({
          title: tCommon('success'),
          description: result.message,
          variant: 'success',
        })
      } else {
        toast({
          title: tCommon('error'),
          description: result.message,
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={t('addCommentPlaceholder')}
          rows={3}
          className="resize-none"
          disabled={isPending}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isPending || !newComment.trim()}
          >
            <Send className="mr-2 h-4 w-4" />
            {isPending ? tCommon('loading') : t('addComment')}
          </Button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('noComments')}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
