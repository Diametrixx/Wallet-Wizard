import { loadCoinGeckoMapping } from "./coinGeckoMap";

export async function refreshCoinGeckoMappingEvery24Hours() {
  console.log("⏳ Setting up CoinGecko mapping auto-refresh every 24 hours...");
  setInterval(async () => {
    console.log("🔄 Auto-refreshing CoinGecko mapping...");
    await loadCoinGeckoMapping();
    console.log("✅ CoinGecko mapping refreshed.");
  }, 24 * 60 * 60 * 1000); // 24 hours
}
