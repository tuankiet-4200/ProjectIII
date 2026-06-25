import { Bot, CreditCard, Heart, PackageSearch, ShieldCheck, Store, Truck } from "lucide-react";
import HomeBanner from "@/components/home/HomeBanner";
import RecommendedProducts from "@/components/home/RecommendedProducts";

const FEATURE_SLIDES = [
  {
    title: "Tìm kiếm sản phẩm",
    desc: "Duyệt sản phẩm theo tên, danh mục và bộ lọc để nhanh chóng tìm đúng món cần mua.",
    icon: PackageSearch,
  },
  {
    title: "Gợi ý cá nhân hóa",
    desc: "Trang chủ ưu tiên sản phẩm dựa trên tương tác, giỏ hàng và xu hướng mua sắm.",
    icon: Heart,
  },
  {
    title: "Chat AI hỗ trợ",
    desc: "Trợ lý AI có thể tư vấn nhanh thông tin mua sắm và điều hướng người dùng.",
    icon: Bot,
  },
  {
    title: "Cửa hàng nhà bán",
    desc: "Vendor quản lý sản phẩm, đơn hàng và trạng thái cửa hàng trong cổng riêng.",
    icon: Store,
  },
  {
    title: "Thanh toán linh hoạt",
    desc: "Hỗ trợ COD, SePay, mã giảm giá và checkout theo sản phẩm đã chọn trong giỏ hàng.",
    icon: CreditCard,
  },
  {
    title: "Theo dõi vận chuyển",
    desc: "Đơn hàng có luồng xử lý, giao vận và cập nhật trạng thái rõ ràng.",
    icon: Truck,
  },
  {
    title: "Quản trị hệ thống",
    desc: "Admin quản lý người dùng, danh mục, cửa hàng, banner và chỉ số vận hành.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
      <HomeBanner />

      {/* Recommended Products Section */}
      <RecommendedProducts />

      {/* Featured Functions */}
      <section className="container mx-auto max-w-7xl px-4 lg:px-8 py-16 mb-12">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">Chức năng nổi bật</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">Các luồng chính đang có trong hệ thống mua sắm ProjectIII.</p>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
          {FEATURE_SLIDES.map((feature) => (
            <article
              key={feature.title}
              className="min-w-[280px] sm:min-w-[340px] snap-start rounded-2xl bg-card border border-card-border p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <feature.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-gray-400">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}
