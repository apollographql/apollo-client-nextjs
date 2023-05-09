"use client";

export default function Error(error: { toString(): string }) {
  return <p>Error: {error.toString()}</p>;
}
