import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_VENDOR = {
  email: 'vendor@projectiii.dev',
  password_hash: 'seeded_password_hash',
  full_name: 'ProjectIII Vendor',
  phone: '0900000000',
};

const DEMO_SHOP = {
  name: 'ProjectIII Demo Store',
  description: 'Demo shop for seeded products',
  logo_url: 'https://placehold.co/120x120?text=Shop',
  status: 'ACTIVE' as const,
};

type SeedCategory = {
  name: string;
  slug: string;
  children?: SeedCategory[];
};

const CATEGORIES: SeedCategory[] = [
  {
    name: 'Điện thoại',
    slug: 'dien-thoai',
    children: [
      { name: 'Apple (iPhone)', slug: 'iphone' },
      { name: 'Samsung', slug: 'samsung' },
      { name: 'Xiaomi', slug: 'xiaomi' },
      { name: 'OPPO', slug: 'oppo' },
      { name: 'HONOR', slug: 'honor' },
      { name: 'Realme', slug: 'realme' },
      { name: 'Vivo', slug: 'vivo' },
    ],
  },
  {
    name: 'Laptop',
    slug: 'laptop',
    children: [
      { name: 'MacBook', slug: 'macbook' },
      { name: 'ASUS', slug: 'asus' },
      { name: 'Dell', slug: 'dell' },
      { name: 'HP', slug: 'hp' },
      { name: 'Lenovo', slug: 'lenovo' },
    ],
  },
  {
    name: 'Tablet',
    slug: 'tablet',
    children: [
      { name: 'iPad', slug: 'ipad' },
      { name: 'Samsung Galaxy Tab', slug: 'galaxy-tab' },
      { name: 'Xiaomi Pad', slug: 'xiaomi-pad' },
      { name: 'Lenovo Tab', slug: 'lenovo-tab' },
    ],
  },
  {
    name: 'Âm thanh',
    slug: 'am-thanh',
    children: [
      { name: 'Tai nghe', slug: 'tai-nghe' },
      { name: 'Loa', slug: 'loa' },
      { name: 'Micro', slug: 'micro' },
    ],
  },
  {
    name: 'Đồng hồ',
    slug: 'dong-ho',
    children: [
      { name: 'Apple Watch', slug: 'apple-watch' },
      { name: 'Galaxy Watch', slug: 'galaxy-watch' },
      { name: 'Xiaomi Watch', slug: 'xiaomi-watch' },
    ],
  },
  {
    name: 'Camera',
    slug: 'camera',
    children: [
      { name: 'Canon', slug: 'canon' },
      { name: 'Sony', slug: 'sony' },
      { name: 'Fujifilm', slug: 'fujifilm' },
      { name: 'Nikon', slug: 'nikon' },
    ],
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    children: [
      { name: 'PlayStation', slug: 'playstation' },
      { name: 'Xbox', slug: 'xbox' },
      { name: 'Nintendo', slug: 'nintendo' },
      { name: 'Phụ kiện gaming', slug: 'phu-kien-gaming' },
    ],
  },
];

async function upsertCategory(category: SeedCategory, parentId?: number) {
  const record = await prisma.category.upsert({
    where: { slug: category.slug },
    update: {
      name: category.name,
      parent_id: parentId ?? null,
    },
    create: {
      name: category.name,
      slug: category.slug,
      parent_id: parentId ?? null,
    },
  });

  if (category.children?.length) {
    for (const child of category.children) {
      await upsertCategory(child, record.id);
    }
  }
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const buildImages = (query: string, index: number) => {
  const safe = encodeURIComponent(query.replace(/\s+/g, ','));
  return [
    `https://loremflickr.com/800/800/${safe}?lock=${index * 3 + 1}`,
    `https://loremflickr.com/800/800/${safe}?lock=${index * 3 + 2}`,
    `https://loremflickr.com/800/800/${safe}?lock=${index * 3 + 3}`,
  ];
};

const CATEGORY_PRICE_RANGES: Record<string, [number, number]> = {
  'dien-thoai': [7000000, 35000000],
  'laptop': [12000000, 60000000],
  'tablet': [5000000, 25000000],
  'am-thanh': [900000, 9000000],
  'dong-ho': [1500000, 15000000],
  'camera': [5000000, 45000000],
  'gaming': [1000000, 18000000],
};

const pickPrice = (slug: string, index: number) => {
  const [min, max] = CATEGORY_PRICE_RANGES[slug] || [1000000, 10000000];
  const step = Math.floor((max - min) / 19);
  const raw = min + step * index;
  return Math.round(raw / 100000) * 100000;
};

const PRODUCT_CATALOG: Record<string, { names: string[]; imageQuery: string }> = {
  'dien-thoai': {
    names: [
      'iPhone 15 Pro Max 256GB',
      'iPhone 15 Pro 128GB',
      'iPhone 15 Plus 128GB',
      'iPhone 15 128GB',
      'Samsung Galaxy S24 Ultra 512GB',
      'Samsung Galaxy S24 Plus 256GB',
      'Samsung Galaxy S24 128GB',
      'Xiaomi 14 Ultra 512GB',
      'Xiaomi 14 256GB',
      'OPPO Find X7 Pro 256GB',
      'OPPO Reno 11 128GB',
      'HONOR Magic 6 Pro 256GB',
      'realme GT Neo 5 256GB',
      'vivo X100 Pro 256GB',
      'iPhone 14 Pro Max 256GB',
      'Samsung Galaxy Z Fold 5 512GB',
      'Samsung Galaxy Z Flip 5 256GB',
      'Xiaomi Redmi Note 13 Pro 256GB',
      'OPPO A78 128GB',
      'vivo V29 256GB',
    ],
    imageQuery: 'iphone,smartphone',
  },
  laptop: {
    names: [
      'MacBook Air M3 13 inch',
      'MacBook Pro M3 14 inch',
      'Dell XPS 13 9315',
      'Dell XPS 15 9530',
      'ASUS ZenBook 14 OLED',
      'ASUS ROG Zephyrus G14',
      'Lenovo ThinkPad X1 Carbon Gen 11',
      'Lenovo IdeaPad Slim 5',
      'HP Spectre x360 14',
      'HP Pavilion 14',
      'Acer Swift 3',
      'Acer Nitro 5',
      'MSI Katana 15',
      'MSI Prestige 14',
      'LG Gram 16',
      'Razer Blade 15',
      'Gigabyte Aero 14 OLED',
      'Surface Laptop 5',
      'Huawei MateBook 14',
      'ASUS TUF Gaming F15',
    ],
    imageQuery: 'laptop,notebook',
  },
  tablet: {
    names: [
      'iPad Pro M2 12.9 inch',
      'iPad Air M1 10.9 inch',
      'iPad Gen 10',
      'iPad Mini 6',
      'Samsung Galaxy Tab S9 Ultra',
      'Samsung Galaxy Tab S9',
      'Xiaomi Pad 6 Pro',
      'Xiaomi Pad 6',
      'Lenovo Tab P12',
      'Lenovo Tab M10',
      'Huawei MatePad 11',
      'Surface Pro 9',
      'OPPO Pad 2',
      'realme Pad',
      'HONOR Pad 9',
      'Samsung Galaxy Tab A9',
      'iPad Pro 11 inch',
      'Xiaomi Pad 5',
      'Lenovo Tab P11',
      'Huawei MatePad SE',
    ],
    imageQuery: 'tablet,ipad',
  },
  'am-thanh': {
    names: [
      'Sony WH-1000XM5',
      'Bose QuietComfort Ultra',
      'AirPods Pro 2',
      'Samsung Galaxy Buds2 Pro',
      'JBL Charge 5',
      'Marshall Emberton II',
      'Sony SRS-XB33',
      'Bose SoundLink Flex',
      'JBL Flip 6',
      'Beats Studio Buds+',
      'Anker Soundcore Q45',
      'Edifier W820NB',
      'HyperX Cloud II',
      'Razer BlackShark V2',
      'Logitech G Pro X',
      'Shure MV7',
      'Rode NT-USB Mini',
      'Audio-Technica AT2020',
      'Sennheiser HD 560S',
      'AKG K371',
    ],
    imageQuery: 'headphones,speaker',
  },
  'dong-ho': {
    names: [
      'Apple Watch Series 9',
      'Apple Watch Ultra 2',
      'Samsung Galaxy Watch 6',
      'Samsung Galaxy Watch 6 Classic',
      'Xiaomi Watch S1',
      'Xiaomi Watch 2 Pro',
      'Garmin Venu 3',
      'Garmin Forerunner 265',
      'Huawei Watch GT 4',
      'Amazfit GTR 4',
      'Amazfit GTS 4',
      'Fitbit Versa 4',
      'Fitbit Sense 2',
      'Suunto 9 Peak',
      'Polar Ignite 3',
      'Casio G-Shock GBD',
      'TicWatch Pro 5',
      'Haylou RS5',
      'Xiaomi Smart Band 8',
      'OPPO Watch Free',
    ],
    imageQuery: 'smartwatch,watch',
  },
  camera: {
    names: [
      'Canon EOS R8',
      'Canon EOS R50',
      'Sony A7 IV',
      'Sony ZV-E10',
      'Fujifilm X-T5',
      'Fujifilm X-S20',
      'Nikon Z6 II',
      'Nikon Z50',
      'Panasonic Lumix S5',
      'Panasonic Lumix G100',
      'Canon PowerShot G7X',
      'Sony RX100 VII',
      'DJI Osmo Pocket 3',
      'GoPro Hero 12',
      'Insta360 X3',
      'Ống kính Sigma 18-50mm',
      'Ống kính Sony 24-70mm',
      'Ống kính Canon RF 50mm',
      'Ống kính Nikon Z 35mm',
      'Ống kính Fujifilm 23mm',
    ],
    imageQuery: 'camera,photography',
  },
  gaming: {
    names: [
      'PlayStation 5 Slim',
      'PlayStation 5 Digital',
      'Xbox Series X',
      'Xbox Series S',
      'Nintendo Switch OLED',
      'Nintendo Switch Lite',
      'Steam Deck OLED',
      'ASUS ROG Ally',
      'Tai nghe Logitech G Pro X',
      'Bàn phím Razer Huntsman Mini',
      'Bàn phím SteelSeries Apex 7',
      'Chuột Logitech G502 Hero',
      'Chuột Razer DeathAdder V3',
      'Tay cầm Xbox Elite Controller 2',
      'Tay cầm DualSense Edge',
      'Elgato Stream Deck',
      'Micro HyperX QuadCast S',
      'Micro NZXT Capsule',
      'Tay cầm Nintendo Pro Controller',
      'Bàn phím Corsair K70 RGB',
    ],
    imageQuery: 'gaming,console',
  },
};

async function main() {
  const vendor = await prisma.user.upsert({
    where: { email: DEMO_VENDOR.email },
    update: {
      full_name: DEMO_VENDOR.full_name,
      phone: DEMO_VENDOR.phone,
      password_hash: DEMO_VENDOR.password_hash,
    },
    create: DEMO_VENDOR,
  });

  const existingShop = await prisma.shop.findFirst({
    where: { owner_id: vendor.id },
  });

  const shop = existingShop
    ? await prisma.shop.update({
        where: { id: existingShop.id },
        data: {
          name: DEMO_SHOP.name,
          description: DEMO_SHOP.description,
          logo_url: DEMO_SHOP.logo_url,
          status: DEMO_SHOP.status,
        },
      })
    : await prisma.shop.create({
        data: {
          owner_id: vendor.id,
          name: DEMO_SHOP.name,
          description: DEMO_SHOP.description,
          logo_url: DEMO_SHOP.logo_url,
          status: DEMO_SHOP.status,
        },
      });

  for (const category of CATEGORIES) {
    await upsertCategory(category);
  }

  const roots = await prisma.category.findMany({
    where: { parent_id: null },
    include: { children: true },
    orderBy: { id: 'asc' },
  });

  for (const root of roots) {
    const childIds = root.children?.length ? root.children.map((child) => child.id) : [root.id];
    const catalog = PRODUCT_CATALOG[root.slug] || {
      names: Array.from({ length: 20 }, (_, idx) => `${root.name} ${idx + 1}`),
      imageQuery: `${root.name} product`,
    };

    for (let index = 1; index <= 20; index += 1) {
      const targetCategoryId = childIds[(index - 1) % childIds.length];
      const baseName = catalog.names[index - 1] || `${root.name} ${index}`;
      const slug = `${slugify(root.slug)}-${index}-${root.id}`;

      const updateData = {
        name: baseName,
        price: pickPrice(root.slug, index),
        stock_quantity: 20 + index,
        images: buildImages(catalog.imageQuery, index),
        category_id: targetCategoryId,
        shop_id: shop.id,
      } as Prisma.ProductUncheckedUpdateInput;

      const createData = {
        name: baseName,
        slug,
        description: `Sản phẩm ${root.name} chính hãng, phù hợp sử dụng hằng ngày.`,
        price: pickPrice(root.slug, index),
        stock_quantity: 20 + index,
        images: buildImages(catalog.imageQuery, index),
        category_id: targetCategoryId,
        shop_id: shop.id,
      } as Prisma.ProductUncheckedCreateInput;

      await prisma.product.upsert({
        where: { slug },
        update: updateData,
        create: createData,
      });
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
