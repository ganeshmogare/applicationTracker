const { Worker } = require('@temporalio/worker');
const { application } = require('./utils/logger');

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/applicationWorkflow'),
    activities: require('./activities/llmActivities'),
    taskQueue: 'applicationQueue',
  });

  application.info('Temporal worker started successfully');
  await worker.run();
}

run().catch(err => {
  application.error('Worker failed to start', { error: err });
  process.exit(1);
});
