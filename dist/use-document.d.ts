import { AnyDocumentId, ChangeFn, Doc } from '@automerge/automerge-repo/slim';
import { ChangeOptions } from '@automerge/automerge/slim/next';
import { Resource } from 'solid-js';

export declare function useDocument<T>(id: () => AnyDocumentId | undefined): [
    Resource<Doc<T> | undefined>,
    (changeFn: ChangeFn<T>, options?: ChangeOptions<T> | undefined) => void
];
//# sourceMappingURL=use-document.d.ts.map