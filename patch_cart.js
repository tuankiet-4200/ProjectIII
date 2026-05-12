const fs = require('fs');

const file = 'frontend/app/(public)/cart/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update CartItem interface
content = content.replace(
  /interface CartItem \{[\s\S]*?shopId: number;\n\}/,
  `interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  emoji: string;
  bgFrom: string;
  bgTo: string;
  shopId: string | number;
  shopName: string;
  imageUrl?: string;
}`
);

// 2. Update CartShop interface
content = content.replace(
  /interface CartShop \{[\s\S]*?\}\n/,
  `interface CartShop {
  id: string | number;
  name: string;
  badge?: string;
}
`
);

// 3. Update INITIAL_ITEMS to include shopName
content = content.replace(/shopId: 1,/g, 'shopId: 1, shopName: "TechHub Official Store",');
content = content.replace(/shopId: 2,/g, 'shopId: 2, shopName: "Luxe Living Home",');

// 4. Update the mapping logic inside loadCart
content = content.replace(
  /cart\.groups\.forEach\(\(group: any, gi: number\) => \{[\s\S]*?\}\);/,
  `cart.groups.forEach((group: any, gi: number) => {
            const shopId = group.shop?.id || gi + 1;
            const shopName = group.shop?.name || 'Shop';
            group.items.forEach((item: any) => {
              mapped.push({
                id: item.product_id || \`prod-\${idx}\`,
                name: item.product?.name || \`Product \${idx + 1}\`,
                variant: item.product?.category?.name || '',
                price: Number(item.product?.price) || 0,
                qty: item.quantity,
                emoji: EMOJI_MAP[idx % EMOJI_MAP.length],
                bgFrom: BG_MAP[idx % BG_MAP.length].from,
                bgTo: BG_MAP[idx % BG_MAP.length].to,
                shopId: shopId,
                shopName: shopName,
                imageUrl: item.product?.images?.[0]
              });
              idx++;
            });
          });`
);

// 5. Update itemsByShop grouping logic
content = content.replace(
  /const itemsByShop = SHOPS\.map\(\(shop\) => \(\{[\s\S]*?\}\)\)\.filter\(\(s\) => s\.items\.length > 0\);/,
  `const itemsByShop = items.reduce((acc, item) => {
    let group = acc.find(g => g.id === item.shopId);
    if (!group) {
      group = { id: item.shopId, name: item.shopName, badge: 'Verified', items: [] };
      acc.push(group);
    }
    group.items.push(item);
    return acc;
  }, [] as (CartShop & { items: CartItem[] })[]);`
);

// 6. Update the thumbnail rendering to use imageUrl if available
content = content.replace(
  /<div\n\s*className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"[\s\S]*?<\/div>/,
  `{item.imageUrl ? (
                          <div className="w-16 h-16 rounded-xl shrink-0 overflow-hidden bg-white">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div
                            className="w-16 h-16 rounded-xl shrink-0 flex items-center justify-center text-2xl"
                            style={{
                              background: \`linear-gradient(135deg, \${item.bgFrom}, \${item.bgTo})\`,
                            }}
                          >
                            {item.emoji}
                          </div>
                        )}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Cart page patched.');
