<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@apollo/experimental-nextjs-app-support](./experimental-nextjs-app-support.md) &gt; [registerApolloClient](./experimental-nextjs-app-support.registerapolloclient_1.md)

## registerApolloClient() function

Ensures that you can always access the same instance of ApolloClient during RSC for an ongoing request, while always returning a new instance for different requests.

**Signature:**

```typescript
declare function registerApolloClient(makeClient: () => ApolloClient$1<any>): {
    getClient: () => ApolloClient$1<any>;
};
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

makeClient


</td><td>

() =&gt; ApolloClient$1&lt;any&gt;


</td><td>


</td></tr>
</tbody></table>
**Returns:**

{ getClient: () =&gt; ApolloClient$1&lt;any&gt;; }

## Example


```ts
export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: "http://example.com/api/graphql",
    }),
  });
});
```

