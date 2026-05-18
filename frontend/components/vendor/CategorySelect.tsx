"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check, FolderOpen, Tag } from "lucide-react";

interface CategoryItem {
  id: number;
  name: string;
  children?: CategoryItem[];
}

interface CategorySelectProps {
  categories: CategoryItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = "-- Chọn danh mục --",
  className = "",
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Find selected label
  const findLabel = (): string => {
    for (const parent of categories) {
      if (String(parent.id) === value) return parent.name;
      for (const child of parent.children || []) {
        if (String(child.id) === value) return `${parent.name} › ${child.name}`;
      }
    }
    return "";
  };

  const selectedLabel = findLabel();

  // Filter by search
  const q = search.toLowerCase();
  const filtered = categories
    .map((parent) => {
      const parentMatch = parent.name.toLowerCase().includes(q);
      const matchedChildren = (parent.children || []).filter((c) =>
        c.name.toLowerCase().includes(q)
      );
      if (parentMatch || matchedChildren.length > 0) {
        return { ...parent, children: parentMatch ? parent.children || [] : matchedChildren };
      }
      return null;
    })
    .filter(Boolean) as CategoryItem[];

  const handleSelect = (id: number) => {
    onChange(String(id));
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs transition-all
          ${open
            ? "border-violet-500/60 bg-white/[0.06] text-white"
            : "border-white/10 bg-white/[0.03] text-white hover:border-white/20 hover:bg-white/[0.05]"
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Tag size={11} className={selectedLabel ? "text-violet-400" : "text-gray-600"} />
          <span className={`truncate font-medium ${selectedLabel ? "text-white" : "text-gray-500"}`}>
            {selectedLabel || placeholder}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${open ? "rotate-180 text-violet-400" : ""}`}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-[#1C1929] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-2.5 py-2">
              <Search size={11} className="text-gray-500 shrink-0" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm danh mục..."
                className="flex-1 bg-transparent text-xs text-white placeholder:text-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto py-1.5 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="px-4 py-4 text-center text-xs text-gray-600">Không tìm thấy danh mục</div>
            ) : (
              filtered.map((parent) => (
                <div key={parent.id}>
                  {/* Parent item */}
                  <button
                    type="button"
                    onClick={() => handleSelect(parent.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold transition-colors group
                      ${String(parent.id) === value
                        ? "text-violet-300 bg-violet-500/10"
                        : "text-gray-300 hover:bg-white/[0.04] hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen size={11} className={String(parent.id) === value ? "text-violet-400" : "text-gray-600 group-hover:text-gray-400"} />
                      {parent.name}
                    </div>
                    {String(parent.id) === value && <Check size={11} className="text-violet-400 shrink-0" />}
                  </button>

                  {/* Children */}
                  {(parent.children || []).map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => handleSelect(child.id)}
                      className={`w-full flex items-center justify-between gap-2 pl-7 pr-3 py-1.5 text-xs transition-colors group
                        ${String(child.id) === value
                          ? "text-violet-300 bg-violet-500/10"
                          : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-200"
                        }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-700">↳</span>
                        <span className="font-medium">{child.name}</span>
                      </div>
                      {String(child.id) === value && <Check size={11} className="text-violet-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
