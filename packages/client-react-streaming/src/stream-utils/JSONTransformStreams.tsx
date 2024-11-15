export class JSONEncodeStream<T> extends TransformStream<T, JsonString<T>> {
  constructor() {
    super({
      transform(chunk, controller) {
        controller.enqueue(JSON.stringify(chunk));
      },
    });
  }
}

export class JSONDecodeStream<T> extends TransformStream<
  JsonString<T> | AllowSharedBufferSource,
  T
> {
  constructor() {
    super({
      transform(chunk, controller) {
        if (typeof chunk !== "string") {
          chunk = new TextDecoder().decode(chunk);
        }
        controller.enqueue(JSON.parse(chunk));
      },
    });
  }
}

export type JsonString<Encoded> = string & { __jsonString?: [Encoded] };
