const {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  sleep,
  condition,
} = require('@temporalio/workflow');
const { sendReminder, archiveApplication } = proxyActivities({
  startToCloseTimeout: '1 minute',
});

const updateStatusSignal = defineSignal('updateStatus');
const getStateQuery = defineQuery('getState');

async function applicationWorkflow(applicationData) {
  let status = 'Applied';
  let archived = false;
  const deadline = applicationData.deadline
    ? new Date(applicationData.deadline)
    : new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);

  setHandler(updateStatusSignal, newStatus => {
    status = newStatus;
  });
  setHandler(getStateQuery, () => ({
    status,
    archived,
    deadline: deadline.toISOString(),
  }));

  // Remove automatic cover letter generation
  // const coverLetter = await generateCoverLetter(applicationData);
  // await updateCoverLetter(applicationData.workflowId, coverLetter);

  const now = Date.now();
  const deadlineTime = deadline.getTime();
  const reminderAt = new Date(deadlineTime - 24 * 60 * 60 * 1000);

  // Handle past deadlines - send immediate reminder
  if (deadlineTime <= now) {
    console.log('Deadline has passed, sending immediate reminder');
    await sendReminder(
      { ...applicationData, deadline: deadline.toISOString() },
      'deadline-reached'
    );

    // For past deadlines, use a shorter grace period (1 hour for testing)
    const graceMs = 60 * 60 * 1000; // 1 hour for testing
    console.log(
      `Waiting ${graceMs / (60 * 60 * 1000)} hours grace period before archiving...`
    );

    await condition(() => status !== 'Applied', graceMs);
    if (status === 'Applied') {
      console.log('Grace period expired, archiving application');
      archived = true;
      await archiveApplication({
        ...applicationData,
        deadline: deadline.toISOString(),
      });
    }
  } else {
    // Handle future deadlines
    // Send pre-deadline reminder if it's in the future
    if (reminderAt.getTime() > now) {
      await sleep(reminderAt.getTime() - now);
      if (status === 'Applied') {
        await sendReminder(
          { ...applicationData, deadline: deadline.toISOString() },
          'pre-deadline'
        );
      }
    }

    // Wait until deadline
    if (status === 'Applied') {
      const waitMsToDeadline = deadlineTime - Date.now();
      if (waitMsToDeadline > 0) {
        await condition(() => status !== 'Applied', waitMsToDeadline);
      }
    }

    // Send deadline reached reminder
    if (status === 'Applied') {
      await sendReminder(
        { ...applicationData, deadline: deadline.toISOString() },
        'deadline-reached'
      );
      const graceMs = 7 * 24 * 60 * 60 * 1000;
      await condition(() => status !== 'Applied', graceMs);
      if (status === 'Applied') {
        archived = true;
        await archiveApplication({
          ...applicationData,
          deadline: deadline.toISOString(),
        });
      }
    }
  }

  return { archived };
}

module.exports = { applicationWorkflow, updateStatusSignal };
