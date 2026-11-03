// Server-only checks: never import this module from a page or public catalog.
const helpers=`static void check(boolean ok){if(!ok)throw new AssertionError("Contract check failed");}
static void invalid(Runnable r){try{r.run();}catch(IllegalArgumentException expected){return;}throw new AssertionError("Expected invalid input rejection");}
static void conflict(Runnable r){try{r.run();}catch(IllegalStateException expected){return;}throw new AssertionError("Expected conflict rejection");}
static void overflow(Runnable r){try{r.run();}catch(ArithmeticException expected){return;}throw new AssertionError("Expected overflow rejection");}`;
const suite=groups=>`class Main {\n${helpers}\npublic static void main(String[] args) throws Exception {\n${groups.map(([name,code])=>`System.out.println("GROUP:${name}");\n${code}`).join('\n')}\n}\n}`;
export const REPOSITORY_CHECKS={
 api:suite([
  ['validation',`RequestRules r=new RequestRules(); check(r.page(null)==0);check(r.size(null)==20);
  for(String v:new String[]{""," ","+1","-1","1.0","a","2147483648"}){invalid(()->r.page(v));invalid(()->r.size(v));}
  invalid(()->r.size("0"));invalid(()->r.size("101"));invalid(()->new PagingEndpoint(null));`],
  ['boundary',`PagingEndpoint e=new PagingEndpoint(r);check(e.handle("2147483647","100").equals("200:214748364700:100"));check(e.handle("0","1").equals("200:0:1"));`],
  ['contract',`check(e.handle(null,null).equals("200:0:20"));check(e.handle("-1","1").equals("400:invalid pagination"));check(e.handle("1","101").equals("400:invalid pagination"));
  PagingEndpoint custom=new PagingEndpoint(new RequestRules(){int page(String x){return 3;}int size(String x){return 4;}});check(custom.handle("x","y").equals("200:12:4"));`],
 ]),
 cache:suite([
  ['validation',`invalid(()->new CacheEntry(null,1));invalid(()->new CacheEntry("v",-1));invalid(()->new CacheEntry("v",1).read(-1));invalid(()->new TinyCache(0));invalid(()->new TinyCache(1001));TinyCache c=new TinyCache(2);
  invalid(()->c.put(null,"v",1));invalid(()->c.put(" ","v",1));invalid(()->c.put("a",null,1));invalid(()->c.put("a","v",-1));invalid(()->c.get(null,0));invalid(()->c.get(" ",0));invalid(()->c.get("a",-1));`],
  ['boundary',`check(new CacheEntry("v",0).read(0)==null);check(new CacheEntry("v",Long.MAX_VALUE).read(Long.MAX_VALUE-1).equals("v"));c.put("a","A",10);check(c.get("a",10)==null);check(c.get("missing",0)==null);`],
  ['eviction',`c.put("a","A",100);c.put("b","B",100);check(c.get("a",1).equals("A"));c.put("c","C",100);check(c.get("b",1)==null);check(c.get("a",1).equals("A"));c.put("c","new",100);c.put("d","D",100);check(c.get("a",1)==null);check(c.get("c",1).equals("new"));
  TinyCache one=new TinyCache(1);one.put("x","X",1);one.put("y","Y",10);check(one.get("x",0)==null);check(one.get("y",1).equals("Y"));
  TinyCache valid=new TinyCache(1);valid.put("kept","K",100);invalid(()->valid.put("bad",null,100));check(valid.get("kept",0).equals("K"));`],
 ]),
 concurrency:suite([
  ['validation',`invalid(()->new PermitPool(0));invalid(()->new PermitPool(-1));invalid(()->new Lease(null));`],
  ['capacity',`PermitPool p=new PermitPool(1);Lease lease=p.tryAcquire();check(lease!=null);check(p.inUse()==1);check(p.tryAcquire()==null);lease.close();check(p.inUse()==0);
  PermitPool race=new PermitPool(1);Lease[] results=new Lease[2];java.util.concurrent.CountDownLatch ready=new java.util.concurrent.CountDownLatch(2),go=new java.util.concurrent.CountDownLatch(1);
  java.util.List<Throwable> errors=java.util.Collections.synchronizedList(new java.util.ArrayList<>());
  Thread[] contenders=new Thread[2];for(int i=0;i<2;i++){final int index=i;contenders[i]=new Thread(()->{try{ready.countDown();go.await();results[index]=race.tryAcquire();}catch(Throwable t){errors.add(t);}});contenders[i].start();}
  check(ready.await(5,java.util.concurrent.TimeUnit.SECONDS));go.countDown();for(Thread t:contenders){t.join(5000);check(!t.isAlive());}check(errors.isEmpty());check((results[0]!=null?1:0)+(results[1]!=null?1:0)==1);check(race.inUse()==1);`],
  ['ownership',`Lease owned=results[0]!=null?results[0]:results[1];Thread[] closers=new Thread[8];java.util.concurrent.CountDownLatch closeGo=new java.util.concurrent.CountDownLatch(1);
  for(int i=0;i<closers.length;i++){closers[i]=new Thread(()->{try{closeGo.await();owned.close();}catch(Throwable t){errors.add(t);}});closers[i].start();}closeGo.countDown();for(Thread t:closers){t.join(5000);check(!t.isAlive());}check(errors.isEmpty());check(race.inUse()==0);owned.close();check(race.inUse()==0);Lease next=race.tryAcquire();check(next!=null);check(race.tryAcquire()==null);next.close();check(race.inUse()==0);`],
 ]),
 debugging:suite([
  ['validation',`invalid(()->new Event(null,0,"v"));invalid(()->new Event(" ",0,"v"));invalid(()->new Event("a",-1,"v"));invalid(()->new Event("a",0,null));VersionGate g=new VersionGate();invalid(()->g.apply(null));invalid(()->g.get(" "));invalid(()->g.get(null));`],
  ['ordering',`check(g.get("missing")==null);check(g.apply(new Event("a",2,"new")));check(!g.apply(new Event("a",1,"old")));check(g.get("a").version==2);check(g.apply(new Event("b",0,"other")));check(g.get("a").payload.equals("new"));check(g.apply(new Event("a",Long.MAX_VALUE,"last")));`],
  ['duplicates',`check(!g.apply(new Event("a",Long.MAX_VALUE,"last")));conflict(()->g.apply(new Event("a",Long.MAX_VALUE,"conflict")));check(g.get("a").payload.equals("last"));check(g.get("b").payload.equals("other"));`],
 ]),
};
