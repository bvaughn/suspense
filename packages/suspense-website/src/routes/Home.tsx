import { Link } from "react-router-dom";

import Block from "../components/Block";
import Container from "../components/Container";
import GitHubLink from "../components/GitHubLink";
import SubHeading from "../components/SubHeading";
import Note from "../components/Note";
import {
  CREATE_CACHE,
  CREATE_DEFERRED,
  CREATE_STREAMING_CACHE,
  IS_THENNABLE,
  USE_CACHE_STATUS,
  USE_STREAMING_CACHE,
} from "./config";

import styles from "./Home.module.css";
import { PropsWithChildren } from "react";
import { ExternalLink } from "../components/ExternalLink";

export default function HomeRoute() {
  return (
    <Container>
      <Block>
        <GitHubLink />
        <p>
          APIs to simplify data loading and caching, for use with{" "}
          <ExternalLink to="https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks">
            React Suspense
          </ExternalLink>
          .
        </p>
        <p>
          This library exposes techniques used in apps like the{" "}
          <ExternalLink to="https://github.com/facebook/react/tree/main/packages/react-devtools-shared">
            React DevTools extension
          </ExternalLink>{" "}
          and <ExternalLink to="https://www.replay.io/">Replay.io</ExternalLink>
          .
        </p>
      </Block>
      <Note type="warn">
        Suspense is an <strong>experimental pre-release feature</strong>; these
        APIs may change.
      </Note>
      <Block>
        <SubHeading title="Installation" />
        <InstallationPanel />
      </Block>
      <Block>
        <SubHeading title="Core API" />
        <ul>
          <LinkListItem children="createCache" to={CREATE_CACHE} />
          <LinkListItem
            children="createStreamingCache"
            to={CREATE_STREAMING_CACHE}
          />
          <LinkListItem children="useCacheStatus" to={USE_CACHE_STATUS} />
          <LinkListItem
            children="useStreamingValues"
            to={USE_STREAMING_CACHE}
          />
        </ul>
      </Block>
      <Block>
        <SubHeading title="Low-level API" />
        <ul>
          {/*<LinkListItem children="createInfallibleCache" to="/createInfallibleCache" />*/}
          <LinkListItem children="createDeferred" to={CREATE_DEFERRED} />
          <LinkListItem children="isThenable" to={IS_THENNABLE} />
          {/*<LinkListItem children="parallelize" to="/parallelize" />*/}
        </ul>
      </Block>
    </Container>
  );
}

function LinkListItem({ children, to }: PropsWithChildren & { to: string }) {
  return (
    <li>
      <Link className={styles.Link} to={to}>
        {children}
      </Link>
    </li>
  );
}

function InstallationPanel() {
  return (
    <code className={styles.Code}>
      <span className="tok-comment"># npm</span>
      <br />
      <span className="tok-operator">npm install </span>
      <span className="tok-variableName">suspense</span>
      <br />
      <br />
      <span className="tok-comment"># yarn</span>
      <br />
      <span className="tok-operator">yarn add </span>
      <span className="tok-variableName">suspense</span>
    </code>
  );
}
