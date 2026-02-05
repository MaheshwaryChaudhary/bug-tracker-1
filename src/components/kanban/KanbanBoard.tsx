import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Ticket, TicketStatus } from '@/types/database';
import { TicketCard } from './TicketCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketMove: (ticketId: string, newStatus: TicketStatus) => void;
  onTicketClick: (ticket: Ticket) => void;
  onCreateTicket: (status: TicketStatus) => void;
}

const columns: { id: TicketStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'text-muted-foreground' },
  { id: 'in_progress', title: 'In Progress', color: 'text-primary' },
  { id: 'done', title: 'Done', color: 'text-green-500' },
];

export function KanbanBoard({ tickets, onTicketMove, onTicketClick, onCreateTicket }: KanbanBoardProps) {
  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets
      .filter((ticket) => ticket.status === status)
      .sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TicketStatus;

    onTicketMove(draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {columns.map((column) => {
          const columnTickets = getTicketsByStatus(column.id);
          
          return (
            <div key={column.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className={cn('font-semibold', column.color)}>{column.title}</h3>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {columnTickets.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onCreateTicket(column.id)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 rounded-lg p-2 space-y-2 min-h-[200px] transition-colors',
                      'bg-secondary/30 border border-transparent',
                      snapshot.isDraggingOver && 'border-primary/50 bg-primary/5'
                    )}
                  >
                    {columnTickets.map((ticket, index) => (
                      <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => onTicketClick(ticket)}
                          >
                            <TicketCard ticket={ticket} isDragging={snapshot.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
