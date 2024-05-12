import { useFormController } from "@components/form/formcontext";
import { useNavigationPrompt } from "@features/utils/use-navigation-prompt";
import { useEffect } from "react";
import { atomFamily, useRecoilState } from "recoil";
import { useRest } from "./use-rest";

const RestDraftAtom = atomFamily<any, [string, string]>({
  key: "RestDraftAtom",
  default: {},
});

export const useReadDraftRest = <T extends { id: string }>(
  table: string,
  id: string,
  readonly = false
) => {
  return useDraftRest<T>(table, id, async () => {}, {}, readonly);
};

export const useDraftRest = <T extends { id: string }>(
  table: string,
  id: string | "new",
  onSaved: (item: T) => Promise<void>,
  defaultValue: Partial<T> = {},
  readonly = false
) => {
  const { items, upsert } = useRest<T>(table, { query: { id } as any });
  const existingItem = id && id !== "new" ? items?.data?.list?.[0] : null;

  const [draft, setDraft] = useRecoilState<T>(RestDraftAtom([table, id]));

  const { lockNavigation, ctrl, setLockNavigation } = useFormController(
    draft,
    setDraft,
    table + "_" + id
  );
  useNavigationPrompt(!readonly && lockNavigation);

  useEffect(() => {
    setDraft((draft) =>
      Object.keys(draft).length || !Object.keys(defaultValue).length
        ? draft
        : (defaultValue as T)
    );
  }, [defaultValue]);

  useEffect(() => {
    if (existingItem && (draft.id !== existingItem.id || readonly)) {
      setDraft(existingItem);
    }
  }, [existingItem]);

  const save = async () => {
    try {
      setLockNavigation(false);
      const newItem = await upsert.mutateAsync(draft);
      await onSaved(newItem);
    } catch (e) {
      setLockNavigation(true);
      console.error(e);
    }
  };

  return {
    save,
    isInitiating: items.isPending && !items.data,
    isPending: upsert.isPending,
    ctrl,
    draft,
    setDraft: setDraft,
  };
};
