# InterviewIQ Java runner

This private service runs Java 8–21 source in disposable Docker containers. Do not expose port 8080 publicly. Run it on a dedicated Docker host with a unique 32+ character `JAVA_RUNNER_SHARED_TOKEN`; that host must not contain application secrets or sensitive mounts.

The runner disables workload networking, drops capabilities, runs workloads as a non-root user, limits CPU/memory/processes/file size/output, and uses a read-only root filesystem. It admits at most two requests concurrently. Pre-pull the JDK images you intend to support before accepting traffic (`eclipse-temurin:17-jdk` is required for practice; the editor offers 8–21).

## Shared workspace (dedicated Linux Docker host)

Docker resolves bind sources on the daemon host, not inside the service container.
Provision a dedicated, quota-limited submission directory on that host, writable
by the service UID 1000. Do not point this at an existing user or application directory.
The local and host roots below map to the **same files**. Socket access grants
host-level Docker authority, so keep this service private on a dedicated machine.
On rootful Linux, give the service the socket's group rather than making the
socket world-writable. Adapt UID/GID mapping for rootless Docker.

Put a random 32+ character `JAVA_RUNNER_SHARED_TOKEN` in the operator environment
before starting (never commit it). The following is a deployment example, not an
automatic provisioning step:

```bash
docker build -t interviewiq-java-runner services/java-runner
sudo install -d -m 0700 -o 1000 -g 1000 /srv/interviewiq-java-submissions
docker run --rm -p 127.0.0.1:8080:8080 \
  --group-add "$(stat -c '%g' /var/run/docker.sock)" \
  -e JAVA_RUNNER_SHARED_TOKEN \
  -e JAVA_RUNNER_WORKSPACE_ROOT=/submissions \
  -e JAVA_RUNNER_HOST_WORKSPACE_ROOT=/srv/interviewiq-java-submissions \
  --mount type=bind,src=/srv/interviewiq-java-submissions,dst=/submissions \
  --mount type=bind,src=/var/run/docker.sock,dst=/var/run/docker.sock \
  interviewiq-java-runner
```

The submission root must exist and have a filesystem quota; individual file limits
do not bound aggregate disk use. Each compiler/runtime gets only its own job directory,
never the full submission root. A direct host process also needs both root settings,
pointing to the same dedicated directory when there is no container path translation.

## Application integration

Set `JAVA_RUNNER_URL` to the service base URL (no `/v1/run` suffix) and the same
`JAVA_RUNNER_SHARED_TOKEN` in the Next app. Both the editor and practice challenges
use this pair; challenges send Java 17 plus the generated harness. Remove obsolete
`PRACTICE_RUNNER_*` settings. Across hosts, use a private authenticated TLS endpoint;
the loopback binding above requires a private gateway/tunnel for a remote app.

Requests go to `/v1/run` using `X-Java-Runner-Token`; the response includes
`phase`, `exitCode`, `stdout`, `stderr`, `timedOut`, `outputLimited`, and `signal`.
The service accepts 20,000 source characters to leave space for the trusted
practice harness; learner editors remain limited to 12,000. Output is capped at
16,000 bytes combined. Compile and runtime each have an 8-second limit, followed
by explicit bounded container removal. Java stdin is forwarded with Docker `-i`.

Files are removed only after execution and container removal finish. If removal
cannot be confirmed, the workspace is retained and the service stops admitting
work. An operator must inspect/remove the named `interviewiq-java-*` container,
then its corresponding job directory, before restarting. A service/host crash
also requires orphan-container and workspace reconciliation; do not restart
blindly. `/health` indicates admission health, not proof that every image is runnable.

## Validation

`node --test test/javaRunnerService.test.mjs test/codeRunner.test.mjs test/buildChallenges.test.mjs`
checks ordering, host path mapping, cleanup failure, time/output bounds and the
shared request/response contract without Docker. Before public use, additionally
run real Java 17 success, compile-error, assertion-failure, timeout, stdin and output
tests; verify no workload containers remain, filesystem/network isolation and
aggregate disk/concurrency limits. Unit tests do not certify the deployed sandbox.
