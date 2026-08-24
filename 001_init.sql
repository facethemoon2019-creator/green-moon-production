
CREATE TABLE IF NOT EXISTS settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 data TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 slug TEXT NOT NULL UNIQUE,
 icon TEXT,
 image_url TEXT,
 sort_order INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 category_id INTEGER,
 name TEXT NOT NULL,
 slug TEXT NOT NULL UNIQUE,
 description TEXT,
 image_url TEXT,
 price REAL NOT NULL DEFAULT 0,
 old_price REAL NOT NULL DEFAULT 0,
 wholesale_price REAL NOT NULL DEFAULT 0,
 cost_price REAL NOT NULL DEFAULT 0,
 stock INTEGER NOT NULL DEFAULT 0,
 max_qty INTEGER NOT NULL DEFAULT 99,
 active INTEGER NOT NULL DEFAULT 1,
 care_json TEXT NOT NULL DEFAULT '{}',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flash_offers (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 description TEXT,
 image_url TEXT,
 price REAL NOT NULL,
 old_price REAL NOT NULL DEFAULT 0,
 stock INTEGER NOT NULL DEFAULT 0,
 show_seconds INTEGER NOT NULL DEFAULT 15,
 gap_seconds INTEGER NOT NULL DEFAULT 60,
 active INTEGER NOT NULL DEFAULT 1,
 sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_number TEXT NOT NULL UNIQUE,
 customer_name TEXT NOT NULL,
 phone TEXT NOT NULL,
 whatsapp TEXT,
 governorate TEXT,
 area TEXT,
 building TEXT,
 floor TEXT,
 apartment TEXT,
 notes TEXT,
 subtotal REAL NOT NULL,
 delivery REAL NOT NULL DEFAULT 0,
 discount REAL NOT NULL DEFAULT 0,
 total REAL NOT NULL,
 status TEXT NOT NULL DEFAULT 'new',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 order_id INTEGER NOT NULL,
 product_id INTEGER,
 name TEXT NOT NULL,
 qty INTEGER NOT NULL,
 unit_price REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 customer_name TEXT NOT NULL,
 stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
 text TEXT NOT NULL,
 verified INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scratch_cards (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 reward_text TEXT NOT NULL,
 invoice_delta REAL NOT NULL DEFAULT 0,
 uses_limit INTEGER NOT NULL DEFAULT 1,
 active INTEGER NOT NULL DEFAULT 1
);


CREATE TABLE IF NOT EXISTS magazine_music (
 id INTEGER PRIMARY KEY CHECK(id=1),
 title TEXT NOT NULL DEFAULT 'Green Moon Magazine',
 audio_url TEXT NOT NULL DEFAULT '',
 volume REAL NOT NULL DEFAULT 0.35,
 autoplay INTEGER NOT NULL DEFAULT 1,
 loop_enabled INTEGER NOT NULL DEFAULT 1,
 enabled INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO categories(name,slug,icon,sort_order) VALUES
('نباتات الزينة','plants','🪴',10),
('العروض','offers','🔥',20),
('الفازات والإكسسوارات','vases','🏺',30);

INSERT OR IGNORE INTO settings(id,data) VALUES
(1,'{"name":"Green Moon Plants & Flowers","msg":"أهلاً بيك في Green Moon 🌿","address":"الدقي — داخل المتحف الزراعي","foundedYear":2017,"about":"Green Moon علامة متخصصة في نباتات الزينة الطبيعية والفازات والإكسسوارات وحلول المساحات الخضراء، مع تجربة شراء مصممة بعناية.","history":"Green Moon بدأت رحلتها في مجال النباتات والزهور وتطورت لتقدم اختيارات نباتية وتنسيقات وخدمات تناسب المنازل والمكاتب والمنشآت.","mission":"تقديم نباتات ومنتجات خضراء مختارة بعناية، مع معلومات واضحة عن العناية وتجربة شراء موثوقة وخدمة تهتم بالتفاصيل.","vision":"أن تصبح Green Moon من العلامات المميزة في مجال نباتات الزينة وحلول المساحات الخضراء في مصر، من خلال الجودة والابتكار وتجربة عميل راقية.","values":"الجودة • الثقة • الاهتمام بالتفاصيل • الابتكار • المعرفة • خدمة العميل • الاستدامة","services":"نباتات زينة • بامبو • فازات وإكسسوارات • باكدجات وعروض • إرشادات العناية بالنباتات • حلول وتوريد للشركات والمنشآت.","quality":"نختار المنتجات بعناية ونحرص على تقديم وصف واضح للعناية، مع دعم للعميل قبل وبعد الشراء وفق السياسات المعتمدة للمتجر.","b2b":"توريد وتنسيق النباتات للمكاتب والعيادات والفنادق والمطاعم والمنشآت، مع إمكانية إعداد حلول حسب المساحة والاحتياج.","deliveryFee":50,"upsellMargin":22,"magazineMusic":{"enabled":true,"url":"/default-music.mp3","volume":0.35,"autoplay":true,"loop":true}}');
