export interface Movie {
  id: string;
  title: string;
  year: number;
  type: "movie" | "tv";
  duration?: string;
  genres: string[];
  rating: number;
  description: string;
  posterUrl: string;
  bgUrl?: string;
  isFeatured?: boolean;
  isCustom?: boolean;
  createdByUsername?: string;
  createdAt?: string | Date;
  episodes?: string | number;
  isAIConcept?: boolean;
}
