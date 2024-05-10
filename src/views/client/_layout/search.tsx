import { InputDecorationIcon } from "@atoms/input/input-decoration-icon";
import { Input } from "@atoms/input/input-text";
import { debounce } from "@features/utils/debounce";
import { SearchIcon } from "@heroicons/react/outline";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SearchResult = {}; //TODO

export const Search = () => {
  const { t } = useTranslation();
  const [, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const requestId = useRef<number>(0);
  const [, setLoading] = useState(false);
  const [, setResult] = useState<{ data: SearchResult[]; total: number }>({
    data: [],
    total: 0,
  });

  useEffect(() => {
    if (query) {
      setLoading(true);
      requestId.current++;
      const id = requestId.current;
      debounce(
        async () => {
          //TODO
          setResult({
            data: [],
            total: 0,
          });
          if (id === requestId.current) {
            setLoading(false);
          }
        },
        { key: "search" }
      );
    }
  }, [query]);

  return (
    <div className="md:relative z-10 w-full">
      <InputDecorationIcon
        className="w-full relative z-20"
        prefix={SearchIcon}
        input={({ className }) => (
          <Input
            className="w-full"
            size="md"
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            onChange={(e) => setQuery(e.target.value)}
            inputClassName={"!rounded-md text-black " + className}
            placeholder={t("header.search.placeholder")}
            shortcut={["shift+k", "ctrl+k"]}
          />
        )}
      />
    </div>
  );
};
