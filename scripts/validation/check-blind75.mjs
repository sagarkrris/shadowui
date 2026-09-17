import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const references = JSON.parse(await readFile(new URL('../../lib/blind75JavaReferences.json', import.meta.url)));
const javaHome = process.env.CONTENT_JAVA_HOME || '/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home';
const directory = await mkdtemp(join(tmpdir(), 'interviewiq-blind75-'));
const fixtures = {
'contains-duplicate':'check(s.containsDuplicate(new int[]{1,2,1})); check(!s.containsDuplicate(new int[]{}));',
'valid-anagram':'check(s.isAnagram("anagram","nagaram")); check(!s.isAnagram("a","b"));',
 'two-sum':'check(Arrays.equals(s.twoSum(new int[]{3,3},6),new int[]{0,1}));',
 'group-anagrams':'check(s.groupAnagrams(new String[]{"ab","ba","c"}).size()==2);',
 'top-k-frequent-elements':'check(Arrays.equals(s.topKFrequent(new int[]{1,1,2},1),new int[]{1}));',
 'product-of-array-except-self':'check(Arrays.equals(s.productExceptSelf(new int[]{1,2,3,4}),new int[]{24,12,8,6})); check(Arrays.equals(s.productExceptSelf(new int[]{0,0}),new int[]{0,0}));',
 'encode-and-decode-strings':'Codec c=new Codec(); List<String> a=Arrays.asList("", "a#b", "😀"); check(c.decode(c.encode(a)).equals(a));',
 'longest-consecutive-sequence':'check(s.longestConsecutive(new int[]{100,4,200,1,3,2,2})==4); check(s.longestConsecutive(new int[]{})==0);',
 'valid-palindrome':'check(s.isPalindrome("A man, a plan, a canal: Panama")); check(!s.isPalindrome("race a car"));',
 '3sum':'check(s.threeSum(new int[]{-1,0,1,2,-1,-4}).size()==2);',
 'container-with-most-water':'check(s.maxArea(new int[]{1,8,6,2,5,4,8,3,7})==49);',
 'best-time-to-buy-and-sell-stock':'check(s.maxProfit(new int[]{7,1,5,3,6,4})==5); check(s.maxProfit(new int[]{7,6,4})==0);',
 'longest-substring-without-repeating-characters':'check(s.lengthOfLongestSubstring("abcabcbb")==3); check(s.lengthOfLongestSubstring("")==0);',
 'longest-repeating-character-replacement':'check(s.characterReplacement("AABABBA",1)==4);',
 'minimum-window-substring':'check(s.minWindow("ADOBECODEBANC","ABC").equals("BANC")); check(s.minWindow("a","aa").equals(""));',
 'valid-parentheses':'check(s.isValid("()[]{}")); check(!s.isValid("([)]"));',
 'binary-search':'check(s.search(new int[]{1,3,5},5)==2); check(s.search(new int[]{},1)==-1); check(s.search(new int[]{2,2},3)==-1);',
 'find-minimum-in-rotated-sorted-array':'check(s.findMin(new int[]{3,4,5,1,2})==1); check(s.findMin(new int[]{1})==1);',
 'search-in-rotated-sorted-array':'check(s.search(new int[]{4,5,6,7,0,1,2},0)==4); check(s.search(new int[]{1},0)==-1);',
 'reverse-linked-list':'ListNode a=list(1,2,3); check(s.reverseList(a).val==3); check(s.reverseList(null)==null);',
 'merge-two-sorted-lists':'check(s.mergeTwoLists(list(1,3),list(2,4)).next.val==2);',
 'reorder-list':'ListNode a=list(1,2,3,4); s.reorderList(a); check(a.next.val==4 && a.next.next.val==2);',
 'remove-nth-node-from-end-of-list':'check(s.removeNthFromEnd(list(1,2,3),2).next.val==3);',
 'linked-list-cycle':'ListNode a=list(1,2); a.next.next=a; check(s.hasCycle(a)); check(!s.hasCycle(null));',
 'merge-k-sorted-lists':'check(s.mergeKLists(new ListNode[]{list(1,4),list(2,3)}).next.val==2);',
 'invert-binary-tree':'TreeNode a=tree(); check(s.invertTree(a).left.val==3);',
 'maximum-depth-of-binary-tree':'check(s.maxDepth(tree())==2); check(s.maxDepth(null)==0);',
 'same-tree':'check(s.isSameTree(tree(),tree())); check(!s.isSameTree(tree(),null));',
 'subtree-of-another-tree':'check(s.isSubtree(tree(),new TreeNode(1)));',
 'lowest-common-ancestor-of-a-binary-search-tree':'TreeNode a=tree(); check(s.lowestCommonAncestor(a,a.left,a.right)==a);',
 'binary-tree-level-order-traversal':'check(s.levelOrder(tree()).equals(Arrays.asList(Arrays.asList(2),Arrays.asList(1,3))));',
 'validate-binary-search-tree':'check(s.isValidBST(tree())); TreeNode a=tree(); a.left.val=2; check(!s.isValidBST(a));',
 'kth-smallest-element-in-a-bst':'check(s.kthSmallest(tree(),2)==2);',
 'construct-binary-tree-from-preorder-and-inorder-traversal':'TreeNode a=s.buildTree(new int[]{2,1,3},new int[]{1,2,3}); check(a.val==2 && a.left.val==1 && a.right.val==3);',
 'binary-tree-maximum-path-sum':'check(s.maxPathSum(tree())==6); check(s.maxPathSum(new TreeNode(-3))==-3);',
 'serialize-and-deserialize-binary-tree':'Codec c=new Codec(); TreeNode a=c.deserialize(c.serialize(tree())); check(a.val==2 && a.left.val==1 && a.right.val==3); check(c.deserialize(c.serialize(null))==null);',
 'find-median-from-data-stream':'MedianFinder m=new MedianFinder(); m.addNum(1);m.addNum(2);check(m.findMedian()==1.5);m.addNum(3);check(m.findMedian()==2);',
 'combination-sum':'check(s.combinationSum(new int[]{2,3,6,7},7).size()==2);',
 'word-search':'check(s.exist(new char[][]{{\'A\',\'B\'}},"AB")); check(!s.exist(new char[][]{{\'A\',\'B\'}},"ABA"));',
 'implement-trie-prefix-tree':'Trie t=new Trie();t.insert("apple");check(t.search("apple"));check(!t.search("app"));check(t.startsWith("app"));',
 'design-add-and-search-words-data-structure':'WordDictionary w=new WordDictionary();w.addWord("bad");check(w.search(".ad"));check(!w.search("pad"));',
 'word-search-ii':'check(s.findWords(new char[][]{{\'a\',\'b\'}},new String[]{"ab","aba"}).equals(Arrays.asList("ab")));',
 'number-of-islands':'check(s.numIslands(new char[][]{{\'1\',\'0\'},{\'0\',\'1\'}})==2);',
 'clone-graph':'Node a=new Node(1);a.neighbors.add(a);Node b=s.cloneGraph(a);check(b!=a && b.neighbors.get(0)==b);',
 'pacific-atlantic-water-flow':'check(s.pacificAtlantic(new int[][]{{1}}).equals(Arrays.asList(Arrays.asList(0,0))));',
 'course-schedule':'check(s.canFinish(2,new int[][]{{1,0}}));check(!s.canFinish(2,new int[][]{{1,0},{0,1}}));',
 'graph-valid-tree':'check(s.validTree(3,new int[][]{{0,1},{1,2}}));check(!s.validTree(3,new int[][]{{0,1}}));',
 'number-of-connected-components-in-an-undirected-graph':'check(s.countComponents(4,new int[][]{{0,1},{2,3}})==2);',
 'alien-dictionary':'check(s.foreignDictionary(new String[]{"wrt","wrf","er","ett","rftt"}).equals("wertf"));check(s.foreignDictionary(new String[]{"abc","ab"}).equals(""));',
 'climbing-stairs':'check(s.climbStairs(1)==1);check(s.climbStairs(5)==8);',
 'house-robber':'check(s.rob(new int[]{2,7,9,3,1})==12);check(s.rob(new int[]{})==0);',
 'house-robber-ii':'check(s.rob(new int[]{2,3,2})==3);check(s.rob(new int[]{1})==1);',
 'longest-palindromic-substring':'check(s.longestPalindrome("cbbd").equals("bb"));',
 'palindromic-substrings':'check(s.countSubstrings("aaa")==6);',
 'decode-ways':'check(s.numDecodings("226")==3);check(s.numDecodings("06")==0);',
 'coin-change':'check(s.coinChange(new int[]{1,2,5},11)==3);check(s.coinChange(new int[]{2},3)==-1);check(s.coinChange(new int[]{1},0)==0);',
 'maximum-product-subarray':'check(s.maxProduct(new int[]{2,3,-2,4})==6);check(s.maxProduct(new int[]{-2,0,-1})==0);',
 'word-break':'check(s.wordBreak("leetcode",Arrays.asList("leet","code")));check(!s.wordBreak("a",Arrays.asList("b")));',
 'longest-increasing-subsequence':'check(s.lengthOfLIS(new int[]{10,9,2,5,3,7,101,18})==4);check(s.lengthOfLIS(new int[]{2,2})==1);',
 'unique-paths':'check(s.uniquePaths(3,7)==28);check(s.uniquePaths(1,1)==1);',
 'longest-common-subsequence':'check(s.longestCommonSubsequence("abcde","ace")==3);check(s.longestCommonSubsequence("a","")==0);',
 'maximum-subarray':'check(s.maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})==6);check(s.maxSubArray(new int[]{-3,-2})==-2);',
 'jump-game':'check(s.canJump(new int[]{2,3,1,1,4}));check(!s.canJump(new int[]{3,2,1,0,4}));',
 'insert-interval':'check(Arrays.deepEquals(s.insert(new int[][]{{1,3},{6,9}},new int[]{2,5}),new int[][]{{1,5},{6,9}}));',
 'merge-intervals':'check(Arrays.deepEquals(s.merge(new int[][]{{1,3},{2,6},{8,10}}),new int[][]{{1,6},{8,10}}));',
 'non-overlapping-intervals':'check(s.eraseOverlapIntervals(new int[][]{{1,2},{2,3},{1,3}})==1);',
 'meeting-rooms-ii':'check(s.minMeetingRooms(new int[][]{{0,30},{5,10},{15,20}})==2);check(s.minMeetingRooms(new int[][]{{0,1},{1,2}})==1);',
 'rotate-image':'int[][] a={{1,2},{3,4}};s.rotate(a);check(Arrays.deepEquals(a,new int[][]{{3,1},{4,2}}));',
 'spiral-matrix':'check(s.spiralOrder(new int[][]{{1,2},{3,4}}).equals(Arrays.asList(1,2,4,3)));',
 'set-matrix-zeroes':'int[][] a={{1,0},{3,4}};s.setZeroes(a);check(Arrays.deepEquals(a,new int[][]{{0,0},{3,0}}));',
 'number-of-1-bits':'check(s.hammingWeight(11)==3);check(s.hammingWeight(-1)==32);',
 'counting-bits':'check(Arrays.equals(s.countBits(5),new int[]{0,1,1,2,1,2}));',
 'reverse-bits':'check(s.reverseBits(1)==Integer.MIN_VALUE);check(s.reverseBits(0)==0);',
 'missing-number':'check(s.missingNumber(new int[]{3,0,1})==2);check(s.missingNumber(new int[]{})==0);',
 'sum-of-two-integers':'check(s.getSum(1,2)==3);check(s.getSum(-3,2)==-1);',
};
const helpers = `class ListNode { int val; ListNode next; ListNode(){} ListNode(int v){val=v;} ListNode(int v,ListNode n){val=v;next=n;} }
class TreeNode { int val; TreeNode left,right; TreeNode(){} TreeNode(int v){val=v;} TreeNode(int v,TreeNode l,TreeNode r){val=v;left=l;right=r;} }
class Node { public int val; public List<Node> neighbors; public Node(){this(0);} public Node(int v){val=v;neighbors=new ArrayList<>();} public Node(int v,ArrayList<Node> n){val=v;neighbors=n;} }`;
const results=[];
for (const [id, reference] of Object.entries(references)) {
  if (!fixtures[id]) throw new Error(`Missing fixture for ${id}`);
  const code=reference.code.replace(/import [^;]+;/g,'').replace(/public class /g,'class ');
  const solution=/class Solution\b/.test(code) ? 'Solution s=new Solution();' : '';
  const source=`import java.util.*;\n${helpers}\n${code}\nclass Verify { static void check(boolean b){if(!b)throw new AssertionError();} static ListNode list(int... values){ListNode head=new ListNode(),tail=head;for(int v:values){tail.next=new ListNode(v);tail=tail.next;}return head.next;} static TreeNode tree(){return new TreeNode(2,new TreeNode(1),new TreeNode(3));} public static void main(String[] args){${solution}${fixtures[id]}} }`;
  const folder=await mkdtemp(join(directory,'case-')); const file=join(folder,'Verify.java'); await writeFile(file,source);
  const compiled=spawnSync(join(javaHome,'bin/javac'),['--release','8','-d',folder,file],{encoding:'utf8',timeout:20000});
  const run=compiled.status===0 ? spawnSync(join(javaHome,'bin/java'),['-cp',folder,'Verify'],{encoding:'utf8',timeout:10000}):null;
  const passed=compiled.status===0 && run?.status===0;
  results.push({id,passed,...(passed?{}:{error:compiled.status!==0?compiled.stderr:run?.stderr})});
  if(!passed) console.log(id,results.at(-1).error);
}
await writeFile(process.argv[2]||'/private/tmp/shadow-blind75-audit.json',JSON.stringify({createdAt:new Date().toISOString(),results},null,2));
console.log(`${results.filter(r=>r.passed).length}/${results.length} Java reference solutions passed.`);
process.exitCode=results.every(r=>r.passed)?0:1;
