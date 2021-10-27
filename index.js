#!/usr/bin / env node

const figlet = require( 'figlet' );
const chalk = require ('chalk');
const { hideBin } = require('yargs/helpers')

require('yargs/yargs')(hideBin(process.argv))
  .scriptName("csj")
  .commandDir('cmds', { recurse : true })
  .usage( 
    chalk.bold( chalk.cyan(figlet.textSync('... CS-JRT ...', {})))
    + '\n'
    + chalk.bold(chalk.yellow('           ClickSend Jira Reporting Tool.') )
    + '\n'
    + '\n'
    + chalk.bold( 'Usage: $0 <command> [options]' 
  ))
  .demandCommand()
  .option( 'host', {
    alias : 'h',
    describe : 'Your Atlassian host (e.g. clicksend.atlassian.net)',
    requiresArg : true,
    demandOption : true,
    group : 'Jira Connect Options:'
  })
  .option( 'basic', {
      alias : 'b',
      describe : 'The basic authentication string for Atlassian.',
      requiresArg : true,
      demandOption : true,
      group : 'Jira Connect Options:'
    })
  .option( 'dir', {
      alias : 'd',
      describe : 'The directory into which the report(s) is/are written',
      requiresArg : true,
      normalize : true,
      default : './'
    })
  .help()
  .parse()
