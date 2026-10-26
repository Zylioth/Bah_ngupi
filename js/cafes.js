/* ============================================================
   Bah_ngupi — starter cafe directory & coffee bean database
   Cafe names / areas curated from public Brunei coffee guides
   (Brunei Coffee Trail, Feb 2025 edition, and the Explore Brunei
   directory). Details are intentionally light because hours and
   menus change — users can add and edit their own entries.
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});

  const SEED_CAFES = [
    {
      id: "noice-kiulap",
      name: "Noice",
      area: "Kiulap",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty coffee", "Sandwiches", "Desserts"],
      description:
        "Gourmet coffee meets gourmet sandwiches at this lively Kiulap hangout, loved for its signature Noice latte and indulgent desserts.",
      address: "Kiulap, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Noice Latte", "Flat White", "Iced Americano", "Croissant"],
      color: "#c98a4b",
      color2: "#5b3820"
    },
    {
      id: "salted-batu-satu",
      name: "Salt:ed",
      area: "Batu Satu",
      district: "Brunei-Muara",
      category: "Bakery",
      tags: ["Korean bakery", "Specialty coffee", "Pastries"],
      description:
        "Korean-inspired bakery with fluffy garlic cream cheese buns, soft milk bread and delicate pastries, paired with specialty coffee.",
      address: "Batu Satu, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Cappuccino", "Cream Cheese Bun", "Milk Bread", "Matcha Latte"],
      color: "#b8694a",
      color2: "#4d261b"
    },
    {
      id: "lanes-microbakery",
      name: "Lanes Microbakery & Coffee",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Bakery",
      tags: ["Sourdough", "Pastries", "Slow coffee"],
      description:
        "Artisanal sourdough, handcrafted desserts and specialty coffee in a warm, quietly stylish micro-bakery.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Filter Coffee", "Sourdough Loaf", "Butter Croissant", "Flat White"],
      color: "#a9853f",
      color2: "#4a3518"
    },
    {
      id: "piccolo-bsb",
      name: "Piccolo Cafe",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Brunch",
      tags: ["Brunch", "Syphon coffee", "Pancakes"],
      description:
        "A charming brunch spot near the waterfront, known for fluffy pancakes, creamy pastas, breakfast platters and syphon coffee.",
      address: "Bandar Seri Begawan (near the Waterfront)",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Piccolo Latte", "Syphon Coffee", "Pancakes", "Iced Latte"],
      color: "#8b9a72",
      color2: "#35402b"
    },
    {
      id: "roasted-sip-jerudong",
      name: "Roasted Sip",
      area: "Jerudong",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["In-house roast", "Espresso", "Beans to go"],
      description:
        "Specialty coffee cafe serving freshly roasted beans, handcrafted drinks and light bites — a favourite for local coffee enthusiasts.",
      address: "Jerudong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["House Espresso", "Flat White", "Cold Brew", "Single Origin Filter"],
      color: "#a06f8a",
      color2: "#42283a"
    },
    {
      id: "kitani-jerudong",
      name: "Kitani",
      area: "Jerudong",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Local dishes", "Coffee", "Community"],
      description:
        "A community-style cafe where friends and families gather over local dishes, coffee and desserts.",
      address: "Jerudong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Kopi", "Latte", "Local Brunch", "Dessert of the Day"],
      color: "#6f8f96",
      color2: "#283c40"
    },
    {
      id: "reform-jerudong",
      name: "Reform",
      area: "Jerudong",
      district: "Brunei-Muara",
      category: "Brunch",
      tags: ["Brunch", "Healthy plates", "Pastries"],
      description:
        "Cosy cafe with specialty coffee, healthy brunch options and fresh pastries — a relaxed spot for casual meetings.",
      address: "Jerudong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Cappuccino", "Matcha Latte", "Brunch Plate", "Croissant"],
      color: "#c27b5c",
      color2: "#4f2a1e"
    },
    {
      id: "18grams-sengkurong",
      name: "18grams",
      area: "Sengkurong",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Hand-crafted coffee", "Pastries", "Work friendly"],
      description:
        "Modern cafe serving hand-crafted coffee, light meals and freshly baked pastries in a warm, welcoming space.",
      address: "Sengkurong, Brunei-Muara",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["18grams Latte", "Espresso", "Pastry", "Iced Chocolate"],
      color: "#c98a4b",
      color2: "#4d2f19"
    },
    {
      id: "mr-bakers-gadong",
      name: "Mr Baker's Cafe",
      area: "Gadong",
      district: "Brunei-Muara",
      category: "Bakery",
      tags: ["Bakery", "Coffee", "Study spot"],
      description:
        "Charming bakery-cafe with fresh coffee, baked goods and light meals, popular with students and friends catching up.",
      address: "Gadong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$",
      menu: ["Latte", "Americano", "Cinnamon Roll", "Sandwich"],
      color: "#9e7b55",
      color2: "#3e2d21"
    },
    {
      id: "kapra-bsb",
      name: "Kapra Coffee Roasters",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["Local roaster", "Filter", "Espresso"],
      description:
        "Artisan cafe specialising in freshly roasted coffee and hand-crafted drinks, with a welcoming room for coffee enthusiasts.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Kapra Filter", "Espresso", "Flat White", "Beans to go"],
      color: "#8b9a72",
      color2: "#2f3a27"
    },
    {
      id: "dahaga-bsb",
      name: "Dahaga Coffee Co.",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Hand-brewed", "Light meals", "Cosy"],
      description:
        "Specialty coffee cafe with hand-brewed drinks, light meals and a calm, welcoming room for slow afternoons.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["V60 Filter", "Cold Brew", "Latte", "Toast"],
      color: "#b8694a",
      color2: "#42231a"
    },
    {
      id: "bread-parlour-bsb",
      name: "Bread Parlour",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Bakery",
      tags: ["Artisan bread", "Brunch", "Specialty coffee"],
      description:
        "Modern bakery-cafe known for artisanal breads, pastries, sandwiches and specialty coffee in a stylish room.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Flat White", "Sourdough Toast", "Pain au Chocolat", "Iced Latte"],
      color: "#a9853f",
      color2: "#3f2f17"
    },
    {
      id: "seventh-cup-bsb",
      name: "The Seventh Cup",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty coffee", "Desserts", "Late hangout"],
      description:
        "Trendy cafe with specialty coffee, desserts and casual meals in a stylish space made for long conversations.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Seventh Cup Latte", "Espresso Tonic", "Cake", "Cold Brew"],
      color: "#a06f8a",
      color2: "#382334"
    },
    {
      id: "kopifix-tutong",
      name: "Kopifix",
      area: "Tutong",
      district: "Tutong",
      category: "Cafe",
      tags: ["Artisan coffee", "Desserts", "Community"],
      description:
        "Vibrant Tutong cafe known for artisan coffee, photogenic desserts and a friendly community atmosphere.",
      address: "Tutong",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Kopifix Latte", "Americano", "Dessert", "Iced Tea"],
      color: "#c27b5c",
      color2: "#4a2a1f"
    },
    {
      id: "melati-tutong",
      name: "Melati Coffee",
      area: "Tutong",
      district: "Tutong",
      category: "Cafe",
      tags: ["Pastries", "Coffee", "Quiet"],
      description:
        "Cosy cafe serving aromatic coffee, freshly baked pastries and light meals — a calm spot for studying or catching up.",
      address: "Tutong",
      hours: "Varies — tap Maps for today's hours",
      price: "$",
      menu: ["Latte", "Cappuccino", "Butter Cake", "Iced Coffee"],
      color: "#9e7b55",
      color2: "#3a2c20"
    },
    {
      id: "thinking-cup-seria",
      name: "Thinking Cup Cafe",
      area: "Seria",
      district: "Belait",
      category: "Cafe",
      tags: ["Pastries", "Work friendly", "Calm"],
      description:
        "Bright Seria cafe with premium coffee, freshly baked pastries and cosy corners for conversations or solo work.",
      address: "Seria, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Flat White", "Filter Coffee", "Pastry", "Matcha"],
      color: "#8b9a72",
      color2: "#313a29"
    },
    {
      id: "coffee-industry-seria",
      name: "Coffee Industry",
      area: "Seria",
      district: "Belait",
      category: "Cafe",
      tags: ["Bold espresso", "Creative drinks", "Modern"],
      description:
        "Trendy Seria cafe with bold espresso, creative beverages and modern decor — a popular hangout for coffee lovers.",
      address: "Seria, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Double Espresso", "Coffee Industry Latte", "Cold Brew", "Brownie"],
      color: "#6f8f96",
      color2: "#24373b"
    },
    {
      id: "beanery-kb",
      name: "Beanery & Co.",
      area: "Kuala Belait",
      district: "Belait",
      category: "Cafe",
      tags: ["Brunch", "Fresh brewed", "Community"],
      description:
        "Cosy Belait cafe with fresh brewed coffee, pastries and wholesome brunch in a friendly community hub.",
      address: "Kuala Belait, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Brewed Coffee", "Latte", "Big Brunch", "Scone"],
      color: "#c98a4b",
      color2: "#4b301c"
    },
    {
      id: "grindside-kb",
      name: "Grindside Coffee Co.",
      area: "Kuala Belait",
      district: "Belait",
      category: "Roastery",
      tags: ["Hand-crafted", "Coffee tasting", "Industrial"],
      description:
        "Industrial-style cafe with hand-crafted coffee, light bites and a warm room made for casual socialising.",
      address: "Kuala Belait, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Espresso", "Cortado", "Batch Brew", "Light Bites"],
      color: "#a06f8a",
      color2: "#3a2836"
    },
    {
      id: "slice-by-ia-kb",
      name: "The Slice by IA",
      area: "Kuala Belait",
      district: "Belait",
      category: "Patisserie",
      tags: ["Desserts", "Minimalist", "Quiet"],
      description:
        "Sleek cafe offering signature coffee, creative desserts and a minimalist room for study or quiet meetups.",
      address: "Kuala Belait, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Signature Latte", "Espresso", "Slice of Cake", "Iced Matcha"],
      color: "#b8694a",
      color2: "#45251b"
    }
  ];

  const COFFEE_BEANS = [
    { roaster: "Roasted Sip", name: "House Espresso", origin: "Blend", region: "Brunei", process: "Washed", notes: "Chocolate, nutty, smooth" },
    { roaster: "Roasted Sip", name: "Single Origin", origin: "Ethiopia", region: "Yirgacheffe", process: "Washed", notes: "Floral, citrus, bright" },
    { roaster: "Roasted Sip", name: "Dark Roast", origin: "Blend", region: "Brunei", process: "Natural", notes: "Dark chocolate, bold, smoky" },
    { roaster: "Kapra Coffee", name: "Kapra House Blend", origin: "Blend", region: "Brunei", process: "Washed", notes: "Caramel, red apple, clean" },
    { roaster: "Top Grind", name: "Top Grind Espresso", origin: "Blend", region: "Brunei", process: "Washed", notes: "Cocoa, hazelnut, syrupy" },
    { roaster: "Brew Lab Coffee Roaster", name: "Lab Espresso", origin: "Blend", region: "Brunei", process: "Washed", notes: "Brown sugar, orange, balanced" },
    { roaster: "Qasa Coffee", name: "Qasa Filter", origin: "Indonesia", region: "Sumatra", process: "Wet-hulled", notes: "Earthy, herbal, full body" },
    { roaster: "MJU", name: "MJU Signature Blend", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Caramel, balanced, sweet" },
    { roaster: "MJU", name: "MJU Single Origin", origin: "Sumatra", region: "Mandheling", process: "Wet-hulled", notes: "Earthy, spicy, full body" },
    { roaster: "Sol", name: "Sol House Blend", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Chocolate, citrus, clean" },
    { roaster: "Sol", name: "Sol Light Roast", origin: "Kenya", region: "Nyeri", process: "Washed", notes: "Berry, wine-like, bright" },
    { roaster: "103 Coffee", name: "103 House Blend", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Nutty, chocolate, smooth" },
    { roaster: "PULP Coffee", name: "PULP Espresso", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Fruity, sweet, complex" },
    { roaster: "Beans & Berries", name: "Sabah Single Origin", origin: "Malaysia", region: "Sabah", process: "Honey", notes: "Palm sugar, mango, soft acidity" }
  ];

  BN.SEED_CAFES = SEED_CAFES;
  BN.COFFEE_BEANS = COFFEE_BEANS;
})();
