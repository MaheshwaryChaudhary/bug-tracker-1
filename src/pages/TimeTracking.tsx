import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
// Added Plus and removed unused Timer if necessary, but kept for your UI
import { Clock, Play, Pause, RotateCcw, Timer, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TimeTracking() {
  // --- STATE ---
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessions, setSessions] = useState<{ duration: number; endedAt: Date }[]>([]);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- HANDLERS ---
  const handleStartStop = () => {
    if (isRunning && elapsedTime > 0) {
      setSessions(prev => [{ duration: elapsedTime, endedAt: new Date() }, ...prev]);
      setElapsedTime(0); // Optional: reset timer after saving session
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
  };

  const handleAddManualSession = (hours: number, minutes: number, seconds: number) => {
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
    if (totalSeconds > 0) {
      setSessions(prev => [{ duration: totalSeconds, endedAt: new Date() }, ...prev]);
      setIsManualOpen(false);
    }
  };

  const totalTime = sessions.reduce((acc, s) => acc + s.duration, 0) + (isRunning ? elapsedTime : 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Manual Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Time Tracking</h1>
          <p className="text-muted-foreground text-sm">Track time spent on tasks and projects.</p>
        </div>

        <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Session
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Manual Session</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleAddManualSession(
                Number(formData.get('h')),
                Number(formData.get('m')),
                Number(formData.get('s'))
              );
            }}>
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="h">Hours</Label>
                  <Input id="h" name="h" type="number" defaultValue="0" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m">Minutes</Label>
                  <Input id="m" name="m" type="number" defaultValue="0" min="0" max="59" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s">Seconds</Label>
                  <Input id="s" name="s" type="number" defaultValue="0" min="0" max="59" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Session</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              Stopwatch
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div className={cn(
              'text-6xl font-mono font-bold mb-8 transition-colors',
              isRunning && 'text-primary'
            )}>
              {formatTime(elapsedTime)}
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                variant={isRunning ? 'destructive' : 'default'}
                onClick={handleStartStop}
                className="w-32"
              >
                {isRunning ? (
                  <><Pause className="h-5 w-5 mr-2" /> Stop</>
                ) : (
                  <><Play className="h-5 w-5 mr-2" /> Start</>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
                disabled={elapsedTime === 0 && !isRunning}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-1">Total Time Today</p>
              <p className="text-4xl font-mono font-bold text-primary">{formatTime(totalTime)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold">{sessions.length}</p>
                <p className="text-sm text-muted-foreground">Sessions</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="text-2xl font-bold">
                  {sessions.length > 0 ? formatTime(Math.floor(totalTime / sessions.length)) : '00:00:00'}
                </p>
                <p className="text-sm text-muted-foreground">Avg. Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions recorded yet. Start the timer to track your work.
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Session {sessions.length - index}</p>
                      <p className="text-sm text-muted-foreground">Ended {session.endedAt.toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <span className="font-mono text-lg">{formatTime(session.duration)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}