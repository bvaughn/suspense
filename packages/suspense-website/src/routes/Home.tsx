import { Link } from "react-router-dom";

import Block from "../components/Block";
import Container from "../components/Container";
import Icon from "../components/Icon";
import SubHeading from "../components/SubHeading";
import Warning from "../components/Warning";
import {
  CREATE_CACHE,
  CREATE_DEFERRED,
  CREATE_STREAMING_CACHE,
  IS_THENNABLE,
  USE_CACHE_STATUS,
  USE_STREAMING_CACHE,
} from "./config";

import styles from "./Home.module.css";

export default function HomeRoute() {
  return (
    <Container>
      <Block>
        <SubHeading
          title={
            <a
              className={styles.Link}
              href="https://github.com/bvaughn/suspense/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Suspense
              <Icon className={styles.GitHub} type="github" />
            </a>
          }
        />
        <p>
          APIs to simplify data loading and caching. Primarily intended for use
          with{" "}
          <a href="https://beta.reactjs.org/blog/2022/03/29/react-v18#suspense-in-data-frameworks">
            React Suspense
          </a>
          .
        </p>
      </Block>
      <Warning>
        Suspense is an <strong>experimental pre-release feature</strong>; these
        APIs will change.
      </Warning>
      <Block>
        <SubHeading title="Installation" />
        <InstallationPanel />
      </Block>
      <Block>
        <SubHeading title="Caches" />
        <ul>
          <LinkListItem title="createCache" to={CREATE_CACHE} />
          <LinkListItem
            title="createStreamingCache"
            to={CREATE_STREAMING_CACHE}
          />
        </ul>
      </Block>
      <Block>
        <SubHeading title="Hooks" />
        <ul>
          <LinkListItem title="useCacheStatus" to={USE_CACHE_STATUS} />
          <LinkListItem title="useStreamingCache" to={USE_STREAMING_CACHE} />
        </ul>
      </Block>
      <Block>
        <SubHeading title="Utilities" />
        <p>
          These utilities are lower level and probably not needed for most
          scenarios.
        </p>
        <ul>
          {/*<LinkListItem title="createInfallibleCache" to="/createInfallibleCache" />*/}
          <LinkListItem title="createDeferred" to={CREATE_DEFERRED} />
          <LinkListItem title="isThennable" to={IS_THENNABLE} />
          {/*<LinkListItem title="parallelize" to="/parallelize" />*/}
        </ul>
      </Block>
    </Container>
  );
}

function LinkListItem({ title, to }: { title: string; to: string }) {
  return (
    <li>
      <Link to={to}>
        <code>{title}</code>
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
