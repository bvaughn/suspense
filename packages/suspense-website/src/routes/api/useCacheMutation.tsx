import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import SubHeading from "../../components/SubHeading";
import { useCacheMutation } from "../../examples";
import { GUIDE_MUTATING_A_CACHE_VALUE } from "../config";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="useCacheMutation" />
      </Block>
      <Block>
        <SubHeading title="Mutating a cache" />
        <p>
          The recommended way to mutate cache values is with the{" "}
          <code>useCacheMutation</code> hook.
        </p>
        <Code code={useCacheMutation.hook} />
        <Note type="warn">
          <p>
            Mutation requires unreleased React APIs currently only available in
            the{" "}
            <ExternalLink to="https://reactjs.org/docs/release-channels.html#experimental-channel">
              "experimental" channel
            </ExternalLink>{" "}
            (<code>react@experimental</code> and{" "}
            <code>react-dom@experimental</code>).
          </p>
        </Note>
      </Block>
      <Block>
        <SubHeading title="Async mutations" />
        <p>
          Use <code>mutateAsync</code> when an async operation is required (e.g.
          an API request).
        </p>
        <Code code={useCacheMutation.async} />
      </Block>
      <Block>
        <SubHeading title="Sync mutations" />
        <p>
          Use <code>mutateSync</code> when a mutation can be done synchronously
          (or for optimistic updates).
        </p>
        <Code code={useCacheMutation.sync} />
      </Block>
      <Block>
        <Note>
          <p>
            The{" "}
            <Link to={GUIDE_MUTATING_A_CACHE_VALUE}>
              "mutating external data" guide
            </Link>{" "}
            shows an end-to-end mutation demo
          </p>
        </Note>{" "}
      </Block>
    </Container>
  );
}
