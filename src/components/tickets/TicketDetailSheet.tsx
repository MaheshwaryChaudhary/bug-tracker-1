import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, TicketStatus, TicketPriority, Comment, Profile } from '@/types/database';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertTriangle, AlertCircle, Minus, ArrowDown, Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketDetailSheetProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: () => void;
}

interface CommentWithProfile extends Comment {
  profile?: Profile;
}

const priorityConfig: Record<TicketPriority, { icon: React.ElementType; className: string; label: string }> = {
  critical: { icon: AlertTriangle, className: 'priority-critical', label: 'Critical' },
  high: { icon: AlertCircle, className: 'priority-high', label: 'High' },
  medium: { icon: Minus, className: 'priority-medium', label: 'Medium' },
  low: { icon: ArrowDown, className: 'priority-low', label: 'Low' },
};

export function TicketDetailSheet({ ticket, open, onOpenChange, onUpdate, onDelete }: TicketDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TicketStatus>('todo');
  const [priority, setPriority] = useState<TicketPriority>('medium');
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description || '');
      setStatus(ticket.status);
      setPriority(ticket.priority);
      fetchComments();
    }
  }, [ticket]);

  const fetchComments = async () => {
    if (!ticket) return;

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Fetch profiles for each comment
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      const commentsWithProfiles = data.map(comment => ({
        ...comment,
        profile: profiles?.find(p => p.user_id === comment.user_id) as Profile | undefined,
      }));

      setComments(commentsWithProfiles);
    }
  };

  const handleUpdate = async () => {
    if (!ticket) return;

    setIsUpdating(true);
    const { error } = await supabase
      .from('tickets')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
      })
      .eq('id', ticket.id);
    setIsUpdating(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update ticket',
        description: error.message,
      });
    } else {
      toast({ title: 'Ticket updated!' });
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!ticket) return;

    setIsDeleting(true);
    const { error } = await supabase.from('tickets').delete().eq('id', ticket.id);
    setIsDeleting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete ticket',
        description: error.message,
      });
    } else {
      toast({ title: 'Ticket deleted' });
      onDelete();
      onOpenChange(false);
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !newComment.trim() || !user) return;

    setIsCommenting(true);
    const { error } = await supabase.from('comments').insert({
      ticket_id: ticket.id,
      user_id: user.id,
      content: newComment.trim(),
    });
    setIsCommenting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add comment',
        description: error.message,
      });
    } else {
      setNewComment('');
      fetchComments();
    }
  };

  if (!ticket) return null;

  const PriorityIcon = priorityConfig[priority].icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="sr-only">Ticket Details</SheetTitle>
          <SheetDescription className="sr-only">
            View and edit ticket details
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-secondary/50 border-0 focus-visible:ring-1"
              placeholder="Ticket title"
            />
          </div>

          {/* Status & Priority */}
          <div className="flex gap-3">
            <Select value={status} onValueChange={(v) => setStatus(v as TicketStatus)}>
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="outline" className={cn('ml-auto', priorityConfig[priority].className)}>
              <PriorityIcon className="w-3 h-3 mr-1" />
              {priorityConfig[priority].label}
            </Badge>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary/50 resize-none min-h-[100px]"
              placeholder="Add a description..."
            />
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
            <span>Updated {format(new Date(ticket.updated_at), 'MMM d, yyyy')}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleUpdate} disabled={isUpdating} className="flex-1">
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </Button>
          </div>

          <Separator />

          {/* Comments */}
          <div className="space-y-4">
            <h4 className="font-medium">Comments</h4>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {comment.profile?.display_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-secondary/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {comment.profile?.display_name || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-secondary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <Button size="icon" onClick={handleAddComment} disabled={isCommenting || !newComment.trim()}>
                {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
