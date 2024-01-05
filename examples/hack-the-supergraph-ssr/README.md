This is based on the [Hack the supergraph demo app](https://github.com/apollographql/hack-the-supergraph)

You can change the delay for deferred fragments using the "Demo Settings" button in the top right.  
As we are dealing with a real network connection, the _real_ delay will be a little longer than what you set here.  
The app is configured so that all fragments arriving within the first 100ms will still be part of SSR, and all fragments that take longer than 100ms will be fetched on the client.
