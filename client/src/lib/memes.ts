// Meme-related constants and utility functions for the app

// Meme ranks based on portfolio performance
export const memeRanks = [
  {
    threshold: -100, // Minimum performance threshold
    rank: "Rugged Rookie",
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    description: "You buy high and sell low. Are you sure this is the right game for you?",
    suggestions: [
      "Consider HODLing through downturns",
      "Do more research before investing",
      "Avoid chasing pumps"
    ]
  },
  {
    threshold: -20,
    rank: "Paper Hand Pleb",
    image: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
    description: "You panic sell at every dip. Try holding longer next time!",
    suggestions: [
      "Set price alerts instead of watching charts",
      "Only invest what you can afford to lose",
      "Remember why you invested in the first place"
    ]
  },
  {
    threshold: 0,
    rank: "Break-Even Andy",
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    description: "You've managed to neither make nor lose money. Impressive in its own way!",
    suggestions: [
      "Try DCA (Dollar-Cost Averaging)",
      "Look into staking for passive income",
      "Build a more diverse portfolio"
    ]
  },
  {
    threshold: 20,
    rank: "DeFi Dabbler",
    image: "https://cryptologos.cc/logos/aave-aave-logo.svg",
    description: "You're starting to explore the DeFi ecosystem. Keep learning!",
    suggestions: [
      "Explore yield farming opportunities",
      "Be cautious of impermanent loss",
      "Audit smart contracts before investing"
    ]
  },
  {
    threshold: 50,
    rank: "Memecoin Enjoyer",
    image: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg",
    description: "You can't resist dog tokens and other memecoins. It's a lifestyle!",
    suggestions: [
      "Balance your memecoins with blue-chip crypto",
      "Take profits regularly on volatile assets",
      "Research tokenomics before investing"
    ]
  },
  {
    threshold: 80,
    rank: "Diamond Hand Chad",
    image: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    description: "You buy the dip and never sell. Your portfolio survived the great bear market and came out stronger!",
    suggestions: [
      "Consider taking some profits during extreme euphoria",
      "Look into tax-efficient ways to realize gains",
      "Set some stop-losses on smaller positions"
    ]
  },
  {
    threshold: 150,
    rank: "Crypto OG",
    image: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
    description: "You've been here since the early days. Your portfolio is legendary!",
    suggestions: [
      "Consider mentoring newcomers",
      "Diversify into traditional assets for balance",
      "Share your wisdom with the community"
    ]
  }
];

/**
 * Get the appropriate meme rank based on portfolio performance
 */
export function getMemeRank(performancePercentage: number) {
  // Find the highest rank that the performance exceeds the threshold for
  for (let i = memeRanks.length - 1; i >= 0; i--) {
    if (performancePercentage >= memeRanks[i].threshold) {
      return memeRanks[i];
    }
  }
  
  // Default to the lowest rank if nothing else matches
  return memeRanks[0];
}

/**
 * Generate a humorous summary based on portfolio data
 */
export function generateMemeSummary(portfolio: any) {
  const { performancePercentage, tokens } = portfolio;
  
  // Get the meme rank
  const rank = getMemeRank(performancePercentage);
  
  // Start with the rank description
  let summary = rank.description;
  
  // Add token-specific humor if available
  if (tokens && tokens.length > 0) {
    const topToken = tokens[0];
    if (topToken.change24h > 20) {
      summary += ` Your ${topToken.symbol} gains are astronomical!`;
    } else if (topToken.change24h < -20) {
      summary += ` Your ${topToken.symbol} position got hammered, but you're still holding!`;
    }
  }
  
  return {
    rank: rank.rank,
    summary,
    image: rank.image,
    suggestions: rank.suggestions
  };
}
