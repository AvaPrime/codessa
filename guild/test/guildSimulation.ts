import { GuildCommunication } from '../comms/negotiationInterface';
import { AuctionStrategy } from '../logic/auctionStrategy';
import { ConsensusStrategy } from '../logic/consensusStrategy';
import * as fs from 'fs';
import * as path from 'path';

const mockAgents = [
  { id: 'AgentA', capabilities: ['compute', 'gpu'], successRate: 0.9, computeAvailable: 20 },
  { id: 'AgentB', capabilities: ['network', 'bandwidth'], successRate: 0.8, computeAvailable: 15 },
  { id: 'AgentC', capabilities: ['storage', 'ssd'], successRate: 0.85, computeAvailable: 25 },
];

async function simulateGuildNegotiation() {
  const guildComms = new GuildCommunication();
  const auctionStrategy = new AuctionStrategy();
  const consensusStrategy = new ConsensusStrategy(0.5);

  // Simulate Auction
  console.log('Starting auction simulation...');
  const auctionId = await auctionStrategy.initiateAuction('resourceAuction', 'GuildAlpha', 'GPU', 5);

  // Wait for all bids to be submitted
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
  console.log('Auction Result:', auctionResult);

  // Simulate Consensus
  console.log('Starting consensus simulation...');
  const proposalId = await consensusStrategy.propose({
    id: 'proposal_1',
    description: 'Shared GPU Allocation Policy',
    proposerId: 'AgentA',
    choices: ['Accept', 'Reject'],
    timestamp: new Date(),
  });

  // Wait for all votes to be cast
  await Promise.all(mockAgents.map(async (agent) => {
    await consensusStrategy.vote({
      proposalId,
      voterId: agent.id,
      choice: Math.random() > 0.5 ? 'Accept' : 'Reject',
      timestamp: new Date(),
    });
  }));

  const consensusResult = await consensusStrategy.checkConsensus(proposalId, mockAgents.length);
  console.log('Consensus Result:', consensusResult);

  // Log Results
  const logOutput = {
    auction: auctionResult,
    consensus: consensusResult,
  };
  
  const outputPath = path.join(__dirname, 'outputs', 'negotiationLogs.json');
  fs.writeFileSync(outputPath, JSON.stringify(logOutput, null, 2));
  console.log('Simulation complete. Results logged to negotiationLogs.json');
}

simulateGuildNegotiation().catch(console.error);
