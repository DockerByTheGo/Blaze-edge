
# Jobs 

https://docs.redwoodjs.com/docs/background-jobs/

Get more inspo from here


![[Screenshot_20250704_203629_Chrome.jpg]]

jobs are scripts which run during the course of the app lifecycle ands have access to the global context obj. What makes thme better than making your jobs seperate from the app is that they have access to the app ctx nothing else. 

## How they work 

they are kinda treated like endpoints (so that they have access to the ctx object) and are called peridocally so whenever they are called all non route specific hooks run for them 

## How to use them
```ts
const job = new Job({handler: ctx => ..., type: JobTypes.Interval(5, "mins" /* has intellisense */), metadata:{tags: []}})
app.addJob("name",job)
```

or anoter overload is 

```ts
app.addJob({"nae]me": job, "name": job2})
```

or
```ts
app.addJob(Job.new({handler: ..., metadata: {name: ""}})) 
```
Note for this overload to work you need to supply the name inside metadata. It is helpful to use this wgen you are building a package for a certain job and want to free the user of naming it 

## Options
### StartWhen
It accepts a timed job e.g. interval etx... but instead of starting directly it setups the timer after the first call of the job

### TTL 
Option is which defines time the function shouldnt exceed when executing, time is in milisecs and should abide to setInterval limits
### Types
#### Interval(number, time_period: "mins" | "hours" | "secs" | "ms")
note if the number and type converted to ms is above 2,147,483,647 or below 0 an error will be thrown. For longer jobs please usethe LongInterval since it uses a different mechanisms to repvent overflows. It has the same syntax

#### Repeat(numberOfTimesToRepeat)

#### None
It does not execute the job with a timer instead it just adds it to the jibs context. This is useful whrn you need to have a reusable logic but still maintain the hooks


#### Once() 
just a shorthand for Repeat(1, ctx => ...) makes the code more readable

#### Twice()


#### OnDate(DateRegex | Range[] | Date[] | customFunc)

#### DateRegex

for date regex you supply it in this format
YYYY/DD/MM

for example 

2,0,[1-9],[1-9]_[1-5],[1-5]_0,[1-4]

#### Range
you can supply a range of dates 


for example a valid argument is [DateRange.new("2020_01_19", "2020_05_19")]

the DateRange just checks if the first is before the second and if not it throws an error 2

#### CustomFunc

it is ran every day (e,g, everytime the date chnages) and accepts the date as an argument and it should return true or false.

This is cool for when you need to have some complex logic based on the date whether to do something or not 

---

Note: each job must have a name so that they can be idetified



## Bundling
If you want to share some common properties between multiple jobs you can. Reate a bundler

```ts
const bundle = JobBundle
.new({metadata:{tags: []}, groupName: ""})
.beforeEach(() => ctx /* this will be recieved by the jibs, for example you have two jibs which run against a db you can pass the connection from  here instead of initing it at two times in the handlers*/)
.afterEach((ctx) => /* something to do with the return of each job  for example close db connection */ ctx)
.addSubGroup(new JobBundle())
```


Destructuring bundles 

If you do not wish for the jobs to be in the group simply omit the groupName from the options

## Querying
### Complex Queries
you can query jobs using our QL language which allows you to query jobs based on their metadata or you can select them using groups, names or tags individually

```ts
app.jobs.query(where(name, selector: or(is("sendEmail"), contains("send"))))
```
this returns a job instance object which gives access to all the fields of a job and also the hooks and the invoke method which runs the job programatically

```ts
app.jobs.fromGroup("group-name").map(res => {
  res.jobs.fromGroup() // returns sub groups of the group if any 

  const job = res.jobs.get("job-name") // has intellisense

  job.onExecuted(() => {...})

  job.onRegistered(() => {...})



})

// or 

app.jobs.fromTags(["tag1", "tag2"]).map(res => {
  
}) // try to have intellisense on this too


app.jobs.fromTag("tag").name // gives "names", has intellisense, do this first since its easier to implement

```

#### Default grouping

By default a job is attached to its groups the substrusture it belongs to 


For example

```ts
JobBundle
.new({groupName: "group-1"})
.addSubBundle(JobBundle.new({groupName: ""}))
```

Now the second one is also in group-1 


## Hooks

### Types
#### Register Resource

This is done if you need to manage some kind of countable resource, for example `jobs` are managed like that since it gives you acces to a lot of goodies

#### OnRegistered
#### OnExecuted

## Overview

Jobs in @blazy/http-core provide a way to run background tasks, scheduled jobs, and long-running processes outside the request/response cycle. This is essential for tasks like sending emails, processing uploads, or performing periodic maintenance.

## Creating Jobs

### Basic Job

```typescript
import { Job } from "@blazy/http-core/jobs";

const sendWelcomeEmail = new Job({
  name: "send-welcome-email",
  handler: async (payload: { userId: string }) => {
    const user = await userService.getUser(payload.userId);
    await emailService.sendWelcomeEmail(user);
  },
  retry: 3, // Number of retry attempts
  timeout: 30000, // 30 seconds
});

// Queue the job
await sendWelcomeEmail.dispatch({ userId: "123" });
```

### Scheduled Jobs

```typescript
import { Job, schedule } from "@blazy/http-core/jobs";
// Start the scheduler
import { startScheduler } from "@blazy/http-core/jobs";

const cleanupJob = new Job({
  name: "cleanup-old-data",
  schedule: schedule.everyDayAt(3, 0), // 3 AM daily
  handler: async () => {
    // Delete records older than 30 days
    await db.logs.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
  }
});
startScheduler([cleanupJob]);
```

## Job Queue

### Using Bull/Redis

```typescript
import { createQueue } from "@blazy/http-core/jobs/queue";
import { Queue } from "bull";

// Create a queue
const emailQueue = createQueue("emails", {
  redis: {
    host: process.env.REDIS_HOST,
    port: Number.parseInt(process.env.REDIS_PORT)
  }
});

// Define job processor
emailQueue.process("send-welcome-email", async (job) => {
  const { userId } = job.data;
  const user = await userService.getUser(userId);
  await emailService.sendWelcomeEmail(user);
});

// Add job to queue
await emailQueue.add("send-welcome-email", { userId: "123" });
```

## Job Events

```typescript
const job = sendWelcomeEmail.dispatch({ userId: "123" });

job
  .on("started", () => {
    console.log("Job started");
  })
  .on("progress", (progress) => {
    console.log(`Progress: ${progress}%`);
  })
  .on("completed", (result) => {
    console.log("Job completed:", result);
  })
  .on("failed", (error) => {
    console.error("Job failed:", error);
  });
```

## Job Middleware

```typescript
// Log all job executions
app.jobs.use(async (job, next) => {
  const start = Date.now();

  try {
    logger.info(`Starting job: ${job.name}`, { jobId: job.id });
    const result = await next();
    logger.info(`Completed job: ${job.name} in ${Date.now() - start}ms`, {
      jobId: job.id,
      duration: Date.now() - start
    });
    return result;
  }
  catch (error) {
    logger.error(`Job failed: ${job.name}`, {
      jobId: job.id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});
```

## Best Practices

1. **Idempotency**: Design jobs to be idempotent
2. **Error Handling**: Implement proper error handling and retries
3. **Monitoring**: Track job execution and failures
4. **Resource Management**: Be mindful of resource usage
5. **Testing**: Test your jobs in isolation

## Next Steps

- Learn about [Router](../router/main.md) for request routing
- Explore [Request Lifecycle](../request-lifecycle/main.md)
- See [Examples](../examples/main.md) for practical implementations