import {
  ReadFromReadableStreamLink,
  TeeToReadableStreamLink,
} from "@apollo/client-react-streaming";
import {
  ApolloLink,
  ApolloClient as _ApolloClient,
} from "@apollo/client/index.js";

export class ApolloClient extends _ApolloClient<any> {
  constructor(options: ConstructorParameters<typeof _ApolloClient>[0]) {
    super(options);
    this.setLink(this.link);
  }

  setLink(newLink: ApolloLink) {
    _ApolloClient.prototype.setLink.call(
      this,
      ApolloLink.from([
        ReadFromReadableStreamLink,
        TeeToReadableStreamLink,
        newLink,
      ])
    );
  }
}
