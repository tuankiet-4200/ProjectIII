CREATE TABLE "home_banners" (
    "id" SERIAL NOT NULL,
    "eyebrow" TEXT NOT NULL DEFAULT 'SEASONAL DROP',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "primary_label" TEXT NOT NULL,
    "primary_href" TEXT NOT NULL,
    "secondary_label" TEXT NOT NULL,
    "secondary_href" TEXT NOT NULL,
    "visual_label" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_banners_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "home_banners_is_active_updated_at_idx" ON "home_banners"("is_active", "updated_at");

INSERT INTO "home_banners" (
    "eyebrow",
    "title",
    "subtitle",
    "primary_label",
    "primary_href",
    "secondary_label",
    "secondary_href",
    "visual_label",
    "is_active",
    "updated_at"
) VALUES (
    'SEASONAL DROP',
    'Định nghĩa lại phong cách công nghệ.',
    'Tuyển chọn thiết bị điện tử hiệu năng cao và thời trang thủ công cho người dùng hiện đại.',
    'Khám phá bộ sưu tập',
    '/products',
    'Xem lookbook',
    '/products',
    'THỜI TRANG SỐ CAO CẤP',
    true,
    CURRENT_TIMESTAMP
);
