"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  FileJson,
  Minimize2,
  Maximize2,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Headphones,
  Speaker,
  Home,
  Shirt,
  Monitor,
  Smartphone,
  Camera,
  Gamepad2,
  Watch,
  Footprints,
  Gem,
  Baby,
  UtensilsCrossed,
  BookOpen,
  Palette,
  Dumbbell,
  X,
  Check,
  TrendingUp,
  Cloud,
  Database,
  Eye,
  Download,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EditTab = "general" | "seo" | "display" | "history";

type IconComponent = React.FC<{
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}>;

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  iconComponent: IconComponent;
  color: string;
  productCount: number;
  description: string;
  parentId: string | null;
  visible: boolean;
  metaTitle: string;
  metaDescription: string;
  children: Category[];
};

// ─── Data ────────────────────────────────────────────────────────────────────

const ICON_OPTIONS: { name: string; icon: IconComponent }[] = [
  { name: "Monitor", icon: Monitor }, { name: "Headphones", icon: Headphones }, { name: "Speaker", icon: Speaker },
  { name: "Smartphone", icon: Smartphone }, { name: "Camera", icon: Camera }, { name: "Gamepad", icon: Gamepad2 },
  { name: "Watch", icon: Watch }, { name: "Home", icon: Home }, { name: "Shirt", icon: Shirt },
  { name: "Footprints", icon: Footprints }, { name: "Gem", icon: Gem }, { name: "Baby", icon: Baby },
  { name: "Utensils", icon: UtensilsCrossed }, { name: "Book", icon: BookOpen }, { name: "Palette", icon: Palette },
  { name: "Dumbbell", icon: Dumbbell },
];

const CATEGORY_TREE: Category[] = [
  {
    id: "cat-1", name: "Electronics", slug: "electronics", icon: "Monitor", iconComponent: Monitor, color: "#8B5CF6", productCount: 12, description: "Electronic devices, gadgets, and accessories.", parentId: null, visible: true, metaTitle: "Electronics - Shop Latest Devices", metaDescription: "Browse our collection of electronics and gadgets.",
    children: [
      {
        id: "cat-1-1", name: "Audio", slug: "electronics-audio", icon: "Headphones", iconComponent: Headphones, color: "#8B5CF6", productCount: 8, description: "Audio equipment and accessories for audiophiles.", parentId: "cat-1", visible: true, metaTitle: "Audio Equipment - Premium Sound", metaDescription: "Find premium audio equipment and accessories.",
        children: [
          { id: "cat-1-1-1", name: "Headphones", slug: "electronics-audio-headphones", icon: "Headphones", iconComponent: Headphones, color: "#8B5AF6", productCount: 5, description: "High-fidelity over-ear and in-ear audio devices for enthusiasts.", parentId: "cat-1-1", visible: true, metaTitle: "Headphones - Best Audio Experience", metaDescription: "Shop premium headphones for music lovers.", children: [] },
          { id: "cat-1-1-2", name: "Speakers", slug: "electronics-audio-speakers", icon: "Speaker", iconComponent: Speaker, color: "#8B5CF6", productCount: 3, description: "Portable and home speakers for every occasion.", parentId: "cat-1-1", visible: true, metaTitle: "Speakers - Room-Filling Sound", metaDescription: "Browse our collection of portable and home speakers.", children: [] },
        ],
      },
      { id: "cat-1-2", name: "Smartphones", slug: "electronics-smartphones", icon: "Smartphone", iconComponent: Smartphone, color: "#3B82F6", productCount: 4, description: "Latest smartphones and mobile accessories.", parentId: "cat-1", visible: true, metaTitle: "Smartphones - Latest Models", metaDescription: "Find the latest smartphones and accessories.", children: [] },
    ],
  },
  {
    id: "cat-2", name: "Home & Living", slug: "home-living", icon: "Home", iconComponent: Home, color: "#F59E0B", productCount: 45, description: "Furniture, décor, and home essentials.", parentId: null, visible: true, metaTitle: "Home & Living - Décor & Essentials", metaDescription: "Transform your space with our home & living collection.",
    children: [
      { id: "cat-2-1", name: "Furniture", slug: "home-living-furniture", icon: "Home", iconComponent: Home, color: "#F59E0B", productCount: 28, description: "Modern and classic furniture for every room.", parentId: "cat-2", visible: true, metaTitle: "Furniture - Modern & Classic", metaDescription: "Shop modern and classic furniture pieces.", children: [] },
      { id: "cat-2-2", name: "Kitchen", slug: "home-living-kitchen", icon: "Utensils", iconComponent: UtensilsCrossed, color: "#F59E0B", productCount: 17, description: "Kitchen appliances and cookware.", parentId: "cat-2", visible: true, metaTitle: "Kitchen - Appliances & Cookware", metaDescription: "Find kitchen appliances and cookware.", children: [] },
    ],
  },
  {
    id: "cat-3", name: "Fashion", slug: "fashion", icon: "Shirt", iconComponent: Shirt, color: "#EC4899", productCount: 128, description: "Clothing, footwear, and accessories.", parentId: null, visible: true, metaTitle: "Fashion - Trending Styles", metaDescription: "Discover the latest fashion trends and styles.",
    children: [
      { id: "cat-3-1", name: "Men's Clothing", slug: "fashion-mens", icon: "Shirt", iconComponent: Shirt, color: "#EC4899", productCount: 52, description: "Men's fashion and casual wear.", parentId: "cat-3", visible: true, metaTitle: "Men's Clothing - Style & Comfort", metaDescription: "Browse men's clothing collection.", children: [] },
      { id: "cat-3-2", name: "Women's Clothing", slug: "fashion-womens", icon: "Shirt", iconComponent: Shirt, color: "#EC4899", productCount: 64, description: "Women's fashion, dresses, and accessories.", parentId: "cat-3", visible: true, metaTitle: "Women's Clothing - Latest Trends", metaDescription: "Shop women's clothing and accessories.", children: [] },
      { id: "cat-3-3", name: "Footwear", slug: "fashion-footwear", icon: "Footprints", iconComponent: Footprints, color: "#EC4899", productCount: 12, description: "Shoes, boots, and sneakers for all occasions.", parentId: "cat-3", visible: true, metaTitle: "Footwear - Shoes & Sneakers", metaDescription: "Find shoes, boots, and sneakers.", children: [] },
    ],
  },
  { id: "cat-4", name: "Sports & Outdoors", slug: "sports-outdoors", icon: "Dumbbell", iconComponent: Dumbbell, color: "#10B981", productCount: 36, description: "Sports equipment and outdoor gear.", parentId: null, visible: true, metaTitle: "Sports & Outdoors - Active Gear", metaDescription: "Shop sports equipment and outdoor gear.", children: [] },
  { id: "cat-5", name: "Books & Media", slug: "books-media", icon: "Book", iconComponent: BookOpen, color: "#6366F1", productCount: 89, description: "Books, eBooks, music, and digital media.", parentId: null, visible: true, metaTitle: "Books & Media - Read & Listen", metaDescription: "Browse books, eBooks, and digital media.", children: [] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllCategories(cats: Category[]): Category[] {
  const result: Category[] = [];
  const recurse = (items: Category[]) => { for (const c of items) { result.push(c); if (c.children.length > 0) recurse(c.children); } };
  recurse(cats); return result;
}

function getBreadcrumb(cats: Category[], targetId: string): string[] {
  const path: string[] = [];
  const find = (items: Category[], trail: string[]): boolean => {
    for (const c of items) { const newTrail = [...trail, c.name]; if (c.id === targetId) { path.push(...newTrail); return true; } if (c.children.length > 0 && find(c.children, newTrail)) return true; }
    return false;
  };
  find(cats, []); return path;
}

function getParentName(cats: Category[], parentId: string | null): string {
  if (!parentId) return "None (Root)";
  return getAllCategories(cats).find((c) => c.id === parentId)?.name || "None";
}

const totalCats = getAllCategories(CATEGORY_TREE).length;

// ─── Tree Node ────────────────────────────────────────────────────────────────

function TreeNode({ category, depth, expanded, onToggle, selected, onSelect, checked, onCheck }: {
  category: Category; depth: number; expanded: Record<string, boolean>; onToggle: (id: string) => void;
  selected: string | null; onSelect: (cat: Category) => void; checked: Record<string, boolean>; onCheck: (id: string) => void;
}) {
  const isExpanded = expanded[category.id] ?? false;
  const hasChildren = category.children.length > 0;
  const isSelected = selected === category.id;
  const isChecked = checked[category.id] ?? false;
  const Icon = category.iconComponent;

  return (
    <div>
      <div className={`flex items-center gap-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer group ${isSelected ? "bg-violet-500/15 border border-violet-500/20" : "hover:bg-white/[0.03] border border-transparent"}`} style={{ paddingLeft: `${depth * 24 + 12}px` }} onClick={() => onSelect(category)}>
        <GripVertical size={12} className="text-gray-700 shrink-0 cursor-grab mr-1" />
        <button onClick={(e) => { e.stopPropagation(); onCheck(category.id); }} className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-all mr-1 ${isChecked ? "bg-violet-600 border-violet-600" : "border-white/10 hover:border-violet-500/40"}`}>
          {isChecked && <Check size={9} className="text-white" />}
        </button>
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); onToggle(category.id); }} className="text-gray-500 hover:text-white transition-colors shrink-0 mr-1">
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : <span className="w-[13px] mr-1 shrink-0" />}
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mr-2" style={{ backgroundColor: `${category.color}15` }}>
          <Icon size={12} style={{ color: category.color }} />
        </div>
        <span className={`flex-1 text-xs font-semibold truncate ${isSelected ? "text-violet-400" : "text-white"}`}>{category.name}</span>
        {isSelected ? (
          <span className="text-[9px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full shrink-0">Selected</span>
        ) : (
          <span className="text-[10px] font-medium text-gray-600 bg-white/5 px-2 py-0.5 rounded-full shrink-0">{category.productCount}</span>
        )}
      </div>
      {hasChildren && isExpanded && <div>{category.children.map((child) => (<TreeNode key={child.id} category={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} selected={selected} onSelect={onSelect} checked={checked} onCheck={onCheck} />))}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCategories() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "cat-1": true, "cat-1-1": true });
  const [selectedId, setSelectedId] = useState<string>("cat-1-1-1");
  const [checked, setChecked] = useState<Record<string, boolean>>({ "cat-1-1-1": true });
  const [editTab, setEditTab] = useState<EditTab>("general");
  const [showNewModal, setShowNewModal] = useState(false);

  const allCategories = getAllCategories(CATEGORY_TREE);
  const selectedCategory = allCategories.find((c) => c.id === selectedId) || null;
  const breadcrumb = selectedCategory ? getBreadcrumb(CATEGORY_TREE, selectedCategory.id) : [];
  const parentName = selectedCategory ? getParentName(CATEGORY_TREE, selectedCategory.parentId) : "";

  const toggleExpand = useCallback((id: string) => { setExpanded((prev) => ({ ...prev, [id]: !prev[id] })); }, []);
  const toggleCheck = useCallback((id: string) => { setChecked((prev) => ({ ...prev, [id]: !prev[id] })); }, []);

  const expandAll = () => { const all: Record<string, boolean> = {}; allCategories.forEach((c) => { if (c.children.length > 0) all[c.id] = true; }); setExpanded(all); };
  const collapseAll = () => setExpanded({});
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const editTabs: { key: EditTab; label: string }[] = [
    { key: "general", label: "General" }, { key: "seo", label: "SEO" }, { key: "display", label: "Display" }, { key: "history", label: "History" },
  ];

  return (
    <>
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left Panel: Category Tree */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden p-6 pr-3">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Category Tree</h1>
              <p className="text-xs text-gray-500 mt-0.5">Organize your store hierarchy with drag-and-drop ease.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"><Download size={12} /> Export</button>
              <button onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-95 shadow shadow-violet-900/40"><Plus size={12} /> New Category</button>
            </div>
          </div>

          {/* Selection actions */}
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#14121C] border border-white/5 mb-4 shrink-0">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Selection Actions:</span>
            <button className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${checkedCount > 0 ? "text-red-400 hover:text-red-300" : "text-gray-600 cursor-not-allowed"}`} disabled={checkedCount === 0}><Trash2 size={10} /> Delete</button>
            <button className={`flex items-center gap-1 text-[10px] font-bold transition-colors ${checkedCount > 0 ? "text-violet-400 hover:text-violet-300" : "text-gray-600 cursor-not-allowed"}`} disabled={checkedCount === 0}><FileJson size={10} /> Export JSON</button>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={expandAll} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all" title="Expand all"><Maximize2 size={12} /></button>
              <button onClick={collapseAll} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all" title="Collapse all"><Minimize2 size={12} /></button>
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto rounded-2xl bg-[#14121C] border border-white/5 p-3">
            <div className="space-y-0.5">
              {CATEGORY_TREE.map((cat) => (<TreeNode key={cat.id} category={cat} depth={0} expanded={expanded} onToggle={toggleExpand} selected={selectedId} onSelect={(c) => { setSelectedId(c.id); setEditTab("general"); }} checked={checked} onCheck={toggleCheck} />))}
            </div>
            <div className="text-center mt-4 pb-2"><button className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors">View All {totalCats} Categories</button></div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 shrink-0">
            <div className="flex items-center gap-4 text-[10px] text-gray-600"><span>© 2024 CatFlow CMS</span><span>·</span><button className="hover:text-gray-400 transition-colors">Privacy Policy</button><span>·</span><button className="hover:text-gray-400 transition-colors">Help Center</button></div>
            <div className="flex items-center gap-4 text-[10px] text-gray-600"><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /><Cloud size={9} /> Cloud Sync Active</span><span className="flex items-center gap-1"><Database size={9} /> API v2.4.0-stable</span></div>
          </div>
        </div>

        {/* Right Panel: Edit Category */}
        {selectedCategory && (
          <div className="w-[400px] shrink-0 flex flex-col border-l border-white/5 bg-[#0F0D1A] overflow-hidden animate-in">
            <div className="px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between mb-1"><h2 className="text-base font-bold text-white">Edit Category</h2><button onClick={() => setSelectedId("")} className="text-gray-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"><X size={14} /></button></div>
              <p className="text-[10px] text-gray-500">{breadcrumb.join(" > ")}</p>
            </div>

            <div className="px-5 pt-3 shrink-0">
              <div className="flex rounded-xl bg-white/5 border border-white/5 p-1 gap-0.5">
                {editTabs.map((tab) => (<button key={tab.key} onClick={() => setEditTab(tab.key)} className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all ${editTab === tab.key ? "bg-violet-600 text-white shadow shadow-violet-900/40" : "text-gray-500 hover:text-white"}`}>{tab.label}</button>))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {editTab === "general" && (
                <>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Category Title</label><input type="text" defaultValue={selectedCategory.name} className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors" /></div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">URL Slug</label><div className="flex items-center bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden focus-within:border-violet-500/40 transition-colors"><span className="px-3 text-[10px] text-gray-600 border-r border-white/5 py-2.5 bg-white/[0.02]">/store/</span><input type="text" defaultValue={selectedCategory.slug} className="flex-1 bg-transparent px-3 py-2.5 text-xs text-white outline-none" /></div></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Icon</label><div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2"><div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${selectedCategory.color}20` }}><selectedCategory.iconComponent size={12} style={{ color: selectedCategory.color }} /></div><span className="flex-1 text-xs text-white">{selectedCategory.icon}</span><ChevronDown size={10} className="text-gray-600" /></div></div>
                    <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Badge Color</label><div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2"><div className="w-5 h-5 rounded-md shrink-0" style={{ backgroundColor: selectedCategory.color }} /><span className="flex-1 text-xs text-gray-400 font-mono">{selectedCategory.color}</span></div></div>
                  </div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Parent Category</label><div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5"><span className="text-xs text-white">{parentName}</span><ChevronDown size={10} className="text-gray-600" /></div></div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Description</label><textarea defaultValue={selectedCategory.description} rows={3} className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-gray-300 outline-none focus:border-violet-500/40 transition-colors resize-none leading-relaxed" /></div>
                  <label className="flex items-center gap-2 cursor-pointer group"><div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedCategory.visible ? "bg-violet-600 border-violet-600" : "border-white/10"}`}>{selectedCategory.visible && <Check size={10} className="text-white" />}</div><span className="text-xs text-gray-300 group-hover:text-white transition-colors">Visible in navigation menu</span></label>
                </>
              )}
              {editTab === "seo" && (
                <>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Meta Title</label><input type="text" defaultValue={selectedCategory.metaTitle} className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors" /><p className="text-[9px] text-gray-600 mt-1">{selectedCategory.metaTitle.length}/60 characters</p></div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Meta Description</label><textarea defaultValue={selectedCategory.metaDescription} rows={3} className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-gray-300 outline-none focus:border-violet-500/40 transition-colors resize-none leading-relaxed" /><p className="text-[9px] text-gray-600 mt-1">{selectedCategory.metaDescription.length}/160 characters</p></div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Canonical URL</label><input type="text" defaultValue={`/store/${selectedCategory.slug}`} className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-gray-300 outline-none focus:border-violet-500/40 transition-colors" /></div>
                  <label className="flex items-center gap-2 cursor-pointer"><div className="w-4 h-4 rounded border bg-violet-600 border-violet-600 flex items-center justify-center"><Check size={10} className="text-white" /></div><span className="text-xs text-gray-300">Index this page in search engines</span></label>
                </>
              )}
              {editTab === "display" && (
                <>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Layout Template</label><div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5"><span className="text-xs text-white">Grid View</span><ChevronDown size={10} className="text-gray-600" /></div></div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Products per Page</label><input type="number" defaultValue={24} className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors" /></div>
                  <div><label className="text-[10px] text-gray-500 font-semibold mb-1.5 block">Sort Order</label><div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5"><span className="text-xs text-white">Best Sellers</span><ChevronDown size={10} className="text-gray-600" /></div></div>
                  <label className="flex items-center gap-2 cursor-pointer"><div className="w-4 h-4 rounded border bg-violet-600 border-violet-600 flex items-center justify-center"><Check size={10} className="text-white" /></div><span className="text-xs text-gray-300">Show filter sidebar</span></label>
                  <label className="flex items-center gap-2 cursor-pointer"><div className="w-4 h-4 rounded border bg-violet-600 border-violet-600 flex items-center justify-center"><Check size={10} className="text-white" /></div><span className="text-xs text-gray-300">Show subcategories in banner</span></label>
                </>
              )}
              {editTab === "history" && (
                <div className="space-y-3">
                  {[{ action: "Category created", by: "Alex Rivera", time: "Oct 15, 2023 09:30" }, { action: "Description updated", by: "Alex Rivera", time: "Oct 18, 2023 14:22" }, { action: "Parent category changed", by: "System", time: "Oct 20, 2023 11:05" }, { action: "SEO metadata updated", by: "Alex Rivera", time: "Oct 24, 2023 16:48" }].map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5"><div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" /><div className="flex-1"><p className="text-xs text-white font-medium">{entry.action}</p><p className="text-[10px] text-gray-600 mt-0.5">By {entry.by} · {entry.time}</p></div></div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/5 space-y-3 shrink-0">
              <div className="flex gap-2">
                <button className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40">Save Changes</button>
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all">Discard</button>
              </div>
              <div className="rounded-xl bg-violet-600/10 border border-violet-500/20 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-violet-600/20 flex items-center justify-center shrink-0"><TrendingUp size={16} className="text-violet-400" /></div>
                <div><div className="text-xs font-bold text-white">Category Performance</div><div className="text-[10px] text-gray-400 mt-0.5">This category contributes to 14% of total electronics sales this month.</div></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Category Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative bg-[#14121C] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-black/50 animate-modal">
            <div className="flex items-center justify-between mb-5"><h2 className="text-base font-bold text-white">New Category</h2><button onClick={() => setShowNewModal(false)} className="text-gray-500 hover:text-white transition-colors"><X size={16} /></button></div>
            <div className="space-y-4">
              <div><label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Category Name</label><input type="text" placeholder="e.g. Accessories" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 transition-colors" /></div>
              <div><label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Parent Category</label><select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors appearance-none"><option value="">None (Root Level)</option>{allCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
              <div><label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Description</label><textarea placeholder="Brief description..." rows={2} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-violet-500/40 transition-colors resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Icon</label><select className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors appearance-none">{ICON_OPTIONS.map((opt) => (<option key={opt.name} value={opt.name}>{opt.name}</option>))}</select></div>
                <div><label className="text-[10px] text-gray-500 font-medium mb-1.5 block uppercase tracking-wider">Color</label><input type="text" defaultValue="#8B5CF6" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-violet-500/40 transition-colors font-mono" /></div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowNewModal(false)} className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white hover:bg-violet-500 transition-all active:scale-[0.98] shadow-lg shadow-violet-900/40">Create Category</button>
              <button onClick={() => setShowNewModal(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-semibold text-gray-300 hover:bg-white/10 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-in { animation: slideIn 0.25s ease-out; }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-modal { animation: modalIn 0.2s ease-out; }
      `}</style>
    </>
  );
}
