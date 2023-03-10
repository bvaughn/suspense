import Block from "../../components/Block";
import Code from "../../components/Code";
import Container from "../../components/Container";
import Header from "../../components/Header";
import Note from "../../components/Note";
import SubHeading from "../../components/SubHeading";
import { recordUtils } from "..";

export default function Route() {
  return (
    <Container>
      <Block>
        <Header title="Record utils" />
      </Block>
      <Block>
        <p>
          Records are a lower level concept that the caches in this package are
          built on top of.
        </p>
        <Note type="warn">
          <p>
            These APIs are probably not useful unless you are building your own
            cache.
          </p>
        </Note>
      </Block>
      <Block>
        <SubHeading title="Record utils" />
        <p>
          Typically a cache request will flow from <em>pending</em> to{" "}
          <em>resolved</em> (or <em>rejected</em>). This process is modeled by
          the <code>Record</code> object. These objects are typically created
          once, stored in a map, and then mutated as the request progresses. The
          following methods can be used to create the initial record object.
        </p>
        <p>
          The most common type of record to create this way is a{" "}
          <em>pending</em> record. This is useful for when a new value is first
          requested.
        </p>
        <Code code={recordUtils.createPendingRecord} />
        <p>
          If external code is caching a value, a record can be created in{" "}
          <em>resolved</em> state.
        </p>
        <Code code={recordUtils.createResolvedRecord} />
        <p>
          A record can also be created in <em>rejected</em> state.
        </p>
        <Code code={recordUtils.createRejectedRecord} />
        <p>
          When a request transitions, a cache can update/mutate the record using
          one of the methods below.
        </p>
        <p>
          It's uncommon for a record to transition back to <em>pending</em>{" "}
          status, but can happen (e.g. if a weakly held value has been garbage
          collected since it was last requested).
        </p>
        <Code code={recordUtils.updateRecordToPending} />
        <p>
          Once data has been loaded, a pending record can be transitioned to{" "}
          <em>resolved</em>.
        </p>
        <Code code={recordUtils.updateRecordToResolved} />
        <p>
          If something goes wrong, a pending record can be transitioned to{" "}
          <em>rejected</em>.
        </p>
        <Code code={recordUtils.updateRecordToRejected} />
      </Block>
      <Block>
        <SubHeading title="Record status utils" />
        <p>
          Convenience methods are provided to check if a record is in a specific
          state:
        </p>
        <Code code={recordUtils.isRecordStatus} />
        <p>TypeScript assertion methods are also provided for the above:</p>
        <Code code={recordUtils.assertRecordStatus} />
      </Block>
      <Block>
        <SubHeading title="RecordData utils" />
        <p>
          If you choose <em>not</em> to build your cache on top of the{" "}
          <code>Record</code> structure, you may still find the internal data
          format useful. The following utilities can be used to create that
          structure.
        </p>
        <Code code={recordUtils.createPendingRecordData} />
        <Code code={recordUtils.createResolvedRecordData} />
        <Code code={recordUtils.createRejectedRecordData} />
      </Block>
    </Container>
  );
}
