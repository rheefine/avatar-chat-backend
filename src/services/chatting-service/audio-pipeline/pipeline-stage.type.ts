import EventEmitter from 'events';

export interface PipelineStage<I, O> extends EventEmitter {
  process(input: I): Promise<void>;
}
