import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertPlace, Place } from "@shared/schema";

export interface PlaceFilters {
  search?: string;
  category?: string;
  sort?: string;
  kidFriendly?: boolean;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'all';
  maxDistance?: number;
  minRating?: number;
  favoritesOnly?: boolean;
}

export function usePlaces(filters?: PlaceFilters) {
  const queryKey = [api.places.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Clean undefined filters
      const cleanFilters: Record<string, string> = {};
      if (filters?.search) cleanFilters.search = filters.search;
      if (filters?.category && filters.category !== 'all') cleanFilters.category = filters.category;
      if (filters?.sort) cleanFilters.sort = filters.sort;
      if (filters?.kidFriendly) cleanFilters.kidFriendly = 'true';
      if (filters?.indoorOutdoor && filters.indoorOutdoor !== 'all') cleanFilters.indoorOutdoor = filters.indoorOutdoor;
      if (filters?.maxDistance) cleanFilters.maxDistance = filters.maxDistance.toString();
      if (filters?.minRating) cleanFilters.minRating = filters.minRating.toString();
      if (filters?.favoritesOnly) cleanFilters.favoritesOnly = 'true';

      const url = filters ? `${api.places.list.path}?${new URLSearchParams(cleanFilters)}` : api.places.list.path;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch places");
      return api.places.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlace(id: number | null) {
  return useQuery({
    queryKey: [api.places.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.places.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch place");
      return api.places.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (place: InsertPlace) => {
      const res = await fetch(api.places.create.path, {
        method: api.places.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(place),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create place");
      return api.places.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.places.list.path] });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertPlace>) => {
      const url = buildUrl(api.places.update.path, { id });
      const res = await fetch(url, {
        method: api.places.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update place");
      return api.places.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.places.list.path] });
    },
  });
}

export function useExtractPlaces() {
  return useMutation({
    mutationFn: async (data: { imageUrl?: string; imageData?: string; fileType: 'image' | 'pdf' }) => {
      const res = await fetch(api.places.extract.path, {
        method: api.places.extract.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to extract places");
      return api.places.extract.responses[200].parse(await res.json());
    },
  });
}

export function useImportSampleData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.places.import.path, {
        method: api.places.import.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to import data");
      return api.places.import.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.places.list.path] });
    },
  });
}
