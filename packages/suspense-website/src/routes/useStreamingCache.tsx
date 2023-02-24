import { Link } from "react-router-dom";

import Block from "../components/Block";
import Code from "../components/Code";
import Container from "../components/Container";
import Header from "../components/Header";
import { createStreamingCache } from "../examples";
import { CREATE_STREAMING_CACHE } from "./config";

export default function UseStreamingCacheRoute() {
  return (
    <Container>
      <Block>
        <Header title="useStreamingCache" />
      </Block>
      <Block>
        <p>
          The easiest way to use a{" "}
          <Link to={CREATE_STREAMING_CACHE}>streaming cache</Link> is with the{" "}
          <code>useStreamingCache</code> hook.
        </p>
        <Code code={createStreamingCache.hook} />
      </Block>
    </Container>
  );
}
