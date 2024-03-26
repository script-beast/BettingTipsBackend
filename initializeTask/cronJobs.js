const MonthlyRecurringCheck = require("../utils/CronJobs/MonthlyRecurringCheck");
const YearlyRecurringCheck = require("../utils/CronJobs/YearlyRecurringCheck");

const CronJobs = () => {
  MonthlyRecurringCheck.start();
  YearlyRecurringCheck.start();
};

module.exports = CronJobs;
