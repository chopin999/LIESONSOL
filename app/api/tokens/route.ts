import { NextResponse } from "next/server"

// Empty array - add your BSC contract addresses here
const ADMIN_TOKENS: string[] = [
  // Add BSC contract addresses here, for example:
  // "0x...",
]

export async function GET() {
  try {
    console.log("=== API ROUTE CALLED ===")
    console.log("Total BSC contract addresses to fetch:", ADMIN_TOKENS.length)

    if (ADMIN_TOKENS.length === 0) {
      console.log("No tokens configured")
      return NextResponse.json({ tokens: [] })
    }

    const tokenPromises = ADMIN_TOKENS.map(async (contractAddress, index) => {
      await new Promise((resolve) => setTimeout(resolve, index * 100))

      try {
        console.log(`[${index + 1}/${ADMIN_TOKENS.length}] Fetching BSC data for: ${contractAddress}`)
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`)

        if (!response.ok) {
          console.error(`Failed to fetch data for ${contractAddress}: ${response.status}`)
          return null
        }

        const data = await response.json()

        if (!data.pairs || data.pairs.length === 0) {
          console.error(`No trading pairs found for ${contractAddress}`)
          return null
        }

        // Filter for BSC pairs only
        const bscPairs = data.pairs.filter((pair: any) => pair.chainId === "bsc")

        if (bscPairs.length === 0) {
          console.error(`No BSC pairs found for ${contractAddress}`)
          return null
        }

        // Get the BSC pair with highest liquidity
        const bestPair = bscPairs.reduce((best: any, current: any) => {
          const bestLiquidity = Number.parseFloat(best.liquidity?.usd || "0")
          const currentLiquidity = Number.parseFloat(current.liquidity?.usd || "0")
          return currentLiquidity > bestLiquidity ? current : best
        })

        const tokenData = {
          name: bestPair.baseToken.name || "Unknown Token",
          symbol: bestPair.baseToken.symbol || "UNKNOWN",
          price: Number.parseFloat(bestPair.priceUsd || "0"),
          marketCap: Number.parseFloat(bestPair.marketCap || "0"),
          change1h: Number.parseFloat(bestPair.priceChange?.h1 || "0"),
          change24h: Number.parseFloat(bestPair.priceChange?.h24 || "0"),
          volume: Number.parseFloat(bestPair.volume?.h24 || "0"),
          holders: Number.parseInt(bestPair.txns?.h24?.buys || "0") + Number.parseInt(bestPair.txns?.h24?.sells || "0"),
          contractAddress: contractAddress,
          imageUrl: bestPair.info?.imageUrl || bestPair.baseToken?.imageUrl,
        }

        console.log(
          `Successfully fetched BSC data for ${tokenData.symbol} - Market Cap: $${tokenData.marketCap.toLocaleString()}`,
        )
        return tokenData
      } catch (error) {
        console.error(`Error fetching token ${contractAddress}:`, error)
        return null
      }
    })

    const tokens = await Promise.all(tokenPromises)
    const validTokens = tokens.filter((token) => token !== null)

    // Sort tokens by market cap (highest to lowest)
    const sortedTokens = validTokens.sort((a: any, b: any) => b.marketCap - a.marketCap)

    console.log(`Returning ${sortedTokens.length} valid BSC tokens sorted by market cap`)
    return NextResponse.json({ tokens: sortedTokens })
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}
