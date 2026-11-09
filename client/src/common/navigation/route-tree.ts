import { matchPath } from 'react-router-dom';
import type { ResolveRouteBranchParams, RouteTreeNode } from './types';

const NO_BRANCH: readonly never[] = [];

// Walks the tree depth-first and returns the matched path from the root down to the most
// specific node, e.g. [tasks, tasks/views/:viewId]. An empty branch means the root did not
// match. Use it whenever a feature needs the whole context chain, not just one value.
export const resolveRouteBranch = <Value>({
  node,
  pathname,
}: ResolveRouteBranchParams<Value>): readonly RouteTreeNode<Value>[] => {
  if (matchPath({ end: false, path: node.pattern }, pathname) === null) {
    return NO_BRANCH;
  }

  const childBranch =
    (node.children ?? [])
      .map((child) => resolveRouteBranch({ node: child, pathname }))
      .find((branch) => branch.length > 0) ?? NO_BRANCH;

  return [node, ...childBranch];
};

// The value of the deepest matched node that defines one, so children override their parents
// and nodes without a value inherit. `undefined` means nothing on the branch defines a value.
export const resolveRouteValue = <Value>(
  params: ResolveRouteBranchParams<Value>,
): Value | undefined =>
  resolveRouteBranch(params)
    .filter((matched) => matched.value !== undefined)
    .at(-1)?.value;
