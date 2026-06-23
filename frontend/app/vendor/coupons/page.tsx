"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Search, Trash2, Calendar, Loader2, X, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { formatVnd } from "@/lib/currency";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string;
  min_order_amount: string | null;
  max_discount: string | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
};

export default function VendorCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    type: "PERCENTAGE",
    value: "",
    min_order_amount: "",
    max_discount: "",
    usage_limit: "",
    expires_at: "",
  });

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get("/coupons/vendor");
      setCoupons(res.data);
    } catch {
      toast.error("Không thể tải danh sách mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc muốn xoá mã ${code}?`)) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success("Đã xoá mã giảm giá");
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xoá thất bại");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload: any = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
      };
      if (formData.min_order_amount) payload.min_order_amount = Number(formData.min_order_amount);
      if (formData.type === "PERCENTAGE" && formData.max_discount) payload.max_discount = Number(formData.max_discount);
      if (formData.usage_limit) payload.usage_limit = Number(formData.usage_limit);
      if (formData.expires_at) payload.expires_at = new Date(formData.expires_at).toISOString();

      await api.post("/coupons", payload);
      toast.success("Tạo mã giảm giá thành công!");
      setShowModal(false);
      setFormData({ code: "", type: "PERCENTAGE", value: "", min_order_amount: "", max_discount: "", usage_limit: "", expires_at: "" });
      loadCoupons();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Tạo mã thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Khuyến Mãi & Voucher</h1>
          <p className="text-xs text-gray-400 mt-0.5">Tạo mã giảm giá để thu hút khách hàng mua sắm</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/40"
        >
          <Plus size={14} /> Tạo mã mới
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 bg-[#14121C] p-3 rounded-xl border border-white/5">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Tìm kiếm mã voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0B0A10] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-[#14121C] rounded-2xl border border-white/5 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-[#181622] text-[10px] uppercase font-bold text-gray-500 tracking-wider">
          <div className="col-span-3">Mã & Phân loại</div>
          <div className="col-span-3">Mức giảm</div>
          <div className="col-span-2">Đã dùng</div>
          <div className="col-span-3">Hạn sử dụng</div>
          <div className="col-span-1 text-right">Thao tác</div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-10 text-gray-400">
            <Loader2 className="animate-spin mb-2 text-violet-500" size={24} />
            <span className="text-xs">Đang tải dữ liệu...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-gray-500">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Tag size={24} className="text-gray-600" />
            </div>
            <p className="text-sm">Chưa có mã giảm giá nào</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(coupon => {
              const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
              const isDepleted = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;
              const statusClass = (isExpired || isDepleted || !coupon.is_active) ? "text-gray-500 bg-white/5" : "text-emerald-400 bg-emerald-500/10";
              const statusText = isExpired ? "Đã hết hạn" : isDepleted ? "Đã dùng hết" : !coupon.is_active ? "Đã tắt" : "Đang hoạt động";

              return (
                <div key={coupon.id} className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-mono font-bold">
                        {coupon.code}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${statusClass}`}>
                        {statusText}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {coupon.type === "PERCENTAGE" ? "Giảm theo phần trăm" : "Giảm số tiền cố định"}
                    </div>
                  </div>
                  
                  <div className="col-span-3">
                    <div className="text-sm font-bold text-white">
                      {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatVnd(Number(coupon.value))}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      Đơn tối thiểu: {coupon.min_order_amount ? formatVnd(Number(coupon.min_order_amount)) : "0đ"}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="text-xs font-semibold text-white">
                      {coupon.used_count} <span className="text-gray-500">/ {coupon.usage_limit || "∞"}</span>
                    </div>
                    {coupon.usage_limit && (
                      <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                        <div 
                          className="h-full bg-violet-500 rounded-full" 
                          style={{ width: `${Math.min(100, (coupon.used_count / coupon.usage_limit) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="col-span-3 flex items-center gap-2 text-xs text-gray-400">
                    <Calendar size={12} />
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleString("vi-VN") : "Không giới hạn"}
                  </div>

                  <div className="col-span-1 flex items-center justify-end gap-2">
                    <button onClick={() => handleDelete(coupon.id, coupon.code)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Xoá mã">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#14121C] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#181622]">
              <h2 className="text-base font-bold text-white">Tạo Mã Giảm Giá Mới</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="couponForm" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Mã Voucher *</label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="VD: MEGA11"
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Loại giảm giá</label>
                      <select
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none"
                      >
                        <option value="PERCENTAGE">Giảm theo %</option>
                        <option value="FIXED_AMOUNT">Giảm số tiền (VNĐ)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                        Mức giảm {formData.type === "PERCENTAGE" ? "(%)" : "(VNĐ)"} *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={formData.type === "PERCENTAGE" ? 100 : undefined}
                        value={formData.value}
                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                        placeholder={formData.type === "PERCENTAGE" ? "10" : "50000"}
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Đơn tối thiểu (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.min_order_amount}
                        onChange={e => setFormData({ ...formData, min_order_amount: e.target.value })}
                        placeholder="Không bắt buộc"
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  </div>

                  {formData.type === "PERCENTAGE" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Trần giảm giá tối đa (VNĐ)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.max_discount}
                        onChange={e => setFormData({ ...formData, max_discount: e.target.value })}
                        placeholder="Ví dụ: Giảm tối đa 30,000đ"
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Lượt sử dụng tối đa</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.usage_limit}
                        onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                        placeholder="Không giới hạn"
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1.5">Ngày hết hạn</label>
                      <input
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={e => setFormData({ ...formData, expires_at: e.target.value })}
                        style={{ colorScheme: "dark" }}
                        className="w-full bg-[#0B0A10] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-violet-500 outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
                  <AlertCircle size={14} className="text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-violet-200">
                    Mã giảm giá này chỉ có hiệu lực cho các sản phẩm thuộc cửa hàng của bạn. Khi khách hàng áp dụng mã, chỉ tính tổng tiền của các sản phẩm thuộc cửa hàng bạn.
                  </p>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-[#181622]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                form="couponForm"
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-900/40"
              >
                {isSubmitting ? "Đang xử lý..." : "Lưu Mã Giảm Giá"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
