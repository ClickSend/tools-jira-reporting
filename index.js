#!/usr/bin/env node
const chalk = require('chalk');
const { option } = require('yargs');
const { hideBin } = require('yargs/helpers')


require('yargs/yargs')(hideBin(process.argv))
  .scriptName("csj")
  .commandDir('modules/cmds', { recurse: true })
  .usage(
    '\n'
    + chalk.bold(chalk.yellow('ClickSend Jira Reporting Tool.'))
    + '\n'
    + '\n'
    + chalk.bold('Usage: $0 <command> [options]'
    ))
  .demandCommand()
  .option('host', {
    alias: 'h',
    describe: 'Your Atlassian host (e.g. awesome_company.atlassian.net)',
    requiresArg: true,
    demandOption: true,
    type: 'string',
    group: 'Jira Connection Options:'
  })
  .option('username', {
    alias: 'usr',
    describe: 'Your Atlassian user name used to log in to Jira',
    requiresArg: true,
    demandOption: true,
    type: 'string',
    group: 'Jira Connection Options:'
  })
  .option('password', {
    alias: ['pwd', 'token'],
    describe: 'Your access token you generated for this tool.  Generate yours at https://id.atlassian.com/manage-profile/security/api-tokens',
    requiresArg: true,
    demandOption: true,
    type: 'string',
    group: 'Jira Connection Options:'
  })
  .option('dir', {
    alias: 'd',
    describe: 'The directory into which the report(s) is/are written',
    requiresArg: true,
    normalize: true,
    default: './',
    type: 'string',
    group: 'Report Options:'
  })
  .option('verbose', {
    alias: 'V',
    describe: 'Verbose output.',
    type: 'boolean'
  })
  .option('debug', {
    alias: 'D',
    describe: 'Provide debugging output to the console.',
    type: 'boolean'
  })
  .help()
  .parse()
