/* ============================================================
   Bah_ngupi — hand-curated cafe notes & coffee bean database
   37 curated Brunei cafes, each with real copy (description, menu,
   price, hours). Broader branch coverage comes from the generated
   js/cafes-directory.js, not from this file.
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});

  const SEED_CAFES = [
    // --- BRUNEI-MUARA DISTRICT (Core & Capital Area) ---
    {
      id: "qahwa-by-taqwa",
      name: "Qahwa by Taqwa",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty Coffee", "Hidden Gem", "Must Visit"],
      description:
        "A charming specialty coffee spot tucked away in a quiet lane among the city buildings, featured officially in the Brunei Coffee Trail.",
      address: "Bandar Seri Begawan, Brunei-Muara",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Signature Qahwa Latte", "Espresso", "Cold Brew", "Artisan Pastry"],
      color: "#6b4226",
      color2: "#2d1a0e"
    },
    {
      id: "qahwa-bakut",
      name: "Qahwa Bakery & Coffee",
      area: "Kampong Bakut",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty coffee", "Artisan pastries", "Must Visit"],
      description:
        "A highly popular aesthetic cafe and bakery known for signature handcrafted coffee, specialty espresso, and fresh pastries.",
      address: "Kampong Bakut, Brunei-Muara",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Qahwa Latte", "Spanish Latte", "Batch Brew", "Croissant"],
      color: "#7a431d",
      color2: "#33180b"
    },
    {
      id: "cbtl-kiulap",
      name: "The Coffee Bean & Tea Leaf",
      area: "Kiulap",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Global Chain", "Espresso", "Ice Blended", "Brunch"],
      description:
        "A classic staple in Brunei's coffee culture offering high-quality espresso drinks, gourmet teas, and full breakfast menus.",
      address: "Kiulap, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Caramel Macchiato", "Vanilla Ice Blended", "Today's Brew", "Cheesecake"],
      color: "#2a1b40",
      color2: "#120a1f"
    },
    {
      id: "ruang-concrete-bsb",
      name: "Ruang Concrete",
      area: "Mulaut",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Industrial minimal", "Specialty coffee", "Hangout"],
      description:
        "Industrial concrete aesthetic paired with serious specialty coffee brews, espresso drinks, and modern café vibes.",
      address: "6 Simpang 343-2, Mulaut",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Pour Over Filter", "Flat White", "Iced Espresso Tonic", "Pastries"],
      color: "#737578",
      color2: "#2b2c2d"
    },
    {
      id: "roasted-sip-jerudong",
      name: "Roasted Sip",
      area: "Jerudong",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["Local Roaster", "Specialty Coffee", "Flagship"],
      description:
        "Brunei's premiere specialty coffee roaster with daily in-house Giesen roasts, filter coffees, and handcrafted lattes.",
      address: "Jerudong, Bandar Seri Begawan",
      hours: "7:00 AM – 11:00 PM",
      price: "$$",
      menu: ["House Espresso", "Ethiopia Guji Filter", "Flat White", "Cold Brew"],
      color: "#a06f8a",
      color2: "#42283a"
    },
    {
      id: "monochrome-gadong",
      name: "Monochrome Coffee Co.",
      area: "Gadong",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Minimalist", "Specialty Espresso", "Desserts"],
      description:
        "Sleek minimalist café popular for smooth espresso extractions, matcha lattes, and fine artisanal treats.",
      address: "Gadong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Monochrome Latte", "Cortado", "Dirty Matcha", "Choco Tart"],
      color: "#3d3d3d",
      color2: "#1a1a1a"
    },
    {
      id: "coffee-ratio-bsb",
      name: "Coffee Ratio",
      area: "Kiulap",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Precision Brews", "Minimalist", "Work Friendly"],
      description:
        "A modern minimalist cafe focused on precise coffee-to-water ratios, expert espresso dialing, and tranquil ambiance.",
      address: "Kiulap, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Ratio Latte", "V60 Single Origin", "Piccolo", "Pain au Chocolat"],
      color: "#8c7051",
      color2: "#3b2d1f"
    },
    {
      id: "rustique-absolute",
      name: "Rustique by Absolute",
      area: "Batu Bersurat",
      district: "Brunei-Muara",
      category: "Brunch",
      tags: ["Gourmet Brunch", "Artisan Coffee", "Cozy"],
      description:
        "Charming cafe with stylish interiors, handcrafted coffees, and creative brunch plates loved by local coffee enthusiasts.",
      address: "Batu Bersurat, Gadong",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Flat White", "Absolute Mocha", "Avocado Toast", "Truffle Fries"],
      color: "#96654a",
      color2: "#3d271a"
    },
    {
      id: "jumpa-coffee-bsb",
      name: "Jumpa Coffee",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["Community Hub", "Micro Roaster", "Filter Coffee"],
      description:
        "A vibrant hub connecting local coffee lovers and regional roasters with micro-batch filter pour overs and espresso.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Batch Brew", "Hand Pour Over", "Jumpa Latte", "Brownies"],
      color: "#5c7865",
      color2: "#233329"
    },
    {
      id: "hwc-coffee-gadong",
      name: "HWC Coffee",
      area: "Gadong",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty Chain", "House Blend", "Quick Grab"],
      description:
        "Contemporary specialty coffee bar serving specialty-grade house beans, rich lattes, and fresh pastries.",
      address: "Gadong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["HWC Signature Latte", "Americano", "Brown Sugar Boba Latte", "Croissant"],
      color: "#1f4037",
      color2: "#0b1a16"
    },
    {
      id: "noice-kiulap",
      name: "Noice",
      area: "Kiulap",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty coffee", "Sandwiches", "Desserts"],
      description:
        "Gourmet coffee meets gourmet sandwiches at this lively Kiulap hangout, loved for its signature Noice latte and desserts.",
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
        "Korean-inspired bakery with garlic cream cheese buns and delicate pastries, paired with specialty espresso drinks.",
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
      tags: ["Brunch", "Syphon coffee", "Waterfront"],
      description:
        "A charming waterfront brunch spot known for fluffy pancakes, breakfast platters, syphon coffee, and espresso.",
      address: "Bandar Seri Begawan (Near Waterfront)",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Piccolo Latte", "Syphon Coffee", "Pancakes", "Iced Latte"],
      color: "#8b9a72",
      color2: "#35402b"
    },
    {
      id: "top-grind-berakas",
      name: "Top Grind Coffee Roasters",
      area: "Berakas",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["Local Roaster", "Espresso Bar", "Beans"],
      description:
        "Specialty roaster and coffee destination serving syrupy espresso extractions, batch brews, and single origin beans.",
      address: "Berakas, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$",
      menu: ["Top Grind Espresso", "Batch Brew", "Iced Latte", "Brownies"],
      color: "#b07d62",
      color2: "#422b1f"
    },
    {
      id: "kapra-bsb",
      name: "Kapra Coffee Roasters",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["Local Roaster", "Filter", "Espresso"],
      description:
        "Artisan roastery specializing in freshly roasted coffee beans, hand-poured filters, and custom espresso blends.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Kapra Filter", "Espresso", "Flat White", "Beans to go"],
      color: "#8b9a72",
      color2: "#2f3a27"
    },
    {
      id: "zus-coffee-kiulap",
      name: "ZUS Coffee",
      area: "Kiulap",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Tech-driven", "Affordable", "Spanish Latte"],
      description:
        "Popular tech-driven specialty coffee chain offering convenient app ordering, signature Spanish lattes, and dark roasts.",
      address: "Kiulap, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$",
      menu: ["Spanish Latte", "Butter Creme Latte", "CEO Latte", "Cold Brew"],
      color: "#002d62",
      color2: "#001b3d"
    },
    {
      id: "mile-coffee-gadong",
      name: "Mile Coffee",
      area: "Gadong",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty Coffee", "Cozy", "Hangout"],
      description:
        "A peaceful specialty cafe focused on expertly brewed coffees, inviting modern interiors, and quiet conversation.",
      address: "Gadong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Mile Latte", "Iced Mocha", "Filter Coffee", "Pastries"],
      color: "#755944",
      color2: "#2e2016"
    },
    {
      id: "dahaga-bsb",
      name: "Dahaga Coffee Co.",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Hand-brewed", "Slow Coffee", "Cosy"],
      description:
        "Specialty coffee cafe with hand-brewed filter coffee, light meals, and a calm space for slow coffee afternoons.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["V60 Filter", "Cold Brew", "Latte", "Sourdough Toast"],
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
      area: "Kiulap",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Specialty coffee", "Desserts", "Youth Hangout"],
      description:
        "Trendy cafe focusing on expertly brewed coffee, signature iced beverages, and photogenic dessert plates.",
      address: "Kiulap, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Seventh Cup Latte", "Espresso Tonic", "Burnt Cheesecake", "Cold Brew"],
      color: "#a06f8a",
      color2: "#382334"
    },
    {
      id: "brewlab-gadong",
      name: "Brew Lab Coffee Roaster",
      area: "Gadong",
      district: "Brunei-Muara",
      category: "Roastery",
      tags: ["Micro-roastery", "Pour over", "Espresso bar"],
      description:
        "Experimental micro-roastery focusing on precise extraction techniques, single-origin pour overs, and bold espresso.",
      address: "Gadong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Lab Espresso", "V60 Pour Over", "Cold Drip", "Flat White"],
      color: "#708238",
      color2: "#2d3514"
    },
    {
      id: "hauari-kafe-bsb",
      name: "Hauari Kafe",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Artisan Brews", "Cozy", "Local Favorite"],
      description:
        "Popular local coffee bar serving smooth milk coffee, filter pour overs, and fresh baked snacks.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Hauari Signature Latte", "Iced Latte", "Filter Brew", "Brownie"],
      color: "#85583b",
      color2: "#331f12"
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
      id: "coffeeculture-gadong",
      name: "Coffee Culture",
      area: "Gadong",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Cozy ambiance", "Coffee", "Desserts"],
      description:
        "A welcoming local hub in Gadong providing quality coffee drinks, pastries, and a comfortable place to hang out.",
      address: "Gadong, Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Caramel Macchiato", "Mocha", "Cheesecake", "Latte"],
      color: "#a3704c",
      color2: "#3b2313"
    },
    {
      id: "qasa-coffee-bandar",
      name: "Qasa Coffee",
      area: "Bandar Seri Begawan",
      district: "Brunei-Muara",
      category: "Cafe",
      tags: ["Artisan brews", "Cozy", "Local hangout"],
      description:
        "Cozy neighborhood cafe serving comforting artisan brews and light snacks in the heart of the capital.",
      address: "Bandar Seri Begawan",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Qasa Filter", "Latte", "Mocha", "Pastries"],
      color: "#8c6239",
      color2: "#332212"
    },

    // --- TUTONG DISTRICT ---
    {
      id: "kopifix-tutong",
      name: "Kopifix",
      area: "Tutong",
      district: "Tutong",
      category: "Cafe",
      tags: ["Artisan coffee", "Desserts", "Tutong Must-Visit"],
      description:
        "Vibrant Tutong staple famous for handcrafted coffee, photogenic desserts, and a lively local community vibe.",
      address: "Kampong Petani, Tutong",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Kopifix Latte", "Iced Spanish Latte", "Dessert Slice", "Iced Matcha"],
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
        "Cosy Tutong spot serving aromatic coffees, freshly baked cakes, and light bites in a peaceful atmosphere.",
      address: "Tutong Town, Tutong",
      hours: "Varies — tap Maps for today's hours",
      price: "$",
      menu: ["Latte", "Cappuccino", "Butter Cake", "Iced Coffee"],
      color: "#9e7b55",
      color2: "#3a2c20"
    },

    // --- BELAIT DISTRICT (Kuala Belait & Seria) ---
    {
      id: "grindside-kb",
      name: "Grindside Coffee Co.",
      area: "Kuala Belait",
      district: "Belait",
      category: "Roastery",
      tags: ["Hand-crafted", "Industrial", "KB Specialty"],
      description:
        "Industrial-style coffee bar in Belait known for serious espresso extractions, cortados, and manual filter brews.",
      address: "V Plaza, Kuala Belait, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Espresso", "Cortado", "Batch Brew", "Light Bites"],
      color: "#a06f8a",
      color2: "#3a2836"
    },
    {
      id: "thinking-cup-seria",
      name: "Thinking Cup Cafe",
      area: "Seria",
      district: "Belait",
      category: "Cafe",
      tags: ["Pastries", "Work friendly", "Seria Spot"],
      description:
        "Bright Seria cafe with premium espresso coffee, freshly baked pastries, and quiet corners ideal for work.",
      address: "Seria, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Flat White", "Filter Coffee", "Pastry", "Matcha Latte"],
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
        "Trendy Seria cafe with bold espresso, creative signature beverages, and modern industrial aesthetic.",
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
      tags: ["Brunch", "Fresh brewed", "Belait Hub"],
      description:
        "Cosy Belait cafe serving fresh brewed coffee, espresso, waffles, and hearty brunch platters.",
      address: "Kuala Belait, Belait",
      hours: "Varies — tap Maps for today's hours",
      price: "$$",
      menu: ["Brewed Coffee", "Latte", "Big Brunch", "Scone"],
      color: "#c98a4b",
      color2: "#4b301c"
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
    },

    // --- TEMBURONG DISTRICT ---
    {
      id: "javara-temburong",
      name: "Javara Cafe",
      area: "Bangar",
      district: "Temburong",
      category: "Cafe",
      tags: ["Nature view", "Temburong Stop", "Rest stop"],
      description:
        "The flagship coffee spot in Bangar, Temburong offering fresh espresso brews and local snacks in a lush environment.",
      address: "Bangar, Temburong",
      hours: "Varies — tap Maps for today's hours",
      price: "$",
      menu: ["Temburong Espresso", "Iced Latte", "Teh Tarik", "Local Kueh"],
      color: "#4a7c59",
      color2: "#1d3324"
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
    { roaster: "MJU", name: "MJU Nutty Nudy", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Caramel, balanced, sweet" },
    { roaster: "MJU", name: "MJU Butterscotch", origin: "Sumatra", region: "Mandheling", process: "Wet-hulled", notes: "Earthy, spicy, full body" },
    { roaster: "103 Coffee", name: "103 House Blend", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Nutty, chocolate, smooth" },
    { roaster: "PULP Coffee", name: "PULP Espresso", origin: "Blend", region: "Malaysia", process: "Washed", notes: "Fruity, sweet, complex" },
    { roaster: "Beans & Berries", name: "Sabah Single Origin", origin: "Malaysia", region: "Sabah", process: "Honey", notes: "Palm sugar, mango, soft acidity" }
  ];

  /* Hand-curated entries first, then the generated directory (see
     js/cafes-directory.js and tools/import-cafes.mjs). The importer
     already skips any directory row a curated entry describes, so this
     concatenation never produces duplicates. */
  const directory = Array.isArray(BN.CAFE_DIRECTORY) ? BN.CAFE_DIRECTORY : [];

  BN.SEED_CAFES = SEED_CAFES.concat(directory);
  BN.COFFEE_BEANS = COFFEE_BEANS;
})();