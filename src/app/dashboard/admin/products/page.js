'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Suppliers list
const SUPPLIERS = ['An Cường', 'Blum', 'Dulux', 'Kohler', 'QiPrime', 'Euroto'];

// Category mappings
const CATEGORIES_L1 = [
  'Đồ gỗ liền tường',
  'Đồ rời',
  'Thiết bị vệ sinh',
  'Đồ decor nghệ thuật',
  'Vật liệu thô (Sơn/Thạch cao)'
];

const CATEGORIES_L2 = {
  'Đồ gỗ liền tường': ['Tủ bếp', 'Tủ quần áo', 'Kệ tivi', 'Hệ vách ốp'],
  'Đồ rời': ['Sofa', 'Giường ngủ', 'Bàn ăn', 'Bàn trà', 'Ghế thư giãn'],
  'Thiết bị vệ sinh': ['Bồn rửa chén', 'Bồn cầu thông minh', 'Sen tắm nhiệt độ', 'Vòi lavabo'],
  'Đồ decor nghệ thuật': ['Đèn chùm', 'Tranh ảnh', 'Rèm cửa', 'Cây xanh trang trí'],
  'Vật liệu thô (Sơn/Thạch cao)': ['Sơn nội thất', 'Tấm thạch cao', 'Sơn lót chống thấm']
};

export default function AdminProductsDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  // Products catalog states
  const [productsList, setProductsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create / Edit modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState('');

  // Form inputs matching requirements
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [catL1, setCatL1] = useState(CATEGORIES_L1[0]);
  const [catL2, setCatL2] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState('');
  
  // Media states
  const [imageUrl, setImageUrl] = useState('/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg');
  const [mediaGallery, setMediaGallery] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [dragging, setDragging] = useState(false);

  // Pricing & Logistics
  const [importPrice, setImportPrice] = useState(10000000);
  const [listedPrice, setListedPrice] = useState(15000000);
  const [inStockQty, setInStockQty] = useState(10);
  const [allowPreOrder, setAllowPreOrder] = useState(false);
  const [preOrderLeadDays, setPreOrderLeadDays] = useState('7 - 10 ngày');

  // Advanced features
  const [aiTags, setAiTags] = useState('');
  const [uom, setUom] = useState('Bộ'); // Bộ, Cái, Mét tới, Thùng, Chiếc
  const [shelfLocation, setShelfLocation] = useState('Kệ A1 - Kho Hậu Nghĩa');
  const [isActive, setIsActive] = useState(true);

  // Load Admin Authentication & Products
  useEffect(() => {
    const stored = localStorage.getItem('qihome_user_profile');
    if (!stored) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== 'admin' && user.role !== 'accounting') {
      router.push('/');
      return;
    }
    setProfile(user);
    checkConnection();
  }, [router]);

  // Adjust level 2 category automatically when level 1 changes
  useEffect(() => {
    const options = CATEGORIES_L2[catL1] || [];
    if (options.length > 0) {
      setCatL2(options[0]);
    }
  }, [catL1]);

  const checkConnection = async () => {
    const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id');
    setIsLive(isConfigured);
    loadProducts(isConfigured);
  };

  const loadProducts = async (useLiveDb) => {
    let localSaved = localStorage.getItem('qihome_custom_products');
    let parsedLocal = localSaved ? JSON.parse(localSaved) : [];

    if (useLiveDb) {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (!error && data && data.length > 0) {
          setProductsList(data);
          return;
        }
      } catch (err) {
        console.warn('Failed querying products table, using storage fallbacks:', err.message);
      }
    }

    // Combine static default products with custom local ones for sandbox view
    const defaultData = [
      { id: '1', sku: 'SF-LTH-01', name: 'Sofa Da Cao Cấp Indochine', supplier: 'QiPrime', catL1: 'Đồ rời', catL2: 'Sofa', importPrice: 20000000, price: 28000000, listedPrice: 28000000, unit: 'Bộ', inStockQty: 5, allowPreOrder: false, imageUrl: '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg', shelfLocation: 'Kệ A1 - Kho Hậu Nghĩa', isActive: true, aiTags: 'sofa da, màu nâu, indochine, phòng khách', desc: 'Khung gỗ sồi Ý, bọc da bò nhập khẩu.', specs: '2m4 x 0.9m' },
      { id: '2', sku: 'LT-CHR-02', name: 'Đèn Chùm Pha Lê Indochine', supplier: 'Euroto', catL1: 'Đồ decor nghệ thuật', catL2: 'Đèn chùm', importPrice: 11000000, price: 15000000, listedPrice: 15000000, unit: 'Bộ', inStockQty: 3, allowPreOrder: true, preOrderLeadDays: '7 ngày', imageUrl: '/images/365c4c688df7b1f8f2b304bdc8d8f8ee.jpg', shelfLocation: 'Kệ B3 - Kho Hậu Nghĩa', isActive: true, aiTags: 'đèn chùm, pha lê, cổ điển, ánh sáng ấm', desc: 'Đồng thau + Pha lê K9 cao cấp.', specs: 'Đường kính 80cm' }
    ];

    // Merge default and local
    const merged = [...parsedLocal, ...defaultData.filter(d => !parsedLocal.some(p => p.sku === d.sku))];
    setProductsList(merged);
  };

  // Dynamic profit margin percentage
  const calculateMargin = () => {
    if (listedPrice <= 0) return 0;
    const diff = listedPrice - importPrice;
    return Math.round((diff / listedPrice) * 100);
  };

  // Simulated drag-and-drop file upload to S3
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    
    // Simulate AWS S3 upload link return
    const randomImg = [
      '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg',
      '/images/cb17520f98fa50444b4d580964fc69e7.jpg',
      '/images/306d8ed842d197c34447a81976615549.jpg',
      '/images/1626aee735a6d69aa16af41338600615.jpg'
    ][Math.floor(Math.random() * 4)];

    setImageUrl(randomImg);
    setMediaGallery([...mediaGallery, randomImg]);
    alert('📤 Đã tải tệp lên AWS S3 tại đường dẫn bucket /products thành công!');
  };

  // Open creation form
  const handleOpenAddForm = () => {
    setIsEditMode(false);
    setSku('SP-AC-' + Date.now().toString().slice(-4));
    setName('');
    setSupplier(SUPPLIERS[0]);
    setCatL1(CATEGORIES_L1[0]);
    setDescription('');
    setSpecs('');
    setImageUrl('/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg');
    setMediaGallery(['/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg']);
    setVideoUrl('');
    setImportPrice(8000000);
    setListedPrice(12000000);
    setInStockQty(12);
    setAllowPreOrder(false);
    setPreOrderLeadDays('7 ngày');
    setAiTags('');
    setUom('Cái');
    setShelfLocation('Kệ A1 - Kho Hậu Nghĩa');
    setIsActive(true);
    setShowFormModal(true);
  };

  // Open edit form
  const handleOpenEditForm = (item) => {
    setIsEditMode(true);
    setCurrentId(item.id);
    setSku(item.sku);
    setName(item.name);
    setSupplier(item.supplier || SUPPLIERS[0]);
    setCatL1(item.catL1 || CATEGORIES_L1[0]);
    setCatL2(item.catL2 || '');
    setDescription(item.desc || item.description || '');
    setSpecs(item.specs || '');
    setImageUrl(item.imageUrl || item.image || '/images/3ba7aecadbb591ec3ea1c15a853362f5.jpg');
    setMediaGallery(item.gallery || [item.imageUrl || item.image]);
    setVideoUrl(item.videoUrl || '');
    setImportPrice(item.importPrice || Math.round(item.price * 0.7));
    setListedPrice(item.listedPrice || item.price || 0);
    setInStockQty(item.inStockQty || 0);
    setAllowPreOrder(item.allowPreOrder || false);
    setPreOrderLeadDays(item.preOrderLeadDays || '7 ngày');
    setAiTags(item.aiTags || '');
    setUom(item.unit || 'Cái');
    setShelfLocation(item.shelfLocation || 'Kệ A1 - Kho Hậu Nghĩa');
    setIsActive(item.isActive !== undefined ? item.isActive : true);
    setShowFormModal(true);
  };

  // Delete product
  const handleDeleteProduct = async (id, targetSku) => {
    const confirm = window.confirm(`🗑️ Bạn chắc chắn muốn xóa sản phẩm ${targetSku} khỏi hệ thống?`);
    if (!confirm) return;

    if (isLive) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('DB delete error, processing locally:', err.message);
      }
    }

    let localSaved = localStorage.getItem('qihome_custom_products');
    let parsedLocal = localSaved ? JSON.parse(localSaved) : [];
    let updatedLocal = parsedLocal.filter(p => p.sku !== targetSku);
    localStorage.setItem('qihome_custom_products', JSON.stringify(updatedLocal));

    alert('Đã xóa sản phẩm thành công!');
    loadProducts(isLive);
  };

  // Submit add/edit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!sku.trim()) {
      alert('Vui lòng điền mã sản phẩm SKU');
      return;
    }

    const payload = {
      id: isEditMode ? currentId : 'prod-' + Date.now(),
      sku,
      name,
      supplier,
      catL1,
      catL2,
      desc: description,
      specs,
      image: imageUrl,
      imageUrl,
      gallery: mediaGallery.length > 0 ? mediaGallery : [imageUrl],
      videoUrl,
      importPrice: Number(importPrice),
      price: Number(listedPrice),
      listedPrice: Number(listedPrice),
      inStockQty: Number(inStockQty),
      allowPreOrder,
      preOrderLeadDays,
      aiTags,
      unit: uom,
      shelfLocation,
      isActive
    };

    if (isLive) {
      try {
        if (isEditMode) {
          const { error } = await supabase.from('products').update(payload).eq('id', currentId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert([payload]);
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Supabase products table insert error, fallback to local storage:', err.message);
      }
    }

    // Save to local storage for local sync
    let localSaved = localStorage.getItem('qihome_custom_products');
    let parsedLocal = localSaved ? JSON.parse(localSaved) : [];
    
    if (isEditMode) {
      parsedLocal = parsedLocal.map(p => p.id === currentId || p.sku === sku ? payload : p);
    } else {
      parsedLocal = [payload, ...parsedLocal];
    }
    
    localStorage.setItem('qihome_custom_products', JSON.stringify(parsedLocal));

    alert(isEditMode ? 'Cập nhật sản phẩm thành công!' : 'Tạo mới sản phẩm thành công!');
    setShowFormModal(false);
    loadProducts(isLive);
  };

  const filteredProducts = productsList.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen text-slate-800 flex flex-col md:flex-row relative overflow-hidden bg-[#faf8f5]">
      
      {/* SIDEBAR PANEL */}
      <aside className="w-full md:w-64 bg-[#14151b] border-r border-[#262832] flex flex-col z-10 relative">
        <div className="p-6 border-b border-[#262832] flex items-center space-x-3">
          <span className="font-bold text-2xl tracking-wider text-[#c49a62] bg-[#c49a62]/10 border border-[#c49a62]/20 px-2 py-0.5 rounded-xl">Qi</span>
          <span className="font-bold text-base text-white tracking-tight">QiHome.vn</span>
        </div>

        <div className="px-6 py-6 border-b border-[#262832] flex items-center space-x-3 text-white">
          <div className="w-10 h-10 rounded-full bg-[#c49a62]/20 border border-[#c49a62]/40 flex items-center justify-center font-bold text-[#c49a62] text-sm">
            AD
          </div>
          <div>
            <div className="text-xs font-bold text-white">{profile?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-500">Cấu hình Hệ thống</div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 mb-2 tracking-wider">
            Quản trị & Giám sát
          </div>
          
          <Link
            href="/dashboard/admin"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/40 transition duration-200"
          >
            <span>📊</span>
            <span>Tiến Độ Dự Án</span>
          </Link>

          <Link
            href="/dashboard/admin"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/40 transition duration-200"
          >
            <span>👥</span>
            <span>Danh Sách Khách Hàng</span>
          </Link>

          <Link
            href="/dashboard/admin"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/40 transition duration-200"
          >
            <span>🤝</span>
            <span>Đối Tác</span>
          </Link>

          {/* Active custom products link */}
          <Link
            href="/dashboard/admin/products"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#c49a62] text-white shadow-lg shadow-[#c49a62]/20 transition duration-200"
          >
            <span>📦</span>
            <span>Quản Lý Vật Tư</span>
          </Link>

          <Link
            href="/dashboard/admin"
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-900/40 transition duration-200"
          >
            <span>🔔</span>
            <span>Đơn Cần Duyệt</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-[#262832]">
          <Link
            href="/"
            className="w-full bg-[#1c1d25] hover:bg-slate-900 border border-slate-800 rounded-xl py-2.5 text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center space-x-2"
          >
            <span>Quay lại Storefront</span>
          </Link>
        </div>
      </aside>

      {/* CONTENT PANEL */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto z-10 relative">
        <header className="h-16 border-b border-[#ebdcb9] bg-white px-8 flex justify-between items-center sticky top-0 z-20">
          <h1 className="font-bold text-sm text-slate-800">Quản Lý Danh Mục Vật Tư & Thiết Bị</h1>
          
          <button
            onClick={handleOpenAddForm}
            className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-md"
          >
            + Thêm Sản Phẩm Mới
          </button>
        </header>

        <main className="p-8 space-y-6 flex-1">
          {/* Top Search Filter */}
          <div className="bg-white border border-[#ebdcb9] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Tìm kiếm vật tư theo SKU, tên, nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-850 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500 font-bold">Hiển thị: {filteredProducts.length} sản phẩm</span>
          </div>

          {/* Table display */}
          <div className="bg-white border border-[#ebdcb9] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#ebdcb9] bg-[#faf8f5] text-slate-500 font-semibold uppercase">
                    <th className="py-3 px-4">Ảnh</th>
                    <th className="py-3 px-4">Mã SKU</th>
                    <th className="py-3 px-4">Tên Sản Phẩm</th>
                    <th className="py-3 px-4">Hãng/Supplier</th>
                    <th className="py-3 px-4 text-right">Giá Nhập (Gốc)</th>
                    <th className="py-3 px-4 text-right">Giá Bán Niêm Yết</th>
                    <th className="py-3 px-4 text-center">Tồn Kho</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {filteredProducts.map((item) => {
                    const margin = item.listedPrice ? Math.round(((item.listedPrice - item.importPrice) / item.listedPrice) * 100) : 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#ebdcb9] bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl || item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-550">{item.sku}</td>
                        <td className="py-3 px-4 text-slate-900">
                          <div>{item.name}</div>
                          <span className="text-[9px] text-[#c49a62] bg-[#c49a62]/10 px-1.5 py-0.5 rounded border border-[#ebdcb9]/40 mt-1 inline-block uppercase font-bold">
                            {item.catL1} / {item.catL2}
                          </span>
                        </td>
                        <td className="py-3 px-4">{item.supplier}</td>
                        <td className="py-3 px-4 text-right text-red-500 font-mono">
                          {item.importPrice?.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-[#c49a62]">
                          {item.listedPrice?.toLocaleString('vi-VN')}đ
                          <span className="block text-[8px] text-emerald-600 font-bold">Margin: {margin}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.inStockQty > 0 ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-bold rounded">
                              Còn Hàng ({item.inStockQty})
                            </span>
                          ) : item.allowPreOrder ? (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[9px] font-bold rounded">
                              Pre-order ({item.preOrderLeadDays})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-500/10 text-red-600 border border-red-500/20 text-[9px] font-bold rounded">
                              Hết Hàng
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                            item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {item.isActive ? 'ĐANG BÁN' : 'ĐÃ ẨN'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="text-xs text-[#c49a62] hover:underline"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id, item.sku)}
                              className="text-xs text-red-500 hover:underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* FORM INPUT MODAL FOR ADD / EDIT PRODUCTS */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex justify-center items-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-[#ebdcb9] rounded-3xl w-full max-w-4xl p-6 relative text-slate-800 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 border-b border-slate-150 pb-3 mb-6">
              {isEditMode ? `⚙️ Chỉnh sửa sản phẩm: ${sku}` : '➕ Thêm sản phẩm nội thất mới'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-6 text-xs font-semibold">
              
              {/* Section 1: Core Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mã sản phẩm (SKU) *</label>
                  <input
                    type="text"
                    required
                    disabled={isEditMode}
                    placeholder="Ví dụ: SP-AC-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Tên sản phẩm E-Commerce *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Sofa Da Cao Cấp Indochine"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 2: Supplier & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nhà cung cấp (Supplier)</label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    {SUPPLIERS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Hạng mục chính (L1)</label>
                  <select
                    value={catL1}
                    onChange={(e) => setCatL1(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    {CATEGORIES_L1.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Hạng mục phụ (L2)</label>
                  <select
                    value={catL2}
                    onChange={(e) => setCatL2(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                  >
                    {(CATEGORIES_L2[catL1] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3: Media upload S3 drag drop */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Quản lý hình ảnh & Media (Kéo thả upload lên AWS S3)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                    dragging ? 'border-[#c49a62] bg-[#c49a62]/10' : 'border-[#ebdcb9] bg-[#faf8f5]'
                  }`}
                >
                  <div className="text-2xl mb-1">📤</div>
                  <p className="text-xs text-slate-600">Kéo thả tệp ảnh vào đây để upload lên AWS S3 `/products` bucket</p>
                  <p className="text-[10px] text-slate-400 mt-1">* Hệ thống giả lập tự tạo URL S3 an toàn</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Đường dẫn hình ảnh chính</label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-1.5 text-[10px] font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">Link Youtube/Tiktok review</label>
                    <input
                      type="text"
                      placeholder="https://youtube.com/watch?..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-1.5 text-[10px] font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Pricing & Margin dynamically calculated */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#faf8f5] p-4 rounded-2xl border border-[#ebdcb9]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Giá nhập kho (Giá gốc) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 10000000"
                    value={importPrice}
                    onChange={(e) => setImportPrice(Number(e.target.value))}
                    className="w-full bg-white border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs font-mono text-red-500 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">* Chỉ Admin/Kế toán nhìn thấy</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Giá bán niêm yết E-Com *</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 15000000"
                    value={listedPrice}
                    onChange={(e) => setListedPrice(Number(e.target.value))}
                    className="w-full bg-white border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs font-mono text-[#c49a62] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-550 block">Biên lợi nhuận định mức</span>
                  <strong className="text-xl font-black text-emerald-600 mt-1">{calculateMargin()}%</strong>
                </div>
              </div>

              {/* Section 5: Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Số lượng tồn thực tế</label>
                  <input
                    type="number"
                    value={inStockQty}
                    onChange={(e) => setInStockQty(Number(e.target.value))}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="allowPreOrder"
                    checked={allowPreOrder}
                    onChange={(e) => setAllowPreOrder(e.target.checked)}
                    className="rounded text-[#c49a62] focus:ring-[#c49a62]"
                  />
                  <label htmlFor="allowPreOrder" className="text-[11px] text-slate-700 cursor-pointer">Cho phép đặt hàng sản xuất trước</label>
                </div>

                {allowPreOrder && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Thời gian sản xuất dự kiến</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 7 - 10 ngày"
                      value={preOrderLeadDays}
                      onChange={(e) => setPreOrderLeadDays(e.target.value)}
                      className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Section 6: Advanced details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Bộ từ khóa gợi ý AI Prompt *</label>
                  <input
                    type="text"
                    placeholder="sofa da, màu nâu, indochine, phòng khách"
                    value={aiTags}
                    onChange={(e) => setAiTags(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">* Tách bằng dấu phẩy để AI mapping tự động</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Đơn vị tính (UoM)</label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="Bộ">Bộ</option>
                    <option value="Cái">Cái</option>
                    <option value="Mét tới">Mét tới</option>
                    <option value="Thùng">Thùng</option>
                    <option value="Chiếc">Chiếc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Vị trí lưu kho kệ hàng</label>
                  <input
                    type="text"
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Rich description fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Mô tả sản phẩm chi tiết</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả chất liệu, nguồn gốc xuất xứ..."
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Thông số kỹ thuật chi tiết</label>
                  <textarea
                    value={specs}
                    onChange={(e) => setSpecs(e.target.value)}
                    placeholder="Kích thước cụ thể, tải trọng, hướng dẫn vệ sinh..."
                    className="w-full bg-[#faf8f5] border border-[#ebdcb9] rounded-xl px-3 py-2 text-xs focus:outline-none h-20 resize-none"
                  />
                </div>
              </div>

              {/* Publish Toggle & Submit */}
              <div className="pt-4 border-t border-slate-150 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-12 h-6 rounded-full p-0.5 transition ${
                      isActive ? 'bg-[#c49a62]' : 'bg-slate-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition duration-200 ${
                      isActive ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                  <span className="text-xs text-slate-700 font-bold">Kích hoạt mở bán (Hiển thị trên E-com)</span>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-xl transition"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-[#c49a62] hover:bg-[#b08752] text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md"
                  >
                    {isEditMode ? 'Cập Nhật' : 'Lưu Sản Phẩm'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
