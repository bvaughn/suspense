import { Link } from "react-router-dom";

import Block from "../../components/Block";
import Container from "../../components/Container";
import Icon from "../../components/Icon";
import SubHeading from "../../components/SubHeading";
import Warning from "../../components/Warning";

import styles from "./styles.module.css";

export default function HomeRoute() {
  return (
    <Container>
      <Block>
        <SubHeading
          title={
            <>
              Suspense
              <a
                className={styles.Link}
                href="https://github.com/bvaughn/suspense/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className={styles.GitHub} type="github" />
              </a>
            </>
          }
        />
        <p>
          APIs to simplify data loading and caching. Primarily intended for use
          with React Suspense.
        </p>
      </Block>
      <Warning>
        <Icon type="warn" />
        Because Suspense is in an <strong>experimental</strong> pre-release
        state, these APIs may change.
      </Warning>
      <Block>
        <SubHeading title="Installation" />
        <InstallationPanel />
      </Block>
      <Block>
        <SubHeading title="Caches" />
        <ul>
          <LinkListItem title="createCache" to="/examples/createCache" />
          <LinkListItem
            title="createStreamingCache"
            to="/examples/createStreamingCache"
          />
        </ul>
      </Block>
      <Block>
        <SubHeading title="Hooks" />
        <ul>
          <LinkListItem title="useCacheStatus" to="/examples/useCacheStatus" />
          <LinkListItem
            title="useStreamingCache"
            to="/examples/useStreamingCache"
          />
        </ul>
      </Block>
      <Block>
        <SubHeading title="Utilities" />
        <p>
          These utilities are lower level and probably not needed for most
          scenarios.
        </p>
        <ul>
          {/*<LinkListItem title="createInfallibleCache" to="/examples/createInfallibleCache" />*/}
          <LinkListItem title="createDeferred" to="/examples/createDeferred" />
          <LinkListItem title="isThennable" to="/examples/isThennable" />
          {/*<LinkListItem title="parallelize" to="/examples/parallelize" />*/}
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
      <span className="tok-variableName">react-resizable-panels</span>
      <br />
      <br />
      <span className="tok-comment"># yarn</span>
      <br />
      <span className="tok-operator">yarn add </span>
      <span className="tok-variableName">react-resizable-panels</span>
    </code>
  );
}
