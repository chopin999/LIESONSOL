import { NextResponse } from "next/server"

// BSC contract addresses for the BNB Meme Index
const ADMIN_TOKENS: string[] = [
  "0x6b05cE09207f890da9650052155ebA32f3C94444",
  "0x5c0B93C0DbA4B7557d366EEf3cca08c3c05b4444",
  "0x0A43fC31a73013089DF59194872Ecae4cAe14444",
  "0x5c45a56BBffA321AF8eD40554d71b3C6Fc5b4444",
  "0x82Ec31D69b3c289E541b50E30681FD1ACAd24444",
  "0x18CeeF39DFf8A2C8C0cB18FdeE1Fa0642b3a4444",
  "0xA6f33A4cafA8a25115499bF6b94e7ad0dF584444",
  "0x44443dd87EC4d1bEa3425AcC118Adb023f07F91b",
  "0x924fa68a0FC644485b8df8AbfA0A41C2e7744444",
  "0x23b35C7f686CAC8297eA6e81A467286481cA4444",
  "0xd454ceAb6f2Fa934B4574D6EE61A04FDCAFF4444",
  "0x73b84F7E3901F39FC29F3704a03126D317Ab4444",
  "0x44440f83419DE123d7d411187aDb9962db017d03",
  "0x9Edcb93Ecbe489d1FF2e4b9A4370d32309474444",
  "0x44448aCa77cc60e77c90B6A60851b1BB843CC2ee",
  "0xc55fe3f2Ec1AFB8d5745a17529c8523A5ae74444",
  "0xf1cf3B0E5C427c04cC48dbb3AB7F6BA357434444",
  "0xf857213e62d9419Ca2076032A1eA3A89d0714444",
  "0x7d03759E5B41E36899833cb2E008455d69A24444",
  "0x444444540BAA98303D5b0A75B77042e3491aDe7c",
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
