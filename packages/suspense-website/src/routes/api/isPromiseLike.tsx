import Container from "../../components/Container";
import Code from "../../components/Code";
import Header from "../../components/Header";
import { isPromiseLike } from "../../examples";
import Block from "../../components/Block";
import Note from "../../components/Note";
import { ExternalLink } from "../../components/ExternalLink";
import SubHeading from "../../components/SubHeading";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="isPromiseLike" />
      </Block>
      <Note type="warn">
        <p>
          Although this package exports the <code>isPromiseLike</code> API, you
          probably won't need to use it directly in most cases.
        </p>
      </Note>
      <Block>
        <p>
          Things that are "promise like" (also sometimes called "thenables") are
          a lower level concept that the caches in this package are built on top
          of. To quote{" "}
          <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise#thenables">
            the MDM docs
          </ExternalLink>
          :
        </p>
        <Note title="Thenables" type="quote">
          <p>
            A "thenable" implements the <code>.then()</code> method, which is
            called with two callbacks: one for when the promise is fulfilled,
            one for when it's rejected. Promises are thenables as well.
          </p>
        </Note>
        <p>
          <code>isPromiseLike</code> can be used to determine if a value is a
          "thenable" or not.
        </p>
      </Block>
      <Block>
        <SubHeading title="Loading optional values" />
        <p>
          You can use this utility method to ignore failures for a particular
          Suspense cache without also swallowing other types of errors.
        </p>
        <Code code={isPromiseLike.util} />
      </Block>
    </Container>
  );
}
