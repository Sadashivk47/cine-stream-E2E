import { Movie } from "../types/movie";

interface MoviesResponse {
  movies: Movie[];
  hasMore: boolean;
  isTMDB: boolean;
}

export async function getPopularMovies(
  page: number = 1,
  genre: string = "All",
  type: string = "all"
): Promise<MoviesResponse> {
  const url = new URL("/api/movies", window.location.origin);
  url.searchParams.set("page", page.toString());
  if (genre && genre !== "All") {
    url.searchParams.set("genre", genre);
  }
  if (type) {
    url.searchParams.set("type", type);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function searchMovies(
  query: string,
  page: number = 1,
  genre: string = "All",
  type: string = "all"
): Promise<MoviesResponse> {
  const url = new URL("/api/movies", window.location.origin);
  url.searchParams.set("q", query);
  url.searchParams.set("page", page.toString());
  if (genre && genre !== "All") {
    url.searchParams.set("genre", genre);
  }
  if (type) {
    url.searchParams.set("type", type);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
export async function getMovieTrailer(movieId: string): Promise<{ videoId?: string }> {
  const response = await fetch(`/api/movies/${encodeURIComponent(movieId)}/trailer`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
