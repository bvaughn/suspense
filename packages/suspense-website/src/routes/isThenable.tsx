import Container from "../components/Container";
import Code from "../components/Code";
import Header from "../components/Header";
import { isThenable } from "../examples";
import Block from "../components/Block";
import Note from "../components/Note";
import { ExternalLink } from "../components/ExternalLink";

export default function IsThenableRoute() {
  return (
    <Container>
      <Block>
        <Header title="isThenable" />
      </Block>
      <Note type="warn">
        Although this package exports the <code>isThenable</code> API, you
        probably won't need to use it directly in most cases.
      </Note>
      <Block>
        <p>
          <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#thenables">
            "Thenable"
          </ExternalLink>{" "}
          are a lower level concept that the caches in this package are built on
          top of.
        </p>
        <p>
          A "thenable" is any object that defines a <code>then</code> method
          that can be used to observe success or failure. (Promises are the most
          common example of this– although you can also implement your own).
        </p>
        <p>
          <code>isThenable</code> can be used to determine if a value is a
          "thenable" or not.
        </p>
        <Code code={isThenable.util} />
      </Block>
    </Container>
  );
}
