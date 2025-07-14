const fs = require('fs');
const path = require('path');

// Mock implementations since we can't directly import TypeScript files
class MockAuctionStrategy {
  constructor() {
    this.activeBids = new Map();
    this.auctionResults = new Map();
  }

  async initiateAuction(auctionId, guildId, resourceType, amount, duration = 5000) {
    this.activeBids.set(auctionId, []);
    console.log(`🎯 Auction ${auctionId} initiated for ${resourceType} (${amount} units)`);
    return auctionId;
  }

  async submitBid(auctionId, bid) {
    const bids = this.activeBids.get(auctionId);
    if (!bids) return false;

    bids.push(bid);
    this.activeBids.set(auctionId, bids);
    console.log(`📈 Bid submitted by ${bid.agentId}: ${bid.bidValue} points`);
    return true;
  }

  async closeAuction(auctionId) {
    const bids = this.activeBids.get(auctionId);
    if (!bids || bids.length === 0) return null;

    // Calculate scores
    const scoredBids = bids.map(bid => ({
      ...bid,
      score: this.calculateBidScore(bid)
    }));

    scoredBids.sort((a, b) => b.score - a.score);
    const winner = scoredBids[0];

    const result = {
      auctionId,
      winner: winner.agentId,
      winningBid: winner,
      totalBids: bids.length,
      timestamp: new Date()
    };

    this.auctionResults.set(auctionId, result);
    this.activeBids.delete(auctionId);
    console.log(`🏆 Auction won by ${winner.agentId} with score ${winner.score.toFixed(2)}`);
    return result;
  }

  calculateBidScore(bid) {
    const normalizedBidValue = Math.min(bid.bidValue / 100, 1);
    const normalizedSuccessRate = bid.successRate;
    const normalizedCompute = Math.min(bid.computeAvailable / 100, 1);
    const normalizedCapabilities = Math.min(bid.capabilities.length / 5, 1);

    return (
      (normalizedBidValue * 0.3) +
      (normalizedSuccessRate * 0.3) +
      (normalizedCompute * 0.2) +
      (normalizedCapabilities * 0.2)
    );
  }
}

class MockConsensusStrategy {
  constructor(quorumSize = 0.5) {
    this.activeProposals = new Map();
    this.votes = new Map();
    this.quorumSize = quorumSize;
  }

  async propose(proposal) {
    this.activeProposals.set(proposal.id, proposal);
    this.votes.set(proposal.id, []);
    console.log(`🗳️ Proposal ${proposal.id} submitted: ${proposal.description}`);
    return proposal.id;
  }

  async vote(vote) {
    const proposalVotes = this.votes.get(vote.proposalId);
    if (!proposalVotes) return false;

    proposalVotes.push(vote);
    this.votes.set(vote.proposalId, proposalVotes);
    console.log(`✅ Vote cast by ${vote.voterId}: ${vote.choice}`);
    return true;
  }

  async checkConsensus(proposalId, totalMembers) {
    const proposalVotes = this.votes.get(proposalId);
    if (!proposalVotes) {
      return {
        proposalId,
        consensusReached: false,
        winningChoice: null,
        votes: [],
        quorumMet: false,
        timestamp: new Date()
      };
    }

    // Count votes
    const voteCounts = proposalVotes.reduce((counts, vote) => {
      counts[vote.choice] = (counts[vote.choice] || 0) + 1;
      return counts;
    }, {});

    const quorumMet = proposalVotes.length >= (totalMembers * this.quorumSize);
    
    let winningChoice = null;
    let maxVotes = 0;
    
    for (const [choice, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningChoice = choice;
      }
    }

    const consensusReached = quorumMet && maxVotes > (totalMembers * this.quorumSize);
    
    console.log(`📊 Consensus check: ${consensusReached ? 'REACHED' : 'NOT REACHED'} (${winningChoice}: ${maxVotes}/${totalMembers})`);

    return {
      proposalId,
      consensusReached,
      winningChoice,
      votes: proposalVotes,
      quorumMet,
      voteCounts,
      timestamp: new Date()
    };
  }
}

const mockAgents = [
  { id: 'AgentA', capabilities: ['compute', 'gpu'], successRate: 0.9, computeAvailable: 80 },
  { id: 'AgentB', capabilities: ['network', 'bandwidth'], successRate: 0.8, computeAvailable: 60 },
  { id: 'AgentC', capabilities: ['storage', 'ssd'], successRate: 0.85, computeAvailable: 70 },
  { id: 'AgentD', capabilities: ['analysis', 'reasoning'], successRate: 0.94, computeAvailable: 90 }
];

async function simulateGuildNegotiation() {
  console.log('🚀 Starting Guild Negotiation Simulation...\n');

  const auctionStrategy = new MockAuctionStrategy();
  const consensusStrategy = new MockConsensusStrategy(0.5);

  // === AUCTION SIMULATION ===
  console.log('=== AUCTION SIMULATION ===');
  const auctionId = 'auction_gpu_001';
  await auctionStrategy.initiateAuction(auctionId, 'GuildAlpha', 'GPU', 5);

  // Submit bids
  await Promise.all(mockAgents.map(async (agent) => {
    await auctionStrategy.submitBid(auctionId, {
      id: `bid_${agent.id}`,
      agentId: agent.id,
      guildId: 'GuildAlpha',
      resourceType: 'GPU',
      amount: 5,
      bidValue: Math.round(Math.random() * 100) + 50,
      capabilities: agent.capabilities,
      successRate: agent.successRate,
      computeAvailable: agent.computeAvailable,
      timestamp: new Date(),
    });
  }));

  const auctionResult = await auctionStrategy.closeAuction(auctionId);
  console.log('\\n=== AUCTION COMPLETED ===\\n');

  // === CONSENSUS SIMULATION ===
  console.log('=== CONSENSUS SIMULATION ===');
  const proposalId = 'proposal_gpu_policy';
  await consensusStrategy.propose({
    id: proposalId,
    description: 'GPU Resource Sharing Policy',
    proposerId: 'AgentA',
    choices: ['Accept', 'Reject'],
    timestamp: new Date(),
  });

  // Cast votes
  await Promise.all(mockAgents.map(async (agent) => {
    await consensusStrategy.vote({
      proposalId,
      voterId: agent.id,
      choice: Math.random() > 0.3 ? 'Accept' : 'Reject', // 70% acceptance rate
      timestamp: new Date(),
    });
  }));

  const consensusResult = await consensusStrategy.checkConsensus(proposalId, mockAgents.length);
  console.log('\\n=== CONSENSUS COMPLETED ===\\n');

  // === RESULTS ===
  const simulationResults = {
    timestamp: new Date(),
    guildId: 'GuildAlpha',
    agents: mockAgents,
    auction: auctionResult,
    consensus: consensusResult,
    summary: {
      auctionWinner: auctionResult?.winner,
      consensusReached: consensusResult.consensusReached,
      participationRate: (consensusResult.votes.length / mockAgents.length) * 100,
      outcomes: {
        resourceAllocation: auctionResult ? 'SUCCESS' : 'FAILED',
        policyConsensus: consensusResult.consensusReached ? 'ACHIEVED' : 'FAILED'
      }
    }
  };

  // Save results
  const outputPath = path.join(__dirname, 'outputs', 'negotiationLogs.json');
  fs.writeFileSync(outputPath, JSON.stringify(simulationResults, null, 2));
  
  console.log('🎯 SIMULATION SUMMARY:');
  console.log(`   Auction Winner: ${simulationResults.summary.auctionWinner}`);
  console.log(`   Consensus: ${simulationResults.summary.outcomes.policyConsensus}`);
  console.log(`   Participation: ${simulationResults.summary.participationRate}%`);
  console.log(`   Results saved to: ${outputPath}`);

  return simulationResults;
}

// Run the simulation
simulateGuildNegotiation()
  .then(results => {
    console.log('\\n✅ Guild Negotiation Simulation completed successfully!');
  })
  .catch(error => {
    console.error('❌ Simulation failed:', error);
  });
