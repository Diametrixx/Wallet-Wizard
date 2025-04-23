export interface Meme {
  title: string;
  src: string;
  alt: string;
  performance: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
}

export const memes: Meme[] = [
  {
    title: "Diamond Hand Chad",
    src: "https://i.imgur.com/RDFL5v0.png",
    alt: "Chad meme with diamond hands",
    performance: 'excellent'
  },
  {
    title: "To The Moon",
    src: "https://i.imgur.com/kY22wbI.png",
    alt: "Doge astronaut on the moon",
    performance: 'excellent'
  },
  {
    title: "Smart Money",
    src: "https://i.imgur.com/OV8ky4v.png",
    alt: "Galaxy brain investor meme",
    performance: 'good'
  },
  {
    title: "HODL Warrior",
    src: "https://i.imgur.com/7aHmvRw.png",
    alt: "Muscular Doge holding crypto",
    performance: 'good'
  },
  {
    title: "Crypto Enjoyer",
    src: "https://i.imgur.com/DZE0ODl.png",
    alt: "Average crypto enjoyer meme",
    performance: 'neutral'
  },
  {
    title: "Still Early",
    src: "https://i.imgur.com/PTUOfsD.png",
    alt: "We're still early meme",
    performance: 'neutral'
  },
  {
    title: "Buy High Sell Low",
    src: "https://i.imgur.com/4DKCNEm.png",
    alt: "Crying wojak with graph going down",
    performance: 'bad'
  },
  {
    title: "Paper Hands",
    src: "https://i.imgur.com/VEgAj9p.png",
    alt: "Crying wojak with paper hands",
    performance: 'bad'
  },
  {
    title: "Rugged",
    src: "https://i.imgur.com/KSJafq7.png",
    alt: "Wojak feeling rugged",
    performance: 'terrible'
  },
  {
    title: "Rekt",
    src: "https://i.imgur.com/RSy5dkg.png",
    alt: "Wojak feeling completely rekt",
    performance: 'terrible'
  }
];

export interface Title {
  title: string;
  description: string;
  performance: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
}

export const titles: Title[] = [
  {
    title: "Diamond Hand Chad",
    description: "You HODL like a true champion! Your steely resolve in the face of market volatility has paid off handsomely.",
    performance: 'excellent'
  },
  {
    title: "DeFi Degen",
    description: "You've mastered the art of yield farming and liquidity provision. Your DeFi skills are legendary!",
    performance: 'excellent'
  },
  {
    title: "Smart Money",
    description: "Your strategic entries and exits show a keen understanding of the market. Well played!",
    performance: 'good'
  },
  {
    title: "Crypto Connoisseur",
    description: "You have a refined taste in digital assets and can spot gems before they moon.",
    performance: 'good'
  },
  {
    title: "Average Crypto Enjoyer",
    description: "You're in it for the tech... and maybe some gains. A balanced approach to crypto investing.",
    performance: 'neutral'
  },
  {
    title: "The HODLer",
    description: "For better or worse, you're holding on for dear life. Time will tell if that's the right strategy.",
    performance: 'neutral'
  },
  {
    title: "Pump Chaser",
    description: "You've been chasing pumps and buying tops. Consider a more strategic approach next time.",
    performance: 'bad'
  },
  {
    title: "Paper Hands",
    description: "You've sold more bottoms than you'd like to admit. Try to strengthen those hands!",
    performance: 'bad'
  },
  {
    title: "Rugged Rookie",
    description: "You've been on the wrong end of too many rug pulls. DYOR before aping in next time.",
    performance: 'terrible'
  },
  {
    title: "Buttcoiner",
    description: "Your portfolio suggests you might secretly hate crypto. Maybe stablecoins are more your speed?",
    performance: 'terrible'
  }
];

export const performanceSummaries: Record<'excellent' | 'good' | 'neutral' | 'bad' | 'terrible', string[]> = {
  excellent: [
    "You bought the dip like a seasoned crypto veteran and diamond-handed through the bear market. We salute your incredible patience and vision!",
    "Your ability to ignore FUD and stick to fundamentals has paid off. This is what chad investing looks like!",
    "While others panic sold, you accumulated. This is textbook smart money behavior!"
  ],
  good: [
    "Your timing isn't perfect, but your strategy is solid. You've outperformed most of the market!",
    "Balancing profits and growth, you've shown good judgment in a volatile market.",
    "You've weathered the storms well and made smart moves. Keep up the good work!"
  ],
  neutral: [
    "You've had your ups and downs, but you're hanging in there. The crypto journey is a marathon, not a sprint.",
    "Breaking even in crypto can be a win sometimes. At least you're not a panic seller!",
    "Your hodling game is average - not bad, but there's room for improvement."
  ],
  bad: [
    "Your sell timing needs work. You seem to have a talent for selling the bottom before major rallies.",
    "Too many memecoins, not enough research. The degen life isn't always profitable.",
    "Buy high, sell low is not actually a good strategy. Try doing the opposite next time?"
  ],
  terrible: [
    "You've managed to lose money in one of the greatest bull markets in history. That takes special talent!",
    "Your portfolio suggests you might have better luck at a casino. At least there they give you free drinks.",
    "From rugs to hacks to just plain bad timing, your crypto journey has been... educational. Maybe try stablecoins?"
  ]
};
