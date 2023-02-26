import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import { demos } from "../../examples";
import Demo from "../../examples/demos/rendering-status-while-fetching";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="render cache status" />
      </Block>
      <Block>
        <p>
          The demo below shows how <code>useCacheStatus</code> can be used to
          render UI based on the status of a cached item.
        </p>
        <p>Click the "start demo" button to fetch user data in the cache.</p>
      </Block>
      <Block type="demo">
        <Demo />
      </Block>
      <Block>
        <p>
          Although the <code>UserStatusBadge</code> component neither schedules
          the update with React nor suspends to load user data,{" "}
          <code>useCacheStatus</code> allows it to render status updates in
          response to cache changes.
        </p>
        <Code code={demos.renderingCacheStatus.UserStatusBadge} />
        <p>
          The full code for the demo can be found{" "}
          <ExternalLink to="https://github.com/bvaughn/suspense/tree/main/packages/suspense-website/src/examples/demos">
            here
          </ExternalLink>
          .
        </p>
      </Block>

      <Note>
        The cache in this demo uses a timeout to simulate a slow network
        request.
      </Note>
    </Container>
  );
}
