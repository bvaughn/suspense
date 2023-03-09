import shuffle from "lodash.shuffle";
import {
  createContext,
  Suspense,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createCache, useCacheStatus } from "suspense";
import Loader from "../../../components/Loader";
import { UserStatusBadge } from "./UserStatusBadge";

import styles from "./style.module.css";

// Fake API data
import { users } from "../users.json";

type User = (typeof users)[0];

function getRandomUsers(): User[] {
  return shuffle(users).slice(0, 5);
}

export const userProfileCache = createCache<[number], User>({
  debugLabel: "userProfileCache",
  load: async (id: number) => {
    return new Promise((resolve, reject) => {
      const delay = 500 + Math.random() * 4_500;
      setTimeout(() => {
        const user = users.find((user) => user.id === id);
        if (user) {
          resolve(user);
        } else {
          reject(`User not found: ${id}`);
        }
      }, delay);
    });
  },
});

export const SelectedUserContext = createContext<{
  selectedUserId: number | null;
  setSelectedUserId: (userId: number | null) => void;
}>(null as any);

export default function Demo() {
  return (
    <Suspense fallback={<Loader />}>
      <DemoSuspends />
    </Suspense>
  );
}

function DemoSuspends() {
  const [filteredUsers, setFilteredUsers] = useState<User[]>(getRandomUsers);
  const [state, setState] = useState<"ready" | "running" | "complete">("ready");

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const context = useMemo(
    () => ({ selectedUserId, setSelectedUserId }),
    [selectedUserId]
  );

  useEffect(() => {
    return () => {
      filteredUsers.map(({ id }) => userProfileCache.evict(id));
    };
  }, []);

  const handleClick = async () => {
    switch (state) {
      case "ready":
        setState("running");
        await Promise.all(
          filteredUsers.map(({ id }) => userProfileCache.readAsync(id))
        );
        setState("complete");
        break;
      case "complete":
        filteredUsers.map(({ id }) => userProfileCache.evict(id));
        setFilteredUsers(getRandomUsers());
        setSelectedUserId(null);
        setState("ready");
        break;
    }
  };

  return (
    <SelectedUserContext.Provider value={context}>
      <div className={styles.ButtonRow}>
        <button
          className={styles.MainButton}
          disabled={state !== "ready"}
          onClick={handleClick}
        >
          Start demo
        </button>
        <button
          className={styles.MainButton}
          disabled={state !== "complete"}
          onClick={handleClick}
        >
          Reset demo
        </button>
      </div>

      <section className={styles.App}>
        <nav className={styles.SideNav}>
          {filteredUsers.map(({ id, firstName, lastName }) => (
            <UserLink key={id} id={id} name={`${firstName} ${lastName}`} />
          ))}
        </nav>
        <main className={styles.Main}>
          {selectedUserId ? (
            <Suspense
              fallback={<Placeholder title="Loading..." />}
              key={selectedUserId}
            >
              <UserProfile id={selectedUserId} />
            </Suspense>
          ) : (
            <Placeholder title="No user selected" />
          )}
        </main>
      </section>
    </SelectedUserContext.Provider>
  );
}

function Placeholder({ title }: { title: string }) {
  return <div className={styles.Placeholder}>{title}</div>;
}

function UserProfile({ id }: { id: number }) {
  const deferredId = useDeferredValue(id);
  const userProfile = userProfileCache.read(deferredId);

  return (
    <>
      <h3 className={styles.Header}>
        {userProfile.firstName} {userProfile.lastName}
      </h3>
      <ul>
        <li>
          <label>Address</label>:{userProfile.address.address},{" "}
          {userProfile.address.city}, {userProfile.address.state}{" "}
          {userProfile.address.postalCode}
        </li>
        <li>
          <label>Phone</label>: {userProfile.phone}
        </li>
        <li>
          <label>Email</label>: {userProfile.email}
        </li>
        <li>
          <label>Website</label>: {userProfile.domain}
        </li>
      </ul>
    </>
  );
}

function UserLink({ id, name }: { id: number; name: string }) {
  const { selectedUserId, setSelectedUserId } = useContext(SelectedUserContext);

  const isCurrent = id === selectedUserId;

  const status = useCacheStatus(userProfileCache, id);

  const handleClick = () => {
    setSelectedUserId(id);
  };

  return (
    <button
      className={styles.UserButton}
      data-current={isCurrent || undefined}
      data-status={status}
      onClick={handleClick}
    >
      <UserStatusBadge id={id} /> {name}
    </button>
  );
}
