import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/database';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CreateCalendarTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date | null;
  onSuccess: () => void;
}

export function CreateCalendarTaskDialog({
  open,
  onOpenChange,
  initialDate,
  onSuccess,
}: CreateCalendarTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      fetchProjects();
    }
  }, [open, user]);

  useEffect(() => {
    if (initialDate) {
      const dateStr = format(initialDate, "yyyy-MM-dd'T'HH:mm");
      setDueDateTime(dateStr);
    } else {
      const now = new Date();
      setDueDateTime(format(now, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [initialDate, open]);

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name');

    if (!error && data) {
      setProjects(data);
      if (data.length > 0 && !projectId) {
        setProjectId(data[0].id);
      }
    }
    setIsLoadingProjects(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user || !projectId || !dueDateTime) return;

    setIsLoading(true);
    
    // Store full timestamp with time
    const dueDateTimestamp = new Date(dueDateTime).toISOString();
    
    const { error } = await supabase.from('tickets').insert({
      project_id: projectId,
      title: title.trim(),
      due_date: dueDateTimestamp,
      priority: 'medium',
      status: 'todo',
      created_by: user.id,
    });
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create task',
        description: error.message,
      });
    } else {
      toast({
        title: 'Task scheduled!',
        description: `"${title}" has been added to the calendar.`,
      });
      setTitle('');
      setDueDateTime('');
      onSuccess();
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle>Schedule New Task</DialogTitle>
          <DialogDescription>
            Add a new task with a due date to your calendar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No projects found. Create a project first.
              </p>
            ) : (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-title">Task Title</Label>
            <Input
              id="task-title"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <div className="relative">
              <Input
                id="due-date"
                type="datetime-local"
                value={dueDateTime}
                onChange={(e) => setDueDateTime(e.target.value)}
                className="bg-secondary/50"
                required
              />
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !title.trim() || !projectId || projects.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save to Calendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
