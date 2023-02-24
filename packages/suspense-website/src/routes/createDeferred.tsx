import Container from "../components/Container";
import Code from "../components/Code";
import Header from "../components/Header";
import { createDeferred } from "../examples/";
import Block from "../components/Block";
import Note from "../components/Note";

export default function CreateDeferredRoute() {
  return (
    <Container>
      <Block>
        <Header title="createDeferred" />
      </Block>
      <Note type="warn">
        Although this package exports the <code>createDeferred</code> API, you
        probably won't need to use it directly in most cases.
      </Note>
      <Block>
        <p>
          Deferred objects are a lower level concept that the caches in this
          package are built on top of.
        </p>
        <Code code={createDeferred.create} />
      </Block>
      <Block>
        <p>Like promises, deferred objects can be observed:</p>
        <Code code={createDeferred.observe} />
      </Block>
      <Block>
        <p>
          Unlike promises, deferred objects can also be resolved or rejected{" "}
          <em>by external code</em> (e.g. by a cache):
        </p>
        <Code code={createDeferred.control} />
      </Block>
    </Container>
  );
}
