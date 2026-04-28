/**
 * Test manuel pour le service de cache
 *
 * Pour tester:
 * 1. Démarrer l'application
 * 2. Exécuter ce fichier: npx ts-node tests/cache.test.ts
 * 3. Vérifier les logs [cache] HIT/MISS dans la console
 */

import Framework from "../src/platform";
import config from "config";

async function testCache() {
  console.log("\n🧪 Test du service de cache\n");

  // Initialiser le framework
  await Framework.init(config);

  const ctx = {
    id: "test-cache",
    role: "SYSTEM" as const,
    timestamp: Date.now(),
  };

  try {
    // Test 1: Première requête (devrait être MISS)
    console.log("📝 Test 1: Première requête sur clients...");
    const result1 = await Framework.Db.select(
      ctx,
      "clients",
      { id: "test-client-id" },
      { limit: 10 }
    );
    console.log("✅ Résultat:", result1.length, "lignes");

    // Test 2: Deuxième requête identique (devrait être HIT)
    console.log("\n📝 Test 2: Deuxième requête identique...");
    const result2 = await Framework.Db.select(
      ctx,
      "clients",
      { id: "test-client-id" },
      { limit: 10 }
    );
    console.log("✅ Résultat:", result2.length, "lignes");

    // Test 3: Stats du cache
    console.log("\n📝 Test 3: Statistiques du cache...");
    const stats = await Framework.Cache.getStats(ctx);
    console.log("✅ Stats:", JSON.stringify(stats, null, 2));

    // Test 4: Requête avec offset (ne devrait PAS être cachée)
    console.log("\n📝 Test 4: Requête avec offset (pas de cache)...");
    const result3 = await Framework.Db.select(
      ctx,
      "clients",
      {},
      { limit: 10, offset: 10 }
    );
    console.log("✅ Résultat:", result3.length, "lignes");

    // Test 5: Requête sur table non whitelistée (ne devrait PAS être cachée)
    console.log("\n📝 Test 5: Requête sur table non cachée...");
    const result4 = await Framework.Db.select(
      ctx,
      "invoices",
      {},
      { limit: 5 }
    );
    console.log("✅ Résultat:", result4.length, "lignes");

    // Test 6: Invalidation
    console.log("\n📝 Test 6: Invalidation du cache clients...");
    await Framework.Cache.invalidate(ctx, "clients");
    console.log("✅ Cache invalidé");

    // Test 7: Requête après invalidation (devrait être MISS)
    console.log("\n📝 Test 7: Requête après invalidation...");
    const result5 = await Framework.Db.select(
      ctx,
      "clients",
      { id: "test-client-id" },
      { limit: 10 }
    );
    console.log("✅ Résultat:", result5.length, "lignes");

    // Stats finales
    console.log("\n📝 Statistiques finales...");
    const finalStats = await Framework.Cache.getStats(ctx);
    console.log("✅ Stats finales:", JSON.stringify(finalStats, null, 2));

    console.log("\n✨ Tests terminés avec succès!\n");
  } catch (error: any) {
    console.error("\n❌ Erreur:", error.message);
    console.error(error.stack);
  }

  process.exit(0);
}

testCache();
