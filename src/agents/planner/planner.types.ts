export enum UserDecision {
  APPROVE = 'approve',
  DISCARD = 'discard',
}

export interface Aftermath {
  timestamp: string;
  proposal: string;
  userDecision: UserDecision;
  feedback: string[];
  note: string;
}
