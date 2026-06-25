"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ordersService } from "@/services/orders.service";

function SepayReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId) {
      setState("error");
      toast.error("Thiếu mã đơn hàng SePay");
      router.replace("/profile?tab=orders&payment=error");
      return;
    }

    let active = true;
    ordersService
      .confirmSepayPayment(orderId)
      .then(() => {
        if (!active) return;
        setState("success");
        toast.success("Thanh toán SePay thành công");
        router.replace("/profile?tab=orders&payment=success");
      })
      .catch((error) => {
        if (!active) return;
        setState("error");
        toast.error(error.response?.data?.message || "Chưa xác nhận được thanh toán SePay");
        router.replace("/profile?tab=orders&payment=pending");
      });

    return () => {
      active = false;
    };
  }, [router, searchParams]);

  const Icon = state === "success" ? CheckCircle2 : state === "error" ? XCircle : Loader2;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="text-center">
        <Icon
          className={`mx-auto mb-4 h-10 w-10 ${
            state === "loading" ? "animate-spin text-violet-500" : state === "success" ? "text-emerald-500" : "text-red-500"
          }`}
        />
        <h1 className="text-xl font-semibold text-foreground">
          {state === "loading" ? "Đang xác minh thanh toán..." : state === "success" ? "Thanh toán thành công" : "Chưa xác nhận được thanh toán"}
        </h1>
        <p className="mt-2 text-sm text-gray-500">Bạn sẽ được chuyển về lịch sử đơn hàng.</p>
      </div>
    </div>
  );
}

export default function SepayReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
        </div>
      }
    >
      <SepayReturnContent />
    </Suspense>
  );
}
