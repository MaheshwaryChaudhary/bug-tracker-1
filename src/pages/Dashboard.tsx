import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Project, Ticket } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderKanban, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Calendar 
} from 'lucide-react';
import { format, isAfter, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

// Interfaces for the context
interface DashboardContext {
  projects: Project[];
  tasks: Ticket[];
  refreshProjects: () => void;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const context = useOutletContext<DashboardContext>();
  
  // Local state for the dynamic card
  const [upcomingTasks, setUpcomingTasks] = useState<Ticket[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Stats and project data from context
  const projects = context?.projects || [];
  const allTasks = context?.tasks || [];

  useEffect(() => {
    if (user) {
      fetchUpcomingTasks();
    }
  }, [user]);

  const fetchUpcomingTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
        .limit(10); 

      if (error) throw error;

      if (data) {
        const today = startOfToday();
        const filtered = (data as Ticket[])
          .filter(task => 
            task.due_date && 
            (task.status as string) !== 'completed' &&
            (isAfter(new Date(task.due_date), today) || 
             format(new Date(task.due_date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
          )
          .slice(0, 5);
        
        setUpcomingTasks(filtered);
      }
    } catch (error) {
      console.error('Error fetching dashboard tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Dynamic stats calculation
  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      subtitle: `${projects.length} active`,
      icon: FolderKanban,
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      valueColor: '',
    },
    {
      title: 'Completed Tasks',
      value: allTasks.filter(t => (t.status as string) === 'completed').length,
      subtitle: allTasks.length > 0 
        ? `${Math.round((allTasks.filter(t => (t.status as string) === 'completed').length / allTasks.length) * 100)}% complete` 
        : '0%',
      icon: CheckCircle2,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      valueColor: '',
    },
    {
      title: 'In Progress',
      value: allTasks.filter(t => (t.status as string) === 'in-progress' || (t.status as string) === 'todo').length,
      subtitle: 'Active tasks',
      icon: Clock,
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      valueColor: '',
    },
    {
      title: 'Overdue',
      value: allTasks.filter(t => {
        const dueDate = t.due_date ? new Date(t.due_date) : null;
        return (t.status as string) !== 'completed' && dueDate && dueDate < startOfToday();
      }).length,
      subtitle: 'Tasks past due',
      icon: AlertTriangle,
      iconBg: 'bg-destructive/20',
      iconColor: 'text-destructive',
      valueColor: 'text-destructive',
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here's an overview of your projects.
          </p>
        </div>
        <Button asChild>
          <Link to="/projects">
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{stat.title}</p>
                  <p className={cn("text-2xl font-bold", stat.valueColor)}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", stat.iconBg)}>
                  <stat.icon className={cn("w-4 h-4", stat.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="py-12 text-center">
                <FolderKanban className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">No projects yet</p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/projects">Create your first project</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <Link 
                    key={project.id} 
                    to={`/project/${project.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">Upcoming Tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar" className="text-xs">View Calendar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 w-full animate-pulse bg-secondary/20 rounded-lg" />
                ))}
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No upcoming tasks scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-transparent hover:border-primary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        task.priority === 'critical' ? 'bg-destructive' : 
                        task.priority === 'high' ? 'bg-amber-500' : 'bg-blue-500'
                      )} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {task.due_date ? format(new Date(task.due_date), 'MMM d, h:mm a') : 'No date'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link to={`/calendar?date=${task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : ''}`}>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}