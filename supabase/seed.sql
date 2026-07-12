-- Seed script to populate mock profiles, projects, BOM materials, and reports for testing
-- Note: UUIDs here can be used in auth.users when testing locally or through a sandbox login override

-- Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data if any (for fresh seed)
TRUNCATE TABLE public.commissions CASCADE;
TRUNCATE TABLE public.site_reports CASCADE;
TRUNCATE TABLE public.material_requests CASCADE;
TRUNCATE TABLE public.bom_materials CASCADE;
TRUNCATE TABLE public.projects CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Insert Mock Profiles
-- In real Supabase, these id values should match auth.users.id
-- For testing, we generate standard UUIDs
INSERT INTO public.profiles (id, phone_number, full_name, role, affiliate_code) VALUES
('a0000000-0000-0000-0000-000000000001', '0900000001', 'Nguyễn Duy Quang (Chủ tịch)', 'admin', NULL),
('a0000000-0000-0000-0000-000000000002', '0900000002', 'Lê Kế Toán (Accounting)', 'accounting', NULL),
('a0000000-0000-0000-0000-000000000003', '0900000003', 'Trần Văn Giám Sát (Site Manager Hậu Nghĩa)', 'site_manager', NULL),
('a0000000-0000-0000-0000-000000000004', '0900000004', 'Thầu Phụ Hùng Vương (Subcontractor)', 'subcontractor', NULL),
('a0000000-0000-0000-0000-000000000005', '0900000005', 'Phạm Hoàng Nam (Sales Agent)', 'SALE-NAM86');

-- Insert Mock Projects
INSERT INTO public.projects (id, project_code, vinhomes_block, vinhomes_floor_căn, client_name, sales_id, site_manager_id, subcontractor_id, total_amount, status) VALUES
('p0000000-0000-0000-0000-000000000001', 'PRJ-HAUNGHIA-101', 'Tòa Golden Silk - Phân khu 1', 'Tầng 12 - Căn 1205', 'Phan Văn Trị', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 350000000.00, 'pending_design'),
('p0000000-0000-0000-0000-000000000002', 'PRJ-HAUNGHIA-102', 'Tòa Ruby Plaza - Phân khu 2', 'Tầng 08 - Căn 08A1', 'Hoàng Thị Hoa', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 450000000.00, 'in_production'),
('p0000000-0000-0000-0000-000000000003', 'PRJ-HAUNGHIA-103', 'Tòa Golden Silk - Phân khu 1', 'Tầng 15 - Căn 1502', 'Nguyễn Thị Bình', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 600000000.00, 'qc_inspection'),
('p0000000-0000-0000-0000-000000000004', 'PRJ-HAUNGHIA-104', 'Tòa Diamond Center', 'Tầng 20 - Căn 2011', 'Trịnh Quốc Bảo', 'a0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 800000000.00, 'completed');

-- Insert Mock BOM Materials (for PRJ-HAUNGHIA-102 & 103)
-- Items from supplier "An Cường" and "Kohler"
INSERT INTO public.bom_materials (id, project_id, sku, item_name, allocated_quantity, disbursed_quantity, unit) VALUES
-- For Project 102
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'AC-WD-402', 'Gỗ công nghiệp Melamine An Cường MS 402', 45.00, 15.00, 'Mét tới'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'BL-DAMP-05', 'Ray trượt giảm chấn Blum 500mm', 10.00, 4.00, 'Bộ'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'DL-UX-18', 'Sơn nội thất Dulux EasyClean trần/tường', 12.00, 6.00, 'Thùng'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'KH-SNK-99', 'Bồn rửa chén Kohler K-5432-1', 1.00, 0.00, 'Bộ'),
-- For Project 103
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'AC-WD-402', 'Gỗ công nghiệp Melamine An Cường MS 402', 60.00, 60.00, 'Mét tới'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'BL-DAMP-05', 'Ray trượt giảm chấn Blum 500mm', 15.00, 15.00, 'Bộ'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'DL-UX-18', 'Sơn nội thất Dulux EasyClean trần/tường', 20.00, 20.00, 'Thùng'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'KH-SNK-99', 'Bồn rửa chén Kohler K-5432-1', 2.00, 2.00, 'Bộ');

-- Insert Mock Material Requests (for PRJ-HAUNGHIA-102)
INSERT INTO public.material_requests (id, project_id, subcontractor_id, sku, requested_quantity, status, is_over_budget, evidence_image_url) VALUES
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'AC-WD-402', 15.00, 'disbursed_in_warehouse', FALSE, NULL),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'BL-DAMP-05', 4.00, 'disbursed_in_warehouse', FALSE, NULL),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'DL-UX-18', 6.00, 'disbursed_in_warehouse', FALSE, NULL),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'BL-DAMP-05', 2.00, 'pending_approval', TRUE, 'https://example.com/evidence_broken_hinges.jpg');

-- Insert Mock Site Reports (for PRJ-HAUNGHIA-103)
INSERT INTO public.site_reports (id, project_id, subcontractor_id, image_url, gps_latitude, gps_longitude, qc_status, qc_notes) VALUES
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'https://example.com/report1.jpg', 10.87910500, 106.54123500, 'passed', 'Đã lắp ráp phần khung trần gỗ thạch cao khít phẳng.'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'https://example.com/report2.jpg', 10.87912200, 106.54124000, 'pending', NULL);

-- Insert Mock Commissions
INSERT INTO public.commissions (id, project_id, sales_id, commission_rate, amount, status) VALUES
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005', 0.02, 7000000.00, 'pending'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005', 0.02, 9000000.00, 'pending'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000005', 0.02, 12000000.00, 'approved'),
(gen_random_uuid(), 'p0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005', 0.02, 16000000.00, 'paid');
