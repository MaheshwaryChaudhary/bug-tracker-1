-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Create project invitations table
CREATE TABLE public.project_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, email)
);

-- Enable RLS on project invitations
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for invitations
CREATE POLICY "Project admins can manage invitations"
ON public.project_invitations FOR ALL
USING (is_project_admin(auth.uid(), project_id));

CREATE POLICY "Users can view invitations sent to their email"
ON public.project_invitations FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Function to create notification on ticket changes
CREATE OR REPLACE FUNCTION public.notify_on_ticket_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_name TEXT;
  _user_ids UUID[];
BEGIN
  -- Get project name
  SELECT name INTO _project_name FROM public.projects WHERE id = NEW.project_id;
  
  -- Get all project members except the actor
  SELECT array_agg(user_id) INTO _user_ids 
  FROM public.user_roles 
  WHERE project_id = NEW.project_id AND user_id != auth.uid();
  
  -- Create notifications for each member
  IF _user_ids IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, project_id, ticket_id)
    SELECT 
      unnest(_user_ids),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'ticket_created'
        ELSE 'ticket_updated'
      END,
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'New ticket created'
        ELSE 'Ticket updated'
      END,
      NEW.title || ' in ' || _project_name,
      NEW.project_id,
      NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for ticket notifications
CREATE TRIGGER on_ticket_change
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_ticket_change();

-- Function to create notification on comment
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ticket_title TEXT;
  _project_id UUID;
  _user_ids UUID[];
BEGIN
  -- Get ticket info
  SELECT title, project_id INTO _ticket_title, _project_id 
  FROM public.tickets WHERE id = NEW.ticket_id;
  
  -- Get all project members except commenter
  SELECT array_agg(user_id) INTO _user_ids 
  FROM public.user_roles 
  WHERE project_id = _project_id AND user_id != NEW.user_id;
  
  -- Create notifications
  IF _user_ids IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, project_id, ticket_id)
    SELECT 
      unnest(_user_ids),
      'comment_added',
      'New comment on ticket',
      _ticket_title,
      _project_id,
      NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment notifications
CREATE TRIGGER on_comment_added
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_comment();