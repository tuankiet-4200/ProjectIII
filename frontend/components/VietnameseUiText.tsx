'use client';

import { useEffect } from 'react';

const TRANSLATIONS: Record<string, string> = {
  'Access your premium marketplace dashboard': 'Truy cập bảng điều khiển mua sắm cao cấp của bạn',
  'Account created successfully!': 'Tạo tài khoản thành công!',
  'Account Role': 'Vai trò tài khoản',
  'Account Type': 'Loại tài khoản',
  'Add New Address': 'Thêm địa chỉ mới',
  'Add New Product': 'Thêm sản phẩm mới',
  'Add an extra layer of security to your account': 'Tăng thêm một lớp bảo mật cho tài khoản',
  'Add some premium products to get started.': 'Thêm vài sản phẩm yêu thích để bắt đầu.',
  'Added to cart successfully!': 'Đã thêm vào giỏ hàng!',
  'Address Book': 'Sổ địa chỉ',
  'Admin': 'Quản trị viên',
  'Admin Console': 'Bảng điều khiển quản trị',
  'Affiliate Program': 'Chương trình liên kết',
  'Active': 'Đang hoạt động',
  'Active Buyers': 'Người mua đang hoạt động',
  'All nodes operating within': 'Tất cả nút đang vận hành trong',
  'ALL RIGHTS RESERVED': 'ĐÃ ĐĂNG KÝ BẢN QUYỀN',
  'All Orders': 'Tất cả đơn hàng',
  'All Products': 'Tất cả sản phẩm',
  'Amount': 'Số tiền',
  'Apply': 'Áp dụng',
  'Apply Again': 'Gửi lại hồ sơ',
  'Approve': 'Phê duyệt',
  'Approved': 'Đã duyệt',
  'Archived': 'Đã lưu trữ',
  'Auto-generated': 'Tự động tạo',
  'Back': 'Quay lại',
  'Back to shopping': 'Quay lại mua sắm',
  'Back to store': 'Quay lại cửa hàng',
  'Bank Transfer': 'Chuyển khoản ngân hàng',
  'Battery Life': 'Thời lượng pin',
  'Basic Information': 'Thông tin cơ bản',
  'Become a': 'Trở thành',
  'Browse Products': 'Xem sản phẩm',
  'Bluetooth': 'Bluetooth',
  'By signing in, you agree to our': 'Khi đăng nhập, bạn đồng ý với',
  'Call': 'Gọi',
  'Cancel': 'Hủy',
  'Cancel Order': 'Hủy đơn hàng',
  'Cancelled': 'Đã hủy',
  'Cart': 'Giỏ hàng',
  'Cash on delivery': 'Thanh toán khi nhận hàng',
  'Charging': 'Sạc',
  'Categories': 'Danh mục',
  'Category': 'Danh mục',
  'Category Directory': 'Thư mục danh mục',
  'Category Name': 'Tên danh mục',
  'Category Performance': 'Hiệu suất danh mục',
  'Category Title': 'Tiêu đề danh mục',
  'Category Tree': 'Cây danh mục',
  'Change Password': 'Đổi mật khẩu',
  'Changes discarded': 'Đã hủy thay đổi',
  'Chat Inbox': 'Hộp thư chat',
  'Checkout': 'Thanh toán',
  'Choose...': 'Chọn...',
  'Click to upload': 'Bấm để tải lên',
  'Color': 'Màu sắc',
  'Color Options': 'Tùy chọn màu sắc',
  'Confirm': 'Xác nhận',
  'Confirm New Password': 'Xác nhận mật khẩu mới',
  'Confirm new password': 'Xác nhận mật khẩu mới',
  'Confirm the details before submitting.': 'Kiểm tra thông tin trước khi gửi.',
  'Continue': 'Tiếp tục',
  'Continue Shopping': 'Tiếp tục mua sắm',
  'Continue shopping': 'Tiếp tục mua sắm',
  'Could not complete Google sign-in.': 'Không thể hoàn tất đăng nhập Google.',
  'Create Account': 'Tạo tài khoản',
  'Create New User': 'Tạo người dùng mới',
  'Create User': 'Tạo người dùng',
  'Create a new listing for your store': 'Tạo sản phẩm mới cho cửa hàng',
  'Creator Hub': 'Trung tâm sáng tạo',
  'Covered against manufacturing defects. Extended care plans available at checkout.': 'Bảo hành lỗi sản xuất. Có thể chọn gói bảo vệ mở rộng khi thanh toán.',
  'Current Password': 'Mật khẩu hiện tại',
  'Critical System Alerts': 'Cảnh báo hệ thống quan trọng',
  'Customer': 'Khách hàng',
  'Customer Name': 'Tên khách hàng',
  'Customer Reviews': 'Đánh giá của khách hàng',
  'Customers': 'Khách hàng',
  'Dashboard': 'Bảng điều khiển',
  'Date': 'Ngày',
  'Declined': 'Bị từ chối',
  'Delete': 'Xóa',
  'Delivered': 'Đã giao',
  'Description': 'Mô tả',
  'Destination': 'Điểm giao hàng',
  'Details': 'Chi tiết',
  'Discard': 'Hủy thay đổi',
  'Draft': 'Bản nháp',
  'Drafts': 'Bản nháp',
  'Driver Size': 'Kích thước driver',
  'Edit': 'Sửa',
  'Edit Category': 'Sửa danh mục',
  'Email Address': 'Địa chỉ email',
  'Email or Username': 'Email hoặc tên đăng nhập',
  'Electronics': 'Điện tử',
  'Enter current password': 'Nhập mật khẩu hiện tại',
  'Enter new password': 'Nhập mật khẩu mới',
  'Export': 'Xuất',
  'Export JSON': 'Xuất JSON',
  'Export Report': 'Xuất báo cáo',
  'Failed to create category': 'Không thể tạo danh mục',
  'Failed to load cart': 'Không thể tải giỏ hàng',
  'Failed to load categories': 'Không thể tải danh mục',
  'Failed to load categories.': 'Không thể tải danh mục.',
  'Failed to load tracking data': 'Không thể tải dữ liệu theo dõi',
  'Failed to update category': 'Không thể cập nhật danh mục',
  'Fashion & Apparels': 'Thời trang & may mặc',
  'Featured Drops': 'Sản phẩm nổi bật',
  'Featured Shops': 'Cửa hàng nổi bật',
  'Filters': 'Bộ lọc',
  'Forgot password?': 'Quên mật khẩu?',
  'Free Express Shipping': 'Miễn phí giao nhanh',
  'Frequency Response': 'Dải tần đáp ứng',
  'Full Name': 'Họ và tên',
  'General': 'Chung',
  'Get notified when someone logs in to your account': 'Nhận thông báo khi có người đăng nhập vào tài khoản của bạn',
  'Go back': 'Quay lại',
  'Go to Seller Dashboard': 'Tới bảng điều khiển nhà bán',
  'Google sign-in failed. Please try again.': 'Đăng nhập Google thất bại. Vui lòng thử lại.',
  'Google sign-in response is invalid.': 'Phản hồi đăng nhập Google không hợp lệ.',
  'Google sign-in successful!': 'Đăng nhập Google thành công!',
  'Global Transaction Log': 'Nhật ký giao dịch toàn hệ thống',
  'Grid View': 'Dạng lưới',
  'Hand-picked premium selections': 'Tuyển chọn sản phẩm cao cấp',
  'Handle your incoming orders and logistics status.': 'Quản lý đơn hàng mới và trạng thái vận chuyển.',
  'Handover to Shipper': 'Bàn giao cho shipper',
  'Help Center': 'Trung tâm trợ giúp',
  'Home': 'Trang chủ',
  'I agree to the': 'Tôi đồng ý với',
  'Image': 'Hình ảnh',
  'Inventory': 'Tồn kho',
  'Inventory Alerts': 'Cảnh báo tồn kho',
  'Inventory Overview': 'Tổng quan tồn kho',
  'Join 50,000+ successful sellers': 'Tham gia cùng hơn 50.000 nhà bán thành công',
  'Join the exclusive world of premium tech and fashion.': 'Tham gia thế giới công nghệ và thời trang cao cấp.',
  'Last 7 days performance': 'Hiệu suất 7 ngày gần đây',
  'List View': 'Dạng danh sách',
  'Loading categories...': 'Đang tải danh mục...',
  'Loading order...': 'Đang tải đơn hàng...',
  'Loading orders...': 'Đang tải đơn hàng...',
  'Loading products...': 'Đang tải sản phẩm...',
  'Loading shops...': 'Đang tải cửa hàng...',
  'Loading users...': 'Đang tải người dùng...',
  'Loading your cart...': 'Đang tải giỏ hàng...',
  'Loading your orders...': 'Đang tải đơn hàng...',
  'Loading...': 'Đang tải...',
  'Login': 'Đăng nhập',
  'Login Notifications': 'Thông báo đăng nhập',
  'Login success!': 'Đăng nhập thành công!',
  'Logout': 'Đăng xuất',
  'Low Stock': 'Sắp hết hàng',
  'Maintenance window scheduled for UTC 02:00. Estimated downtime: 4 minutes.': 'Lịch bảo trì dự kiến lúc 02:00 UTC. Thời gian gián đoạn ước tính: 4 phút.',
  'Management': 'Quản lý',
  'Manage your catalog, inventory, and listings.': 'Quản lý danh mục, tồn kho và sản phẩm.',
  'Mark as Delivered': 'Đánh dấu đã giao',
  'Marketplace': 'Sàn mua sắm',
  'Merchant': 'Nhà bán',
  'Meta Description': 'Mô tả SEO',
  'Meta Title': 'Tiêu đề SEO',
  'Method:': 'Phương thức:',
  'Mobile Wallet': 'Ví điện tử',
  'Monthly scale overview': 'Tổng quan tăng trưởng tháng',
  'My Account': 'Tài khoản của tôi',
  'My Store': 'Cửa hàng của tôi',
  'Name & SKU': 'Tên & SKU',
  'New Category': 'Danh mục mới',
  'New Password': 'Mật khẩu mới',
  'New Product': 'Sản phẩm mới',
  'New Shops Growth': 'Tăng trưởng cửa hàng mới',
  'Newsletter': 'Bản tin',
  'Next': 'Tiếp',
  'Noise Cancellation': 'Chống ồn',
  'No Categories Found': 'Không tìm thấy danh mục',
  'No orders found': 'Không tìm thấy đơn hàng',
  'No orders found.': 'Không tìm thấy đơn hàng nào.',
  'No products found': 'Không tìm thấy sản phẩm',
  'No shops found': 'Không tìm thấy cửa hàng',
  'No users found': 'Không tìm thấy người dùng',
  'Not satisfied? Return for any reason within 30 days for a full refund, no questions asked.': 'Chưa hài lòng? Bạn có thể hoàn trả trong 30 ngày để được hoàn tiền đầy đủ.',
  'Optional': 'Không bắt buộc',
  'Or continue with': 'Hoặc tiếp tục với',
  'Or continue with email': 'Hoặc tiếp tục bằng email',
  'Order Detail': 'Chi tiết đơn hàng',
  'Order Details': 'Chi tiết đơn hàng',
  'Order History': 'Lịch sử đơn hàng',
  'Order ID': 'Mã đơn hàng',
  'Order Items': 'Sản phẩm trong đơn',
  'Order Management': 'Quản lý đơn hàng',
  'Order Placed! 🎉': 'Đặt hàng thành công! 🎉',
  'Order Summary': 'Tóm tắt đơn hàng',
  'Order Total': 'Tổng đơn hàng',
  'Orders over $200 ship free via FedEx Express. Estimated delivery: 2–3 business days.': 'Đơn hàng trên 5.000.000đ được miễn phí giao nhanh. Thời gian dự kiến: 2-3 ngày làm việc.',
  'Orders': 'Đơn hàng',
  'Original Sealed Box': 'Hộp nguyên seal',
  'Original Sealed Packaging': 'Đóng gói nguyên seal',
  'Other': 'Khác',
  'Out of Stock': 'Hết hàng',
  'Owner': 'Chủ sở hữu',
  'Pack Order': 'Đóng gói đơn hàng',
  'Parent Category': 'Danh mục cha',
  'Password does not match': 'Mật khẩu xác nhận không khớp',
  'Payment': 'Thanh toán',
  'Payment Method': 'Phương thức thanh toán',
  'Pending': 'Chờ xử lý',
  'Phone': 'Điện thoại',
  'Phone Number': 'Số điện thoại',
  'Please fill out all required fields.': 'Vui lòng điền đầy đủ các trường bắt buộc.',
  'Please login to add products to cart': 'Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng',
  'Please login to continue': 'Vui lòng đăng nhập để tiếp tục',
  'Preparing': 'Đang chuẩn bị',
  'Previous': 'Trước',
  'Price': 'Giá',
  'Pricing': 'Giá bán',
  'Privacy Policy': 'Chính sách bảo mật',
  'Proceed to Checkout': 'Tiến hành thanh toán',
  'Product Details': 'Chi tiết sản phẩm',
  'Product Management': 'Quản lý sản phẩm',
  'Product Media': 'Hình ảnh sản phẩm',
  'Product Name': 'Tên sản phẩm',
  'Product is not ready yet. Please try again.': 'Sản phẩm chưa sẵn sàng. Vui lòng thử lại.',
  'Products': 'Sản phẩm',
  'Profile Info': 'Thông tin hồ sơ',
  'Profile Information': 'Thông tin cá nhân',
  'Rating': 'Đánh giá',
  'Refresh': 'Làm mới',
  'Register': 'Đăng ký',
  'Register Your Shop': 'Đăng ký cửa hàng',
  'Registered': 'Đã đăng ký',
  'Registered Users': 'Người dùng đã đăng ký',
  'Reject': 'Từ chối',
  'Rejected': 'Đã từ chối',
  'Remember this device': 'Ghi nhớ thiết bị này',
  'Remove': 'Xóa',
  'Review Order Items': 'Kiểm tra sản phẩm trong đơn',
  'Review Guidelines': 'Hướng dẫn duyệt',
  'Review and manage pending merchant applications for the marketplace.': 'Duyệt và quản lý hồ sơ nhà bán đang chờ xử lý.',
  'Reviews': 'Đánh giá',
  'Review your shop': 'Kiểm tra cửa hàng',
  'Safe Mode': 'Chế độ an toàn',
  'Safe Mode Guidelines': 'Hướng dẫn chế độ an toàn',
  'Save Changes': 'Lưu thay đổi',
  'Security': 'Bảo mật',
  'Security & Privacy': 'Bảo mật & quyền riêng tư',
  'Sell on ProjectIII': 'Bán hàng trên ProjectIII',
  'Seller Center': 'Trung tâm nhà bán',
  'Seller Terms': 'Điều khoản nhà bán',
  'Sellers': 'Nhà bán',
  'Settings': 'Cài đặt',
  'Shipping': 'Vận chuyển',
  'Shipping Address': 'Địa chỉ giao hàng',
  'Shipping Information': 'Thông tin giao hàng',
  'Shop Details': 'Chi tiết cửa hàng',
  'Shop More': 'Mua thêm',
  'Shop Review Applications': 'Hồ sơ duyệt cửa hàng',
  'Shop Reviews': 'Duyệt cửa hàng',
  'Shopping Cart': 'Giỏ hàng',
  'Sign Out': 'Đăng xuất',
  'Signing you in...': 'Đang đăng nhập...',
  'Specifications': 'Thông số kỹ thuật',
  'Start selling on': 'Bắt đầu bán hàng trên',
  'Start Selling': 'Bắt đầu bán hàng',
  'Status': 'Trạng thái',
  'Status:': 'Trạng thái:',
  'Stock': 'Tồn kho',
  'Stock Quantity': 'Số lượng tồn kho',
  'Stock:': 'Tồn kho:',
  'Store Online': 'Cửa hàng trực tuyến',
  'Submit Application': 'Gửi hồ sơ',
  'Submitting...': 'Đang gửi...',
  'Subtotal': 'Tạm tính',
  'System': 'Hệ thống',
  'System Health': 'Sức khỏe hệ thống',
  'System Online': 'Hệ thống trực tuyến',
  'Tell us about your business to get started.': 'Hãy cho chúng tôi biết về doanh nghiệp của bạn để bắt đầu.',
  'Terms of Service': 'Điều khoản dịch vụ',
  'There are currently no categories listed in the system. Please check back later or contact support.': 'Hiện chưa có danh mục nào trong hệ thống. Vui lòng quay lại sau hoặc liên hệ hỗ trợ.',
  'The world\'s leading premium marketplace for high-end tech, minimalist fashion, and luxury lifestyle goods.': 'Sàn thương mại cao cấp dành cho công nghệ, thời trang tối giản và phong cách sống sang trọng.',
  'This will be your public shop name': 'Đây sẽ là tên cửa hàng hiển thị công khai',
  'Toggle theme': 'Đổi giao diện sáng/tối',
  'Total': 'Tổng cộng',
  'Total Amount': 'Tổng tiền',
  'Total Items': 'Tổng sản phẩm',
  'Total Orders': 'Tổng đơn hàng',
  'TOTAL USERS': 'TỔNG NGƯỜI DÙNG',
  'Tracking Events': 'Sự kiện vận chuyển',
  'Try adjusting your search or filters': 'Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc',
  'Update Password': 'Cập nhật mật khẩu',
  'Upload': 'Tải lên',
  'User Governance': 'Quản trị người dùng',
  'Vendor Portal': 'Cổng nhà bán',
  'Verified': 'Đã xác minh',
  'View All': 'Xem tất cả',
  'View All Notifications': 'Xem tất cả thông báo',
  'View Orders': 'Xem đơn hàng',
  'Wait for Shipper': 'Chờ shipper',
  'Weight': 'Trọng lượng',
  'Welcome Back': 'Chào mừng trở lại',
  'Wishlist': 'Yêu thích',
  'Write a Review': 'Viết đánh giá',
  'You do not have permission to access that page.': 'Bạn không có quyền truy cập trang này.',
  'You already have a shop. Redirecting...': 'Bạn đã có cửa hàng. Đang chuyển hướng...',
  'You might also like': 'Có thể bạn cũng thích',
  'You will receive a confirmation email shortly.': 'Bạn sẽ sớm nhận được email xác nhận.',
  'You will receive an email notification once your shop is approved or if additional information is required.': 'Bạn sẽ nhận được email khi cửa hàng được duyệt hoặc khi cần bổ sung thông tin.',
  'Your cart is empty': 'Giỏ hàng của bạn đang trống',
  'Your cart is empty.': 'Giỏ hàng của bạn đang trống.',
  'Your data is secured with bank-level encryption. We never share your personal information.': 'Dữ liệu của bạn được bảo vệ bằng mã hóa cấp ngân hàng. Chúng tôi không chia sẻ thông tin cá nhân của bạn.',
  'Your earnings are protected by our escrow system and seller guarantee.': 'Doanh thu của bạn được bảo vệ bởi hệ thống giữ tiền và cam kết cho nhà bán.',
  'Your session has expired. Please login again.': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'Your shop has been submitted for review!': 'Cửa hàng của bạn đã được gửi để xét duyệt!',
  'Your shop will be reviewed before going live. This usually takes': 'Cửa hàng sẽ được duyệt trước khi mở bán. Thường mất',
  'has been submitted for review.': 'đã được gửi để xét duyệt.',
  'Curated selection of high-performance electronics and artisanal fashion pieces for the digital elite.': 'Tuyển chọn thiết bị điện tử hiệu năng cao và thời trang thủ công cho người dùng hiện đại.',
  'Digital Haute Couture': 'Thời trang số cao cấp',
  'Early Drops Access': 'Truy cập bộ sưu tập sớm',
  'Explore Collection': 'Khám phá bộ sưu tập',
  'Get Started - $10/mo': 'Bắt đầu - 250.000đ/tháng',
  'Redefine Your': 'Định nghĩa lại',
  'Tech Aesthetic.': 'phong cách công nghệ.',
  'Unlock early access to drops, free worldwide express shipping, and a personal AI shopping concierge.': 'Mở khóa quyền mua sớm, miễn phí giao nhanh toàn cầu và trợ lý mua sắm AI cá nhân.',
  'View Lookbook': 'Xem lookbook',
  'and': 'và',
  'items': 'sản phẩm',
  'item': 'sản phẩm',
};

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT']);
const TEXT_ATTRIBUTES = ['placeholder', 'aria-label', 'title'];
const sortedKeys = Object.keys(TRANSLATIONS).sort((a, b) => b.length - a.length);

function translateValue(value: string) {
  let next = value;

  for (const key of sortedKeys) {
    const translated = TRANSLATIONS[key];
    if (next.trim() === key) {
      return next.replace(key, translated);
    }
    next = next.split(key).join(translated);
  }

  return next;
}

function translateNode(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const current = root.textContent;
    if (!current || !/[A-Za-z]/.test(current)) return;

    const parent = root.parentElement;
    if (!parent || SKIP_TAGS.has(parent.tagName)) return;

    const translated = translateValue(current);
    if (translated !== current) {
      root.textContent = translated;
    }
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const element = root as Element;
  if (SKIP_TAGS.has(element.tagName)) return;

  for (const attr of TEXT_ATTRIBUTES) {
    const current = element.getAttribute(attr);
    if (!current || !/[A-Za-z]/.test(current)) continue;

    const translated = translateValue(current);
    if (translated !== current) {
      element.setAttribute(attr, translated);
    }
  }

  root.childNodes.forEach(translateNode);
}

export function VietnameseUiText() {
  useEffect(() => {
    translateNode(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(translateNode);

        if (mutation.type === 'characterData') {
          translateNode(mutation.target);
        }

        if (mutation.type === 'attributes') {
          translateNode(mutation.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TEXT_ATTRIBUTES,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
