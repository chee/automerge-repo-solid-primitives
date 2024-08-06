import { AnyDocumentId, DocHandle } from '@automerge/automerge-repo/slim';

/** A hook which returns a {@link DocHandle} identified by a URL.
 *
 * @remarks
 * This requires a {@link RepoContext} to be provided by a parent component.
 */
export declare function useHandle<T>(id: () => AnyDocumentId | undefined): () => DocHandle<T> | undefined;
//# sourceMappingURL=use-handle.d.ts.map