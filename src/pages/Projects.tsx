import { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Project } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus, Trash2 } from 'lucide-react'; 
import { format } from 'date-fns';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
// UPDATE: Changed this path to the standard location. 
// If your file is in 'lib', ensure the file 'src/lib/supabase.ts' actually exists.
import { supabase } from '@/integrations/supabase/client'; 
import { toast } from 'sonner'; 

interface ProjectsContext {
  projects: Project[];
  refreshProjects: () => void;
}

export default function Projects() {
  const { projects, refreshProjects } = useOutletContext<ProjectsContext>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 

    if (!confirm('Are you sure you want to delete this project?')) {
      return;
    }

    setIsDeleting(projectId);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project deleted successfully');
      refreshProjects();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleProjectCreated = () => {
    setIsCreateDialogOpen(false);
    refreshProjects();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Manage all your projects in one place.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to start tracking bugs and issues.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} to={`/project/${project.id}`}>
              <Card className="glass-card hover:border-primary/50 transition-colors cursor-pointer h-full group relative">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                        <FolderKanban className="w-5 h-5 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {project.description || 'No description'}
                        </CardDescription>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isDeleting === project.id}
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      <Trash2 className={`w-4 h-4 ${isDeleting === project.id ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {format(new Date(project.created_at), 'MMM d, yyyy')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}