import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import Note from "../../components/Note";
import SubHeading from "../../components/SubHeading";
import { useImperativeIntervalCacheValues } from "../../examples";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="useImperativeIntervalCacheValues" />
      </Block>
      <Block>
        <SubHeading title="Loading interval data without Suspense" />
        <p>
          Data can be fetched without suspending using the{" "}
          <code>useImperativeIntervalCacheValues</code> hook. (This hook uses
          the imperative <code>readAsync</code> API, called from an effect.)
        </p>
        <Code code={useImperativeIntervalCacheValues.hook} />
      </Block>
      <Note type="warn">
        <p>
          Components that use this hook{" "}
          <strong>may mount before data has loaded</strong>.
        </p>
      </Note>
      <Note type="warn">
        <p>
          This hook exists as an escape hatch. When possible, values should be
          loaded using the <code>read</code> API.
        </p>
      </Note>
    </Container>
  );
}
