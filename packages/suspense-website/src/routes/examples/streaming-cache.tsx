import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import { demos } from "../../examples";
import Demo from "../../examples/demos/streaming-cache";
import { CREATE_STREAMING_CACHE, USE_STREAMING_CACHE } from "../config";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="writing a streaming cache" />
      </Block>
      <Block>
        <p>
          The demo below shows how a{" "}
          <Link to={CREATE_STREAMING_CACHE}>streaming cache</Link> can be used
          to render a larger data set as it incrementally loads.
        </p>
        <p>Click the "start demo" button to fetch user data in the cache.</p>
        {/*<Code code={demos.} />*/}
      </Block>
      <Block type="demo">
        <Demo />
      </Block>
      <Block>
        <p>
          The demo above uses the{" "}
          <code>
            <Link to={USE_STREAMING_CACHE}>useStreamingValues</Link>
          </code>{" "}
          hook to incrementally render posts as they stream in. At a high level
          that usage looks like this:
        </p>
        <Code code={demos.streamingCache.Posts} />
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
