import { Poll } from "@/components/Poll";
import gql from "graphql-tag";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <main className="max-w-5xl p-8">
      <header className="mb-4">
        <h1 className="text-3xl underline underline-offset-2">
          Apollo Next.js 13 Poll Demo
        </h1>
      </header>

      <Poll id="1" />
    </main>
  );
}
