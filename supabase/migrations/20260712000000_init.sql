-- Create roles enum if not exist
-- Tables setup

-- 1. profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'accounting', 'site_manager', 'subcontractor', 'sales')),
    affiliate_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code TEXT UNIQUE NOT NULL,
    vinhomes_block TEXT NOT NULL,
    vinhomes_floor_căn TEXT NOT NULL,
    client_name TEXT NOT NULL,
    sales_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    site_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subcontractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    vin_subsidy NUMERIC(15, 2) GENERATED ALWAYS AS (total_amount * 0.06) STORED,
    status TEXT NOT NULL CHECK (status IN ('pending_design', 'in_production', 'qc_inspection', 'completed')) DEFAULT 'pending_design',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. bom_materials Table
CREATE TABLE IF NOT EXISTS public.bom_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    item_name TEXT NOT NULL,
    allocated_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    disbursed_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(project_id, sku)
);

-- 4. material_requests Table
CREATE TABLE IF NOT EXISTS public.material_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    requested_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL CHECK (status IN ('pending_approval', 'approved', 'disbursed_in_warehouse')) DEFAULT 'pending_approval',
    is_over_budget BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_image_url TEXT,
    qr_code_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. site_reports Table
CREATE TABLE IF NOT EXISTS public.site_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    gps_latitude NUMERIC(10, 8) NOT NULL,
    gps_longitude NUMERIC(11, 8) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    qc_status TEXT NOT NULL CHECK (qc_status IN ('pending', 'passed', 'failed')) DEFAULT 'pending',
    qc_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. audit_logs Table (Immutable Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Commissions Table (for sales tracking)
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sales_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0200, -- e.g. 2%
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

---
--- TRIGGERS & FUNCTIONS
---

-- Automatic updated_at column handler
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER handle_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER handle_bom_materials_updated_at BEFORE UPDATE ON public.bom_materials FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER handle_material_requests_updated_at BEFORE UPDATE ON public.material_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER handle_site_reports_updated_at BEFORE UPDATE ON public.site_reports FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER handle_commissions_updated_at BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-generate affiliate code for sales roles
CREATE OR REPLACE FUNCTION public.generate_sales_affiliate_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN := FALSE;
BEGIN
    IF NEW.role = 'sales' AND NEW.affiliate_code IS NULL THEN
        WHILE NOT done LOOP
            -- Generate a random code like SALE-XXXX
            new_code := 'SALE-' || UPPER(substring(md5(random()::text) from 1 for 6));
            -- Check unique constraint
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE affiliate_code = new_code) THEN
                NEW.affiliate_code := new_code;
                done := TRUE;
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_affiliate BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.generate_sales_affiliate_code();

-- Protect Audit Logs from UPDATE and DELETE
CREATE OR REPLACE FUNCTION public.protect_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_protect_audit_logs BEFORE UPDATE OR DELETE ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION public.protect_audit_logs();

-- Helper function to get role of current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

---
--- ROW LEVEL SECURITY (RLS) POLICIES
---

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are readable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles can only be managed by Admins" 
ON public.profiles FOR ALL TO authenticated USING (public.get_user_role() = 'admin');

-- Projects Policies
CREATE POLICY "Projects Select Policy" 
ON public.projects FOR SELECT TO authenticated 
USING (
    public.get_user_role() IN ('admin', 'accounting') 
    OR site_manager_id = auth.uid() 
    OR subcontractor_id = auth.uid() 
    OR sales_id = auth.uid()
);

CREATE POLICY "Projects Insert/Delete Policy" 
ON public.projects FOR INSERT OR DELETE TO authenticated 
WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Projects Update Policy" 
ON public.projects FOR UPDATE TO authenticated 
USING (
    public.get_user_role() IN ('admin', 'accounting') 
    OR site_manager_id = auth.uid()
    OR subcontractor_id = auth.uid()
)
WITH CHECK (
    public.get_user_role() IN ('admin', 'accounting') 
    OR site_manager_id = auth.uid()
    -- Subcontractor can only update project to qc_inspection state when requesting QC
    OR (subcontractor_id = auth.uid() AND status = 'qc_inspection')
);

-- BOM Materials Policies
CREATE POLICY "BOM Materials Select Policy" 
ON public.bom_materials FOR SELECT TO authenticated 
USING (
    public.get_user_role() IN ('admin', 'accounting', 'site_manager') 
    OR EXISTS (
        SELECT 1 FROM public.projects 
        WHERE id = bom_materials.project_id AND subcontractor_id = auth.uid()
    )
);

CREATE POLICY "BOM Materials Admin Write Policy" 
ON public.bom_materials FOR ALL TO authenticated 
USING (public.get_user_role() = 'admin');

-- Material Requests Policies
CREATE POLICY "Material Requests Select Policy" 
ON public.material_requests FOR SELECT TO authenticated 
USING (
    public.get_user_role() IN ('admin', 'accounting', 'site_manager') 
    OR subcontractor_id = auth.uid()
);

CREATE POLICY "Material Requests Subcontractor Insert Policy" 
ON public.material_requests FOR INSERT TO authenticated 
WITH CHECK (
    public.get_user_role() = 'subcontractor' 
    AND subcontractor_id = auth.uid()
);

CREATE POLICY "Material Requests Write Policy" 
ON public.material_requests FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('admin', 'site_manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'site_manager'));

-- Site Reports Policies
CREATE POLICY "Site Reports Select Policy" 
ON public.site_reports FOR SELECT TO authenticated 
USING (
    public.get_user_role() IN ('admin', 'accounting', 'site_manager') 
    OR subcontractor_id = auth.uid()
);

CREATE POLICY "Site Reports Subcontractor Insert Policy" 
ON public.site_reports FOR INSERT TO authenticated 
WITH CHECK (
    public.get_user_role() = 'subcontractor' 
    AND subcontractor_id = auth.uid()
);

CREATE POLICY "Site Reports Site Manager Update Policy" 
ON public.site_reports FOR UPDATE TO authenticated 
USING (public.get_user_role() IN ('admin', 'site_manager'))
WITH CHECK (public.get_user_role() IN ('admin', 'site_manager'));

-- Audit Logs Policies
CREATE POLICY "Audit Logs Admin Read Policy" 
ON public.audit_logs FOR SELECT TO authenticated 
USING (public.get_user_role() = 'admin');

CREATE POLICY "Audit Logs Insert Policy" 
ON public.audit_logs FOR INSERT TO authenticated 
WITH CHECK (true);

-- Commissions Policies
CREATE POLICY "Commissions Read Policy" 
ON public.commissions FOR SELECT TO authenticated 
USING (
    public.get_user_role() IN ('admin', 'accounting') 
    OR sales_id = auth.uid()
);

CREATE POLICY "Commissions Admin Write Policy" 
ON public.commissions FOR ALL TO authenticated 
USING (public.get_user_role() = 'admin');
