import Link from "next/link";

export default async function Home() {
  return (
    <ul className="list-disc pl-4 text-xl">
      <li>
        <Link href="/cc" className="underline">
          Client Components example
        </Link>
      </li>
      <li>
        <Link href="/rsc" className="underline">
          RSC example
        </Link>
      </li>
    </ul>
  );
}
