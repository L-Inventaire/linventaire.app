import { useFormController } from "@components/form/formcontext";
import { useNavigationPrompt } from "@features/utils/use-navigation-prompt";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { atomFamily, useRecoilState } from "recoil";
import { useRest } from "./use-rest";
import toast from "react-hot-toast";

const RestDraftAtom = atomFamily<any, [string, string | "new", string]>({
  key: "RestDraftAtom",
  default: {},
  effects_UNSTABLE: (key) => [
    ({ onSet }) => {
      onSet((newVal) => {
        if (key[1] === "new") {
          localStorage.setItem(
            "drafts_" + key.join("_"),
            JSON.stringify(newVal)
          );
        }
      });
    },
  ],
});

export const useReadDraftRest = <T extends { id: string }>(
  table: string,
  id: string,
  readonly = false
) => {
  return useDraftRest<T>(table, id, async () => {}, undefined, readonly);
};

export const DraftContext = createContext({ key: "" });

export const useDraftRest = <T extends { id: string }>(
  table: string,
  id: string | "new",
  onSaved: (item: T) => Promise<void>,
  defaultValue?: Partial<T>,
  readonly = false
) => {
  const { items, upsert, remove, restore, isPendingModification } = useRest<T>(
    table,
    { id }
  );
  const existingItem = id && id !== "new" ? items?.data?.list?.[0] : null;
  const { key } = useContext(DraftContext);

  const [defaultWasSet, setDefaultWasSet] = useState(false);
  const [draft, setDraft] = useRecoilState<T>(RestDraftAtom([table, id, key]));

  const { lockNavigation, ctrl, setLockNavigation } = useFormController(
    draft,
    setDraft,
    table + "_" + id
  );
  useNavigationPrompt(!readonly && lockNavigation);

  useEffect(() => {
    // TODO see bellow
    // 1/ For now we wont load the last draft, it should instead be in an other atom to store drafts and allow
    // user to load it back -> JSON.parse(localStorage.getItem("drafts_" + key.join("_")) || "{}"
    // 2/ Auto loading draft at loading page is great when reloading page but not when navigating from button "create new"
    // Maybe we can detect if it's a reload or not ?
    if (defaultValue && !items.isPending) {
      setDraft(defaultValue as T);
    }
    setDefaultWasSet(true);
  }, [JSON.stringify(defaultValue), items.isPending]);

  useEffect(() => {
    if (existingItem && (draft.id !== existingItem.id || readonly)) {
      setDraft(existingItem);
    }
  }, [existingItem, draft.id]);

  const save = useCallback(
    async (mutation: Partial<T> = {}) => {
      try {
        setLockNavigation(false);
        const newItem = await upsert.mutateAsync({ ...draft, ...mutation });
        await onSaved(newItem);
        return newItem;
      } catch (e) {
        setLockNavigation(true);
        console.error(e);
        toast.error("An error occurred while saving the item");
      }
      return null;
    },
    [draft, upsert.mutateAsync, onSaved]
  );

  return {
    save,
    remove: async () => remove.mutateAsync(draft?.id),
    restore: async () => restore.mutateAsync(draft?.id),
    isInitiating:
      (items.isPending && !items.data) || (defaultValue && !defaultWasSet),
    isPending: items.isPending,
    isPendingModification,
    ctrl,
    draft,
    setDraft: setDraft,
  };
};
