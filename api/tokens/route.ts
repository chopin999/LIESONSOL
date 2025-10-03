import { NextResponse } from "next/server"

// This would typically connect to your database
// For now, using a simple array that you can manage
const ADMIN_TOKENS = [
  "9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump",
  "2RA1v8NdkEQcF5N5zHUqLuAHxjnDMQFjwEE8fwKNpump", 
  "BYpJEjZ8YBBWjF66oihbLnipwtmMHnLeJnkp4aBcpump", 
  "BnWDGN5SSFUvA1KVZtGnyr58nzA2T4TyoTyTYH9Dpump", 
  "3dk9CNre8tmv6bbNXd5F6dgkNnEzsyQ7sPhVT8kKpump", 
  "EJUbsyWDuJvnHSWQYXMnqcqD4XefA9WM4ftjZtSmpump", 
  "9jBxPfYJmaDuvpWT3b2J194NYrBWksxhNMZxvi31pump", 
  "Ha84q9JSjx8wxK1sxhhXTD6U1pG5wnoiYZHi5DaUpump", 
  "2NhoUWfCbM8V63aCpqdTk4tpf6AmP1Rq11zJvEWHpump", 
  "E2Kddk65HwvevojHnZgQaDE8Pbd3e4FZrVuEz31Npump", 
  "eL5fUxj2J4CiQsmW85k5FG9DvuQjjUoBHoQBi2Kpump", 
  "CWX6t6pGJ1zsnuywnyd2ZMZJ7inB2sWuPdsteoT6pump",
  "2RA1v8NdkEQcF5N5zHUqLuAHxjnDMQFjwEE8fwKNpump",
  "3dk9CNre8tmv6bbNXd5F6dgkNnEzsyQ7sPhVT8kKpump",
  "BnWDGN5SSFUvA1KVZtGnyr58nzA2T4TyoTyTYH9Dpump",
  "BYpJEjZ8YBBWjF66oihbLnipwtmMHnLeJnkp4aBcpump",
  "JEFP9RSTsRGXKL7fbX6zsHkB7eucReJFpBxpR6kUpump",
  "8cVZCdP973kupdt1TktpD4jq3k7Jpr3FiaBAxN5Kpump",
  "EJUbsyWDuJvnHSWQYXMnqcqD4XefA9WM4ftjZtSmpump",
  "9jBxPfYJmaDuvpWT3b2J194NYrBWksxhNMZxvi31pump",
  "EzVkdRYRACWKQeY7fHg4BBL7gx8WC5DvNxWm4ZA2pump",
  "5d82791nEub4A6WJR4t5rtDUrM1CrWdcw4kea4U9pump",  
  // "
]

export async function GET() {
  try {
    // Fetch token data for each contract address
    const tokenPromises = ADMIN_TOKENS.map(async (contractAddress) => {
      try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${contractAddress}`)
        }

        const data = await response.json()

        if (!data.pairs || data.pairs.length === 0) {
          throw new Error(`No trading pairs found for ${contractAddress}`)
        }

        const bestPair = data.pairs.reduce((best: any, current: any) => {
          const bestLiquidity = Number.parseFloat(best.liquidity?.usd || "0")
          const currentLiquidity = Number.parseFloat(current.liquidity?.usd || "0")
          return currentLiquidity > bestLiquidity ? current : best
        })

        return {
          name: bestPair.baseToken.name || "Unknown Token",
          symbol: bestPair.baseToken.symbol || "UNKNOWN",
          price: Number.parseFloat(bestPair.priceUsd || "0"),
          marketCap: Number.parseFloat(bestPair.marketCap || "0"),
          change1h: Number.parseFloat(bestPair.priceChange?.h1 || "0"),
          change24h: Number.parseFloat(bestPair.priceChange?.h24 || "0"),
          volume: Number.parseFloat(bestPair.volume?.h24 || "0"),
          holders: Number.parseInt(bestPair.txns?.h24?.buys || "0") + Number.parseInt(bestPair.txns?.h24?.sells || "0"),
          contractAddress: contractAddress,
        }
      } catch (error) {
        console.error(`Error fetching token ${contractAddress}:`, error)
        return null
      }
    })

    const tokens = await Promise.all(tokenPromises)
    const validTokens = tokens.filter((token) => token !== null)

    return NextResponse.json({ tokens: validTokens })
  } catch (error) {
    console.error("Error fetching tokens:", error)
    return NextResponse.json({ error: "Failed to fetch tokens" }, { status: 500 })
  }
}
