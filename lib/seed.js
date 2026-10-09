// Catalogue from the Lapstack PDF (October 2026). Stock defaults to 1 per model: edit in /admin.
export const SEED = [
  {"name": "HP EliteBook 640 G9", "cpu": "Intel Core i5 12th Gen \u00b7 10 Core", "ram": "16 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 42000, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Dell Latitude 5420 \u00b7 Touch", "cpu": "Intel Core i5 11th Gen", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 28500, "stock": 1, "image": "", "note": "", "warranty": 1},
  {"name": "Dell Latitude 5420 \u00b7 Non-Touch", "cpu": "Intel Core i5 11th Gen", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 27700, "stock": 1, "image": "", "note": "", "warranty": 1},
  {"name": "Dell Latitude 5320 \u00b7 Touch", "cpu": "Intel Core i7 11th Gen", "ram": "16 GB", "storage": "512 GB SSD", "display": "13.3-inch", "price": 37500, "stock": 1, "image": "", "note": "", "warranty": 1},
  {"name": "Dell Latitude 5320 \u00b7 Touch", "cpu": "Intel Core i7 11th Gen", "ram": "32 GB", "storage": "512 GB SSD", "display": "13.3-inch", "price": 41000, "stock": 1, "image": "", "note": "", "warranty": 1},
  {"name": "Dell Latitude 5330 \u00b7 Touch", "cpu": "Intel Core i7 12th Gen \u00b7 12 Core", "ram": "32 GB", "storage": "512 GB SSD", "display": "13.3-inch", "price": 47000, "stock": 1, "image": "", "note": "", "warranty": 1},
  {"name": "Dell Latitude 5420", "cpu": "Intel Core i7 11th Gen", "ram": "16 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 34500, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "HP ProBook 440", "cpu": "Intel Core i5 11th Gen", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 31000, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Lenovo ThinkPad T14 \u00b7 Touch", "cpu": "Intel Core i5 10th Gen", "ram": "16 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 27000, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Dell Latitude 5401", "cpu": "Intel Core i7 9th Gen \u00b7 H Series", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 25500, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Dell Latitude 5411", "cpu": "Intel Core i7 10th Gen \u00b7 H Processor", "ram": "8 GB", "storage": "512 GB SSD", "display": "14-inch", "price": 30000, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "MacBook Air A1466", "cpu": "Intel Core i5", "ram": "8 GB", "storage": "256 GB SSD", "display": "13.3-inch", "price": 21000, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Lenovo ThinkPad E14", "cpu": "Intel Core i3 10th Gen", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 23000, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Lenovo ThinkPad T495", "cpu": "AMD Ryzen 5 3500", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 25000, "stock": 1, "image": "", "note": "2 GB graphics \u00b7 180\u00b0 tilt", "warranty": 0},
  {"name": "Lenovo ThinkPad T14", "cpu": "Intel Core i5 10th Gen", "ram": "8 GB", "storage": "256 GB SSD", "display": "14-inch", "price": 27500, "stock": 1, "image": "", "note": "", "warranty": 0},
  {"name": "Dell Precision 5570 \u00b7 Touch", "cpu": "Intel Core i7 12th Gen", "ram": "16 GB", "storage": "512 GB NVMe SSD", "display": "15.6-inch", "price": 75000, "stock": 1, "image": "", "note": "NVIDIA RTX A1000 \u00b7 4 GB", "warranty": 0},
];

// Representative photo per model (files in public/laptops). Filled in only where a listing has no image.
// Sharp studio photos (1254px) per model. On startup they replace the old small stock photos and the
// earlier low-quality uploads listed in OLD_PHOTO; photos you upload yourself are never touched.
export const PHOTOS = {
  'HP EliteBook 640 G9': '/laptops/hd/hp-elitebook-640-g9.jpg',
  'HP ProBook 440': '/laptops/hd/hp-probook-440.jpg',
  'Dell Latitude 5420 · Touch': '/laptops/hd/dell-latitude-5420.jpg',
  'Dell Latitude 5420 · Non-Touch': '/laptops/hd/dell-latitude-5420.jpg',
  'Dell Latitude 5420': '/laptops/hd/dell-latitude-5420.jpg',
  'Dell Latitude 5320 · Touch': '/laptops/hd/dell-latitude-5320.jpg',
  'Dell Latitude 5330 · Touch': '/laptops/hd/dell-latitude-5330.jpg',
  'Dell Latitude 5401': '/laptops/hd/dell-latitude-5401.jpg',
  'Dell Latitude 5411': '/laptops/hd/dell-latitude-5411.jpg',
  'Dell Precision 5570 · Touch': '/laptops/hd/dell-precision-5570.jpg',
  'Lenovo ThinkPad T14 · Touch': '/laptops/hd/thinkpad-t14.jpg',
  'Lenovo ThinkPad T14': '/laptops/hd/thinkpad-t14.jpg',
  'Lenovo ThinkPad E14': '/laptops/hd/thinkpad-e14.jpg',
  'Lenovo ThinkPad T495': '/laptops/hd/thinkpad-t495.jpg',
};
// Old images that should be swapped for the HD photo: the built-in small stock files and the poster crops uploaded on 9 Oct.
export const OLD_PHOTO = [
  '/laptops/%.jpg',
  '%/products/Dell_Latitude_5401-%', '%/products/Dell_Latitude_5411-%', '%/products/Dell_Latitude_5420_Touch-%',
  '%/products/Dell_Latitude_5420_Non_Touch-%', '%/products/Lenovo_ThinkPad_T14_Touch-%', '%/products/Lenovo_ThinkPad_T495-%',
  '%/products/Lenovo_ThinkPad_E14_Studio_Showcase-%',
];
