-- Migration: Add Vendor Evaluations Table
CREATE TABLE IF NOT EXISTS public.vendor_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    evaluated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    quality_score NUMERIC(3,2) CHECK (quality_score >= 0 AND quality_score <= 10),
    speed_score NUMERIC(3,2) CHECK (speed_score >= 0 AND speed_score <= 10),
    reworks_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vendor_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Everyone authenticated can view evaluations (transparency for dashboards)
CREATE POLICY "Allow authenticated read vendor_evaluations"
    ON public.vendor_evaluations FOR SELECT
    TO authenticated
    USING (true);

-- 2. Only Admins and Site Managers can write evaluations
CREATE POLICY "Allow admin/site-manager insert vendor_evaluations"
    ON public.vendor_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'site_manager')
        )
    );

-- 3. Only Admins can update/delete evaluations
CREATE POLICY "Allow admin modify vendor_evaluations"
    ON public.vendor_evaluations FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Pre-seed some evaluations for Sandbox (matching the seeded subcontractor profiles)
INSERT INTO public.vendor_evaluations (vendor_id, evaluated_by, quality_score, speed_score, reworks_count, notes)
VALUES 
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 9.2, 9.5, 2, 'Thầu phụ Hùng Vương thi công gỗ An Cường rất sắc nét, đúng thời hạn bàn giao căn mẫu.'),
    ('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000003', 8.0, 7.8, 4, 'Sơn bả thạch cao đợt đầu hơi loang lổ màu, đã yêu cầu sơn lại lớp phủ Dulux.');
