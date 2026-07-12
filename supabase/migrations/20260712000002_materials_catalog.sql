-- Migration: Add Materials Catalog Table
CREATE TABLE IF NOT EXISTS public.materials_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    price NUMERIC(12,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.materials_catalog ENABLE ROW LEVEL SECURITY;

-- Everyone can view the materials catalog
CREATE POLICY "Allow public read materials_catalog"
    ON public.materials_catalog FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only Admin can insert/update/delete catalog items
CREATE POLICY "Allow admin modify materials_catalog"
    ON public.materials_catalog FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Seed Catalog Items
INSERT INTO public.materials_catalog (sku, name, brand, price, unit, image_url, description)
VALUES
    ('AC-WD-402', 'Gỗ công nghiệp Melamine An Cường MS 402', 'An Cường', 4200000.00, 'Mét tới', 'https://example.com/wood_ac.jpg', 'Ván gỗ MDF chống ẩm bề mặt phủ Melamine cao cấp màu vân gỗ tự nhiên.'),
    ('BL-DAMP-05', 'Bản lề giảm chấn Blum Clip Top Blumotion', 'Blum', 350000.00, 'Bộ', 'https://example.com/hinge_blum.jpg', 'Bản lề hơi giảm chấn lắp nhanh chất liệu inox 304 siêu bền.'),
    ('DL-UX-18', 'Sơn nội thất Dulux EasyClean lau chùi hiệu quả', 'Dulux', 1200000.00, 'Thùng', 'https://example.com/paint_dulux.jpg', 'Sơn tường nội thất cao cấp chống bám bẩn và dễ dàng vệ sinh.'),
    ('KH-SNK-99', 'Bồn rửa chén Kohler Cairn âm bàn bếp', 'Kohler', 7800000.00, 'Bộ', 'https://example.com/sink_kohler.jpg', 'Bồn rửa chén đá thạch anh đúc cao cấp Kohler chống trầy xước.');
