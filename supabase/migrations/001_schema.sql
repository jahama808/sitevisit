-- profiles
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text UNIQUE NOT NULL,
  email      text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name  text NOT NULL DEFAULT '',
  role       text NOT NULL DEFAULT 'requester'
               CHECK (role IN ('admin', 'manager', 'requester', 'designer')),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- designer_profiles
CREATE TABLE designer_profiles (
  id                       bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id                  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  island_preferences       jsonb NOT NULL DEFAULT '[]',
  additional_preferences   text NOT NULL DEFAULT '',
  active                   boolean NOT NULL DEFAULT true
);

ALTER TABLE designer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read designer_profiles"
  ON designer_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage designer_profiles"
  ON designer_profiles FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- site_visit_requests
CREATE TABLE site_visit_requests (
  id                            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  property_name                 text NOT NULL,
  island                        text NOT NULL CHECK (island IN ('Oahu', 'Maui', 'Kauai', 'Hawaii')),
  property_address              text NOT NULL DEFAULT '',
  building_count                integer,
  floor_count                   integer,
  internet_connections          integer,
  property_contact_name         text NOT NULL DEFAULT '',
  property_contact_phone        text NOT NULL DEFAULT '',
  date_requested                date,
  date_performed                date,
  date_completed                date,
  preferred_start               timestamptz NOT NULL,
  preferred_end                 timestamptz,
  detailed_description          text NOT NULL DEFAULT '',
  scope_fiber_enablement_pathing boolean NOT NULL DEFAULT false,
  scope_common_area_requirements boolean NOT NULL DEFAULT false,
  notes                         text NOT NULL DEFAULT '',
  install_plan_url              text NOT NULL DEFAULT '',
  attachment_path               text,
  submitted_by                  uuid NOT NULL REFERENCES profiles(id),
  assigned_designer             uuid REFERENCES profiles(id),
  assigned_by                   uuid REFERENCES profiles(id),
  status                        text NOT NULL DEFAULT 'new',
  request_status                text NOT NULL DEFAULT 'received',
  wiring_plan_status            text NOT NULL DEFAULT 'in_progress',
  costs_status                  text NOT NULL DEFAULT 'in_progress',
  admin_override                boolean NOT NULL DEFAULT false,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_visit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read visits"
  ON site_visit_requests FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create visits"
  ON site_visit_requests FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin/manager/submitter can update visits"
  ON site_visit_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
    OR submitted_by = auth.uid()
  );

CREATE POLICY "Admin/manager can delete visits"
  ON site_visit_requests FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON site_visit_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- visit_change_events
CREATE TABLE visit_change_events (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type text NOT NULL,
  visit_id   bigint NOT NULL REFERENCES site_visit_requests(id) ON DELETE CASCADE,
  actor_id   uuid REFERENCES profiles(id),
  payload    jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visit_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read change events"
  ON visit_change_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert change events"
  ON visit_change_events FOR INSERT TO authenticated WITH CHECK (true);

-- api_tokens
CREATE TABLE api_tokens (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  token      text UNIQUE NOT NULL,
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage api_tokens"
  ON api_tokens FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('request-pdfs', 'request-pdfs', false);

CREATE POLICY "Authenticated users can upload PDFs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'request-pdfs');

CREATE POLICY "Authenticated users can read PDFs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'request-pdfs');
