Runnable verification for the reviewed Java interview guide

Requirements: JDK 21 or later; Python 3 with the standard sqlite3 module.
The delivered examples were compiled with --release 21 and no preview features.
Run these commands from the document folder:

  java code/InterviewAlgorithms.java
  java code/WebInterviewPractice.java
  mkdir -p build
  javac --release 21 -d build code/GuideExamples.java code/ProducerConsumerDemo.java code/GuideRegressionTests.java
  java -cp build GuideRegressionTests
  java -cp build ProducerConsumerDemo
  python3 code/SqlRegressionTests.py

Recorded results on 7 October 2026:
  InterviewAlgorithms: 3,116 checks passed.
  WebInterviewPractice: 12,417 checks passed.
  GuideRegressionTests: 3,288 checks passed.
  Portable SQL: 17 assertions passed on SQLite 3.53.1.

GuideExamples contains 58 groups extracted from Markdown: 57 groups identified
by snippet-index.json, plus the monetary ranking expression. It supplies imports,
enclosing classes, and simple tree/list node fixtures. Top-level teaching classes
are made static only inside the test wrapper. The ranking expression has a method
wrapper and return statement for invocation. ProducerConsumerDemo is identical
to the complete program in Appendix A.

The extraction covers standalone Java examples, not every framework fragment.
Compilation does not establish behavior; the regression harness exercises the
repaired examples and selected algorithm boundaries. Concurrency tests sample
interleavings and cannot prove all schedules. SQL tests read the delivered
Markdown directly and cover portable statements; they do not execute PostgreSQL
locking, row-level security, Hibernate/JPA, cloud or Kubernetes integrations.

The two algorithm companions were recovered from the earlier editable guide's
local output and are included here so the delivered references are usable.
