import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'streamvault_favourites';

function loadFavourites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    }
  } catch {
    // ignore
  }
  return new Set();
}

function saveFavourites(favs: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favs)));
  } catch {
    // ignore
  }
}

export function useLocalFavourites() {
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => loadFavourites());

  useEffect(() => {
    saveFavourites(favouriteIds);
  }, [favouriteIds]);

  const toggleFavourite = useCallback((id: string) => {
    setFavouriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const isFavourite = useCallback(
    (id: string) => favouriteIds.has(id),
    [favouriteIds]
  );

  return { favouriteIds, toggleFavourite, isFavourite };
}
