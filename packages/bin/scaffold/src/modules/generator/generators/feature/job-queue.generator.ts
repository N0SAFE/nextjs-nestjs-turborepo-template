/**
 * Job Queue Generator
 *
 * Sets up BullMQ-based job queue infrastructure with NestJS integration,
 * job processors, queue utilities, and Redis configuration.
 */
import { Injectable } from "@nestjs/common";
import { BaseGenerator } from "../../base/base.generator";
import type {
  GeneratorContext,
  FileSpec,
  DependencySpec,
  ScriptSpec,
} from "../../../../types/generator.types";

@Injectable()
export class JobQueueGenerator extends BaseGenerator {
  protected override metadata = {
    pluginId: "job-queue",
    priority: 35,
    version: "1.0.0",
    description: "BullMQ job queue with NestJS integration",
    contributesTo: ["apps/api/src/jobs/**", "apps/api/src/queue/**"],
    dependsOn: ["nestjs"],
  };

  protected override getFiles(context: GeneratorContext): FileSpec[] {
    const files: FileSpec[] = [];

    // Queue module
    files.push(
      this.file("apps/api/src/queue/queue.module.ts", this.getQueueModule(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue service
    files.push(
      this.file("apps/api/src/queue/queue.service.ts", this.getQueueService(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue configuration
    files.push(
      this.file("apps/api/src/queue/queue.config.ts", this.getQueueConfig(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue types
    files.push(
      this.file("apps/api/src/queue/queue.types.ts", this.getQueueTypes(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue decorators
    files.push(
      this.file("apps/api/src/queue/decorators/index.ts", this.getQueueDecorators(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue index
    files.push(
      this.file("apps/api/src/queue/index.ts", this.getQueueIndex(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Base job processor
    files.push(
      this.file("apps/api/src/jobs/base.processor.ts", this.getBaseProcessor(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Example email job
    files.push(
      this.file("apps/api/src/jobs/email/email.processor.ts", this.getEmailProcessor(context), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Email job types
    files.push(
      this.file("apps/api/src/jobs/email/email.types.ts", this.getEmailTypes(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Email job constants
    files.push(
      this.file("apps/api/src/jobs/email/email.constants.ts", this.getEmailConstants(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Email jobs index
    files.push(
      this.file("apps/api/src/jobs/email/index.ts", this.getEmailIndex(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Jobs module
    files.push(
      this.file("apps/api/src/jobs/jobs.module.ts", this.getJobsModule(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Jobs index
    files.push(
      this.file("apps/api/src/jobs/index.ts", this.getJobsIndex(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue health indicator
    files.push(
      this.file("apps/api/src/queue/health/queue.health.ts", this.getQueueHealth(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    // Queue dashboard controller (optional admin UI)
    files.push(
      this.file("apps/api/src/queue/queue.controller.ts", this.getQueueController(), {
        mergeStrategy: "replace",
        priority: 35,
      }),
    );

    return files;
  }

  protected override getDependencies(_context: GeneratorContext): DependencySpec[] {
    return [
      { name: "@nestjs/bullmq", version: "^10.2.3", type: "prod", target: "apps/api", pluginId: "job-queue" },
      { name: "bullmq", version: "^5.34.8", type: "prod", target: "apps/api", pluginId: "job-queue" },
      { name: "ioredis", version: "^5.4.2", type: "prod", target: "apps/api", pluginId: "job-queue" },
      { name: "@bull-board/api", version: "^6.5.1", type: "prod", target: "apps/api", pluginId: "job-queue" },
      { name: "@bull-board/nestjs", version: "^6.5.1", type: "prod", target: "apps/api", pluginId: "job-queue" },
    ];
  }

  protected override getScripts(_context: GeneratorContext): ScriptSpec[] {
    return [
      { name: "queue:dashboard", command: "echo 'Queue dashboard available at /admin/queues'", target: "apps/api", description: "Queue dashboard info", pluginId: "job-queue" },
    ];
  }

  private getQueueModule(): string {
    return `import { Module, Global } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import { QueueService } from "./queue.service";
import { QueueController } from "./queue.controller";
import { getQueueConfig, QUEUE_NAMES } from "./queue.config";

@Global()
@Module({
  imports: [
    // Register BullMQ with Redis connection
    BullModule.forRoot({
      connection: getQueueConfig().connection,
      defaultJobOptions: getQueueConfig().defaultJobOptions,
    }),
    // Register queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.BACKGROUND },
    ),
    // Bull Board for queue monitoring
    BullBoardModule.forRoot({
      route: "/admin/queues",
      adapter: ExpressAdapter,
    }),
  ],
  providers: [QueueService],
  controllers: [QueueController],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
`;
  }

  private getQueueService(): string {
    return `import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue, Job, JobsOptions } from "bullmq";
import { QUEUE_NAMES, getDefaultJobOptions } from "./queue.config";
import type { QueueStats, JobInfo, QueueName } from "./queue.types";

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues: Map<string, Queue> = new Map();

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notificationsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BACKGROUND) private readonly backgroundQueue: Queue,
  ) {
    this.queues.set(QUEUE_NAMES.EMAIL, this.emailQueue);
    this.queues.set(QUEUE_NAMES.NOTIFICATIONS, this.notificationsQueue);
    this.queues.set(QUEUE_NAMES.BACKGROUND, this.backgroundQueue);
  }

  /**
   * Get a queue by name
   */
  getQueue(name: QueueName): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(\`Queue '\${name}' not found\`);
    }
    return queue;
  }

  /**
   * Add a job to a queue
   */
  async addJob<T>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: JobsOptions,
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const jobOptions = { ...getDefaultJobOptions(), ...options };
    
    const job = await queue.add(jobName, data, jobOptions);
    this.logger.debug(\`Added job \${jobName} to \${queueName} queue: \${job.id}\`);
    
    return job;
  }

  /**
   * Add multiple jobs to a queue (bulk insert)
   */
  async addBulk<T>(
    queueName: QueueName,
    jobs: Array<{ name: string; data: T; opts?: JobsOptions }>,
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    const defaultOpts = getDefaultJobOptions();
    
    const bulkJobs = jobs.map((job) => ({
      name: job.name,
      data: job.data,
      opts: { ...defaultOpts, ...job.opts },
    }));

    const addedJobs = await queue.addBulk(bulkJobs);
    this.logger.debug(\`Added \${addedJobs.length} jobs to \${queueName} queue\`);
    
    return addedJobs;
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  /**
   * Remove a job by ID
   */
  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.debug(\`Removed job \${jobId} from \${queueName} queue\`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueName): Promise<QueueStats> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed + paused,
    };
  }

  /**
   * Get statistics for all queues
   */
  async getAllQueueStats(): Promise<QueueStats[]> {
    const queueNames = Array.from(this.queues.keys()) as QueueName[];
    return Promise.all(queueNames.map((name) => this.getQueueStats(name)));
  }

  /**
   * Get recent jobs from a queue
   */
  async getRecentJobs(
    queueName: QueueName,
    status: "waiting" | "active" | "completed" | "failed" | "delayed",
    limit = 10,
  ): Promise<JobInfo[]> {
    const queue = this.getQueue(queueName);
    let jobs: Job[];

    switch (status) {
      case "waiting":
        jobs = await queue.getWaiting(0, limit - 1);
        break;
      case "active":
        jobs = await queue.getActive(0, limit - 1);
        break;
      case "completed":
        jobs = await queue.getCompleted(0, limit - 1);
        break;
      case "failed":
        jobs = await queue.getFailed(0, limit - 1);
        break;
      case "delayed":
        jobs = await queue.getDelayed(0, limit - 1);
        break;
      default:
        jobs = [];
    }

    return jobs.map((job) => ({
      id: job.id!,
      name: job.name,
      data: job.data,
      status,
      progress: job.progress as number,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    }));
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(\`Paused queue: \${queueName}\`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(\`Resumed queue: \${queueName}\`);
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    queueName: QueueName,
    grace: number = 1000 * 60 * 60 * 24, // 24 hours
    status: "completed" | "failed" = "completed",
  ): Promise<string[]> {
    const queue = this.getQueue(queueName);
    const cleaned = await queue.clean(grace, 1000, status);
    this.logger.log(\`Cleaned \${cleaned.length} \${status} jobs from \${queueName}\`);
    return cleaned;
  }

  /**
   * Drain a queue (remove all jobs)
   */
  async drainQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.drain();
    this.logger.warn(\`Drained all jobs from queue: \${queueName}\`);
  }
}
`;
  }

  private getQueueConfig(): string {
    return `import type { QueueOptions, JobsOptions } from "bullmq";

/**
 * Queue names used in the application
 */
export const QUEUE_NAMES = {
  EMAIL: "email" as const,
  NOTIFICATIONS: "notifications" as const,
  BACKGROUND: "background" as const,
} as const;

/**
 * Get Redis connection configuration for queues
 */
export function getQueueConfig(): QueueOptions {
  return {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_QUEUE_DB || "1", 10),
    },
    defaultJobOptions: getDefaultJobOptions(),
  };
}

/**
 * Default job options
 */
export function getDefaultJobOptions(): JobsOptions {
  return {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 60 * 60, // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      count: 500, // Keep last 500 failed jobs
      age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
    },
  };
}

/**
 * Job priority levels
 */
export const JOB_PRIORITY = {
  CRITICAL: 1,
  HIGH: 2,
  NORMAL: 3,
  LOW: 4,
  BACKGROUND: 5,
} as const;
`;
  }

  private getQueueTypes(): string {
    return `import type { QUEUE_NAMES, JOB_PRIORITY } from "./queue.config";

/**
 * Queue name type
 */
export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/**
 * Job priority type
 */
export type JobPriority = (typeof JOB_PRIORITY)[keyof typeof JOB_PRIORITY];

/**
 * Queue statistics
 */
export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
}

/**
 * Job information for API responses
 */
export interface JobInfo {
  id: string;
  name: string;
  data: unknown;
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  attemptsMade: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
}

/**
 * Base job data interface
 */
export interface BaseJobData {
  /** Unique identifier for deduplication */
  idempotencyKey?: string;
  /** Job metadata */
  metadata?: {
    userId?: string;
    correlationId?: string;
    source?: string;
  };
}

/**
 * Job result interface
 */
export interface JobResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  duration?: number;
}
`;
  }

  private getQueueDecorators(): string {
    return `import { SetMetadata } from "@nestjs/common";

/**
 * Metadata key for job processor
 */
export const JOB_PROCESSOR_KEY = "JOB_PROCESSOR";

/**
 * Decorator to mark a method as a job handler
 */
export const JobHandler = (jobName: string) => SetMetadata(JOB_PROCESSOR_KEY, jobName);

/**
 * Metadata key for queue name
 */
export const QUEUE_NAME_KEY = "QUEUE_NAME";

/**
 * Decorator to specify which queue a processor handles
 */
export const ForQueue = (queueName: string) => SetMetadata(QUEUE_NAME_KEY, queueName);
`;
  }

  private getQueueIndex(): string {
    return `export { QueueModule } from "./queue.module";
export { QueueService } from "./queue.service";
export { QUEUE_NAMES, JOB_PRIORITY, getQueueConfig, getDefaultJobOptions } from "./queue.config";
export type { QueueName, JobPriority, QueueStats, JobInfo, BaseJobData, JobResult } from "./queue.types";
export * from "./decorators";
`;
  }

  private getBaseProcessor(): string {
    return `import { Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bullmq";
import type { JobResult, BaseJobData } from "../queue/queue.types";

/**
 * Base class for job processors
 * Provides common functionality for all processors
 */
export abstract class BaseProcessor implements OnModuleInit {
  protected abstract readonly logger: Logger;

  onModuleInit() {
    this.logger.log(\`\${this.constructor.name} initialized\`);
  }

  /**
   * Handle job completion logging
   */
  protected logJobComplete(job: Job, result: JobResult, duration: number): void {
    this.logger.log(
      \`Job \${job.name} (\${job.id}) completed in \${duration}ms\`,
    );
  }

  /**
   * Handle job failure logging
   */
  protected logJobFailed(job: Job, error: Error, duration: number): void {
    this.logger.error(
      \`Job \${job.name} (\${job.id}) failed after \${duration}ms: \${error.message}\`,
      error.stack,
    );
  }

  /**
   * Wrap job processing with timing and error handling
   */
  protected async processWithMetrics<T extends BaseJobData, R>(
    job: Job<T>,
    handler: (job: Job<T>) => Promise<R>,
  ): Promise<JobResult<R>> {
    const startTime = Date.now();

    try {
      const data = await handler(job);
      const duration = Date.now() - startTime;

      const result: JobResult<R> = {
        success: true,
        data,
        duration,
      };

      this.logJobComplete(job, result, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logJobFailed(job, error as Error, duration);

      return {
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Update job progress
   */
  protected async updateProgress(job: Job, progress: number): Promise<void> {
    await job.updateProgress(Math.min(100, Math.max(0, progress)));
  }
}
`;
  }

  private getEmailProcessor(_context: GeneratorContext): string {
    return `import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { QUEUE_NAMES } from "../../queue/queue.config";
import { BaseProcessor } from "../base.processor";
import { EMAIL_JOBS, type EmailJobData, type SendEmailData, type SendBulkEmailData } from "./email.types";
import type { JobResult } from "../../queue/queue.types";

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  protected readonly logger = new Logger(EmailProcessor.name);

  /**
   * Main job processing method
   */
  async process(job: Job<EmailJobData>): Promise<JobResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(\`Processing email job: \${job.name} (\${job.id})\`);

      let result: JobResult;

      switch (job.name) {
        case EMAIL_JOBS.SEND_EMAIL:
          result = await this.handleSendEmail(job as Job<SendEmailData>);
          break;
        case EMAIL_JOBS.SEND_BULK_EMAIL:
          result = await this.handleSendBulkEmail(job as Job<SendBulkEmailData>);
          break;
        case EMAIL_JOBS.SEND_TEMPLATE_EMAIL:
          result = await this.handleSendTemplateEmail(job);
          break;
        default:
          throw new Error(\`Unknown email job type: \${job.name}\`);
      }

      const duration = Date.now() - startTime;
      this.logger.log(\`Email job \${job.name} (\${job.id}) completed in \${duration}ms\`);

      return { ...result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(\`Email job \${job.name} (\${job.id}) failed: \${errorMessage}\`);

      throw error; // Re-throw to trigger retry
    }
  }

  /**
   * Handle single email sending
   */
  private async handleSendEmail(job: Job<SendEmailData>): Promise<JobResult> {
    const { to, subject, body, html } = job.data;

    // TODO: Implement actual email sending with your email provider
    // Example: await this.mailerService.sendMail({ to, subject, text: body, html });

    this.logger.log(\`Sending email to \${to}: \${subject}\`);

    // Simulate email sending
    await this.simulateEmailSend();

    return {
      success: true,
      data: { to, subject, sentAt: new Date().toISOString() },
    };
  }

  /**
   * Handle bulk email sending
   */
  private async handleSendBulkEmail(job: Job<SendBulkEmailData>): Promise<JobResult> {
    const { recipients, subject, body, html } = job.data;
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      try {
        // TODO: Implement actual email sending
        await this.simulateEmailSend();
        results.push({ email: recipient, success: true });
      } catch (error) {
        results.push({
          email: recipient,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Update progress
      await job.updateProgress(Math.round(((i + 1) / recipients.length) * 100));
    }

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(\`Bulk email: \${successCount}/\${recipients.length} sent successfully\`);

    return {
      success: successCount === recipients.length,
      data: { results, total: recipients.length, successful: successCount },
    };
  }

  /**
   * Handle template-based email sending
   */
  private async handleSendTemplateEmail(job: Job<EmailJobData>): Promise<JobResult> {
    const { to, template, templateData } = job.data as any;

    // TODO: Implement template rendering and sending
    this.logger.log(\`Sending template email to \${to}: \${template}\`);

    await this.simulateEmailSend();

    return {
      success: true,
      data: { to, template, sentAt: new Date().toISOString() },
    };
  }

  /**
   * Simulate email sending (replace with actual implementation)
   */
  private async simulateEmailSend(): Promise<void> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.debug(\`Job \${job.id} completed\`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job, error: Error) {
    this.logger.error(\`Job \${job.id} failed: \${error.message}\`);
  }

  @OnWorkerEvent("progress")
  onProgress(job: Job, progress: number) {
    this.logger.debug(\`Job \${job.id} progress: \${progress}%\`);
  }
}
`;
  }

  private getEmailTypes(): string {
    return `import type { BaseJobData } from "../../queue/queue.types";

/**
 * Email job names
 */
export const EMAIL_JOBS = {
  SEND_EMAIL: "send-email",
  SEND_BULK_EMAIL: "send-bulk-email",
  SEND_TEMPLATE_EMAIL: "send-template-email",
} as const;

export type EmailJobName = (typeof EMAIL_JOBS)[keyof typeof EMAIL_JOBS];

/**
 * Base email job data
 */
export interface EmailJobData extends BaseJobData {
  to: string;
  subject: string;
  body?: string;
  html?: string;
}

/**
 * Single email send data
 */
export interface SendEmailData extends EmailJobData {
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Bulk email send data
 */
export interface SendBulkEmailData extends BaseJobData {
  recipients: string[];
  subject: string;
  body?: string;
  html?: string;
  batchSize?: number;
}

/**
 * Template email data
 */
export interface TemplateEmailData extends BaseJobData {
  to: string;
  template: string;
  templateData: Record<string, unknown>;
  locale?: string;
}
`;
  }

  private getEmailConstants(): string {
    return `/**
 * Email templates available in the system
 */
export const EMAIL_TEMPLATES = {
  WELCOME: "welcome",
  PASSWORD_RESET: "password-reset",
  EMAIL_VERIFICATION: "email-verification",
  NOTIFICATION: "notification",
  INVOICE: "invoice",
} as const;

/**
 * Email sending limits and configuration
 */
export const EMAIL_CONFIG = {
  MAX_RECIPIENTS_PER_BATCH: 50,
  MAX_ATTACHMENTS: 5,
  MAX_ATTACHMENT_SIZE_MB: 10,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 5000,
} as const;

/**
 * Email priority presets
 */
export const EMAIL_PRIORITY = {
  TRANSACTIONAL: 1, // Password resets, verifications
  HIGH: 2, // Important notifications
  NORMAL: 3, // Regular emails
  MARKETING: 4, // Marketing emails
  DIGEST: 5, // Digest/batch emails
} as const;
`;
  }

  private getEmailIndex(): string {
    return `export { EmailProcessor } from "./email.processor";
export { EMAIL_JOBS, type EmailJobName, type EmailJobData, type SendEmailData, type SendBulkEmailData, type TemplateEmailData } from "./email.types";
export { EMAIL_TEMPLATES, EMAIL_CONFIG, EMAIL_PRIORITY } from "./email.constants";
`;
  }

  private getJobsModule(): string {
    return `import { Module } from "@nestjs/common";
import { EmailProcessor } from "./email/email.processor";
import { QueueModule } from "../queue/queue.module";

@Module({
  imports: [QueueModule],
  providers: [EmailProcessor],
  exports: [EmailProcessor],
})
export class JobsModule {}
`;
  }

  private getJobsIndex(): string {
    return `export { JobsModule } from "./jobs.module";
export { BaseProcessor } from "./base.processor";
export * from "./email";
`;
  }

  private getQueueHealth(): string {
    return `import { Injectable } from "@nestjs/common";
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from "@nestjs/terminus";
import { QueueService } from "../queue.service";
import { QUEUE_NAMES } from "../queue.config";

@Injectable()
export class QueueHealthIndicator extends HealthIndicator {
  constructor(private readonly queueService: QueueService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const stats = await this.queueService.getAllQueueStats();
      
      const isHealthy = stats.every((queue) => {
        // Queue is healthy if not too many failed jobs
        const failureRate = queue.total > 0 ? queue.failed / queue.total : 0;
        return failureRate < 0.1; // Less than 10% failure rate
      });

      const result = this.getStatus(key, isHealthy, {
        queues: stats.map((s) => ({
          name: s.name,
          waiting: s.waiting,
          active: s.active,
          failed: s.failed,
        })),
      });

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError("Queue health check failed", result);
    } catch (error) {
      throw new HealthCheckError(
        "Queue health check failed",
        this.getStatus(key, false, {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
`;
  }

  private getQueueController(): string {
    return `import { Controller, Get, Post, Delete, Param, Query, HttpException, HttpStatus } from "@nestjs/common";
import { QueueService } from "./queue.service";
import type { QueueName } from "./queue.types";
import { QUEUE_NAMES } from "./queue.config";

@Controller("admin/queue")
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Get statistics for all queues
   */
  @Get("stats")
  async getAllStats() {
    return this.queueService.getAllQueueStats();
  }

  /**
   * Get statistics for a specific queue
   */
  @Get("stats/:queueName")
  async getQueueStats(@Param("queueName") queueName: string) {
    this.validateQueueName(queueName);
    return this.queueService.getQueueStats(queueName as QueueName);
  }

  /**
   * Get jobs from a queue by status
   */
  @Get(":queueName/jobs")
  async getJobs(
    @Param("queueName") queueName: string,
    @Query("status") status: "waiting" | "active" | "completed" | "failed" | "delayed" = "waiting",
    @Query("limit") limit: string = "10",
  ) {
    this.validateQueueName(queueName);
    return this.queueService.getRecentJobs(queueName as QueueName, status, parseInt(limit, 10));
  }

  /**
   * Pause a queue
   */
  @Post(":queueName/pause")
  async pauseQueue(@Param("queueName") queueName: string) {
    this.validateQueueName(queueName);
    await this.queueService.pauseQueue(queueName as QueueName);
    return { success: true, message: \`Queue \${queueName} paused\` };
  }

  /**
   * Resume a queue
   */
  @Post(":queueName/resume")
  async resumeQueue(@Param("queueName") queueName: string) {
    this.validateQueueName(queueName);
    await this.queueService.resumeQueue(queueName as QueueName);
    return { success: true, message: \`Queue \${queueName} resumed\` };
  }

  /**
   * Clean completed jobs from a queue
   */
  @Delete(":queueName/clean")
  async cleanQueue(
    @Param("queueName") queueName: string,
    @Query("grace") grace: string = "86400000", // 24 hours default
  ) {
    this.validateQueueName(queueName);
    const cleaned = await this.queueService.cleanQueue(queueName as QueueName, parseInt(grace, 10));
    return { success: true, cleaned: cleaned.length };
  }

  /**
   * Remove a specific job
   */
  @Delete(":queueName/jobs/:jobId")
  async removeJob(
    @Param("queueName") queueName: string,
    @Param("jobId") jobId: string,
  ) {
    this.validateQueueName(queueName);
    await this.queueService.removeJob(queueName as QueueName, jobId);
    return { success: true, message: \`Job \${jobId} removed\` };
  }

  private validateQueueName(queueName: string): void {
    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as QueueName)) {
      throw new HttpException(
        \`Invalid queue name. Valid queues: \${validQueues.join(", ")}\`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
`;
  }
}
