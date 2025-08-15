const { Worker } = require('@temporalio/worker');
const { Connection } = require('@temporalio/client');
const config = require('./config');

async function run() {
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows/applicationWorkflow'),
    activities: require('./activities/llmActivities'),
    taskQueue: 'applicationQueue',
  });

  console.log('Worker started...');
  await worker.run();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
