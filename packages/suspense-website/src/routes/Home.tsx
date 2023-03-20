import { Link } from "react-router-dom";

import Block from "../components/Block";
import Container from "../components/Container";
import GitHubLink from "../components/GitHubLink";
import SubHeading from "../components/SubHeading";
import Note from "../components/Note";
import {
  CREATE_CACHE,
  CREATE_DEFERRED,
  CREATE_INTERVAL_CACHE,
  CREATE_SINGLE_ENTRY_CACHE,
  CREATE_STREAMING_CACHE,
  GUIDE_ABORT_A_REQUEST,
  GUIDE_FETCH_WITH_STATUS,
  GUIDE_MEMORY_MANAGEMENT,
  GUIDE_MUTATING_A_CACHE_VALUE,
  GUIDE_STREAMING_CACHE,
  IS_PROMISE_LIKE,
  RECORD_AND_RECORD_DATA_UTILS,
  USE_CACHE_MUTATION,
  USE_CACHE_STATUS,
  USE_IMPERATIVE_CACHE_VALUE,
  USE_IMPERATIVE_INTERVAL_CACHE_VALUES,
  USE_INTERVAL_CACHE_STATUS,
  USE_STREAMING_CACHE,
} from "./config";

import styles from "./Home.module.css";
import { PropsWithChildren } from "react";
import { ExternalLink } from "../components/ExternalLink";

export default function Route() {
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
        <p>
          Suspense is an <strong>experimental pre-release feature</strong>;
          these APIs may change.
        </p>
      </Note>
      <Block>
        <SubHeading title="Installation" />
        <InstallationPanel />
      </Block>
      <Block>
        <SubHeading title="APIs" />
        <SubHeading level={2} title="Caches" />
        <ul>
          <LinkListItem children="createCache" to={CREATE_CACHE} type="code" />
          <LinkListItem
            children="creatIntervalCache"
            to={CREATE_INTERVAL_CACHE}
            type="code"
          />
          <LinkListItem
            children="createSingleEntryCache"
            to={CREATE_SINGLE_ENTRY_CACHE}
            type="code"
          />
          <LinkListItem
            children="createStreamingCache"
            to={CREATE_STREAMING_CACHE}
            type="code"
          />
        </ul>
        <SubHeading level={2} title="Hooks" />
        <ul>
          <LinkListItem
            children="useCacheMutation"
            to={USE_CACHE_MUTATION}
            type="code"
          />
          <LinkListItem
            children="useCacheStatus"
            to={USE_CACHE_STATUS}
            type="code"
          />
          <LinkListItem
            children="useIntervalCacheStatus"
            to={USE_INTERVAL_CACHE_STATUS}
            type="code"
          />
          <LinkListItem
            children="useImperativeCacheValue"
            to={USE_IMPERATIVE_CACHE_VALUE}
            type="code"
          />
          <LinkListItem
            children="useImperativeIntervalCacheValues"
            to={USE_IMPERATIVE_INTERVAL_CACHE_VALUES}
            type="code"
          />
          <LinkListItem
            children="useStreamingValue"
            to={USE_STREAMING_CACHE}
            type="code"
          />
        </ul>
        <SubHeading level={2} title="Low-level API" />
        <ul>
          {/*<LinkListItem children="createInfallibleCache" to="{CREATE_INFALLIBLE_CACHE} type="code" />*/}
          <LinkListItem
            children="createDeferred"
            to={CREATE_DEFERRED}
            type="code"
          />
          <LinkListItem
            children="isPromiseLike"
            to={IS_PROMISE_LIKE}
            type="code"
          />
          <LinkListItem
            children="Record"
            to={RECORD_AND_RECORD_DATA_UTILS}
            type="code"
          />
          {/*<LinkListItem children="parallelize" to={PARALLELIZE} type="code" />*/}
        </ul>
      </Block>
      <Block>
        <SubHeading title="Guides" />
        <ul>
          <LinkListItem
            children="Memory management"
            to={GUIDE_MEMORY_MANAGEMENT}
            type="plaintext"
          />
          <LinkListItem
            children="Aborting a request"
            to={GUIDE_ABORT_A_REQUEST}
            type="plaintext"
          />
          <LinkListItem
            children="Mutating cache values"
            to={GUIDE_MUTATING_A_CACHE_VALUE}
            type="plaintext"
          />
          <LinkListItem
            children="Creating a streaming cache"
            to={GUIDE_STREAMING_CACHE}
            type="plaintext"
          />
          <LinkListItem
            children="Rendering cache status"
            to={GUIDE_FETCH_WITH_STATUS}
            type="plaintext"
          />
        </ul>
      </Block>
    </Container>
  );
}

function LinkListItem({
  children,
  to,
  type,
}: PropsWithChildren & { to: string; type: "code" | "plaintext" }) {
  return (
    <li className={styles.ListItem} data-type={type}>
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
