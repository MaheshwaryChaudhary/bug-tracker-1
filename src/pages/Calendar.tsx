import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Ticket, TicketPriority } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  AlertCircle, 
  Minus, 
  ArrowDown, 
  Plus, 
  Clock, 
  Trash2,
  CheckCircle2 
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateCalendarTaskDialog } from '@/components/calendar/CreateCalendarTaskDialog';
import { toast } from 'sonner';

const priorityConfig: Record<TicketPriority, { icon: React.ElementType; className: string }> = {
  critical: { icon: AlertTriangle, className: 'priority-critical' },
  high: { icon: AlertCircle, className: 'priority-high' },
  medium: { icon: Minus, className: 'priority-medium' },
  low: { icon: ArrowDown, className: 'priority-low' },
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .not('due_date', 'is', null);

    if (!error && data) {
      setTickets(data as Ticket[]);
    }
    setIsLoading(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', taskId);
      if (error) throw error;
      toast.success('Task deleted successfully');
      fetchTickets();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
    }
  };

  // --- CALENDAR MATH ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();

  const paddedDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - i - 1);
      days.push(date);
    }
    days.push(...daysInMonth);
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  }, [currentMonth]);

  const ticketsByDate = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    tickets.forEach(ticket => {
      if (ticket.due_date) {
        const dateKey = format(new Date(ticket.due_date), 'yyyy-MM-dd');
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(ticket);
      }
    });
    return map;
  }, [tickets]);

  const selectedDateTickets = selectedDate
    ? ticketsByDate[format(selectedDate, 'yyyy-MM-dd')] || []
    : [];

  // --- GROUPING LOGIC FOR SIDEBAR ---
  const groupedSelectedTickets = useMemo(() => {
    return {
      todo: selectedDateTickets.filter(t => ['todo', 'open', 'backlog'].includes(t.status.toLowerCase())),
      in_progress: selectedDateTickets.filter(t => ['in_progress', 'in-progress', 'doing'].includes(t.status.toLowerCase())),
      done: selectedDateTickets.filter(t => ['completed', 'done', 'closed'].includes(t.status.toLowerCase()))
    };
  }, [selectedDateTickets]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Calendar</h1>
          <p className="text-muted-foreground text-sm">Track your progress and daily tasks.</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Task
        </Button>
      </div>

      <CreateCalendarTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialDate={selectedDate}
        onSuccess={fetchTickets}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Card */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayTickets = ticketsByDate[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'relative h-24 p-2 rounded-lg border border-transparent transition-all text-left overflow-hidden',
                      isCurrentMonth ? 'bg-secondary/30 hover:bg-secondary/50' : 'bg-secondary/10 text-muted-foreground/30',
                      isSelected && 'border-primary bg-primary/10',
                      isTodayDate && 'ring-2 ring-primary/50'
                    )}
                  >
                    <span className={cn('text-xs font-bold', isTodayDate && 'text-primary')}>{format(day, 'd')}</span>
                    <div className="mt-1 space-y-1">
                      {dayTickets.slice(0, 2).map(ticket => (
                        <div key={ticket.id} className={cn('text-[9px] px-1 py-0.5 rounded truncate flex items-center gap-1', priorityConfig[ticket.priority].className)}>
                          <span className="truncate">{ticket.title}</span>
                        </div>
                      ))}
                      {dayTickets.length > 2 && <p className="text-[8px] text-muted-foreground">+{dayTickets.length - 2} more</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar: Work Details */}
        <Card className="glass-card flex flex-col h-[650px]">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4 space-y-6">
            {!selectedDate ? (
              <div className="text-center py-20 text-muted-foreground">Click a date to see your work details.</div>
            ) : selectedDateTickets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-muted-foreground mb-4">No tasks found for this day.</p>
                <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>Add Activity</Button>
              </div>
            ) : (
              <>
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-secondary/40 p-2 rounded text-center">
                    <p className="text-[10px] text-muted-foreground">Todo</p>
                    <p className="text-sm font-bold">{groupedSelectedTickets.todo.length}</p>
                  </div>
                  <div className="bg-blue-500/10 p-2 rounded text-center">
                    <p className="text-[10px] text-blue-500">Progress</p>
                    <p className="text-sm font-bold text-blue-600">{groupedSelectedTickets.in_progress.length}</p>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded text-center">
                    <p className="text-[10px] text-green-600">Done</p>
                    <p className="text-sm font-bold text-green-600">{groupedSelectedTickets.done.length}</p>
                  </div>
                </div>

                {/* Task Sections */}
                <div className="space-y-6">
                  {groupedSelectedTickets.in_progress.length > 0 && (
                    <Section label="In Progress" color="text-blue-500" icon={<Clock className="h-3 w-3" />}>
                      {groupedSelectedTickets.in_progress.map(t => (
                        <TaskItem key={t.id} ticket={t} onDelete={handleDeleteTask} />
                      ))}
                    </Section>
                  )}

                  {groupedSelectedTickets.done.length > 0 && (
                    <Section label="Work Done" color="text-green-600" icon={<CheckCircle2 className="h-3 w-3" />}>
                      {groupedSelectedTickets.done.map(t => (
                        <TaskItem key={t.id} ticket={t} onDelete={handleDeleteTask} isDone />
                      ))}
                    </Section>
                  )}

                  {groupedSelectedTickets.todo.length > 0 && (
                    <Section label="Upcoming" color="text-muted-foreground" icon={<Minus className="h-3 w-3" />}>
                      {groupedSelectedTickets.todo.map(t => (
                        <TaskItem key={t.id} ticket={t} onDelete={handleDeleteTask} />
                      ))}
                    </Section>
                  )}
                </div>
              </>
            )}
          </CardContent>
          {selectedDate && (
            <div className="p-4 border-t">
              <Button className="w-full" variant="secondary" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// Helpers
function Section({ label, color, icon, children }: { label: string, color: string, icon: any, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-2", color)}>
        {icon} {label}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TaskItem({ ticket, onDelete, isDone }: { ticket: Ticket, onDelete: (id: string) => void, isDone?: boolean }) {
  const PriorityIcon = priorityConfig[ticket.priority].icon;
  return (
    <div className={cn("group relative p-3 rounded-md border transition-all", isDone ? "bg-green-500/5 border-green-500/10" : "bg-secondary/20 border-border")}>
      <div className="flex justify-between items-start">
        <Badge variant="outline" className={cn("text-[8px] h-4 px-1", priorityConfig[ticket.priority].className)}>
          <PriorityIcon className="h-2 w-2 mr-1" /> {ticket.priority}
        </Badge>
        <button onClick={() => onDelete(ticket.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <p className={cn("text-xs font-semibold mt-2", isDone && "line-through text-muted-foreground")}>{ticket.title}</p>
      <p className="text-[10px] text-muted-foreground mt-1">Status: {ticket.status.replace('_', ' ')}</p>
    </div>
  );
}