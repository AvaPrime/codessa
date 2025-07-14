export interface Proposal {
  id: string;
  description: string;
  proposerId: string;
  choices: string[];
  timestamp: Date;
}

export interface Vote {
  proposalId: string;
  voterId: string;
  choice: string;
  timestamp: Date;
}

export interface ConsensusResult {
  proposalId: string;
  consensusReached: boolean;
  winningChoice: string | null;
  votes: Vote[];
  quorumMet: boolean;
  timestamp: Date;
}

export class ConsensusStrategy {
  private activeProposals: Map<string, Proposal>;
  private votes: Map<string, Vote[]>;
  private quorumSize: number; // Fraction of total members, e.g., 0.5 for >50%

  constructor(quorumSize: number = 0.5) {
    this.activeProposals = new Map();
    this.votes = new Map();
    this.quorumSize = quorumSize;
  }

  /**
   * Propose a new consensus decision.
   */
  async propose(proposal: Proposal): Promise<string> {
    this.activeProposals.set(proposal.id, proposal);
    this.votes.set(proposal.id, []);
    return proposal.id;
  }

  /**
   * Register a vote on a proposal.
   */
  async vote(vote: Vote): Promise<boolean> {
    const proposalVotes = this.votes.get(vote.proposalId);
    if (!proposalVotes) {
      return false; // Proposal not found
    }

    // Record the vote
    proposalVotes.push(vote);
    this.votes.set(vote.proposalId, proposalVotes);
    return true;
  }

  /**
   * Determine if consensus has been reached for a proposal.
   */
  async checkConsensus(proposalId: string, totalMembers: number): Promise<ConsensusResult> {
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

    // Count votes for each choice
    const voteCounts = proposalVotes.reduce((counts, vote) => {
      counts[vote.choice] = (counts[vote.choice] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    // Determine if quorum is met
    const quorumMet = proposalVotes.length >= (totalMembers * this.quorumSize);

    // Determine winning choice
    let winningChoice: string | null = null;
    let maxVotes = 0;

    for (const [choice, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningChoice = choice;
      }
    }

    return {
      proposalId,
      consensusReached: quorumMet && maxVotes > (totalMembers * this.quorumSize) / 2,
      winningChoice,
      votes: proposalVotes,
      quorumMet,
      timestamp: new Date()
    };
  }

  /**
   * Perform timeout and fallback if no consensus is reached.
   */
  async performTimeoutFallback(proposalId: string): Promise<ConsensusResult> {
    // Placeholder logic for timeout handling and fallback
    return {
      proposalId,
      consensusReached: false,
      winningChoice: null,
      votes: this.votes.get(proposalId) || [],
      quorumMet: false,
      timestamp: new Date()
    };
  }

  /**
   * Close proposal and finalize results.
   */
  async closeProposal(proposalId: string): Promise<ConsensusResult | null> {
    const proposalVotes = this.votes.get(proposalId);
    if (!proposalVotes) {
      return null;
    }

    // Finalize consensus
    const totalMembers = proposalVotes.length * 2; // Placeholder: assume all members voted
    return await this.checkConsensus(proposalId, totalMembers);
  }
}

