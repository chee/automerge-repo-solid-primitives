import { Repo } from '@automerge/automerge-repo/slim';

/**
 * A [context](https://docs.solidjs.com/concepts/context) that provides access
 * to an Automerge repo.
 */
export declare const RepoContext: import('solid-js').Context<Repo | null>;
/** A utility function to access the repo owned by {@link RepoContext}. */
export declare function useRepo(): Repo;
//# sourceMappingURL=use-repo.d.ts.map