import {
  ApolloLink,
  FetchResult,
  Observable,
  Operation,
} from "@apollo/client/index.js";
import type { SchemaLink } from "@apollo/client/link/schema";
import {
  experimentalExecuteIncrementally,
  SubsequentIncrementalExecutionResult,
  validate,
} from "graphql";
import { ObjMap } from "graphql/jsutils/ObjMap";

export class IncrementalSchemaLink extends ApolloLink {
  public schema: SchemaLink.Options["schema"];
  public rootValue: SchemaLink.Options["rootValue"];
  public context: SchemaLink.Options["context"];
  public validate: boolean;

  constructor(options: SchemaLink.Options) {
    super();
    this.schema = options.schema;
    this.rootValue = options.rootValue;
    this.context = options.context;
    this.validate = !!options.validate;
  }

  public request(operation: Operation): Observable<FetchResult> {
    return new Observable<FetchResult>((observer) => {
      new Promise<SchemaLink.ResolverContext>((resolve) =>
        resolve(
          typeof this.context === "function"
            ? this.context(operation)
            : this.context
        )
      )
        .then((context) => {
          if (this.validate) {
            const validationErrors = validate(this.schema, operation.query);
            if (validationErrors.length > 0) {
              return { errors: validationErrors };
            }
          }

          return experimentalExecuteIncrementally({
            schema: this.schema,
            document: operation.query,
            rootValue: this.rootValue,
            contextValue: context,
            variableValues: operation.variables,
            operationName: operation.operationName,
          });
        })
        .then((data) => {
          if (!observer.closed) {
            if ("initialResult" in data) {
              observer.next(data.initialResult);
              return data.subsequentResults.next().then(function handleChunk(
                next: IteratorResult<
                  SubsequentIncrementalExecutionResult<
                    ObjMap<unknown>,
                    ObjMap<unknown>
                  >,
                  void
                >
              ): Promise<unknown> | void {
                if (!observer.closed) {
                  if (next.value) {
                    observer.next(next.value);
                  }
                  if (next.done) {
                    observer.complete();
                  } else {
                    return data.subsequentResults.next().then(handleChunk);
                  }
                }
              });
            } else {
              observer.next(data);
              observer.complete();
            }
          }
        })
        .catch((error) => {
          if (!observer.closed) {
            observer.error(error);
          }
        });
    });
  }
}
