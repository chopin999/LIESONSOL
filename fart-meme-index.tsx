"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

interface Token {
  name: string
  symbol: string
  price: number
  marketCap: number
  change1h: number
  change24h: number
  volume: number
  holders: number
  contractAddress: string
  imageUrl?: string
}

export default function Component() {
  const [copied, setCopied] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [newTokenCA, setNewTokenCA] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTokenInput, setShowTokenInput] = useState(false)

  const totalWorth = tokens.reduce((sum, token) => sum + token.marketCap, 0)

  const handleCopy = () => {
    navigator.clipboard.writeText("Updating")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    }
    return `$${num.toFixed(6)}`
  }

  const formatPrice = (price: number) => {
    return `$${price.toFixed(6)}`
  }

  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? "+" : ""
    return `${sign}${percent.toFixed(2)}%`
  }

  const fetchTokenData = async (contractAddress: string): Promise<Token | null> => {
    try {
      setIsLoading(true)

      // Fetch token data from DexScreener API
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${contractAddress}`)

      if (!response.ok) {
        throw new Error("Failed to fetch token data")
      }

      const data = await response.json()

      if (!data.pairs || data.pairs.length === 0) {
        throw new Error("No trading pairs found for this token")
      }

      // Filter for BSC pairs only
      const bscPairs = data.pairs.filter((pair: any) => pair.chainId === "bsc")

      if (bscPairs.length === 0) {
        throw new Error("No BSC trading pairs found for this token")
      }

      // Get the BSC pair with highest liquidity
      const bestPair = bscPairs.reduce((best: any, current: any) => {
        const bestLiquidity = Number.parseFloat(best.liquidity?.usd || "0")
        const currentLiquidity = Number.parseFloat(current.liquidity?.usd || "0")
        return currentLiquidity > bestLiquidity ? current : best
      })

      const tokenData: Token = {
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

      return tokenData
    } catch (error) {
      console.error("Error fetching token data:", error)
      alert(`Error fetching token data: ${error instanceof Error ? error.message : "Unknown error"}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToken = async () => {
    if (!newTokenCA.trim()) return

    const tokenData = await fetchTokenData(newTokenCA)
    if (tokenData) {
      setTokens((prev) => [...prev, tokenData])
      setNewTokenCA("")
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "I") {
        setShowTokenInput(!showTokenInput)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [showTokenInput])

  // Auto-refresh token data every 30 seconds
  useEffect(() => {
    if (tokens.length === 0) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/tokens")
        if (response.ok) {
          const data = await response.json()
          setTokens(data.tokens || [])
        }
      } catch (error) {
        console.error("Error refreshing tokens:", error)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [tokens.length])

  // Load tokens from API on component mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const response = await fetch("/api/tokens")
        if (response.ok) {
          const data = await response.json()
          setTokens(data.tokens || [])
        }
      } catch (error) {
        console.error("Error loading tokens:", error)
      }
    }

    loadTokens()
  }, [])

  return (
    <div className="min-h-screen bg-black text-yellow-400 font-mono p-2 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 text-yellow-500">BNB MEME INDEX</h1>
          <div className="h-px bg-yellow-400 mb-3 md:mb-6"></div>
        </div>

        {/* Token Info Box */}
        <div className="border border-yellow-400 p-3 md:p-6 mb-4 md:mb-8">
          <div className="mb-2 md:mb-4">
            <span className="text-yellow-500">Token: </span>
            <span className="text-yellow-400">$BMIDX</span>
          </div>

          <div className="mb-2 md:mb-4">
            <div className="text-yellow-400 mb-1 md:mb-2">Address: Updating</div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent text-xs md:text-sm"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>

          <div>
            <span className="text-yellow-400">Socials: </span>
            <a
              href="https://x.com/FMIDXsol"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-yellow-500"
            >
              Twitter
            </a>
          </div>
        </div>

        {/* Net Worth Display */}
        <div className="border border-yellow-400 p-4 md:p-8 mb-4 md:mb-8 text-center text-yellow-500">
          <h2 className="text-xl md:text-2xl mb-2 md:mb-4 text-yellow-500">BNB MEME INDEX NET WORTH</h2>
          <div className="text-4xl md:text-6xl font-bold text-yellow-400 mb-1 md:mb-2">
            ${totalWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-gray-400 mb-1 md:mb-2">Total Value (USD)</div>
          <div className="text-gray-400 text-xs">
            Last Updated: {new Date().toLocaleDateString("en-GB")}, {new Date().toLocaleTimeString("en-GB")}
          </div>
        </div>

        {/* Token Input - Hidden by default */}
        {showTokenInput && (
          <div className="mb-4 md:mb-8 p-2 md:p-4 border border-yellow-400">
            <div className="text-yellow-400 mb-1 md:mb-2">Add Token by Contract Address:</div>
            <div className="flex gap-1 md:gap-2">
              <input
                type="text"
                value={newTokenCA}
                onChange={(e) => setNewTokenCA(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddToken()}
                placeholder="Enter BSC contract address"
                className="bg-black border border-yellow-400 text-yellow-400 p-1 md:p-2 font-mono flex-1 text-xs md:text-sm"
                id="tokenInput"
              />
              <Button
                onClick={handleAddToken}
                disabled={isLoading}
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black bg-transparent text-xs md:text-sm"
              >
                {isLoading ? "Loading..." : "Add Token"}
              </Button>
            </div>
          </div>
        )}

        {/* Tokens Table */}
        <div className="border border-yellow-400">
          <div className="bg-gray-900 p-2 md:p-4 border-b border-yellow-400">
            <h3 className="text-lg md:text-xl text-yellow-400">INDEX TOKENS (BSC)</h3>
          </div>

          {tokens.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {isLoading ? "Loading tokens..." : "No tokens loaded. Add BSC tokens to get started."}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 p-2 md:p-4 border-b border-yellow-400 text-xs md:text-sm font-bold">
                <div className="text-yellow-500">TOKEN</div>
                <div className="text-yellow-500">PRICE</div>
                <div className="text-yellow-500">MARKET CAP</div>
                <div className="text-yellow-500">1H</div>
                <div className="text-yellow-500">24H</div>
                <div className="text-yellow-500">VOLUME</div>
                <div className="text-yellow-500">HOLDERS</div>
                <div className="text-yellow-500">ACTION</div>
              </div>

              {/* Table Rows */}
              {tokens.map((token, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 p-2 md:p-4 border-b border-gray-700 hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center">
                    {token.imageUrl ? (
                      <img
                        src={token.imageUrl || "/placeholder.svg"}
                        alt={token.symbol}
                        className="w-6 h-6 md:w-8 md:h-8 rounded-full mr-1 md:mr-3"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-6 h-6 md:w-8 md:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black text-xs font-bold mr-1 md:mr-3 ${token.imageUrl ? "hidden" : ""}`}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="text-yellow-400 font-bold">{token.symbol}</div>
                      <div className="text-gray-400 text-xs">{token.name}</div>
                    </div>
                  </div>

                  <div className="text-yellow-400">{formatPrice(token.price)}</div>

                  <div className="text-yellow-400">{formatNumber(token.marketCap)}</div>

                  <div className={token.change1h >= 0 ? "text-yellow-400" : "text-red-400"}>
                    {formatPercentage(token.change1h)}
                  </div>

                  <div className={token.change24h >= 0 ? "text-yellow-400" : "text-red-400"}>
                    {formatPercentage(token.change24h)}
                  </div>

                  <div className="text-yellow-400">{formatNumber(token.volume)}</div>

                  <div className="text-yellow-400">{token.holders.toLocaleString()}</div>

                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`https://dexscreener.com/bsc/${token.contractAddress || ""}`, "_blank")
                      }
                      className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black text-xs bg-transparent"
                    >
                      TRADE
                    </Button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 md:mt-8 border border-yellow-400 border-dashed p-2 md:p-4">
          <div className="flex items-center justify-between">
            <div className="text-yellow-400">Latest Deployment</div>
            <div className="bg-yellow-400 text-black px-2 py-1 text-xs font-bold rounded">NEW</div>
          </div>
        </div>
      </div>
    </div>
  )
}
