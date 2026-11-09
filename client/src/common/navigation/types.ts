// The top-level sections of the app; each owns a route root and everything nested below it.
export enum AppArea {
  Home = 'home',
  Tasks = 'tasks',
  Notes = 'notes',
  Expenses = 'expenses',
  Menu = 'menu',
}

// One node of a route tree. A node matches every URL its pattern matches as a prefix; children
// are more specific contexts below it, tried in order (put static segments before params).
// `value` is optional so grouping nodes can inherit their parent's value.
export interface RouteTreeNode<Value> {
  readonly children?: readonly RouteTreeNode<Value>[];
  readonly pattern: string;
  readonly value?: Value;
}

export interface ResolveRouteBranchParams<Value> {
  readonly node: RouteTreeNode<Value>;
  readonly pathname: string;
}

// Navigation state carrying the URL a flow should go back to, e.g. after creating a task.
export interface ReturnToState {
  readonly returnTo: string;
}
