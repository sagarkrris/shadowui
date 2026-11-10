import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { JAVA_RELEASE_CHAPTERS } from '../lib/javaReleaseLessons.mjs';
import { javaTool } from '../scripts/validation/java-runtime.mjs';

// Inject boundary assertions into the published main so tests use its real local
// values and implementations. The unmodified source is also compiled/executed.
const boundaries = {
  'Java 9 language refinements': 'if(!greeter.greet("  Grace ").equals("Hello Grace")) throw new AssertionError();',
  'Collection factories and defensive copies': 'if(snapshot.size()!=1 || source.size()!=2)throw new AssertionError(); try{snapshot.add("bad");throw new AssertionError();}catch(UnsupportedOperationException expected){} try{java.util.List.of((String)null);throw new AssertionError();}catch(NullPointerException expected){}',
  'Modern Stream and Optional APIs': 'if(java.util.stream.Stream.of(5,1).takeWhile(n->n<4).count()!=0 || java.util.stream.Stream.of(5,1).filter(n->n<4).count()!=1 || java.util.Optional.empty().stream().count()!=0)throw new AssertionError();',
  'Local variable type inference': 'if(!greeting.apply("").equals("Hello "))throw new AssertionError();',
  'Java HTTP Client': 'if(!request.timeout().orElseThrow().equals(java.time.Duration.ofSeconds(3)) || request.bodyPublisher().isPresent())throw new AssertionError();',
  'Java 11 String and Files APIs': 'if(!"ha".repeat(0).isEmpty() || !"".isBlank())throw new AssertionError(); try{"ha".repeat(-1);throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'Switch expressions': 'if(fee(Size.SMALL)!=5 || fee(Size.LARGE)!=10)throw new AssertionError();',
  'Text blocks': 'if(!message.equals("alpha\\nbeta\\n"))throw new AssertionError("exact indentation or newline changed");',
  'Pattern matching with instanceof': 'if(length("")!=0 || length(null)!=0 || length(42)!=0 || length("Grace")!=5)throw new AssertionError();',
  'Modern random generators and HexFormat': 'if(!java.util.Arrays.equals(java.util.HexFormat.of().parseHex("000fff"),new byte[]{0,15,-1}))throw new AssertionError(); try{java.util.HexFormat.of().parseHex("z");throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'UTF-8 defaults and explicit encodings': 'if(!java.nio.charset.Charset.defaultCharset().equals(java.nio.charset.StandardCharsets.UTF_8) || bytes.length!=5 || text.length()!=4)throw new AssertionError();',
  'Record patterns': 'if(sum(new Point(-3,3))!=0 || sum("wrong type")!=0 || sum(null)!=0)throw new AssertionError();',
  'Pattern matching with switch': 'if(!describe(42).equals("other") || !describe(null).equals("missing") || !describe("").equals("empty"))throw new AssertionError();',
  'Sequenced collections': 'values.clear(); if(!reversed.isEmpty())throw new AssertionError("detached view"); try{reversed.getFirst();throw new AssertionError();}catch(java.util.NoSuchElementException expected){}',
  'Foreign Function and Memory API': 'try(var arena=java.lang.foreign.Arena.ofConfined()){var live=arena.allocate(java.lang.foreign.ValueLayout.JAVA_INT);try{live.get(java.lang.foreign.ValueLayout.JAVA_INT,4);throw new AssertionError();}catch(IndexOutOfBoundsException expected){}}',
  'Unnamed variables and patterns': 'if(count!=2 || !isText)throw new AssertionError();',
  'Class-File API': 'try{java.lang.classfile.ClassFile.of().parse(new byte[]{0,1});throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'Stream gatherers': 'if(java.util.stream.Stream.<Integer>empty().gather(java.util.stream.Gatherers.windowFixed(2)).count()!=0 || windows.getLast().size()!=1)throw new AssertionError();try{java.util.stream.Gatherers.windowFixed(0);throw new AssertionError();}catch(IllegalArgumentException expected){}',
  'Virtual threads and monitor pinning': 'Thread second=Thread.ofVirtual().start(()->{for(int i=0;i<1000;i++)counter.increment();});second.join();if(counter.value()!=2000)throw new AssertionError();',
  'Scoped values': 'ScopedValue.where(USER,"outer").run(()->{ScopedValue.where(USER,"inner").run(()->{if(!USER.get().equals("inner"))throw new AssertionError();});if(!USER.get().equals("outer"))throw new AssertionError();});try{USER.get();throw new AssertionError();}catch(java.util.NoSuchElementException expected){}',
  'Module import declarations': 'if(!names.getFirst().equals("Ada"))throw new AssertionError();',
  'Compact source files and instance main': 'if (java.util.List.of("a", "b").size() != 2) throw new AssertionError();',
  'Flexible constructor bodies': 'try{new Child(Integer.MAX_VALUE);throw new AssertionError();}catch(ArithmeticException expected){}if(new Child(0).value!=0)throw new AssertionError();',
  'Modern cryptographic algorithms': 'var changed=java.security.Signature.getInstance("ML-DSA");changed.initVerify(pair.getPublic());changed.update("changed".getBytes(java.nio.charset.StandardCharsets.UTF_8));if(changed.verify(signature))throw new AssertionError("altered message accepted");',
  'Key derivation with HKDF': 'if(!java.util.HexFormat.of().formatHex(output).equals("3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865"))throw new AssertionError("RFC 5869 vector mismatch");if(java.util.Arrays.equals(output,derive(input,salt,new byte[]{1},42)))throw new AssertionError("context ignored");',
  'HTTP 3 client configuration': 'try{java.net.http.HttpClient.newBuilder().version(null);throw new AssertionError();}catch(NullPointerException expected){}',
  'Final field integrity in Java 26': 'if(settings.limit!=3)throw new AssertionError("final value changed");',
  'Runtime evolution and AOT caching': 'if(!g1)throw new AssertionError("expected launched collector policy");',
  'Primitive patterns in Java 26': 'if(!describe(Integer.MIN_VALUE).startsWith("int:") || !describe(Integer.MAX_VALUE).startsWith("int:") || !describe((long)Integer.MAX_VALUE+1).equals("outside") || !describe((long)Integer.MIN_VALUE-1).equals("outside"))throw new AssertionError();',
  'Lazy constants in Java 26': 'if(CALLS.get()!=1 || VALUE.get()!=42)throw new AssertionError();try{LazyConstant.of(()->null).get();throw new AssertionError();}catch(NullPointerException expected){}',
  'Structured concurrency in Java 26': 'var ready=new java.util.concurrent.CountDownLatch(1);var exited=new java.util.concurrent.atomic.AtomicBoolean();try{combine(()->{ready.await();throw new IllegalStateException("child failed");},()->{ready.countDown();try{new java.util.concurrent.CountDownLatch(1).await();return "unexpected";}finally{exited.set(true);}});throw new AssertionError();}catch(java.util.concurrent.StructuredTaskScope.FailedException expected){if(!exited.get())throw new AssertionError("scope leaked child lifetime");}',
  'PEM encoding in Java 26': 'if(!pem.contains("-----END PUBLIC KEY-----") || pem.contains("PRIVATE KEY"))throw new AssertionError("wrong export type");',
  'Vector API in Java 26': 'for(int i=0;i<result.length;i++)if(result[i]!=a[i]+b[i])throw new AssertionError();',
  'Java 26 migration and withdrawn previews': 'if(Runtime.version().feature()<26)throw new AssertionError("wrong runtime");',
};
const invalidChanges = {
  'Java 9 language refinements': source => inject(source, 'greeter.normalize("private");'),
  'Local variable type inference': source => inject(source, 'label = 42;'),
  'Switch expressions': source => source.replace('SMALL, LARGE', 'SMALL, MEDIUM, LARGE'),
  'Unnamed variables and patterns': source => inject(source, 'System.out.println(_);'),
};
function inject(source, body) {
  const marker = source.includes('public class ReleaseExample') ? '\n  }\n}' : '\n}\n';
  const index = source.lastIndexOf(marker);
  assert.ok(index >= 0, 'published main boundary must be found');
  return source.slice(0, index) + '\n    ' + body + source.slice(index);
}
for (const lesson of Object.values(JAVA_RELEASE_CHAPTERS)) test(`${lesson.title}: published example and behavioral boundaries`, { timeout: 60000 }, () => {
  const example = lesson.runnableExample;
  const directory = mkdtempSync(join(tmpdir(), 'java-release-contract-'));
  const file = join(directory, example.filename);
  const javac = javaTool('javac', process.env, example.release);
  const java = javaTool('java', process.env, example.release);
  const compile = (source, flags = example.compileArgs) => {
    writeFileSync(file, source);
    return spawnSync(javac, [...flags, '-d', directory, file], { encoding: 'utf8', timeout: 20000 });
  };
  const run = (flags = example.runArgs) => spawnSync(java, [...flags, '-cp', directory, example.className], { encoding: 'utf8', timeout: 15000 });
  const passed = result => assert.equal(result.status, 0, result.error?.message || result.stderr);
  try {
    passed(compile(example.source));
    const original = run(); passed(original); assert.equal(original.stdout.trim(), example.output);
    assert.ok(boundaries[lesson.title], 'new lessons require a behavioral fixture');
    passed(compile(inject(example.source, boundaries[lesson.title])));
    const checked = run(); passed(checked); assert.equal(checked.stdout.trim(), example.output);
    if (invalidChanges[lesson.title]) assert.notEqual(compile(invalidChanges[lesson.title](example.source)).status, 0, 'unsafe source change must be rejected');
    if (lesson.status === 'preview') {
      const noPreview = compile(example.source, example.compileArgs.filter(flag => flag !== '--enable-preview'));
      assert.notEqual(noPreview.status, 0, 'preview source must require the declared opt-in');
    }
    if (lesson.title === 'HTTP 3 client configuration') assert.notEqual(compile(example.source, ['--release', '21']).status, 0, 'Java 21 must reject the Java 26 API');
    if (lesson.status === 'incubator') assert.notEqual(run([]).status, 0, 'incubator module must be resolved at launch');
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
