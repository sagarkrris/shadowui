#!/bin/sh
# Run from a copy of the project. Requires a full JDK 21+ on PATH.
set -eu
cd "$(dirname "$0")"
work=$(mktemp -d "${TMPDIR:-/tmp}/java-indexer.XXXXXX")
trap 'rm -rf "$work"' EXIT
mkdir "$work/classes" "$work/tests" "$work/fixtures"
javac --release 21 -d "$work/classes" src/main/java/learning/javaindex/*.java
javac --release 21 -cp "$work/classes" -d "$work/tests" src/test/java/learning/javaindex/*.java
java -cp "$work/classes:$work/tests" learning.javaindex.LanguageLab
java -cp "$work/classes:$work/tests" learning.javaindex.ConcurrencyLab
java -cp "$work/classes:$work/tests" learning.javaindex.IndexerChecks "$work/fixtures"
java -cp "$work/classes:$work/tests" learning.javaindex.JvmLab "$work/fixtures"
jar --create --file "$work/indexer.jar" --main-class learning.javaindex.Indexer -C "$work/classes" .
test "$(java -jar "$work/indexer.jar" build sample "$work/index.jidx" 2)" = 'Indexed 2 files'
test "$(java -jar "$work/indexer.jar" search "$work/index.jidx" 'java maps')" = 'collections.txt'
printf '%s\n' 'Packaged CLI passed: build and search in separate JVMs'
