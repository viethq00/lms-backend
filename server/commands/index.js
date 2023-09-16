const {program} = require('commander');
const {crowData} = require('../repositories/statistic_used_time.repository');

program.command('cron_data_used_time').description('Cron data used time').action(crowData);
program.parse();

module.exports = program;
