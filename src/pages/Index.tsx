import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Bug, ArrowRight, Kanban, Users, Zap } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Kanban,
      title: 'Kanban Boards',
      description: 'Visualize your workflow with drag-and-drop kanban boards.',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members and collaborate in real-time.',
    },
    {
      icon: Zap,
      title: 'Fast & Intuitive',
      description: 'Built for speed with a modern, clean interface.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background -z-10" />
        
        <div className="animate-fade-in space-y-6 max-w-3xl">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center glow">
            <Bug className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold">
            <span className="gradient-text">Track Bugs.</span>
            <br />
            Ship Faster.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            A modern issue tracker inspired by Linear and Jira. 
            Manage projects, track bugs, and collaborate with your team.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card rounded-xl p-6 text-center space-y-4 animate-fade-in"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-6 text-center text-sm text-muted-foreground border-t border-border">
        <p>Built with Lovable • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
