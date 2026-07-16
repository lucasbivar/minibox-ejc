import type { ComboboxItem, ComboboxParsedItem, OptionsFilter } from "@mantine/core";
import { normalizeSearchText } from "@minibox/shared";

function isOptionsGroup(item: ComboboxParsedItem): item is Extract<ComboboxParsedItem, { group: string }> {
  return "group" in item;
}

function matchesTerm(item: ComboboxItem, term: string): boolean {
  return normalizeSearchText(item.label).includes(term);
}

export const accentInsensitiveFilter: OptionsFilter = ({ options, search }) => {
  const term = normalizeSearchText(search);
  if (!term) return options;

  return options.reduce<ComboboxParsedItem[]>((result, item) => {
    if (isOptionsGroup(item)) {
      const items = item.items.filter((groupItem) => matchesTerm(groupItem, term));
      if (items.length > 0) result.push({ group: item.group, items });
      return result;
    }
    if (matchesTerm(item, term)) result.push(item);
    return result;
  }, []);
};
