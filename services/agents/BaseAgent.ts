// =====================================================
// DROPSHIPAI - Base Agent Class
// =====================================================

import {
  AgentType,
  AgentStatus,
  AgentState,
  AgentTask,
  AgentMessage,
  AgentConfig,
  AgentEvent,
  AgentEventHandler,
} from './types';

export abstract class BaseAgent {
  protected state: AgentState;
  protected config: AgentConfig;
  protected eventHandlers: AgentEventHandler[] = [];

  constructor(
    type: AgentType,
    name: string,
    capabilities: string[],
    config?: Partial<AgentConfig>
  ) {
    this.state = {
      id: `agent-${type}-${Date.now()}`,
      type,
      name,
      status: 'idle',
      taskHistory: [],
      messages: [],
      capabilities,
      stats: {
        tasksCompleted: 0,
        tasksFailed: 0,
        avgTaskTime: 0,
        successRate: 100,
      },
    };

    this.config = {
      enabled: true,
      autoStart: false,
      maxConcurrentTasks: 1,
      retryAttempts: 3,
      timeout: 60000,
      ...config,
    };
  }

  // ==================== STATE MANAGEMENT ====================

  getState(): AgentState {
    return { ...this.state };
  }

  getStatus(): AgentStatus {
    return this.state.status;
  }

  protected setStatus(status: AgentStatus): void {
    this.state.status = status;
    this.emit({
      type: 'agent:status_changed',
      timestamp: new Date(),
      agent: this.state.type,
      data: { status },
    });
  }

  // ==================== EVENT SYSTEM ====================

  on(handler: AgentEventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  protected emit(event: AgentEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Event handler error:', error);
      }
    });
  }

  // ==================== MESSAGING ====================

  protected sendMessage(
    to: AgentType | 'user' | 'all',
    type: AgentMessage['type'],
    content: string,
    data?: any
  ): AgentMessage {
    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      from: this.state.type,
      to,
      type,
      content,
      data,
    };

    this.state.messages.push(message);
    this.emit({
      type: 'agent:message',
      timestamp: new Date(),
      agent: this.state.type,
      data: message,
    });

    return message;
  }

  receiveMessage(message: AgentMessage): void {
    this.state.messages.push(message);
    this.handleMessage(message);
  }

  protected abstract handleMessage(message: AgentMessage): void;

  // ==================== TASK MANAGEMENT ====================

  protected createTask(type: string, description: string, priority: AgentTask['priority'] = 'medium'): AgentTask {
    return {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      description,
      priority,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    };
  }

  protected async executeTask(task: AgentTask): Promise<any> {
    task.status = 'in_progress';
    task.startedAt = new Date();
    this.state.currentTask = task;

    this.emit({
      type: 'agent:task_started',
      timestamp: new Date(),
      agent: this.state.type,
      data: { taskId: task.id, description: task.description },
    });

    try {
      this.setStatus('working');
      const result = await this.performTask(task);

      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      task.progress = 100;

      this.updateStats(task, true);
      this.state.taskHistory.push(task);
      this.state.currentTask = undefined;

      this.emit({
        type: 'agent:task_completed',
        timestamp: new Date(),
        agent: this.state.type,
        data: { taskId: task.id, result },
      });

      this.setStatus('idle');
      return result;
    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();
      task.error = error instanceof Error ? error.message : 'Unknown error';

      this.updateStats(task, false);
      this.state.taskHistory.push(task);
      this.state.currentTask = undefined;

      this.emit({
        type: 'agent:task_failed',
        timestamp: new Date(),
        agent: this.state.type,
        data: { taskId: task.id, error: task.error },
      });

      this.setStatus('error');
      throw error;
    }
  }

  protected updateProgress(progress: number): void {
    if (this.state.currentTask) {
      this.state.currentTask.progress = Math.min(100, Math.max(0, progress));
      this.emit({
        type: 'agent:task_progress',
        timestamp: new Date(),
        agent: this.state.type,
        data: {
          taskId: this.state.currentTask.id,
          progress: this.state.currentTask.progress,
        },
      });
    }
  }

  protected abstract performTask(task: AgentTask): Promise<any>;

  private updateStats(task: AgentTask, success: boolean): void {
    if (success) {
      this.state.stats.tasksCompleted++;
    } else {
      this.state.stats.tasksFailed++;
    }

    const total = this.state.stats.tasksCompleted + this.state.stats.tasksFailed;
    this.state.stats.successRate = (this.state.stats.tasksCompleted / total) * 100;

    if (task.startedAt && task.completedAt) {
      const duration = task.completedAt.getTime() - task.startedAt.getTime();
      const prevTotal = this.state.stats.avgTaskTime * (total - 1);
      this.state.stats.avgTaskTime = (prevTotal + duration) / total;
    }
  }

  // ==================== LIFECYCLE ====================

  async start(): Promise<void> {
    this.setStatus('idle');
    this.sendMessage('all', 'info', `${this.state.name} is now online and ready.`);
  }

  async stop(): Promise<void> {
    this.setStatus('idle');
    this.sendMessage('all', 'info', `${this.state.name} is shutting down.`);
  }

  pause(): void {
    this.setStatus('paused');
  }

  resume(): void {
    this.setStatus('idle');
  }

  // ==================== ABSTRACT METHODS ====================

  abstract execute(input: any): Promise<any>;

  // ==================== UTILITY ====================

  protected async think(thought: string): Promise<void> {
    this.setStatus('thinking');
    this.sendMessage('user', 'info', `Thinking: ${thought}`);
    // Simulate thinking time
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const prefix = `[${this.state.name}]`;
    switch (level) {
      case 'warn':
        console.warn(prefix, message);
        break;
      case 'error':
        console.error(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }
}

export default BaseAgent;
