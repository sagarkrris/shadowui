# Shared architecture revisions

Open **Design Lab → Revise a design** or **System Canvas → Editable architecture and revisions**. Both edit the same `systemDesignCanvas.revision` inside the existing practice session. The editable notification graph is distinct from the older text brief and generated reference diagrams; changing a brief template preserves the revision.

The exercise starts with explicit requirements and budget. Edit components and connections, then freeze the initial graph and introduce a ten-minute provider outage. Baseline capture is one-time and subsequent edits affect only the current graph. Before/after diagrams and a field-level change list accompany explanation, decisions, and unresolved-risk notes. Readers may add/remove up to 12 components and 24 connections. Removing a component removes its incident connections.

Components carry per-replica capacity, traffic, latency, replica count, storage, consistency and availability assumptions. Connections carry protocol, payload, direction, sync/async mode, timeout and maximum attempts. Diagrams reflow vertically on narrow screens; detailed editors are collapsible.

Feedback is deterministic and intentionally limited: synchronous failure reachability, stalled async delivery, single-instance risk, assumed traffic above nominal capacity, component latency above a synchronous timeout, and retry amplification prompts. No live service runs, no AI is required, and these rules neither predict real performance nor certify reliability. Replica failure independence, durable acceptance, deduplication, queue retention, backlog drain and actual capacity must still be justified and tested.

Existing session persistence/export carries the revision. **Save revision** writes an additional explicit browser backup; **Restore saved revision** restores it. **Download revision JSON** provides a portable copy. Storage failure shows a message and does not block editing or downloading. Existing sessions without a revision retain their prior state shape.
