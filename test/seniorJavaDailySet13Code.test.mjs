import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

test("Set 13 published Java matches direct range-sum and exhaustive palindrome-partition oracles", async () => {
  const markdown = await readFile(new URL("../content/senior-java/daily/set-13.md", import.meta.url), "utf8");
  const members = [...markdown.matchAll(/```java\n([\s\S]*?)\n```/g)].map(match => match[1]);
  assert.equal(members.length, 2, "compile every published Java block");
  const checks = `
    static int assertions;
    static void check(boolean value) { assertions++; if (!value) throw new AssertionError("assertion " + assertions); }
    static void rejects(Class<? extends Throwable> type, Runnable action) {
      try { action.run(); } catch (Throwable error) { check(type.isInstance(error)); return; }
      throw new AssertionError("expected " + type);
    }
    static void verifyRanges(RangeReadings actual, int[] model) {
      for (int from = 0; from <= model.length; from++) {
        long sum = 0;
        for (int to = from; to <= model.length; to++) {
          if (to > from) sum += model[to-1];
          check(actual.sum(from,to) == sum);
        }
      }
    }
    static boolean isPalindrome(String text, int start, int end) {
      while (start < end) if (text.charAt(start++) != text.charAt(--end)) return false;
      return true;
    }
    // Enumerate cuts recursively without using the published substring/prefix tables.
    static int palindromeOracle(String text, int start) {
      if (start == text.length()) return 0;
      int best = text.length();
      for (int end = start+1; end <= text.length(); end++)
        if (isPalindrome(text,start,end)) best = Math.min(best,1+palindromeOracle(text,end));
      return best;
    }
    static void verifyPartition(String text) {
      List<String> pieces = palindromePieces(text);
      check(pieces.size() == palindromeOracle(text,0));
      check(String.join("",pieces).equals(text));
      for (String piece : pieces) { check(!piece.isEmpty()); check(isPalindrome(piece,0,piece.length())); }
      rejects(UnsupportedOperationException.class, () -> pieces.add("a"));
    }
    public static void main(String[] args) {
      RangeReadings example = new RangeReadings(new int[]{4,-2,7});
      check(example.sum(0,3)==9); example.replace(1,5); check(example.sum(1,3)==12);
      check(example.sum(2,2)==0);
      // Exhaustive short arrays; test every possible point replacement and range against direct sums.
      for (int length=0; length<=5; length++) {
        int combinations = (int) Math.pow(5,length);
        for (int code=0; code<combinations; code++) {
          int[] model = new int[length]; int rest=code;
          for (int i=0; i<length; i++) { model[i]=rest%5-2; rest/=5; }
          int[] source=model.clone(); RangeReadings actual=new RangeReadings(source);
          Arrays.fill(source,99); verifyRanges(actual,model);
          for (int index=0; index<length; index++) {
            for (int value : new int[]{Integer.MIN_VALUE,-2,0,2,Integer.MAX_VALUE}) {
              actual.replace(index,value); model[index]=value; verifyRanges(actual,model);
              actual.replace(index,value); verifyRanges(actual,model);
            }
          }
          rejects(IndexOutOfBoundsException.class, () -> actual.replace(-1,1));
          rejects(IndexOutOfBoundsException.class, () -> actual.replace(model.length,1));
          rejects(IndexOutOfBoundsException.class, () -> actual.sum(-1,0));
          rejects(IndexOutOfBoundsException.class, () -> actual.sum(1,0));
          rejects(IndexOutOfBoundsException.class, () -> actual.sum(0,model.length+1));
          verifyRanges(actual,model);
        }
      }
      Random random = new Random(132026);
      for (int trial=0; trial<100; trial++) {
        int[] model=new int[1+random.nextInt(25)];
        for (int i=0; i<model.length; i++) model[i]=random.nextInt();
        var actual=new RangeReadings(model);
        for (int operation=0; operation<100; operation++) {
          int index=random.nextInt(model.length), value=random.nextInt();
          actual.replace(index,value); model[index]=value;
          verifyRanges(actual,model);
        }
      }
      int[] large=new int[1000000]; Arrays.fill(large,Integer.MAX_VALUE);
      var largeTree=new RangeReadings(large);
      check(largeTree.sum(0,large.length)==2147483647000000L);
      largeTree.replace(999999,Integer.MIN_VALUE);
      check(largeTree.sum(999999,1000000)==Integer.MIN_VALUE);
      check(largeTree.sum(0,1000000)==2147483647000000L-4294967295L);
      rejects(NullPointerException.class, () -> new RangeReadings(null));
      rejects(IllegalArgumentException.class, () -> new RangeReadings(new int[1000001]));
      check(palindromePieces("aababa").equals(List.of("a","ababa")));
      check(palindromePieces("abba").equals(List.of("abba")));
      for (int length=0; length<=8; length++) {
        int combinations=(int)Math.pow(3,length);
        for (int code=0; code<combinations; code++) {
          char[] letters=new char[length]; int rest=code;
          for(int i=0;i<length;i++) { letters[i]=(char)('a'+rest%3); rest/=3; }
          verifyPartition(new String(letters));
        }
      }
      for (int trial=0; trial<1000; trial++) {
        char[] letters=new char[random.nextInt(13)];
        for(int i=0;i<letters.length;i++) letters[i]=(char)('a'+random.nextInt(4));
        verifyPartition(new String(letters));
      }
      String maximum="a".repeat(2000);
      check(palindromePieces(maximum).equals(List.of(maximum)));
      String alternating="ab".repeat(1000);
      var alternatingPieces=palindromePieces(alternating);
      check(alternatingPieces.size()==2 && String.join("",alternatingPieces).equals(alternating));
      for (String piece : alternatingPieces) check(isPalindrome(piece,0,piece.length()));
      rejects(NullPointerException.class, () -> palindromePieces(null));
      rejects(IllegalArgumentException.class, () -> palindromePieces("a".repeat(2001)));
      for (String invalid : List.of("abA","ab0","ab ","abé","ab😀"))
        rejects(IllegalArgumentException.class, () -> palindromePieces(invalid));
      System.out.println(assertions + " assertions passed");
    }
  `;
  const directory = await mkdtemp(path.join(tmpdir(), "senior-java-set13-"));
  const javaHome = process.env.CONTENT_JAVA_HOME || process.env.JAVA_HOME;
  const bin = name => javaHome ? path.join(javaHome,"bin",name) : name;
  try {
    const file = path.join(directory,"DailySet13Checks.java");
    await writeFile(file,`import java.util.*; public class DailySet13Checks {\n${members.join("\n")}\n${checks}\n}`);
    execFileSync(bin("javac"),["--release","21","-d",directory,file],{timeout:20000});
    const output = execFileSync(bin("java"),["-cp",directory,"DailySet13Checks"],{timeout:30000,encoding:"utf8"});
    assert.match(output,/\d+ assertions passed/); console.log(output.trim());
  } finally { await rm(directory,{recursive:true,force:true}); }
});
