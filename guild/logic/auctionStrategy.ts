export interface AuctionBid {
  id: string;
  agentId: string;
  guildId: string;
  resourceType: string;
  amount: number;
  bidValue: number;
  capabilities: string[];
  successRate: number;
  computeAvailable: number;
  timestamp: Date;
}

export interface AuctionResult {
  auctionId: string;
  winner: string;
  winningBid: AuctionBid;
  totalBids: number;
  auctionDuration: number;
  timestamp: Date;
}

export class AuctionStrategy {
  private activeBids: Map<string, AuctionBid[]>;
  private auctionResults: Map<string, AuctionResult>;

  constructor() {
    this.activeBids = new Map();
    this.auctionResults = new Map();
  }

  /**
   * Initiate an auction for resource allocation
   */
  async initiateAuction(
    auctionId: string,
    guildId: string,
    resourceType: string,
    amount: number,
    duration: number = 30000 // 30 seconds default
  ): Promise<string> {
    this.activeBids.set(auctionId, []);
    
    // Set auction timeout
    setTimeout(async () => {
      await this.closeAuction(auctionId);
    }, duration);

    return auctionId;
  }

  /**
   * Submit a bid for an ongoing auction
   */
  async submitBid(auctionId: string, bid: AuctionBid): Promise<boolean> {
    const bids = this.activeBids.get(auctionId);
    if (!bids) {
      return false; // Auction not found or closed
    }

    // Validate bid
    if (await this.validateBid(bid)) {
      bids.push(bid);
      this.activeBids.set(auctionId, bids);
      return true;
    }

    return false;
  }

  /**
   * Close auction and determine winner
   */
  async closeAuction(auctionId: string): Promise<AuctionResult | null> {
    const bids = this.activeBids.get(auctionId);
    if (!bids || bids.length === 0) {
      return null;
    }

    // Calculate weighted scores for each bid
    const scoredBids = bids.map(bid => ({
      ...bid,
      score: this.calculateBidScore(bid)
    }));

    // Sort by score (highest first)
    scoredBids.sort((a, b) => b.score - a.score);
    
    const winner = scoredBids[0];
    const result: AuctionResult = {
      auctionId,
      winner: winner.agentId,
      winningBid: winner,
      totalBids: bids.length,
      auctionDuration: Date.now() - bids[0].timestamp.getTime(),
      timestamp: new Date()
    };

    this.auctionResults.set(auctionId, result);
    this.activeBids.delete(auctionId);

    return result;
  }

  /**
   * Calculate weighted score for a bid
   */
  private calculateBidScore(bid: AuctionBid): number {
    // Weight factors
    const bidValueWeight = 0.3;
    const successRateWeight = 0.3;
    const computeWeight = 0.2;
    const capabilityWeight = 0.2;

    // Normalize values (0-1 range)
    const normalizedBidValue = Math.min(bid.bidValue / 1000, 1);
    const normalizedSuccessRate = bid.successRate;
    const normalizedCompute = Math.min(bid.computeAvailable / 100, 1);
    const normalizedCapabilities = Math.min(bid.capabilities.length / 10, 1);

    const score = (
      (normalizedBidValue * bidValueWeight) +
      (normalizedSuccessRate * successRateWeight) +
      (normalizedCompute * computeWeight) +
      (normalizedCapabilities * capabilityWeight)
    );

    return score;
  }

  /**
   * Validate bid requirements
   */
  private async validateBid(bid: AuctionBid): Promise<boolean> {
    // Check if agent has sufficient resources
    if (bid.computeAvailable < 10) {
      return false;
    }

    // Check if bid value is reasonable
    if (bid.bidValue <= 0) {
      return false;
    }

    // Validate capabilities
    if (bid.capabilities.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Get auction status
   */
  async getAuctionStatus(auctionId: string): Promise<any> {
    const bids = this.activeBids.get(auctionId);
    const result = this.auctionResults.get(auctionId);

    if (result) {
      return {
        status: 'closed',
        result,
        totalBids: result.totalBids
      };
    }

    if (bids) {
      return {
        status: 'active',
        currentBids: bids.length,
        highestBid: bids.reduce((max, bid) => 
          bid.bidValue > max ? bid.bidValue : max, 0
        )
      };
    }

    return {
      status: 'not_found'
    };
  }

  /**
   * Get agent's bidding history
   */
  async getAgentBiddingHistory(agentId: string): Promise<AuctionBid[]> {
    const allBids: AuctionBid[] = [];
    
    // Collect from active auctions
    for (const bids of this.activeBids.values()) {
      allBids.push(...bids.filter(bid => bid.agentId === agentId));
    }

    return allBids;
  }

  /**
   * Get auction analytics
   */
  async getAuctionAnalytics(guildId: string): Promise<any> {
    const guildResults = Array.from(this.auctionResults.values())
      .filter(result => result.winningBid.guildId === guildId);

    const totalAuctions = guildResults.length;
    const averageBids = guildResults.reduce((sum, result) => 
      sum + result.totalBids, 0) / totalAuctions;
    const averageDuration = guildResults.reduce((sum, result) => 
      sum + result.auctionDuration, 0) / totalAuctions;

    return {
      totalAuctions,
      averageBidsPerAuction: averageBids,
      averageAuctionDuration: averageDuration,
      participationRate: this.calculateParticipationRate(guildId)
    };
  }

  private calculateParticipationRate(guildId: string): number {
    // Implementation to calculate how many agents participate in auctions
    // This would require integration with agent registry
    return 0.85; // Placeholder: 85% participation rate
  }
}
