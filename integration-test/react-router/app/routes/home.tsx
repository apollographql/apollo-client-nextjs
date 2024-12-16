import { useLoaderData, type MetaFunction } from "react-router";
import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import type { TypedDocumentNode } from "@apollo/client/index.js";
import { gql, useReadQuery } from "@apollo/client/index.js";
import { apolloLoader } from "~/apollo";

export const meta: MetaFunction = () => {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
};

interface Posts {
  posts: {
    data: Array<{
      id: string;
      title: string;
    }>;
  };
}
const GET_POSTS: TypedDocumentNode<Posts> = gql`
  query GetPosts {
    posts(options: { paginate: { page: 1, limit: 5 } }) {
      data {
        id
        title
      }
    }
  }
`;

export const loader = apolloLoader<Route.LoaderArgs>()(({ preloadQuery }) => {
  const postsRef = preloadQuery(GET_POSTS);
  return {
    postsRef,
  };
});

export default function Home() {
  const { postsRef } = useLoaderData<typeof loader>();

  const posts = useReadQuery(postsRef).data.posts.data;

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {posts.map((post) => {
          return (
            <li key={post.id} className="whitespace-nowrap">
              <div>{post.title.substring(0, 20)}</div>
            </li>
          );
        })}
      </ul>
      <hr />
      <Welcome />
    </div>
  );
}
