import { Movie } from "../types/movie";

export async function getMovieSuggestionFromMood(mood: string): Promise<{
  suggestedMovie: Movie;
  aiExplanation: string;
  isKeyLeaked?: boolean;
  apiError?: string;
}> {
  const response = await fetch("/api/mood-matcher", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mood }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
