import React from "react";
import ListItemShowcase from "../ListItem";
import { orpc } from "@/lib/orpc";
import { unstable_rethrow } from "next/dist/client/components/unstable-rethrow.server";

const ServerSideShowcase: React.FC = async function ServerSideShowcase() {
  // Performance monitoring - captured at server render time
  // eslint-disable-next-line react-hooks/purity -- Server component, timing capture is acceptable
  const timingStartMs = performance.now();
  let timeTakenMs: number;

  try {
    const result = await orpc.user.list.call({
      query: {
        limit: 10,
        offset: 0,
      },
    });

    // eslint-disable-next-line react-hooks/purity -- Server component, timing capture is acceptable
    timeTakenMs = performance.now() - timingStartMs;

    return (
      <>
        <div>Time taken: {timeTakenMs}ms</div>
        <ListItemShowcase users={result.data} />
      </>
    );
  } catch (error) {
    unstable_rethrow(error); // Ensure proper error handling in Next.js because orpc can throw redirect responses
    // eslint-disable-next-line react-hooks/purity -- Server component, timing capture is acceptable
    timeTakenMs = performance.now() - timingStartMs;

    return (
      <>
        <div>Time taken: {timeTakenMs}ms</div>
        <div className="text-red-500">
          Error loading users:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
        <ListItemShowcase users={[]} />
      </>
    );
  }
};

export default ServerSideShowcase;
