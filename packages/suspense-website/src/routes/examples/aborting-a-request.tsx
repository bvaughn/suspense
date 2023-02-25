import { Link } from "react-router-dom";
import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import { ExternalLink } from "../../components/ExternalLink";
import Header from "../../components/Header";
import Note from "../../components/Note";
import { createCache, createStreamingCache, demos } from "../../examples";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="aborting a request" />
      </Block>
      <Block>
        <p>
          In-progress requests can be cancelled by calling the cache{" "}
          <code>abort</code> method.
        </p>
        <Code code={demos.abortRequest.abort} />
        <Note>
          Requests can be aborted where side effects are permitted (e.g. event
          handlers, effect cleanup functions).
        </Note>
      </Block>
      <Block>
        <p>
          To accomplish this, a cache must forward the{" "}
          <code>
            <ExternalLink to="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal">
              AbortSignal
            </ExternalLink>
          </code>{" "}
          provided. Both types of cache receive this signal as part of an{" "}
          <code>options</code> parameter.
        </p>
        <Code code={createCache.cacheWithSignal} />
        <Code code={createStreamingCache.cacheWithSignal} />
      </Block>
    </Container>
  );
}
