import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { setTrackedLevel, startTracking, trackingHeaders } from "./tracker";
import type {
  CommandInput,
  CreativeReply,
  CreativeVerb,
  ProjectRecord,
  Workspace,
} from "./contracts";

// Bind every reply (including failures and navigation URLs) to the browser
// identity that started it. A fresh session invalidates all older requests.
// eslint-disable-next-line react-refresh/only-export-components
export function createResponseGate() {
  let epoch = 0;
  let identity: string | null = null;
  let snapshotSequence = 0;
  const stale = (): CreativeReply => ({
    ok: false,
    code: "SESSION_CHANGED",
    message: "Your session changed. Open the project again in your current workspace.",
  });
  return {
    begin(sequence: number) { return { epoch, sequence }; },
    receive(request: { epoch: number; sequence: number }, reply: CreativeReply): CreativeReply {
      if (request.epoch !== epoch) return stale();
      if (reply.ok && reply.workspace) {
        const nextIdentity = reply.workspace.person.id;
        if (nextIdentity !== identity) {
          if (request.sequence < snapshotSequence) return stale();
          identity = nextIdentity;
          epoch++;
        }
        snapshotSequence = Math.max(snapshotSequence, request.sequence);
      }
      return reply;
    },
  };
}

// Snapshots may finish after a later edit. Project revisions, rather than
// network completion order, decide which saved document remains visible.
// eslint-disable-next-line react-refresh/only-export-components
export function reconcileWorkspace(
  current: Workspace | null,
  snapshot?: Workspace,
  project?: ProjectRecord,
  acceptMetadata = true,
): Workspace | null {
  if (!current && !snapshot) return current;
  if (current && snapshot && current.person.id !== snapshot.person.id) {
    return acceptMetadata ? snapshot : current;
  }
  const base = snapshot && (acceptMetadata || !current) ? snapshot : current;
  const records = new Map(current?.projects.map((record) => [record.id, record]));
  for (const record of [...(snapshot?.projects ?? []), ...(project ? [project] : [])]) {
    const existing = records.get(record.id);
    if (!existing || record.revision > existing.revision) records.set(record.id, record);
  }
  return { ...base, projects: [...records.values()] };
}
const Context = createContext<{
  workspace: Workspace | null;
  loading: boolean;
  error: string;
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
  refresh: () => Promise<void>;
  run: <V extends CreativeVerb>(
    verb: V,
    input: CommandInput<V>,
  ) => Promise<CreativeReply>;
}>(null);
export function CreativeProvider({ children }: { children: ReactNode }) {
  const requestSequence = useRef(0);
  const workspaceSequence = useRef(0);
  const refreshSequence = useRef(0);
  const responseGate = useRef(createResponseGate());
  const [workspace, setWorkspace] = useState<Workspace | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [manualReducedMotion, setManualReducedMotion] = useState(
    () => localStorage.getItem("kresilo-reduce-motion") === "true",
  );
  const [systemReducedMotion, setSystemReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const reduceMotion = manualReducedMotion || systemReducedMotion;
  const setReduceMotion = (value: boolean) => {
    localStorage.setItem("kresilo-reduce-motion", String(value));
    setManualReducedMotion(value);
  };
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.kresiloMotion = reduceMotion
      ? "reduced"
      : "full";
  }, [reduceMotion]);
  useEffect(() => startTracking(), []);
  useEffect(() => setTrackedLevel(workspace?.person.mode), [workspace?.person.mode]);
  const run = useCallback(
    async <V extends CreativeVerb>(
      verb: V,
      input: CommandInput<V>,
    ): Promise<CreativeReply> => {
      const sequence = ++requestSequence.current;
      const request = responseGate.current.begin(sequence);
      try {
        const response = await fetch("/api/creative", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json", ...trackingHeaders() },
          body: JSON.stringify({ verb, input }),
        });
        const result = responseGate.current.receive(request, (await response.json()) as CreativeReply);
        if ("code" in result && result.code === "SESSION_CHANGED") return result;
        if ("code" in result) {
          setError(result.message);
          toast.error(result.message);
          return result;
        }
        setError("");
        const acceptMetadata = sequence >= workspaceSequence.current;
        if (result.workspace && acceptMetadata) workspaceSequence.current = sequence;
        if (result.workspace || result.project)
          setWorkspace((current) => reconcileWorkspace(
            current, result.workspace, result.project, acceptMetadata,
          ));
        return result;
      } catch {
        const message =
          "Could not connect. Your work may already be saved; refresh before retrying.";
        const failure = responseGate.current.receive(request, { ok: false, code: "NETWORK", message });
        if ("code" in failure && failure.code === "SESSION_CHANGED") return failure;
        setError(message);
        toast.error(message);
        return failure;
      }
    },
    [],
  );
  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    setLoading(true);
    await run("workspace.get", {});
    if (sequence === refreshSequence.current) setLoading(false);
  }, [run]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <Context.Provider
      value={{
        workspace,
        loading,
        error,
        refresh,
        run,
        reduceMotion,
        setReduceMotion,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCreative() {
  return useContext(Context);
}
export function useProject(id: string) {
  const c = useCreative();
  const record = c.workspace?.projects.find((p) => p.id === id);
  const { loading, run } = c;
  useEffect(() => {
    if (id && !loading && !record) void run("project.get", { projectId: id });
  }, [id, loading, record, run]);
  return { ...c, record } as typeof c & { record: ProjectRecord | undefined };
}
