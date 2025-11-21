import React, { useState } from 'react';
import {
  Check,
  Circle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Plan, Step } from '../../types';

interface PlanTimelineProps {
  plan: Plan;
  steps: Step[];
  onStepClick?: (step: Step) => void;
}

export const PlanTimeline: React.FC<PlanTimelineProps> = ({
  plan,
  steps,
  onStepClick,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStepExpansion = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const getStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-6 h-6 text-green-600" />;
      case 'running':
        return <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'skipped':
        return <Circle className="w-6 h-6 text-slate-400" />;
      default:
        return <Circle className="w-6 h-6 text-slate-300" />;
    }
  };

  const getRiskLevelColor = (
    level: Step['risk_level']
  ): string => {
    switch (level) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200';
      case 'low':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return 'Pending';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Execution Plan
        </h3>
        <p className="text-slate-600 mb-4">{plan.goal}</p>

        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {steps.filter((s) => s.status === 'completed').length}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {steps.filter((s) => s.status === 'pending').length}
            </div>
            <div className="text-sm text-slate-600">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {steps.filter((s) => s.status === 'failed').length}
            </div>
            <div className="text-sm text-slate-600">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-600">
              {steps.length}
            </div>
            <div className="text-sm text-slate-600">Total</div>
          </div>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                steps.length > 0
                  ? (steps.filter((s) => s.status === 'completed').length /
                      steps.length) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id}>
            <button
              onClick={() => {
                toggleStepExpansion(step.id);
                onStepClick?.(step);
              }}
              className={`w-full border rounded-lg p-4 transition-colors text-left ${getRiskLevelColor(step.risk_level)}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(step.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">
                      Step {index + 1}: {step.tool_name}
                    </span>
                    <span className="inline-block px-2 py-1 bg-slate-200 text-xs font-medium text-slate-700 rounded">
                      {step.risk_level}
                    </span>
                    {step.status === 'running' && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-xs font-medium text-blue-700 rounded animate-pulse">
                        Running
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-slate-600 truncate">
                      {step.description}
                    </p>
                  )}
                  {step.completed_at && (
                    <p className="text-xs text-slate-500 mt-1">
                      Duration: {formatDuration(step.started_at, step.completed_at)}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {expandedSteps.has(step.id) ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </div>
            </button>

            {expandedSteps.has(step.id) && (
              <div className="mt-2 ml-4 border-l-2 border-slate-300 pl-4 py-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">
                    Input
                  </h4>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(step.input_payload, null, 2)}
                  </pre>
                </div>

                {step.output_payload && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Output
                    </h4>
                    <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(step.output_payload, null, 2)}
                    </pre>
                  </div>
                )}

                {step.error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <h4 className="text-sm font-semibold text-red-900 mb-1">
                      Error
                    </h4>
                    <p className="text-sm text-red-700">{step.error}</p>
                  </div>
                )}

                {step.dependencies && step.dependencies.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      Dependencies
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {step.dependencies.map((dep) => (
                        <span
                          key={dep}
                          className="inline-block px-2 py-1 bg-slate-200 text-xs text-slate-700 rounded"
                        >
                          Step {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {step.retry_count > 0 && (
                  <div className="text-xs text-slate-600">
                    Retries: {step.retry_count} / {step.max_retries}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
