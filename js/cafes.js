/* ============================================================
   Bah_ngupi — coffee bean database

   The cafe list is NOT maintained here. Cafes come from the generated
   js/cafes-directory.js, which mirrors bruneicoffeeplaces.com branch for
   branch (see tools/import-cafes.mjs). That keeps one source of truth:
   nothing in this file can invent a cafe that does not exist.

   To add a place that the directory misses, use the in-app "Add a cafe"
   flow — it is stored locally and clearly marked as yours.
   ============================================================ */
(function () {
  "use strict";

  const BN = (window.BN = window.BN || {});

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

  const directory = Array.isArray(BN.CAFE_DIRECTORY) ? BN.CAFE_DIRECTORY : [];

  BN.SEED_CAFES = directory.slice();
  BN.COFFEE_BEANS = COFFEE_BEANS;
})();
