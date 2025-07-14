import { Command } from 'commander';
import { CodesssaKernel } from '../../core/codessa-kernel';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();
const kernel = new CodesssaKernel();

program
  .command('list-agents')
  .description('List all active agents in the Codessa system')
  .action(async () => {
    try {
      const agents = await kernel.listAgents();
      console.log('Active Agents:', agents);
    } catch (error) {
      console.error('Error listing agents:', error.message);
    }
  });

program
  .command('run-directive <name>')
  .description('Run a directive within Codessa')
  .action(async (name) => {
    try {
      console.log(`Executing directive: ${name}`);
      const result = await kernel.runDirective(name);
      console.log('Result:', result);
    } catch (error) {
      console.error(`Error executing directive ${name}:`, error.message);
    }
  });

program
  .command('query-memory <query>')
  .description('Query the Codessa memory system')
  .action(async (query) => {
    try {
      const results = await kernel.queryMemory(query);
      console.log('Memory Query Results:', results);
    } catch (error) {
      console.error('Error querying memory:', error.message);
    }
  });

program
  .command('agent-status <name>')
  .description('Check the status of an agent')
  .action(async (name) => {
    try {
      const status = await kernel.agentStatus(name);
      console.log(`Agent ${name} Status:`, status);
    } catch (error) {
      console.error(`Error checking agent status for ${name}:`, error.message);
    }
  });

// Planner Commands
program
  .command('schedule-goal <description>')
  .description('Schedule a new goal with the autonomous task planner')
  .option('-p, --priority <priority>', 'Goal priority (high, medium, low)', 'medium')
  .option('-d, --deadline <deadline>', 'Goal deadline (ISO date string)')
  .action(async (description, options) => {
    const spinner = ora('Scheduling goal...').start();
    try {
      const goalData = {
        description,
        priority: options.priority as 'high' | 'medium' | 'low',
        deadline: options.deadline ? new Date(options.deadline) : undefined
      };
      
      const goalId = await kernel.scheduleGoal(goalData);
      spinner.succeed(`Goal scheduled successfully with ID: ${chalk.green(goalId)}`);
      console.log(`Description: ${description}`);
      console.log(`Priority: ${options.priority}`);
      if (options.deadline) {
        console.log(`Deadline: ${options.deadline}`);
      }
    } catch (error) {
      spinner.fail('Failed to schedule goal');
      console.error('Error scheduling goal:', error.message);
    }
  });

program
  .command('list-goals')
  .description('List all goals in the autonomous task planner')
  .option('-s, --status <status>', 'Filter by status (pending, in-progress, completed, failed)')
  .option('-p, --priority <priority>', 'Filter by priority (high, medium, low)')
  .action(async (options) => {
    const spinner = ora('Fetching goals...').start();
    try {
      const filters = {
        status: options.status,
        priority: options.priority
      };
      
      const goals = await kernel.listGoals(filters);
      spinner.succeed(`Found ${goals.length} goals`);
      
      if (goals.length === 0) {
        console.log(chalk.yellow('No goals found matching the criteria.'));
        return;
      }
      
      console.log('\n' + chalk.bold('Goals:'));
      goals.forEach((goal: import('../../core/codessa-kernel').Goal, index: number) => {
        const statusColor = goal.status === 'completed' ? 'green' : 
                           goal.status === 'failed' ? 'red' : 
                           goal.status === 'in-progress' ? 'yellow' : 'blue';
        
        console.log(`\n${index + 1}. ${chalk.bold(goal.description)}`);
        console.log(`   ID: ${goal.id}`);
        console.log(`   Status: ${chalk[statusColor](goal.status)}`);
        console.log(`   Priority: ${goal.priority}`);
        if (goal.deadline) {
          console.log(`   Deadline: ${goal.deadline.toISOString()}`);
        }
        console.log(`   Created: ${goal.createdAt.toISOString()}`);
      });
    } catch (error) {
      spinner.fail('Failed to fetch goals');
      console.error('Error listing goals:', error.message);
    }
  });

program
  .command('goal-status <goalId>')
  .description('Get detailed status of a specific goal')
  .action(async (goalId) => {
    const spinner = ora('Fetching goal status...').start();
    try {
      const goalStatus = await kernel.getGoalStatus(goalId);
      spinner.succeed('Goal status retrieved');
      
      console.log(`\n${chalk.bold('Goal Status:')}`);
      console.log(`ID: ${goalStatus.id}`);
      console.log(`Description: ${goalStatus.description}`);
      console.log(`Status: ${chalk[goalStatus.status === 'completed' ? 'green' : goalStatus.status === 'failed' ? 'red' : 'yellow'](goalStatus.status)}`);
      console.log(`Priority: ${goalStatus.priority}`);
      console.log(`Progress: ${goalStatus.progress}%`);
      
      if (goalStatus.currentTask) {
        console.log(`\n${chalk.bold('Current Task:')}`);
        console.log(`  Description: ${goalStatus.currentTask.description}`);
        console.log(`  Status: ${goalStatus.currentTask.status}`);
      }
      
      if (goalStatus.completedTasks?.length > 0) {
        console.log(`\n${chalk.bold('Completed Tasks:')}`);
        goalStatus.completedTasks.forEach((task: import('../../core/codessa-kernel').Task, index: number) => {
          console.log(`  ${index + 1}. ${task.description}`);
        });
      }
      
      if (goalStatus.deadline) {
        console.log(`Deadline: ${goalStatus.deadline.toISOString()}`);
      }
      console.log(`Created: ${goalStatus.createdAt.toISOString()}`);
      if (goalStatus.completedAt) {
        console.log(`Completed: ${goalStatus.completedAt.toISOString()}`);
      }
    } catch (error) {
      spinner.fail('Failed to fetch goal status');
      console.error('Error fetching goal status:', error.message);
    }
  });

program
  .command('planner-status')
  .description('Get the overall status of the autonomous task planner')
  .action(async () => {
    const spinner = ora('Fetching planner status...').start();
    try {
      const status = await kernel.getPlannerStatus();
      spinner.succeed('Planner status retrieved');
      
      console.log(`\n${chalk.bold('Autonomous Task Planner Status:')}`);
      console.log(`Active: ${status.active ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`Total Goals: ${status.totalGoals}`);
      console.log(`Active Goals: ${status.activeGoals}`);
      console.log(`Completed Goals: ${status.completedGoals}`);
      console.log(`Failed Goals: ${status.failedGoals}`);
      console.log(`Queue Length: ${status.queueLength}`);
      
      if (status.currentGoal) {
        console.log(`\n${chalk.bold('Current Goal:')}`);
        console.log(`  ID: ${status.currentGoal.id}`);
        console.log(`  Description: ${status.currentGoal.description}`);
        console.log(`  Priority: ${status.currentGoal.priority}`);
        console.log(`  Progress: ${status.currentGoal.progress}%`);
      }
      
      if (status.upcomingGoals?.length > 0) {
        console.log(`\n${chalk.bold('Upcoming Goals:')}`);
        status.upcomingGoals.slice(0, 3).forEach((goal: import('../../core/codessa-kernel').Goal, index: number) => {
          console.log(`  ${index + 1}. ${goal.description} (${goal.priority})`);
        });
        if (status.upcomingGoals.length > 3) {
          console.log(`  ... and ${status.upcomingGoals.length - 3} more`);
        }
      }
      
      console.log(`\nLast Updated: ${status.lastUpdated.toISOString()}`);
    } catch (error) {
      spinner.fail('Failed to fetch planner status');
      console.error('Error fetching planner status:', error.message);
    }
  });

program
  .command('pause-planner')
  .description('Pause the autonomous task planner')
  .action(async () => {
    const spinner = ora('Pausing planner...').start();
    try {
      await kernel.pausePlanner();
      spinner.succeed(chalk.yellow('Autonomous task planner paused'));
    } catch (error) {
      spinner.fail('Failed to pause planner');
      console.error('Error pausing planner:', error.message);
    }
  });

program
  .command('resume-planner')
  .description('Resume the autonomous task planner')
  .action(async () => {
    const spinner = ora('Resuming planner...').start();
    try {
      await kernel.resumePlanner();
      spinner.succeed(chalk.green('Autonomous task planner resumed'));
    } catch (error) {
      spinner.fail('Failed to resume planner');
      console.error('Error resuming planner:', error.message);
    }
  });

program
  .parse(process.argv);

export { program as aethershellCLI };
