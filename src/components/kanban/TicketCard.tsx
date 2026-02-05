import { Ticket, TicketPriority } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, AlertCircle, Minus, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TicketCardProps {
  ticket: Ticket;
  isDragging?: boolean;
}

const priorityConfig: Record<TicketPriority, { icon: React.ElementType; className: string; label: string }> = {
  critical: { icon: AlertTriangle, className: 'priority-critical', label: 'Critical' },
  high: { icon: AlertCircle, className: 'priority-high', label: 'High' },
  medium: { icon: Minus, className: 'priority-medium', label: 'Medium' },
  low: { icon: ArrowDown, className: 'priority-low', label: 'Low' },
};

export function TicketCard({ ticket, isDragging }: TicketCardProps) {
  const priority = priorityConfig[ticket.priority];
  const PriorityIcon = priority.icon;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary/50',
        'bg-card/80 backdrop-blur-sm',
        isDragging && 'shadow-xl shadow-primary/20 rotate-2 scale-105'
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight line-clamp-2">{ticket.title}</h4>
        </div>

        {ticket.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge variant="outline" className={cn('text-xs', priority.className)}>
            <PriorityIcon className="w-3 h-3 mr-1" />
            {priority.label}
          </Badge>

          {ticket.due_date && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {format(new Date(ticket.due_date), 'MMM d')}
            </div>
          )}
        </div>

        {ticket.labels && ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.slice(0, 3).map((label) => (
              <Badge key={label} variant="secondary" className="text-xs px-1.5 py-0">
                {label}
              </Badge>
            ))}
            {ticket.labels.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{ticket.labels.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
