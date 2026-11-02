import { Action, ActionPanel, closeMainWindow, List } from "@raycast/api";
import { showFailureToast, useExec } from "@raycast/utils";
import { execFile } from "node:child_process";
import { homedir } from "node:os";
import { promisify } from "node:util";

const REX = `${homedir()}/Library/Application Support/com.superlogical.rex/RexServer/Versions/Current/Rex Server.app/Contents/MacOS/rex`;
const exec = promisify(execFile);

type Session = { session_id: string; label: string };

async function switchTo(session: Session) {
  try {
    await exec(REX, ["do", "session.select", `session_id=${session.session_id}`]);
    await exec("open", ["-a", "Rex Beta"]);
    await closeMainWindow({ clearRootSearch: true });
  } catch (error) {
    await showFailureToast(error, { title: `Couldn't switch to ${session.label}` });
  }
}

export default function Command() {
  const { data, isLoading, revalidate } = useExec(REX, ["ls", "--json"], {
    parseOutput: ({ stdout }): Session[] => JSON.parse(stdout).sessions,
  });

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search sessions…">
      {data?.map((session) => (
        <List.Item
          key={session.session_id}
          title={session.label || session.session_id}
          accessories={[{ text: session.session_id.slice(-6) }]}
          actions={
            <ActionPanel>
              <Action title="Switch to Session" onAction={() => switchTo(session)} />
              <Action.CopyToClipboard title="Copy Session ID" content={session.session_id} />
              <Action title="Refresh" shortcut={{ modifiers: ["cmd"], key: "r" }} onAction={revalidate} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
