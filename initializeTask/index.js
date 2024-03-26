const cronJobs = require("./cronJobs");

const initializeTask = () => {
  cronJobs();
};

module.exports = initializeTask;
