"use client"; // Error boundaries must be Client Components

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <>
      <h2>Encountered an error:</h2>
      <pre>{error.message}</pre>
      <button onClick={() => reset()}>Try again</button>
    </>
  );
}
